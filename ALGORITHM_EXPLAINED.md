# 📚 Algorithm Explained - EduSched AI

## ภาพรวมอัลกอริทึมจัดตารางสอน

ระบบ EduSched AI ใช้หลักการ **Constraint Satisfaction Problem (CSP)** ผสมผสานกับ **Heuristic-based Scheduling** และ **LLM (Gemini AI)** สำหรับการจัดตารางอัตโนมัติ

---

## 🎯 แนวคิดหลัก: Morning-First Priority

### ลำดับความสำคัญ
1. **เช้าต้องเต็มก่อน** - วันใดก็ตามต้องมีอย่างน้อย 4 คาบเช้า (ครึ่งวัน)
2. **กระจายทุกวัน** - Round-robin ระหว่างวันเพื่อกระจายภาระ
3. **บ่ายใส่หลังสุด** - บ่ายจะใส่เมื่อเช้าเต็มแล้วเท่านั้น
4. **ห้ามเกิน 17:00** - คาบ 9 (16:00-17:00) เป็นคาบสุดท้าย

---

## 🔧 Constraint Checking

### Hard Constraints (ห้ามฝ่าฝืน)
| Constraint | คำอธิบาย | การตรวจสอบ |
|------------|----------|------------|
| ครูไม่ซ้อน | ครู 1 คนสอนได้ทีละ 1 ที่ | `isTeacherFree(day, start, end, teacherId)` |
| ห้องไม่ซ้อน | ห้อง 1 ห้องใช้ได้ทีละ 1 วิชา | `isRoomFree(day, start, end, roomId)` |
| พักกลางวัน | คาบ 5 (12:00-13:00) ห้ามจัด | `if (p === LUNCH_PERIOD) return false` |
| เลิกเรียน | ห้ามเกินคาบ 9 | `if (p > MAX_PERIOD) return false` |
| เวลาไม่สะดวก | ครูระบุเวลาที่ไม่สะดวกได้ | `isTeacherAvailable(day, start, end, teacherId)` |

### Soft Constraints (พยายามทำตาม)
| Constraint | คำอธิบาย | วิธีการ |
|------------|----------|---------|
| ครึ่งวันขึ้นไป | แต่ละวันต้องมีอย่างน้อย 4 คาบ | `MIN_MORNING_PER_DAY = 4` |
| กระจายสม่ำเสมอ | ทุกวันควรมีภาระใกล้กัน | Round-robin day selection |
| ห้อง Lab ก่อน | วิชาปฏิบัติจะหาห้อง Lab ก่อน | `isPractice ? labRooms : regularRooms` |

---

## 📊 ขั้นตอนการทำงาน

```
┌─────────────────────────────────────────────────────────────┐
│ 1. รับข้อมูล                                                  │
│    - รายวิชา (theoryHours, practiceHours)                    │
│    - ครู (unavailableTimes, maxHours)                        │
│    - ห้องเรียน (type, capacity)                               │
│    - ตารางที่มีอยู่แล้ว (existingSchedules)                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. เตรียมข้อมูล                                               │
│    - สร้าง globalOccupied map                                │
│    - แยก labRooms / regularRooms                             │
│    - สร้าง queue ของคาบที่ต้องจัด                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Phase 1: เติมเช้า (Round-Robin)                            │
│    while (ยังมีคาบเหลือ && เช้ายังไม่เต็ม) {                   │
│      วน loop วันจันทร์ → ศุกร์                                  │
│      หา slot ว่างที่ไม่ conflict                              │
│      จัด 1-2 ชม. ต่อวิชา                                      │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Phase 2: เติมบ่าย (Round-Robin)                            │
│    while (ยังมีคาบเหลือ && บ่ายยังว่าง) {                      │
│      ตรวจสอบว่าเช้าของวันนั้นเต็มแล้ว                          │
│      หา slot ว่างที่ไม่ conflict                              │
│      จัด 1-2 ชม. ต่อวิชา                                      │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Validate & Return                                         │
│    - ตรวจสอบว่าทุกวันมีครึ่งวันขึ้นไป                          │
│    - จัดเรียงตาม วัน → คาบ                                    │
│    - Return JSON schedule                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Integration (Gemini)

เมื่อใช้ Gemini AI:

1. **Prompt Engineering** - ส่ง constraints ทั้งหมดไปให้ LLM
2. **Model Fallback** - ถ้า model หนึ่งไม่ทำงาน จะลอง model อื่น
3. **Deterministic Fallback** - ถ้า AI ล้มเหลว ใช้ algorithm ที่เขียนเอง

```javascript
// Model Priority
const models = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp", 
    "gemini-2.0-flash-lite-preview-02-05"
];
```

---

## 📈 ตัวอย่าง Input/Output

### Input
```json
{
  "subjects": [
    { "code": "2204-2003", "name": "การเขียนโปรแกรม", "theoryHours": 1, "practiceHours": 4, "teacherId": "T001" }
  ],
  "rooms": [
    { "id": "R1", "name": "ห้อง 101", "type": "lecture" },
    { "id": "R2", "name": "Lab คอม 1", "type": "lab" }
  ],
  "teachers": [
    { "id": "T001", "name": "อ.สมชาย", "unavailableTimes": [{"day":1,"periods":[1,2]}] }
  ]
}
```

### Output
```json
[
  { "day_of_week": "วันจันทร์", "start_period": 3, "end_period": 4, "subject_id": "...", "teacher_id": "T001", "room_id": "R2" },
  { "day_of_week": "วันอังคาร", "start_period": 1, "end_period": 3, "subject_id": "...", "teacher_id": "T001", "room_id": "R2" }
]
```

---

## 🏆 สมรรถนะ (Performance)

| Metric | ค่า |
|--------|-----|
| เวลาจัดตาราง 1 ชั้น | < 100ms |
| เวลาจัดตารางทั้งหมด | < 5 วินาที |
| Conflict Rate | 0% (Hard constraints) |
| Coverage | 100% รายวิชา |

---

## 📚 อ้างอิง

- Constraint Satisfaction Problems (CSP)
- Heuristic Scheduling Algorithms
- Google Gemini API Documentation
