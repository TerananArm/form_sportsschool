import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// Helper to format date to DDMMYYYY
function formatDateToPassword(date) {
    if (!date) return null;
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}${month}${year}`;
}

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

                // 1. Check Admin (Users table)
                try {
                    const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
                    if (users.length > 0) {
                        const user = users[0];
                        let isValid = user.password === password;
                        if (!isValid && user.password && user.password.startsWith('$2')) {
                            isValid = await bcrypt.compare(password, user.password);
                        }

                        if (isValid) {
                            return { id: user.id.toString(), name: user.name, email: null, image: user.image, role: 'admin' };
                        }
                    }
                } catch (e) { console.error("Admin login error", e); }

                // 2. Check Student
                try {
                    const [students] = await db.execute('SELECT * FROM students WHERE id = ?', [username]);
                    if (students.length > 0) {
                        const student = students[0];
                        let isValid = false;
                        if (student.password) {
                            isValid = await bcrypt.compare(password, student.password);
                        } else {
                            const dob = formatDateToPassword(student.birthdate);
                            if (dob && dob === password) {
                                isValid = true;
                            }
                        }

                        if (isValid) {
                            return { id: student.id, name: student.name, email: null, image: null, role: 'student' };
                        }
                    }
                } catch (e) { console.error("Student login error", e); }

                // 3. Check Teacher
                try {
                    const [teachers] = await db.execute('SELECT * FROM teachers WHERE id = ?', [username]);
                    if (teachers.length > 0) {
                        const teacher = teachers[0];
                        let isValid = false;
                        if (teacher.password) {
                            isValid = await bcrypt.compare(password, teacher.password);
                        } else {
                            const dob = formatDateToPassword(teacher.birthdate);
                            if (dob && dob === password) {
                                isValid = true;
                            }
                        }

                        if (isValid) {
                            return { id: teacher.id, name: teacher.name, email: teacher.email, image: null, role: 'teacher' };
                        }
                    }
                } catch (e) { console.error("Teacher login error", e); }

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
    secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-123', // Fallback if env is missing
    debug: true,
};
