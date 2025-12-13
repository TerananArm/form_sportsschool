// app/api/smart-query/route.js
import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function POST(req) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'กรุณาระบุคำถาม' }, { status: 400 });
        }

        const lowerQuery = query.toLowerCase();
        let sqlQuery = '';
        let answer = '';

        // Pattern matching for common questions
        if (lowerQuery.includes('นักเรียน') && (lowerQuery.includes('กี่คน') || lowerQuery.includes('จำนวน') || lowerQuery.includes('ทั้งหมด'))) {
            sqlQuery = 'SELECT COUNT(*) as count FROM students';
            const [rows] = await db.query(sqlQuery);
            answer = `มีนักเรียนทั้งหมด ${rows[0].count} คน`;
        }
        else if (lowerQuery.includes('ครู') && (lowerQuery.includes('กี่คน') || lowerQuery.includes('จำนวน') || lowerQuery.includes('ทั้งหมด'))) {
            sqlQuery = 'SELECT COUNT(*) as count FROM teachers';
            const [rows] = await db.query(sqlQuery);
            answer = `มีครูทั้งหมด ${rows[0].count} คน`;
        }
        else if (lowerQuery.includes('ห้อง') && (lowerQuery.includes('กี่ห้อง') || lowerQuery.includes('จำนวน') || lowerQuery.includes('ทั้งหมด'))) {
            sqlQuery = 'SELECT COUNT(*) as count FROM rooms';
            const [rows] = await db.query(sqlQuery);
            answer = `มีห้องเรียนทั้งหมด ${rows[0].count} ห้อง`;
        }
        else if (lowerQuery.includes('วิชา') && (lowerQuery.includes('กี่วิชา') || lowerQuery.includes('จำนวน') || lowerQuery.includes('ทั้งหมด'))) {
            sqlQuery = 'SELECT COUNT(*) as count FROM subjects';
            const [rows] = await db.query(sqlQuery);
            answer = `มีวิชาทั้งหมด ${rows[0].count} วิชา`;
        }
        else if (lowerQuery.includes('แผนก') && (lowerQuery.includes('กี่แผนก') || lowerQuery.includes('จำนวน') || lowerQuery.includes('ทั้งหมด') || lowerQuery.includes('มีอะไรบ้าง'))) {
            sqlQuery = 'SELECT name FROM departments';
            const [rows] = await db.query(sqlQuery);
            const depts = rows.map(r => r.name).join(', ');
            answer = `มีแผนกทั้งหมด ${rows.length} แผนก: ${depts}`;
        }
        else if (lowerQuery.includes('ตาราง') && (lowerQuery.includes('กี่คาบ') || lowerQuery.includes('จำนวน') || lowerQuery.includes('ทั้งหมด'))) {
            sqlQuery = 'SELECT COUNT(*) as count FROM schedule';
            const [rows] = await db.query(sqlQuery);
            answer = `มีตารางสอนทั้งหมด ${rows[0].count} คาบ`;
        }
        else if (lowerQuery.includes('ระดับชั้น') || (lowerQuery.includes('ชั้นเรียน') && lowerQuery.includes('มีอะไรบ้าง'))) {
            sqlQuery = 'SELECT cl.name, d.name as dept FROM class_levels cl LEFT JOIN departments d ON cl.departmentId = d.id';
            const [rows] = await db.query(sqlQuery);
            answer = `มีระดับชั้นทั้งหมด ${rows.length} ระดับ`;
        }
        else if (lowerQuery.includes('ครู') && lowerQuery.includes('ชื่อ')) {
            sqlQuery = 'SELECT name FROM teachers LIMIT 10';
            const [rows] = await db.query(sqlQuery);
            const names = rows.map(r => r.name).join(', ');
            answer = `รายชื่อครู (10 คนแรก): ${names}`;
        }
        else if (lowerQuery.includes('ห้อง') && lowerQuery.includes('ว่าง')) {
            sqlQuery = `
                SELECT r.name, r.type 
                FROM rooms r 
                WHERE r.id NOT IN (SELECT DISTINCT roomId FROM schedule)
            `;
            const [rows] = await db.query(sqlQuery);
            if (rows.length === 0) {
                answer = 'ไม่มีห้องว่างในตอนนี้ ทุกห้องถูกใช้งานแล้ว';
            } else {
                const names = rows.map(r => `${r.name} (${r.type})`).join(', ');
                answer = `ห้องที่ว่าง: ${names}`;
            }
        }
        else if (lowerQuery.includes('ครู') && lowerQuery.includes('สอน') && lowerQuery.includes('มากสุด')) {
            sqlQuery = `
                SELECT t.name, COUNT(s.id) as lesson_count 
                FROM teachers t 
                LEFT JOIN schedule s ON s.teacherId = t.id 
                GROUP BY t.id, t.name 
                ORDER BY lesson_count DESC 
                LIMIT 5
            `;
            const [rows] = await db.query(sqlQuery);
            const top = rows.map((r, i) => `${i + 1}. ${r.name} (${r.lesson_count} คาบ)`).join('\n');
            answer = `ครูที่สอนมากที่สุด:\n${top}`;
        }
        else if (lowerQuery.includes('วัน') && (lowerQuery.includes('เยอะสุด') || lowerQuery.includes('มากสุด'))) {
            sqlQuery = `
                SELECT day_of_week, COUNT(*) as count 
                FROM schedule 
                GROUP BY day_of_week 
                ORDER BY count DESC 
                LIMIT 1
            `;
            const [rows] = await db.query(sqlQuery);
            if (rows.length > 0) {
                answer = `วันที่มีการเรียนการสอนมากที่สุด: ${rows[0].day_of_week} (${rows[0].count} คาบ)`;
            } else {
                answer = 'ยังไม่มีข้อมูลตารางสอน';
            }
        }
        else if (lowerQuery.includes('สวัสดี') || lowerQuery.includes('หวัดดี') || lowerQuery.includes('hello')) {
            answer = 'สวัสดีครับ! 👋 ฉันคือผู้ช่วย AI ของระบบ EduSched AI สามารถถามเกี่ยวกับข้อมูลนักเรียน ครู ห้องเรียน วิชา และตารางสอนได้เลยครับ';
        }
        else if (lowerQuery.includes('ช่วยอะไรได้') || lowerQuery.includes('ทำอะไรได้')) {
            answer = `ฉันสามารถช่วยได้หลายอย่าง เช่น:
• ถามจำนวนนักเรียน/ครู/ห้อง/วิชา
• ดูรายชื่อครู
• ดูแผนกทั้งหมด
• ดูห้องที่ว่าง
• ดูครูที่สอนมากที่สุด
• ดูวันที่มีคาบสอนเยอะสุด
ลองถามมาได้เลยครับ! 😊`;
        }
        else {
            // Default response for unknown queries
            answer = `ขอโทษครับ ฉันไม่เข้าใจคำถาม "${query}" 

ลองถามใหม่ เช่น:
• "มีนักเรียนกี่คน"
• "มีครูกี่คน"
• "มีแผนกอะไรบ้าง"
• "ครูที่สอนมากที่สุด"
• "ห้องที่ว่าง"`;
        }

        return NextResponse.json({ answer, query: sqlQuery || null });

    } catch (error) {
        console.error('Smart Query Error:', error);
        return NextResponse.json({
            error: 'เกิดข้อผิดพลาดในการประมวลผล',
            details: error.message
        }, { status: 500 });
    }
}
