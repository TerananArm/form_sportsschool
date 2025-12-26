import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";

export async function POST(req) {
    try {
        // 1. Check if user is authenticated
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user;
        const body = await req.json();
        const { descriptor } = body;

        if (!descriptor) {
            return NextResponse.json({ error: "No face descriptor provided" }, { status: 400 });
        }

        // 2. Store Face Data
        // We store the descriptor as a JSON string
        await db.execute(
            `INSERT INTO face_data (id, user_id, user_type, descriptor, created_at) VALUES (UUID(), ?, ?, ?, NOW())`,
            [user.id, user.role, JSON.stringify(descriptor)]
        );

        return NextResponse.json({ success: true, message: "Face registered successfully" });

    } catch (error) {
        console.error("Face registration error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
