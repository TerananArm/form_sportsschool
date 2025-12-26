
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const hashedPassword = await bcrypt.hash('1234', 10);

        // Check if admin exists
        const existingUser = await prisma.user.findUnique({
            where: { username: 'admin' }
        });

        if (!existingUser) {
            await prisma.user.create({
                data: {
                    username: 'admin',
                    password: hashedPassword,
                    name: 'Administrator',
                    role: 'admin'
                }
            });
            return NextResponse.json({ success: true, message: 'Admin user created' });
        }

        // Optional: Update password if needed
        // await prisma.user.update({ where: { username: 'admin' }, data: { password: hashedPassword } });

        return NextResponse.json({ success: true, message: 'Admin user already exists' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
