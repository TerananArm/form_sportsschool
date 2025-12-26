import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

const RP_ID = process.env.NODE_ENV === "production" ? "your-production-domain.com" : "localhost";
const ORIGIN = process.env.NODE_ENV === "production" ? `https://${RP_ID}` : `http://${RP_ID}:3000`;

export async function POST(req) {
    // 1. Generate options
    // We don't know the user yet, so we allow any credential (user verification required)
    // Or we can ask for username first.
    // For "Login with Face ID" button usually we don't ask username, we use discoverable credentials (resident keys).
    // But if we want to allow non-resident keys, we need username.
    // Let's assume we want to support both or just resident keys for simplicity of UI.
    // If we support resident keys, we don't pass `allowCredentials`.

    const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        userVerification: "required",
        // allowCredentials: ... (omit for resident keys or if we don't have username yet)
    });

    // 2. Save challenge
    cookies().set("webauthn_challenge", options.challenge, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 5,
        path: "/",
    });

    return NextResponse.json(options);
}

export async function PUT(req) {
    // 1. Get body and challenge
    const body = await req.json();
    const challengeCookie = cookies().get("webauthn_challenge");

    if (!challengeCookie) {
        return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
    }

    const expectedChallenge = challengeCookie.value;

    try {
        // 2. Find authenticator in DB by credential ID
        // body.id is the credential ID
        const credentialID = body.id;

        const [rows] = await db.execute(
            "SELECT * FROM authenticators WHERE credential_id = ?",
            [credentialID]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: "Authenticator not found" }, { status: 400 });
        }

        const authenticator = rows[0];

        // 3. Verify authentication
        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            authenticator: {
                credentialID: authenticator.credential_id, // string
                credentialPublicKey: Buffer.from(authenticator.credential_public_key, 'base64'), // Convert back to buffer
                counter: BigInt(authenticator.counter), // Retrieve counter
                transports: authenticator.transports ? authenticator.transports.split(",") : undefined,
            },
        });

        const { verified, authenticationInfo } = verification;

        if (verified) {
            // 4. Update counter
            await db.execute(
                "UPDATE authenticators SET counter = ? WHERE credential_id = ?",
                [authenticationInfo.newCounter, credentialID]
            );

            // 5. Log the user in
            // We need to issue a session.
            // Since we are using NextAuth, we need to manually create the session token or use a trick.
            // NextAuth uses `encode` to create JWT.

            // We can return a success message and then client calls `signIn` with credentials?
            // But we already verified the challenge. We shouldn't trust the client to just say "I verified, log me in".
            // We should issue a token here immediately.

            // OPTION: We return a temporary secure token (signed JWT) that the client can exchange for a session 
            // via `signIn('credentials', { token: ... })`.

            const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
            const tempToken = await new SignJWT({
                userId: authenticator.user_id,
                userType: authenticator.user_type,
                isWebAuthn: true
            })
                .setProtectedHeader({ alg: 'HS256' })
                .setExpirationTime('1m')
                .sign(secret);

            cookies().delete("webauthn_challenge");

            return NextResponse.json({ verified: true, token: tempToken });
        }
    } catch (error) {
        console.error("Auth verification failed", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ verified: false }, { status: 400 });
}
