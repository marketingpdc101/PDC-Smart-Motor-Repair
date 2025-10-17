# LINE Official Account & LIFF Setup Guide

## 📱 ขั้นตอนการตั้งค่า LINE Integration

### 1. สร้าง LINE Developers Account

1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. Login ด้วย LINE Account ของคุณ
3. ถ้ายังไม่มี Provider, คลิก **Create a new provider**
   - Provider name: `PDC Motor Repair`
   - ยอมรับข้อตกลง → Create

---

### 2. สร้าง LINE Official Account (OA) พนักงาน

#### 2.1 สร้าง Messaging API Channel

1. คลิก **Create a new channel**
2. เลือก **Messaging API**
3. กรอกข้อมูล:
   - **Channel name**: `PDC System - Internal`
   - **Channel description**: `ระบบภายในสำหรับพนักงาน PDC`
   - **Category**: Business
   - **Subcategory**: Motor Repair Services
   - **Email address**: your-email@company.com
4. อ่านและยอมรับข้อตกลง → **Create**

#### 2.2 ตั้งค่า Channel

1. ไปที่ **Messaging API** tab
2. **Channel access token (long-lived)**:
   - คลิก **Issue** button
   - Copy token → บันทึกไว้ (ใส่ใน Config.gs ภายหลัง)
3. **Use webhooks**: เปิดเป็น **Enabled**
4. **Auto-reply messages**: เปิดเป็น **Disabled** (เราจะใช้ Webhook แทน)
5. **Greeting messages**: เปิดเป็น **Enabled** (ถ้าต้องการ)

#### 2.3 ดึง Channel Secret

1. ไปที่ **Basic settings** tab
2. หาในส่วน **Channel secret**
3. คลิก **Show** → Copy → บันทึกไว้

---

### 3. สร้าง LINE Official Account (OA) ลูกค้า

ทำซ้ำขั้นตอนในส่วน 2 แต่ใช้ข้อมูลดังนี้:

- **Channel name**: `PDC Smart Motor Repair`
- **Channel description**: `บริการซ่อมมอเตอร์คุณภาพสูง`

จด **Channel Access Token** และ **Channel Secret** ของ OA นี้แยกต่างหาก

---

### 4. สร้าง LIFF Apps (LINE Front-end Framework)

#### เข้าสู่ LIFF Console

1. เลือก Channel **PDC System - Internal**
2. คลิกที่ **LIFF** tab
3. คลิก **Add** button

#### สร้าง LIFF Apps ทั้งหมด 5 Apps:

##### LIFF #1: Quotation (ใบเสนอราคา)

- **LIFF app name**: `Quotation Builder`
- **Size**: **Full**
- **Endpoint URL**: `YOUR_WEB_APP_URL?page=quotation`
  - (แทนที่ YOUR_WEB_APP_URL ด้วย URL จาก Apps Script Deploy)
- **Scope**: 
  - ✅ profile
  - ✅ openid
- **Bot link feature**: **On (Aggressive)**
- **Scan QR**: Optional
- **Module mode**: **Off**
- คลิก **Add** → จด **LIFF ID** (เช่น `1234567890-AbCdEfGh`)

##### LIFF #2: Work Order View

- **LIFF app name**: `Work Order View`
- **Size**: **Tall**
- **Endpoint URL**: `YOUR_WEB_APP_URL?page=work-order`
- **Scope**: profile, openid
- คลิก **Add** → จด **LIFF ID**

##### LIFF #3: Status Update

- **LIFF app name**: `Status Update`
- **Size**: **Tall**
- **Endpoint URL**: `YOUR_WEB_APP_URL?page=status-update`
- **Scope**: profile, openid
- คลิก **Add** → จด **LIFF ID**

##### LIFF #4: Final Test Input

- **LIFF app name**: `Final Test Input`
- **Size**: **Tall**
- **Endpoint URL**: `YOUR_WEB_APP_URL?page=final-test`
- **Scope**: profile, openid
- คลิก **Add** → จด **LIFF ID**

##### LIFF #5: Final Report

- **LIFF app name**: `Final Report`
- **Size**: **Full**
- **Endpoint URL**: `YOUR_WEB_APP_URL?page=final-report`
- **Scope**: profile, openid
- คลิก **Add** → จด **LIFF ID**

---

### 5. ตั้งค่า Webhook URL

#### 5.1 Deploy Google Apps Script (ถ้ายังไม่ได้ทำ)

1. เปิด Apps Script Editor
2. **Deploy** → **New deployment**
3. Type: **Web app**
4. Execute as: **Me**
5. Who has access: **Anyone**
6. คลิก **Deploy**
7. Copy **Web app URL** (เช่น `https://script.google.com/macros/s/ABC123.../exec`)

#### 5.2 ตั้งค่า Webhook ใน LINE Console

1. กลับไปที่ LINE Developers Console
2. เลือก Channel **PDC System - Internal**
3. **Messaging API** tab
4. หาในส่วน **Webhook settings**
5. **Webhook URL**: ใส่ Web App URL จาก step 5.1
6. **Use webhook**: **Enabled**
7. คลิก **Verify** button
   - ถ้าขึ้น "Success" แสดงว่าถูกต้อง ✅
   - ถ้า Error ให้ตรวจสอบ URL และ Deploy settings

8. ทำซ้ำกับ Channel **PDC Smart Motor Repair** (ลูกค้า)

---

### 6. แก้ไข Config.gs ใน Apps Script

กลับไปที่ Google Apps Script → เปิดไฟล์ `Config.gs`

แก้ไขค่าต่อไปนี้:

```javascript
LINE: {
  INTERNAL_CHANNEL_ACCESS_TOKEN: 'YOUR_INTERNAL_TOKEN_HERE',
  INTERNAL_CHANNEL_SECRET: 'YOUR_INTERNAL_SECRET_HERE',
  EXTERNAL_CHANNEL_ACCESS_TOKEN: 'YOUR_EXTERNAL_TOKEN_HERE',
  EXTERNAL_CHANNEL_SECRET: 'YOUR_EXTERNAL_SECRET_HERE',
},

LIFF: {
  QUOTATION: 'YOUR_LIFF_ID_1',
  WORK_ORDER: 'YOUR_LIFF_ID_2',
  STATUS_UPDATE: 'YOUR_LIFF_ID_3',
  FINAL_TEST: 'YOUR_LIFF_ID_4',
  FINAL_REPORT: 'YOUR_LIFF_ID_5',
},

WEB_APP_URL: 'YOUR_WEB_APP_URL_FROM_DEPLOY'
```

**Save** → **Deploy** → **Manage deployments** → **Edit** → **New version** → **Deploy**

---

### 7. สร้าง Rich Menu (เมนูด้านล่าง LINE OA)

#### 7.1 Rich Menu สำหรับพนักงาน (Internal)

1. ใช้ [Rich Menu Maker](https://richmenus.line.biz/) หรือ LINE OA Manager
2. ออกแบบเมนู 6 ปุ่ม:
   ```
   ┌─────────┬─────────┐
   │ สร้างงาน │ ใบเสนอราคา│
   ├─────────┼─────────┤
   │ อัพเดท   │ ทดสอบ    │
   ├─────────┼─────────┤
   │ รายงาน   │ งานของฉัน│
   └─────────┴─────────┘
   ```

3. Action สำหรับแต่ละปุ่ม:
   - **สร้างงาน**: Text → `/createjob`
   - **ใบเสนอราคา**: URI → `https://liff.line.me/{LIFF_ID_QUOTATION}`
   - **อัพเดท**: URI → `https://liff.line.me/{LIFF_ID_STATUS_UPDATE}`
   - **ทดสอบ**: URI → `https://liff.line.me/{LIFF_ID_FINAL_TEST}`
   - **รายงาน**: URI → `https://liff.line.me/{LIFF_ID_FINAL_REPORT}`
   - **งานของฉัน**: Text → `/myjobs`

#### 7.2 Rich Menu สำหรับลูกค้า (External)

```
┌─────────┬─────────┐
│ สถานะงาน │ งานของฉัน │
├─────────┴─────────┤
│    ติดต่อเรา       │
└───────────────────┘
```

- **สถานะงาน**: Text → `/status`
- **งานของฉัน**: Text → `/myjobs`
- **ติดต่อเรา**: Text → `/contact`

---

### 8. Add Friend QR Code

1. LINE Developers Console → เลือก Channel
2. **Messaging API** tab
3. หาในส่วน **QR code**
4. คลิก **View QR code**
5. Download QR code → แชร์ให้พนักงาน/ลูกค้าสแกน

หรือใช้ LINE ID:
- คลิก **Basic info** tab
- หา **LINE ID** (เช่น @pdc123)
- ให้คนค้นหาใน LINE App

---

### 9. ทดสอบระบบ

#### ทดสอบพนักงาน (Internal OA):

1. สแกน QR Code หรือค้นหา LINE ID ของ OA Internal
2. Add Friend
3. ส่งข้อความ "สวัสดี" → ระบบควรตอบกลับ
4. กด Rich Menu → ทดสอบแต่ละฟังก์ชัน

#### ทดสอบลูกค้า (External OA):

1. สแกน QR Code ของ OA External
2. Add Friend → ควรได้รับข้อความต้อนรับ
3. ส่งข้อความ "สถานะ" → ระบบตอบกลับสถานะงาน

---

### 10. Troubleshooting

#### ปัญหา: Webhook ไม่ทำงาน

✅ แก้ไข:
- ตรวจสอบว่า Web App Deploy แบบ "Anyone" access
- ตรวจสอบ Webhook URL ว่าใช้ `/exec` ท้าย URL
- ดู Execution logs ใน Apps Script (View → Executions)

#### ปัญหา: LIFF ไม่เปิด

✅ แก้ไข:
- ตรวจสอบ LIFF Endpoint URL
- ตรวจสอบว่า Web App ทำงานปกติ (เปิด URL ด้วย Browser)
- Clear cache LINE App

#### ปัญหา: LINE ไม่ส่งข้อความ

✅ แก้ไข:
- ตรวจสอบ Channel Access Token
- ตรวจสอบว่าผู้ใช้ Add Friend OA แล้ว
- ดู Response code จาก LINE API (ใน Apps Script logs)

---

### 11. Best Practices

✅ **Security**:
- เก็บ Channel Secret ไว้เป็นความลับ
- Verify LINE Signature ทุกครั้งที่รับ Webhook
- ใช้ HTTPS เท่านั้น

✅ **Performance**:
- Rate limit การส่งข้อความ (max 500 msg/sec)
- Cache ข้อมูลที่ใช้บ่อย
- ใช้ Batch API สำหรับส่ง Multicast

✅ **User Experience**:
- ใช้ Flex Message สำหรับข้อความที่สวยงาม
- Quick Reply สำหรับตัวเลือกที่ใช้บ่อย
- Loading Indicator สำหรับ LIFF Apps

---

## 🎉 เสร็จสิ้น!

ตอนนี้ระบบ LINE Integration ของคุณพร้อมใช้งานแล้ว!

### เอกสารเพิ่มเติม:
- [LINE Messaging API Docs](https://developers.line.biz/en/docs/messaging-api/)
- [LIFF Documentation](https://developers.line.biz/en/docs/liff/)
- [Flex Message Simulator](https://developers.line.biz/flex-simulator/)

**Happy Coding! 🚀**
