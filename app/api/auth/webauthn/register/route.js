import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { cookies } from "next/headers";

const RP_NAME = "My NextJS App";
const RP_ID = process.env.NODE_ENV === "production" ? "your-production-domain.com" : "localhost";
const ORIGIN = process.env.NODE_ENV === "production" ? `https://${RP_ID}` : `http://${RP_ID}:3000`;

export async function POST(req) {
    // 1. Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;

    // 2. Get user's existing authenticators to exclude them (prevent duplicate registration)
    // We need to query DB based on user type
    let authenticators = [];
    try {
        const [rows] = await db.execute(
            "SELECT credential_id FROM authenticators WHERE user_id = ? AND user_type = ?",
            [user.id, user.role] // Assuming user.role matches user type (student/teacher/admin) stored in DB
        );
        authenticators = rows;
    } catch (error) {
        console.error("Error fetching authenticators", error);
    }

    // 3. Generate registration options
    const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: new TextEncoder().encode(String(user.id)), // Must be Uint8Array for @simplewebauthn v10+
        userName: user.name || user.email || "User",
        // Don't prompt if they already have one
        excludeCredentials: authenticators.map((auth) => ({
            id: auth.credential_id,
            type: "public-key",
            transports: auth.transports ? auth.transports.split(",") : undefined,
        })),
        authenticatorSelection: {
            residentKey: "required", // Required for "Passkeys" (synced via iCloud)
            userVerification: "preferred",
            authenticatorAttachment: "platform", // Force Touch ID / Face ID on this device
        },
    });

    // 4. Save challenge to cookie (signed/HTTPOnly)
    // Ideally, use a DB or Redis. For simplicity, we use a cookie.
    cookies().set("webauthn_challenge", options.challenge, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 5, // 5 minutes
        path: "/",
    });

    return NextResponse.json(options);
}

export async function PUT(req) {
    // 1. Check session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    // 2. Get body and challenge
    const body = await req.json();
    const challengeCookie = cookies().get("webauthn_challenge");

    if (!challengeCookie) {
        return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
    }

    const expectedChallenge = challengeCookie.value;

    try {
        // 3. Verify registration
        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
        });

        const { verified, registrationInfo } = verification;

        if (verified && registrationInfo) {
            const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } = registrationInfo;

            // 4. Save to DB
            await db.execute(
                `INSERT INTO authenticators 
        (credential_id, credential_public_key, counter, credential_device_type, credential_backed_up, transports, user_id, user_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    credentialID,
                    Buffer.from(credentialPublicKey).toString('base64'), // Store as base64 
                    // Wait, verifyRegistrationResponse returns credentialPublicKey as Uint8Array. 
                    // If stored as String @db.Text, we should base64 encode it.
                    // Let's check schema again. credentialPublicKey is String @db.Text.

                    counter,
                    credentialDeviceType,
                    credentialBackedUp, // boolean
                    body.response.transports ? body.response.transports.join(",") : null,
                    user.id,
                    user.role,
                ]
            );

            // Clear challenge
            cookies().delete("webauthn_challenge");

            return NextResponse.json({ verified: true });
        }
    } catch (error) {
        console.error("Verification failed", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ verified: false }, { status: 400 });
}
