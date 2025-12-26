import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const { username, password } = credentials;

                // Check Admin (Users table)
                try {
                    const prisma = new (require('@prisma/client').PrismaClient)();
                    const user = await prisma.user.findUnique({
                        where: { username }
                    });

                    if (user && user.password) {
                        let isValid = false;

                        // Check if password is bcrypt hash (starts with $2)
                        if (user.password.startsWith('$2')) {
                            isValid = await bcrypt.compare(password, user.password);
                        } else {
                            // DEV ONLY: Allow plaintext for migration period
                            // TODO: Remove this after all passwords are hashed
                            isValid = user.password === password;
                            if (isValid) {
                                console.warn('⚠️ User has plaintext password - please hash it!');
                            }
                        }

                        if (isValid) {
                            return {
                                id: user.id.toString(),
                                name: user.name,
                                email: null,
                                role: user.role || 'admin'
                            };
                        }
                    }
                } catch (e) {
                    console.error("Admin login error", e);
                }

                return null;
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    // Use env secret, with fallback for development only
    secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-secret-key-change-in-production' : undefined),
};
