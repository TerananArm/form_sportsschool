import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SignJWT } from "jose";

// Helper for Euclidean Distance
function euclideanDistance(desc1, desc2) {
    if (desc1.length !== desc2.length) return 1.0;
    return Math.sqrt(
        desc1.reduce((sum, val, i) => sum + Math.pow(val - desc2[i], 2), 0)
    );
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { descriptor } = body;

        if (!descriptor) {
            return NextResponse.json({ error: "No face descriptor provided" }, { status: 400 });
        }

        const probeDescriptor = Object.values(descriptor); // Ensure it's an array

        // 1. Fetch all face data
        // In a production app, you might optimize this (e.g. use vector DB or filter by user provided username)
        // For now, we compare against all faces (1:N matching)
        const [rows] = await db.execute("SELECT * FROM face_data");

        if (rows.length === 0) {
            return NextResponse.json({ error: "No registered faces found" }, { status: 404 });
        }

        let bestMatch = { distance: 1.0, user: null };

        // 2. Find best match
        for (const row of rows) {
            try {
                const storedDescriptor = JSON.parse(row.descriptor);
                // Ensure stored descriptor is array
                const targetDescriptor = Object.values(storedDescriptor);

                const distance = euclideanDistance(probeDescriptor, targetDescriptor);

                if (distance < bestMatch.distance) {
                    bestMatch = { distance, user: row };
                }
            } catch (e) {
                console.error("Error parsing descriptor for row", row.id, e);
            }
        }

        // 3. Check Threshold (0.5 is a common threshold for dlib/face-api)
        const THRESHOLD = 0.5;

        if (bestMatch.distance < THRESHOLD && bestMatch.user) {
            // MATCH FOUND!
            const user = bestMatch.user;

            // 4. Generate Temporary Token (Same logic as WebAuthn)
            const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'super-secret-key-123456789');
            const token = await new SignJWT({
                userId: user.user_id,
                userType: user.user_type,
                isFaceAI: true
            })
                .setProtectedHeader({ alg: 'HS256' })
                .setExpirationTime('1m')
                .sign(secret);

            return NextResponse.json({
                verified: true,
                token,
                matchDistance: bestMatch.distance
            });
        }

        return NextResponse.json({
            verified: false,
            error: "Face not recognized",
            bestMatchDistance: bestMatch.distance
        }, { status: 401 });

    } catch (error) {
        console.error("Face authentication error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
