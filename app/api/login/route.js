// app/api/login/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Query ฐานข้อมูล (ใช้ ? เพื่อป้องกัน SQL Injection)
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    // ตรวจสอบว่าเจอ user หรือไม่
    if (rows.length > 0) {
      // Login สำเร็จ
      return NextResponse.json({ message: 'Login Success', user: rows[0] }, { status: 200 });
    } else {
      // Login ไม่ผ่าน
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}