# PDC Smart Motor Repair System

ระบบจัดการงานซ่อมมอเตอร์แบบครบวงจร (End-to-End) ผ่าน LINE Official Account

## 🎯 ภาพรวมระบบ

ระบบนี้ออกแบบมาเพื่อจัดการงานซ่อมมอเตอร์ตั้งแต่รับงาน ตรวจสอบ ใบเสนอราคา ติดตามงาน ทดสอบ จนถึงส่งมอบ โดยใช้ LINE เป็นช่องทางหลักในการสื่อสาร

### ✨ คุณสมบัติหลัก

- ✅ **LINE Integration**: ใช้ LINE OA สำหรับพนักงานและลูกค้า
- ✅ **LIFF Apps**: ฟอร์มต่างๆ ทำงานภายใน LINE
- ✅ **Auto PDF/Excel**: สร้างเอกสารอัตโนมัติ (ใบเสนอราคา, ใบสั่งงาน, รายงาน)
- ✅ **Real-time Tracking**: ติดตามสถานะงาน 9 ขั้นตอน
- ✅ **Google Sheets Database**: จัดเก็บข้อมูลทั้งหมด
- ✅ **Dashboard**: วิเคราะห์ข้อมูลด้วย Looker Studio

### 📋 3 ฟอร์มหลัก

1. **Form #1: Quotation** - ใบเสนอราคา (Sales/Planner)
2. **Form #2: Work Order** - ใบสั่งงานภายใน (Auto-generate)
3. **Form #3: Final Report** - รายงานสุดท้าย (Planner/QC)

### 🔄 9 ขั้นตอนการทำงาน

1. รับงาน & ตรวจสอบพื้นฐาน
2. สร้างใบเสนอราคา → ส่ง LINE ลูกค้า
3. ลูกค้าอนุมัติ → สร้างใบสั่งงาน
4. ติดตามงาน (Received → Disassembly → Burnout → Core → Rewinding → Varnish → Assembly → Balancing → Painting → QC → Delivery)
5. ทดสอบไฟฟ้า (Electrical Test)
6. สร้างรายงานสุดท้าย (Before/After Photos)
7. ส่งมอบงาน
8. รับคำติชม
9. วิเคราะห์ KPI/Dashboard

## 🗂️ โครงสร้างโปรเจกต์

```
PDC-Smart-Motor-Repair/
├── apps-script/              # Google Apps Script Backend
│   ├── Code.gs              # Main entry point
│   ├── Config.gs            # Configuration & Constants
│   ├── Database.gs          # Google Sheets operations
│   ├── Webhook.gs           # LINE webhook handlers
│   ├── PDFGenerator.gs      # PDF/Excel generation
│   ├── StateMachine.gs      # Job status state machine
│   ├── LineAPI.gs           # LINE Messaging API
│   ├── Utils.gs             # Utility functions
│   └── appsscript.json      # Apps Script manifest
├── liff-apps/               # LIFF Applications (HTML/CSS/JS)
│   ├── quotation/           # Form #1: ใบเสนอราคา
│   ├── work-order/          # Form #2: ใบสั่งงาน
│   ├── status-update/       # อัพเดทสถานะงาน
│   ├── final-test/          # บันทึกผลทดสอบ
│   └── final-report/        # Form #3: รายงานสุดท้าย
├── templates/               # PDF Templates (Google Docs)
│   ├── quotation-template.md
│   ├── workorder-template.md
│   └── finalreport-template.md
├── docs/                    # Documentation
│   ├── SETUP_GUIDE.md       # คู่มือติดตั้ง
│   ├── USER_MANUAL.md       # คู่มือใช้งาน
│   ├── API_DOCS.md          # API Documentation
│   └── LINE_SETUP.md        # LINE OA & LIFF Setup
└── README.md                # This file
```

## 📊 Database Schema (Google Sheets)

### Sheet 1: Jobs
ตารางหลักสำหรับงานซ่อม
- job_id (PK): PDC-YYYYMM-####
- customer_id, customer_name, sales_owner
- asset_desc, serial_no, brand, model
- status: Draft/Approved/In-Progress/Completed/Delivered/Cancelled
- milestone: ขั้นตอนปัจจุบัน
- eta_finish, created_at, updated_at
- quotation_pdf, workorder_pdf, final_report_pdf

### Sheet 2: JobItems
รายการซ่อม/ชิ้นงาน (15-20 รายการ/งาน)
- item_id (PK), job_id (FK)
- line_no, title, tech_detail, uom, qty
- unit_price, subtotal
- is_quoted, is_approved
- media_group_id

### Sheet 3: Media
รูปภาพ/เอกสาร/วิดีโอ
- media_id (PK), job_id, item_id
- milestone (before/process/after/test/delivery)
- type (photo/video/report/signature)
- drive_file_id, webapp_url
- created_by, created_at, note

### Sheet 4: Events
ประวัติการเปลี่ยนแปลง
- event_id, job_id, actor_role, actor_id
- event_type (inspect_added/quote_sent/approved/status_update/test_saved/final_report)
- payload_json, created_at

### Sheet 5: Approvals
การอนุมัติใบเสนอราคา
- approval_id, job_id
- approved_by_line_user_id, approved_name
- po_no, approved_at, channel

### Sheet 6: TestResult
ผลทดสอบไฟฟ้า
- job_id (PK), voltage, current, rpm
- ir_mohm, vibration_mm_s, temp_c
- remark, tester, tested_at
- balancing_spec, attachments_media_group_id

### Sheet 7: Users
ผู้ใช้งานภายใน
- user_id, name, role (planner/tech/electrical/qc/sales/manager)
- internal_line_user_id, email, phone
- is_active, created_at

### Sheet 8: Customers
ข้อมูลลูกค้า
- customer_id (PK), company, contact_name
- line_user_id, email, phone
- address, tax_id
- is_active, created_at

## 🚀 Quick Start

### 1. สร้าง Google Sheets Database

```bash
# รันคำสั่งนี้เพื่อสร้าง Google Sheets พร้อม Schema
# (ดูรายละเอียดใน docs/SETUP_GUIDE.md)
```

### 2. Deploy Apps Script

1. เปิด Google Sheets ที่สร้างไว้
2. Extensions → Apps Script
3. Copy code จากโฟลเดอร์ `apps-script/`
4. แก้ไข `Config.gs` ใส่ค่า LINE Channel Access Token, Secret, LIFF ID
5. Deploy → New deployment → Web app

### 3. Setup LINE Official Account

ดูรายละเอียดใน `docs/LINE_SETUP.md`

### 4. Deploy LIFF Apps

1. สร้าง LIFF Apps 5 ตัว ใน LINE Developers Console
2. Upload HTML files จาก `liff-apps/`
3. บันทึก LIFF ID ลงใน `Config.gs`

### 5. Create PDF Templates

1. Copy templates จาก `templates/` ไปสร้างเป็น Google Docs
2. บันทึก Document ID ลงใน `Config.gs`

## 🔧 Configuration

แก้ไขไฟล์ `apps-script/Config.gs`:

```javascript
const CONFIG = {
  // LINE Configuration
  LINE_CHANNEL_ACCESS_TOKEN: 'YOUR_CHANNEL_ACCESS_TOKEN',
  LINE_CHANNEL_SECRET: 'YOUR_CHANNEL_SECRET',
  
  // LIFF IDs
  LIFF_QUOTATION: 'YOUR_LIFF_ID_1',
  LIFF_STATUS_UPDATE: 'YOUR_LIFF_ID_2',
  LIFF_FINAL_TEST: 'YOUR_LIFF_ID_3',
  LIFF_FINAL_REPORT: 'YOUR_LIFF_ID_4',
  
  // Google Docs Template IDs
  TEMPLATE_QUOTATION: 'YOUR_DOC_ID_1',
  TEMPLATE_WORKORDER: 'YOUR_DOC_ID_2',
  TEMPLATE_FINALREPORT: 'YOUR_DOC_ID_3',
  
  // Google Drive Folder IDs
  FOLDER_QUOTATIONS: 'YOUR_FOLDER_ID_1',
  FOLDER_WORKORDERS: 'YOUR_FOLDER_ID_2',
  FOLDER_FINALREPORTS: 'YOUR_FOLDER_ID_3',
  FOLDER_PHOTOS: 'YOUR_FOLDER_ID_4'
};
```

## 📱 LINE Integration

### OA พนักงาน (Internal)
- Planner: สร้างงาน, ตรวจสอบ, อัพเดทสถานะ
- ช่างไฟฟ้า: บันทึกผลทดสอบ
- ช่างกล: อัพเดทสถานะงาน
- QC: ตรวจสอบคุณภาพ
- Sales: สร้างใบเสนอราคา

### OA ลูกค้า (External)
- รับใบเสนอราคา
- อนุมัติ/ปฏิเสธ
- ดูสถานะงาน
- รับรายงานสุดท้าย

## 🎨 LIFF Apps

### 1. Quotation Builder (ใบเสนอราคา)
- เลือกรายการซ่อมจาก JobItems
- กรอกราคา/จำนวน/ส่วนลด
- อัปโหลดรูป Before
- Generate PDF → ส่ง LINE ลูกค้า

### 2. Status Update (อัพเดทสถานะ)
- เลือก Milestone (9 ขั้นตอน)
- กรอกหน่วยงาน, อัปโหลดรูป 1-3 รูป
- Push LINE ลูกค้าอัตโนมัติ

### 3. Final Test Input (บันทึกผลทดสอบ)
- กรอก: Voltage, Current, RPM, IR, Vibration, Temperature
- อัปโหลดรูปผลทดสอบ
- บันทึกลง TestResult

### 4. Final Report (รายงานสุดท้าย)
- เลือกรูป Before/After
- สรุปงานซ่อม
- Generate Final Report PDF
- ส่ง LINE ลูกค้า + พิมพ์

## 📈 Dashboard & Reports

### KPI หลัก
- จำนวนงาน (รับ/เสร็จ/ค้าง)
- Lead Time เฉลี่ย
- อัตราอนุมัติใบเสนอราคา
- Customer Satisfaction
- ผลทดสอบ (Vibration, IR, Temperature)

### Looker Studio
- เชื่อมต่อกับ Google Sheets
- Dashboard แบบ Real-time
- Filter ตามช่วงเวลา/ลูกค้า/ช่าง

## 🔒 Security & Privacy

- ✅ ตรวจสอบ LINE Signature ทุกครั้ง
- ✅ Validate line_user_id ก่อน push message
- ✅ Role-based access control
- ✅ Backup Sheet ทุกวัน
- ✅ Log ทุก event

## 📞 Support & Contact

- **Developer**: PDC Development Team
- **Email**: support@pdc-motor.com
- **Version**: 1.0.0
- **Last Updated**: October 2025

## 📝 License

Copyright © 2025 PDC Smart Motor Repair. All rights reserved.

---

## 🎓 Next Steps

1. ✅ อ่าน [Setup Guide](docs/SETUP_GUIDE.md)
2. ✅ Setup [LINE OA & LIFF](docs/LINE_SETUP.md)
3. ✅ Deploy Apps Script
4. ✅ ทดสอบระบบกับงาน 1-2 งาน
5. ✅ อบรมทีมงาน
6. ✅ Go Live!

**Happy Coding! 🚀**
