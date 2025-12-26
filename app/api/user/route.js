import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/authOptions';
import { PrismaClient } from '../../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            select: { name: true, image: true, username: true }
        });
        return NextResponse.json(user);
    } catch (error) {
        console.error('GET user error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, password, newPassword, image } = body;
        const userId = parseInt(session.user.id);

        const updateData = {};

        // Update name if provided
        if (name !== undefined && name !== '') {
            updateData.name = name;
        }

        // Update image if provided
        if (image !== undefined) {
            updateData.image = image;
        }

        // Handle password change
        if (newPassword) {
            const user = await prisma.user.findUnique({ where: { id: userId } });

            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            // Verify old password if provided
            if (password) {
                let isValid = false;

                // Check if stored password is bcrypt hashed
                if (user.password && user.password.startsWith('$2')) {
                    isValid = await bcrypt.compare(password, user.password);
                } else {
                    // Plain text comparison for legacy passwords
                    isValid = password === user.password;
                }

                if (!isValid) {
                    return NextResponse.json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' }, { status: 400 });
                }
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedPassword;
        }

        // Only update if there's data to update
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No data to update' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            user: {
                name: updatedUser.name,
                image: updatedUser.image,
                username: updatedUser.username
            }
        });

    } catch (error) {
        console.error('PUT user error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
