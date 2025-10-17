# คู่มือการติดตั้งระบบ PDC Smart Motor Repair

## ⚙️ ขั้นตอนการติดตั้ง

### 1. สร้าง Google Sheets Database

1. เปิด Google Sheets ใหม่
2. ตั้งชื่อว่า "PDC Smart Motor Repair - Database"
3. เปิด **Extensions** → **Apps Script**
4. Copy code จากโฟลเดอร์ `apps-script/` ทั้งหมดไปวางใน Apps Script Editor
   - `Config.gs`
   - `Database.gs`
   - `Code.gs`
   - `LineAPI.gs`
   - `Webhook.gs`
   - `PDFGenerator.gs`
   - `StateMachine.gs`
   - `Utils.gs`
5. Save โปรเจกต์ (ตั้งชื่อ "PDC System")
6. กลับไปที่ Google Sheets
7. Refresh หน้าเว็บ จะเห็นเมนู "🔧 PDC System" ขึ้นมา
8. คลิก **PDC System** → **Initialize Database**
9. รอจนกว่าระบบสร้าง Sheets ทั้งหมดเสร็จ

---

### 2. สร้าง LINE Official Account (2 บัญชี)

#### 2.1 OA พนักงาน (Internal)

1. เข้า [LINE Developers Console](https://developers.line.biz/)
2. สร้าง Provider ใหม่ (ถ้ายังไม่มี)
3. สร้าง **Messaging API Channel** ใหม่
   - Channel name: "PDC System - Internal"
   - Channel description: "สำหรับพนักงาน"
4. ใน **Messaging API** tab:
   - Enable **Messaging API**
   - สร้าง **Channel Access Token (long-lived)**
   - Copy **Channel Access Token** → บันทึกไว้
   - Copy **Channel Secret** → บันทึกไว้
5. ตั้งค่า **Webhook**:
   - Webhook URL: `YOUR_WEB_APP_URL` (จะได้จาก Step 5)
   - เปิด **Use webhook**: ON
   - เปิด **Webhook redelivery**: ON

#### 2.2 OA ลูกค้า (External)

1. ทำซ้ำขั้นตอนเหมือน 2.1
   - Channel name: "PDC Smart Motor Repair"
   - Channel description: "ระบบซ่อมมอเตอร์"
2. Copy **Channel Access Token** และ **Channel Secret**

---

### 3. สร้าง LIFF Apps (5 Apps)

ใน LINE Developers Console → เลือก Channel Internal → **LIFF** tab

สร้าง LIFF Apps ดังนี้:

#### 3.1 LIFF: Quotation (ใบเสนอราคา)
- Size: **Full**
- Endpoint URL: `YOUR_WEB_APP_URL?page=quotation`
- **Scope**: profile, openid
- Copy **LIFF ID**

#### 3.2 LIFF: Status Update (อัพเดทสถานะ)
- Size: **Tall**
- Endpoint URL: `YOUR_WEB_APP_URL?page=status-update`
- Copy **LIFF ID**

#### 3.3 LIFF: Final Test (บันทึกผลทดสอบ)
- Size: **Tall**
- Endpoint URL: `YOUR_WEB_APP_URL?page=final-test`
- Copy **LIFF ID**

#### 3.4 LIFF: Final Report (รายงานสุดท้าย)
- Size: **Full**
- Endpoint URL: `YOUR_WEB_APP_URL?page=final-report`
- Copy **LIFF ID**

#### 3.5 LIFF: Job Viewer (ดูรายละเอียดงาน)
- Size: **Tall**
- Endpoint URL: `YOUR_WEB_APP_URL?page=job-viewer`
- Copy **LIFF ID**

---

### 4. สร้าง Google Docs Templates

#### 4.1 Quotation Template

1. สร้าง Google Docs ใหม่
2. ตั้งชื่อ "PDC - Quotation Template"
3. ออกแบบเอกสารตามต้องการ โดยใช้ Placeholder ดังนี้:

```
===========================================
       บริษัท PDC มอเตอร์ จำกัด
   เลขที่ 123 ถ.สุขุมวิท กรุงเทพฯ 10110
     โทร: 02-xxx-xxxx | Line: @pdc
===========================================

ใบเสนอราคา
เลขที่: {{quotation_no}}
วันที่: {{quotation_date}}
ใช้ได้ถึง: {{valid_until}}

เรียน: {{customer_name}}
บริษัท: {{company}}

งาน: {{job_id}}
เครื่องจักร: {{asset_desc}}
Serial No: {{serial_no}}
ยี่ห้อ: {{brand}} / รุ่น: {{model}}

---------------------------------------------
รายการซ่อม
---------------------------------------------
{{items_table}}

---------------------------------------------
ยอดรวม: {{subtotal}}
VAT 7%: {{vat}}
รวมทั้งสิ้น: {{total}}
---------------------------------------------

หมายเหตุ:
- ราคานี้รวม VAT แล้ว
- ระยะเวลาซ่อม: 7-14 วัน
- รับประกัน: 90 วัน

ผู้เสนอราคา: _________________
วันที่: _________________
```

4. **File** → **Share** → **Copy link** (Anyone with the link can view)
5. จาก URL: `https://docs.google.com/document/d/ABC123XYZ/edit`
6. Copy **Document ID**: `ABC123XYZ` → บันทึกไว้

#### 4.2 Work Order Template

ทำเหมือน 4.1 แต่ใช้ Placeholder:
- `{{wo_no}}`, `{{wo_date}}`, `{{job_id}}`
- `{{customer_name}}`, `{{company}}`
- `{{asset_desc}}`, `{{serial_no}}`, `{{brand}}`, `{{model}}`
- `{{repair_items}}`, `{{eta_finish}}`

#### 4.3 Final Report Template

ทำเหมือน 4.1 แต่ใช้ Placeholder:
- `{{report_no}}`, `{{report_date}}`, `{{job_id}}`
- `{{customer_name}}`, `{{company}}`
- `{{asset_desc}}`, `{{serial_no}}`
- `{{repair_summary}}`
- `{{voltage}}`, `{{current}}`, `{{rpm}}`
- `{{ir}}`, `{{vibration}}`, `{{temperature}}`
- `{{pass_fail}}`, `{{test_remark}}`
- `{{photos_url}}`

---

### 5. Deploy Apps Script as Web App

1. เปิด Apps Script Editor
2. **Deploy** → **New deployment**
3. Type: **Web app**
4. Settings:
   - Description: "PDC System v1.0"
   - Execute as: **Me**
   - Who has access: **Anyone**
5. คลิก **Deploy**
6. Copy **Web app URL** → บันทึกไว้

---

### 6. สร้าง Google Drive Folders

1. สร้างโฟลเดอร์หลัก: "PDC System Files"
2. ภายในสร้างโฟลเดอร์ย่อย:
   - `01_Quotations`
   - `02_WorkOrders`
   - `03_FinalReports`
   - `04_Photos_Before`
   - `05_Photos_Process`
   - `06_Photos_After`
   - `07_TestResults`
   - `08_Delivery`
3. คลิกขวาแต่ละโฟลเดอร์ → **Share** → **Get link** → Copy **Folder ID**
   - จาก URL: `https://drive.google.com/drive/folders/ABC123XYZ`
   - Folder ID คือ: `ABC123XYZ`

---

### 7. แก้ไข Config.gs

กลับไปที่ Apps Script Editor → เปิด `Config.gs`

แก้ไขค่าต่อไปนี้:

```javascript
LINE: {
  INTERNAL_CHANNEL_ACCESS_TOKEN: 'YOUR_TOKEN_FROM_STEP_2.1',
  INTERNAL_CHANNEL_SECRET: 'YOUR_SECRET_FROM_STEP_2.1',
  EXTERNAL_CHANNEL_ACCESS_TOKEN: 'YOUR_TOKEN_FROM_STEP_2.2',
  EXTERNAL_CHANNEL_SECRET: 'YOUR_SECRET_FROM_STEP_2.2',
},

LIFF: {
  QUOTATION: 'YOUR_LIFF_ID_FROM_STEP_3.1',
  WORK_ORDER: 'YOUR_LIFF_ID_FROM_STEP_3.2',
  STATUS_UPDATE: 'YOUR_LIFF_ID_FROM_STEP_3.3',
  FINAL_TEST: 'YOUR_LIFF_ID_FROM_STEP_3.4',
  JOB_VIEWER: 'YOUR_LIFF_ID_FROM_STEP_3.5',
},

TEMPLATES: {
  QUOTATION: 'YOUR_DOC_ID_FROM_STEP_4.1',
  WORK_ORDER: 'YOUR_DOC_ID_FROM_STEP_4.2',
  FINAL_REPORT: 'YOUR_DOC_ID_FROM_STEP_4.3',
},

DRIVE_FOLDERS: {
  QUOTATIONS: 'YOUR_FOLDER_ID',
  WORK_ORDERS: 'YOUR_FOLDER_ID',
  FINAL_REPORTS: 'YOUR_FOLDER_ID',
  PHOTOS_BEFORE: 'YOUR_FOLDER_ID',
  PHOTOS_PROCESS: 'YOUR_FOLDER_ID',
  PHOTOS_AFTER: 'YOUR_FOLDER_ID',
  TEST_RESULTS: 'YOUR_FOLDER_ID',
  DELIVERY: 'YOUR_FOLDER_ID',
},

WEB_APP_URL: 'YOUR_WEB_APP_URL_FROM_STEP_5'
```

**Save** → **Deploy** → **Manage deployments** → **Edit** → **Version: New version** → **Deploy**

---

### 8. ตั้งค่า Webhook URL

1. กลับไปที่ LINE Developers Console
2. เลือก Channel Internal
3. **Messaging API** tab
4. Webhook URL: ใส่ `YOUR_WEB_APP_URL` (จาก Step 5)
5. **Verify** → ถ้าขึ้น "Success" แสดงว่าถูกต้อง
6. ทำซ้ำกับ Channel External

---

### 9. ทดสอบระบบ

1. กลับไปที่ Google Sheets
2. เมนู **PDC System** → **Create Sample Job**
3. เมนู **PDC System** → **Generate Sample Quotation**
4. ตรวจสอบว่า PDF ถูกสร้างใน Google Drive
5. เมนู **PDC System** → **Test LINE API**
6. เมนู **PDC System** → **Show Configuration** → ตรวจสอบว่าไม่มี Error

---

### 10. เพิ่มผู้ใช้งาน

#### เพิ่มพนักงาน (Internal Users)

1. ไปที่ Sheet: **Users**
2. เพิ่มแถวใหม่:
   ```
   user_id | name | email | phone | role | internal_line_user_id | ...
   U001 | สมชาย | somchai@pdc.com | 081-xxx-xxxx | planner | Uxxxxx | ...
   ```
3. หา LINE User ID: Add Friend OA Internal → ส่งข้อความ "สวัสดี" → ดูใน Events Log

#### เพิ่มลูกค้า (Customers)

1. ไปที่ Sheet: **Customers**
2. เพิ่มแถวใหม่:
   ```
   customer_id | company | contact_name | line_user_id | ...
   C001 | บริษัท ABC | คุณสมหญิง | Uyyyyy | ...
   ```

---

## ✅ เสร็จสิ้น!

ระบบพร้อมใช้งานแล้ว 🎉

### Next Steps:
- ทดสอบสร้างงานจริง
- ทดสอบส่งใบเสนอราคา
- ทดสอบอนุมัติผ่าน LINE
- ทดสอบอัพเดทสถานะ
- ทดสอบส่งรายงานสุดท้าย

---

## 🆘 การแก้ปัญหา

### ปัญหา: Webhook ไม่ทำงาน
- ตรวจสอบ Webhook URL ว่าถูกต้องหรือไม่
- ตรวจสอบว่า Deploy แบบ "Anyone" access
- ลอง Verify webhook ใน LINE Console

### ปัญหา: PDF ไม่ถูกสร้าง
- ตรวจสอบ Template ID ใน Config.gs
- ตรวจสอบสิทธิ์ Access ของ Google Docs (Anyone with link can view)
- ตรวจสอบ Folder ID ใน Config.gs

### ปัญหา: LINE ไม่ส่งข้อความ
- ตรวจสอบ Channel Access Token
- ตรวจสอบว่าได้ Add Friend OA แล้ว
- ตรวจสอบ line_user_id ใน Database

---

## 📞 ติดต่อสอบถาม

หากมีปัญหาหรือข้อสงสัย:
- Email: support@pdc-motor.com
- LINE: @pdcsupport

**Happy Building! 🚀**
