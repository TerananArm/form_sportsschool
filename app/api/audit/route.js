import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const logs = await prisma.auditLog.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ logs });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
