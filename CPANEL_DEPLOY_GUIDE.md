# 📚 คู่มือ Deploy Next.js ขึ้น cPanel แบบละเอียด

## 📋 ข้อมูล Server

| รายการ | ค่า |
|--------|-----|
| URL เว็บไซต์ | http://ai.itmoreshop.com |
| Server IP | 118.27.130.237 |
| cPanel URL | https://ps05.zwhhosting.com:2083 |
| cPanel User | zcyvpszw |
| cPanel Pass | Shell@2022! |
| FTP User | vecskill@ai.itmoreshop.com |
| FTP Pass | pwD@2025!!! |
| Database | zcyvpszw_ai |

---

## 🔨 ขั้นตอนที่ 1: Build Production บนเครื่อง Local

```bash
cd /Users/teerananyimlooplek/my-nextjs
npm run build
```

หลัง build จะได้โฟลเดอร์ `.next/standalone/` ที่มีไฟล์พร้อม deploy

---

## 📦 ขั้นตอนที่ 2: เตรียมไฟล์สำหรับอัปโหลด

### ไฟล์ที่ต้องอัปโหลด:

```
📁 .next/standalone/
   ├── 📁 .next/          ← compiled files
   ├── 📁 node_modules/   ← dependencies  
   ├── 📄 server.js       ← startup file
   └── 📄 package.json

📁 .next/static/          ← ต้อง copy ไปใส่ใน standalone/.next/static/
📁 public/                ← ต้อง copy ไปใส่ใน standalone/public/
```

### คำสั่ง copy ไฟล์เตรียมพร้อม:

```bash
# Copy static files
cp -r .next/static .next/standalone/.next/

# Copy public folder
cp -r public .next/standalone/

# สร้าง .env สำหรับ production
cat > .next/standalone/.env << 'EOF'
DB_HOST=localhost
DB_USER=zcyvpszw
DB_PASSWORD=Shell@2022!
DB_NAME=zcyvpszw_ai
NODE_ENV=production
NEXTAUTH_URL=http://ai.itmoreshop.com
NEXTAUTH_SECRET=super-secret-key-123456789
AUTH_TRUST_HOST=true
GEMINI_API_KEY=AIzaSyCmZNDHp6BdeA_NzH_WK5wKWjGU0JHSF0c
EOF
```

---

## 📤 ขั้นตอนที่ 3: อัปโหลดผ่าน FTP (FileZilla)

### 3.1 เชื่อมต่อ FTP

1. เปิด FileZilla
2. กรอกข้อมูล:
   - **Host**: `118.27.130.237`
   - **Username**: `vecskill@ai.itmoreshop.com`
   - **Password**: `pwD@2025!!!`
   - **Port**: `21`
3. กด **Quickconnect**

### 3.2 อัปโหลดไฟล์

**ซ้าย (Local):** ไปที่ `/Users/teerananyimlooplek/my-nextjs/.next/standalone/`

**ขวา (Server):** ไปที่ `/mynextjs/` หรือ `/public_html/`

**Drag & Drop ทุกไฟล์จากซ้ายไปขวา:**
- `.next/` (โฟลเดอร์)
- `node_modules/` (โฟลเดอร์)
- `public/` (โฟลเดอร์)
- `server.js`
- `package.json`
- `.env`

⚠️ **หมายเหตุ:** การอัปโหลดอาจใช้เวลา 10-30 นาที เพราะ node_modules มีไฟล์เยอะ

---

## ⚙️ ขั้นตอนที่ 4: ตั้งค่า Node.js App บน cPanel

### 4.1 เข้า cPanel

1. ไปที่ https://ps05.zwhhosting.com:2083
2. Login:
   - **Username**: `zcyvpszw`
   - **Password**: `Shell@2022!`

### 4.2 สร้าง Node.js Application

1. ค้นหา **"Setup Node.js App"** ใน cPanel
2. กด **"CREATE APPLICATION"**
3. กรอกข้อมูล:

| Setting | ค่า |
|---------|-----|
| Node.js version | `18` หรือ `20` |
| Application mode | `Production` |
| Application root | `/home/zcyvpszw/mynextjs` (หรือ path ที่อัปโหลด) |
| Application URL | `ai.itmoreshop.com` |
| Application startup file | `server.js` |

4. กด **"CREATE"**

### 4.3 Start Application

1. กลับมาที่หน้า Node.js App
2. กด **"RUN NPM INSTALL"** (ถ้ามีปุ่ม)
3. กด **"RESTART"**

---

## ✅ ขั้นตอนที่ 5: ทดสอบ

1. ไปที่ http://ai.itmoreshop.com
2. ควรเห็นหน้า Login
3. ลอง Login ด้วย username/password จาก database
4. ทดสอบ Dashboard และ AI Chatbot

---

## 🔧 แก้ปัญหาที่พบบ่อย

### ❌ Login แล้ววนลูป ไม่เข้า Dashboard

**แก้ไข:** ตรวจสอบ `.env` บน server:
```
NEXTAUTH_URL=http://ai.itmoreshop.com
AUTH_TRUST_HOST=true
```

### ❌ Error 500 หรือหน้าว่าง

**แก้ไข:** 
1. ตรวจสอบ Node.js version (ต้อง 18+)
2. ดู Error Log ใน cPanel → Metrics → Errors

### ❌ ไม่เชื่อมต่อ Database

**แก้ไข:** ตรวจสอบข้อมูล DB ใน `.env`:
```
DB_HOST=localhost
DB_USER=zcyvpszw
DB_PASSWORD=Shell@2022!
DB_NAME=zcyvpszw_ai
```

### ❌ Static files ไม่โหลด (CSS/Images)

**แก้ไข:** ตรวจสอบว่า:
- โฟลเดอร์ `.next/static/` อยู่ใน path ที่ถูกต้อง
- โฟลเดอร์ `public/` อยู่ใน root ของ app

---

## 📂 โครงสร้างไฟล์บน Server (ที่ถูกต้อง)

```
/home/zcyvpszw/mynextjs/
├── .next/
│   ├── server/
│   ├── static/        ← สำคัญ!
│   └── ...
├── node_modules/
├── public/            ← สำคัญ!
├── server.js
├── package.json
└── .env               ← สำคัญ! (ต้องสร้างเอง)
```

---

## 🎉 เสร็จสิ้น!

หลังจากทำตามขั้นตอนทั้งหมด เว็บไซต์ควรทำงานได้ที่:

**http://ai.itmoreshop.com**
