# PDF Generator Setup Guide

## 📋 ภาพรวม

PDF Generator สำหรับสร้างเอกสารอัตโนมัติ:
1. **Quotation PDF** - ใบเสนอราคา
2. **Work Order PDF** - ใบสั่งงาน
3. **Final Report PDF** - รายงานสุดท้าย

## 🚀 การ Setup

### Step 1: รัน Setup Script

ใน Google Apps Script Editor:

```javascript
// เปิด Apps Script Editor
// ไปที่ SetupTemplates.js
// รันฟังก์ชัน: setupTemplatesAndFolders()
```

Script จะสร้าง:
- ✅ Google Drive Folders (9 โฟลเดอร์)
- ✅ Google Docs Templates (3 templates)

### Step 2: Copy IDs

หลังจากรัน `setupTemplatesAndFolders()` จะได้ IDs ใน Log:

```
TEMPLATES: {
  QUOTATION: '1abc...xyz',
  WORK_ORDER: '1def...xyz',
  FINAL_REPORT: '1ghi...xyz'
},

DRIVE_FOLDERS: {
  ROOT: '1jkl...xyz',
  QUOTATIONS: '1mno...xyz',
  WORK_ORDERS: '1pqr...xyz',
  FINAL_REPORTS: '1stu...xyz',
  PHOTOS_BEFORE: '1vwx...xyz',
  PHOTOS_PROCESS: '1yza...xyz',
  PHOTOS_AFTER: '1bcd...xyz',
  TEST_RESULTS: '1efg...xyz',
  DELIVERY: '1hij...xyz'
}
```

### Step 3: อัพเดท config.js

Copy IDs ไปใส่ใน `config.js`:

```javascript
// config.js

TEMPLATES: {
  QUOTATION: '1abc...xyz',  // แทนที่ YOUR_GOOGLE_DOCS_TEMPLATE_ID_QUOTATION
  WORK_ORDER: '1def...xyz', // แทนที่ YOUR_GOOGLE_DOCS_TEMPLATE_ID_WORKORDER
  FINAL_REPORT: '1ghi...xyz' // แทนที่ YOUR_GOOGLE_DOCS_TEMPLATE_ID_FINALREPORT
},

DRIVE_FOLDERS: {
  ROOT: '1jkl...xyz',
  QUOTATIONS: '1mno...xyz',
  WORK_ORDERS: '1pqr...xyz',
  FINAL_REPORTS: '1stu...xyz',
  PHOTOS_BEFORE: '1vwx...xyz',
  PHOTOS_PROCESS: '1yza...xyz',
  PHOTOS_AFTER: '1bcd...xyz',
  TEST_RESULTS: '1efg...xyz',
  DELIVERY: '1hij...xyz'
}
```

### Step 4: Save และ Deploy

1. บันทึก config.js
2. Deploy Apps Script ใหม่ (สร้าง Deployment ใหม่)
3. อัพเดท worker.js ด้วย Deployment URL ใหม่ (ถ้าจำเป็น)

## 📄 Template Placeholders

### Quotation Template

```
{{quotation_no}}      - เลขที่ใบเสนอราคา (Q-202510-0001)
{{quotation_date}}    - วันที่ออกใบเสนอราคา
{{valid_until}}       - วันหมดอายุ
{{job_id}}            - Job ID (PDC-202510-0001)
{{customer_name}}     - ชื่อลูกค้า
{{company}}           - ชื่อบริษัท
{{asset_desc}}        - รายละเอียดมอเตอร์
{{serial_no}}         - Serial Number
{{brand}}             - ยี่ห้อ
{{model}}             - รุ่น
{{items_table}}       - ตารางรายการซ่อม
{{subtotal}}          - ยอดรวมก่อน VAT
{{vat}}               - ภาษี VAT 7%
{{total}}             - ยอดรวมทั้งสิ้น
```

### Work Order Template

```
{{wo_no}}             - เลขที่ใบสั่งงาน (WO-202510-0001)
{{wo_date}}           - วันที่ออกใบสั่งงาน
{{job_id}}            - Job ID
{{customer_name}}     - ชื่อลูกค้า
{{company}}           - ชื่อบริษัท
{{asset_desc}}        - รายละเอียดมอเตอร์
{{serial_no}}         - Serial Number
{{brand}}             - ยี่ห้อ
{{model}}             - รุ่น
{{eta_finish}}        - กำหนดส่งมอบ
{{repair_items}}      - รายการซ่อม
```

### Final Report Template

```
{{report_no}}         - เลขที่รายงาน (FR-202510-0001)
{{report_date}}       - วันที่ออกรายงาน
{{job_id}}            - Job ID
{{customer_name}}     - ชื่อลูกค้า
{{company}}           - ชื่อบริษัท
{{asset_desc}}        - รายละเอียดมอเตอร์
{{serial_no}}         - Serial Number
{{repair_summary}}    - สรุปการซ่อม
{{voltage}}           - แรงดันไฟฟ้า (380 V)
{{current}}           - กระแสไฟฟ้า (85 A)
{{rpm}}               - ความเร็วรอบ (1450 RPM)
{{ir}}                - ค่า Insulation Resistance (50 MΩ)
{{vibration}}         - ค่า Vibration (2.8 mm/s)
{{temperature}}       - อุณหภูมิ (65 °C)
{{pass_fail}}         - ผลการทดสอบ (PASS/FAIL)
{{test_remark}}       - หมายเหตุ
{{photos_url}}        - URL รูปภาพ
```

## 🧪 การทดสอบ

### Test PDF Generator

```javascript
// ใน Apps Script Editor
function testPDFGenerator() {
  const jobId = 'PDC-202510-0001'; // ใส่ Job ID ที่มีจริง
  
  // ทดสอบ Quotation PDF
  const quotationUrl = generateQuotationPDF(jobId);
  Logger.log('Quotation PDF: ' + quotationUrl);
  
  // ทดสอบ Work Order PDF
  const woUrl = generateWorkOrderPDF(jobId);
  Logger.log('Work Order PDF: ' + woUrl);
  
  // ทดสอบ Final Report PDF
  const reportUrl = generateFinalReportPDF(jobId);
  Logger.log('Final Report PDF: ' + reportUrl);
}
```

## 🎨 การปรับแต่ง Templates

### วิธีแก้ไข Template

1. เปิด Google Drive → ไปที่โฟลเดอร์ "PDC Smart Motor Repair - Documents"
2. เปิดไฟล์ Template ที่ต้องการแก้ไข:
   - Template - Quotation
   - Template - Work Order
   - Template - Final Report
3. แก้ไขเนื้อหา (เปลี่ยนแปลงข้อความ, ฟอนต์, สี, โลโก้)
4. **อย่าลบ Placeholders** (เช่น `{{quotation_no}}`, `{{customer_name}}`)
5. บันทึกและปิด

### เพิ่มโลโก้บริษัท

1. เปิด Template
2. Insert → Image → Upload หรือ Insert from URL
3. ใส่โลโก้ที่ตำแหน่งที่ต้องการ (มุมบนซ้าย/ขวา)
4. Resize และจัดตำแหน่ง
5. บันทึก

### เปลี่ยนฟอนต์และสี

1. เลือกข้อความทั้งหมด (Ctrl+A)
2. เปลี่ยนฟอนต์ (แนะนำ: TH Sarabun New, Arial)
3. ตั้งสี Header (เช่น สีน้ำเงิน: #4285F4)
4. บันทึก

## 📂 Drive Folder Structure

```
PDC Smart Motor Repair - Documents/
├── Quotations/                 ← ใบเสนอราคา PDF
├── Work Orders/                ← ใบสั่งงาน PDF
├── Final Reports/              ← รายงานสุดท้าย PDF
├── Photos - Before/            ← รูปภาพก่อนซ่อม
├── Photos - Process/           ← รูปภาพระหว่างซ่อม
├── Photos - After/             ← รูปภาพหลังซ่อม
├── Test Results/               ← ผลการทดสอบ
├── Delivery Documents/         ← เอกสารส่งมอบ
├── Template - Quotation        ← Template ใบเสนอราคา
├── Template - Work Order       ← Template ใบสั่งงาน
└── Template - Final Report     ← Template รายงาน
```

## 🔧 Troubleshooting

### ❌ Error: Template ID not configured

**สาเหตุ:** ยังไม่ได้ตั้งค่า Template IDs ใน config.js

**วิธีแก้:**
1. รัน `setupTemplatesAndFolders()`
2. Copy IDs จาก Log
3. อัพเดท config.js
4. Deploy ใหม่

### ❌ Error: Cannot access Drive folder

**สาเหตุ:** Folder ID ผิดหรือไม่มีสิทธิ์เข้าถึง

**วิธีแก้:**
1. ตรวจสอบ Folder ID ใน config.js
2. เช็คว่า Apps Script มีสิทธิ์เข้าถึง Google Drive
3. ไปที่ Project Settings → OAuth Scopes → อนุญาต Drive API

### ❌ PDF ไม่แสดงข้อมูล

**สาเหตุ:** Placeholder ไม่ตรงกับ Template

**วิธีแก้:**
1. เปิด Template Document
2. ตรวจสอบว่ามี `{{placeholder}}` ครบ
3. ตรวจสอบตัวสะกด (case-sensitive)
4. ลองสร้าง PDF ใหม่

### ❌ Font ภาษาไทยแสดงผิด

**วิธีแก้:**
1. เปิด Template
2. เปลี่ยนฟอนต์เป็น TH Sarabun New หรือ Arial
3. บันทึก
4. สร้าง PDF ใหม่

## 🗑️ Cleanup (ลบและเริ่มใหม่)

ถ้าต้องการลบและสร้างใหม่:

```javascript
// 1. ลบ Folders และ Templates เดิม
cleanupTemplatesAndFolders();

// 2. สร้างใหม่
setupTemplatesAndFolders();

// 3. Copy IDs ใหม่ไปใส่ config.js
```

## 📚 Additional Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [DocumentApp Class](https://developers.google.com/apps-script/reference/document/document-app)
- [DriveApp Class](https://developers.google.com/apps-script/reference/drive/drive-app)

## ✅ Checklist

- [ ] รัน `setupTemplatesAndFolders()`
- [ ] Copy Template IDs ไปใส่ config.js
- [ ] Copy Folder IDs ไปใส่ config.js
- [ ] แก้ไข Templates (เพิ่มโลโก้, เปลี่ยนฟอนต์)
- [ ] Deploy Apps Script ใหม่
- [ ] ทดสอบสร้าง PDF (quotation, work order, final report)
- [ ] เช็ค PDF ที่สร้างออกมาว่าถูกต้อง
- [ ] Share Folder กับทีม (ถ้าจำเป็น)
