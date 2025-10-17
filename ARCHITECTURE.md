# 🏗️ PDC Smart Motor Repair - System Architecture

**วันที่อัพเดท:** 17 ตุลาคม 2568

---

## 📋 สารบัญ

1. [ภาพรวมระบบ](#ภาพรวมระบบ)
2. [Entity Relationships](#entity-relationships)
3. [Data Flow](#data-flow)
4. [User Journey](#user-journey)
5. [API Architecture](#api-architecture)
6. [Technology Stack](#technology-stack)

---

## 🎯 ภาพรวมระบบ

### **ระบบจัดการงานซ่อมมอเตอร์แบบครบวงจร**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PDC Smart Motor Repair System                │
└─────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┴─────────────────┐
                │                                   │
        ┌───────▼────────┐                 ┌───────▼────────┐
        │  Internal OA   │                 │  External OA   │
        │   (พนักงาน)    │                 │   (ลูกค้า)     │
        └───────┬────────┘                 └───────┬────────┘
                │                                   │
        ┌───────▼──────────────────────────────────▼────────┐
        │            LINE Messaging API                     │
        │            Cloudflare Worker (Webhook Proxy)      │
        └───────────────────┬───────────────────────────────┘
                            │
                ┌───────────▼───────────┐
                │  Google Apps Script   │
                │  (Backend + API)      │
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│ Google Sheets  │  │ Google Docs │  │ Google Drive    │
│ (Database)     │  │ (Templates) │  │ (File Storage)  │
└────────────────┘  └─────────────┘  └─────────────────┘
```

---

## 🗂️ Entity Relationships

### **1. Core Entities (ตารางหลัก)**

```
┌──────────────┐
│   Customer   │ ← ลูกค้า
├──────────────┤
│ customer_id  │ (PK)
│ company      │
│ contact_name │
│ line_user_id │ ← เชื่อมกับ External OA
│ email        │
│ phone        │
│ address      │
└──────┬───────┘
       │ 1
       │
       │ N
       ▼
┌──────────────┐
│     Job      │ ← งานซ่อม (ตารางหลักสุด)
├──────────────┤
│ job_id       │ (PK) PDC-202510-0001
│ customer_id  │ (FK) → Customer
│ sales_owner  │ (FK) → Users (พนักงานขาย)
│ status       │ DRAFT/PENDING/APPROVED/IN_PROGRESS/COMPLETED
│ milestone    │ RECEIVED/DISASSEMBLY/.../DELIVERY
│ quotation_no │ Q-202510-0001
│ eta_finish   │ กำหนดส่ง
│ created_at   │
│ updated_at   │
└──────┬───────┘
       │ 1
       │
       ├─────────────────┬─────────────────┬──────────────┐
       │ N               │ N               │ N            │ N
       ▼                 ▼                 ▼              ▼
┌──────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐
│   JobItems   │  │    Media    │  │  Events  │  │Approvals │
├──────────────┤  ├─────────────┤  ├──────────┤  ├──────────┤
│ item_id (PK) │  │ media_id    │  │ event_id │  │approval  │
│ job_id (FK)  │  │ job_id (FK) │  │ job_id   │  │job_id    │
│ line_no      │  │ item_id     │  │ actor_id │  │po_no     │
│ title        │  │ milestone   │  │ event    │  │approved  │
│ tech_detail  │  │ type        │  │ payload  │  │  _at     │
│ qty          │  │ drive_file  │  │ created  │  └──────────┘
│ unit_price   │  │   _id       │  │   _at    │
│ subtotal     │  │ created_at  │  └──────────┘
└──────────────┘  └─────────────┘
```

### **2. Support Entities (ตารางสนับสนุน)**

```
┌──────────────┐       ┌──────────────┐
│    Users     │       │ TestResults  │
├──────────────┤       ├──────────────┤
│ user_id (PK) │       │ job_id (PK)  │ ← 1 Job = 1 Test Result
│ name         │       │ voltage      │
│ role         │       │ current      │
│ internal_    │       │ rpm          │
│   line_user  │       │ ir_mohm      │
│   _id        │       │ vibration    │
│ email        │       │ temp_c       │
│ phone        │       │ tester       │
└──────────────┘       │ tested_at    │
                       └──────────────┘
```

---

## 🔄 Data Flow (การไหลของข้อมูล)

### **Flow 1: สร้างงานใหม่ (Job Creation)**

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: พนักงานสร้างงาน (Planning/Sales)                    │
└─────────────────────────────────────────────────────────────┘

Internal OA → LIFF (Job Creation) → Apps Script
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │ createJobWithItems()  │
                            └───────┬───────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌──────────┐   ┌──────────────┐
            │ Customer  │   │   Job    │   │  JobItems    │
            │  (Create  │   │ (Create) │   │  (Create 2-5)│
            │   if new) │   │          │   │              │
            └───────────┘   └────┬─────┘   └──────────────┘
                                 │
                                 ▼
                        ┌────────────────┐
                        │ generateJobId()│
                        │ PDC-202510-0001│
                        └────────────────┘
                                 │
                                 ▼
                        Status = DRAFT
                        Milestone = RECEIVED
```

### **Flow 2: สร้างใบเสนอราคา (Quotation)**

```
┌─────────────────────────────────────────────────────────────┐
│ Step 2: สร้าง Quotation & ส่งลูกค้า                         │
└─────────────────────────────────────────────────────────────┘

พนักงาน (Internal OA) 
    │
    ├─ เลือก Job ที่สถานะ DRAFT
    ├─ กรอกราคา/ส่วนลด/รายละเอียด
    └─ กด "Generate Quotation"
              │
              ▼
    ┌─────────────────────┐
    │ generateQuotation() │
    └──────────┬──────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌───────────┐
│ Copy   │ │Replace │ │ Export to │
│ Google │ │ Merge  │ │ PDF       │
│ Docs   │ │ Fields │ │           │
│Template│ │        │ │           │
└────────┘ └────────┘ └─────┬─────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ Save to Google Drive  │
                │ Q-202510-0001.pdf     │
                └──────────┬────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ Update Job:          │
                │ - quotation_no       │
                │ - quotation_pdf_url  │
                │ - status = PENDING   │
                └──────────┬───────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │ Push LINE to Customer        │
            │ (External OA)                │
            │                              │
            │ "ใบเสนอราคา Q-202510-0001" │
            │ [ดูใบเสนอราคา] (LIFF)       │
            │ [อนุมัติ] [ปฏิเสธ]          │
            └──────────────────────────────┘
```

### **Flow 3: ลูกค้าอนุมัติ (Customer Approval)**

```
┌─────────────────────────────────────────────────────────────┐
│ Step 3: ลูกค้าอนุมัติใบเสนอราคา                            │
└─────────────────────────────────────────────────────────────┘

ลูกค้า (External OA)
    │
    ├─ กด "ดูใบเสนอราคา" → LIFF Quotation App
    ├─ ดู PDF Quotation
    └─ กด "อนุมัติ" หรือ "ปฏิเสธ"
              │
              ▼
    ┌─────────────────────┐
    │ handleApproval()    │
    └──────────┬──────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌───────────┐
│Approval│ │ Update │ │ Generate  │
│(Create)│ │ Job    │ │ WorkOrder │
│        │ │ Status │ │ PDF       │
│po_no   │ │=APPROV │ │ WO-202510 │
│approved│ │ED      │ │   -0001   │
│_at     │ │        │ │           │
└────────┘ └────────┘ └─────┬─────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ Push LINE:            │
                │                       │
                │ Internal OA:          │
                │ → แจ้งพนักงานว่ามีงาน │
                │                       │
                │ External OA:          │
                │ → ขอบคุณที่อนุมัติ    │
                └───────────────────────┘
```

### **Flow 4: อัพเดทสถานะงาน (Status Update)**

```
┌─────────────────────────────────────────────────────────────┐
│ Step 4: ช่างอัพเดทสถานะตามขั้นตอน                          │
└─────────────────────────────────────────────────────────────┘

ช่าง (Internal OA)
    │
    ├─ เลือก Job
    ├─ เลือก Milestone ถัดไป
    ├─ Upload รูป 1-3 รูป (optional)
    └─ กด "อัพเดท"
              │
              ▼
    ┌─────────────────────┐
    │ updateJobStatus()   │
    └──────────┬──────────┘
               │
    ┌──────────┼──────────────┐
    │          │              │
    ▼          ▼              ▼
┌────────┐ ┌────────┐ ┌──────────┐
│ Upload │ │ Update │ │ Create   │
│ Images │ │ Job    │ │ Event    │
│ to     │ │        │ │ (Log)    │
│ Drive  │ │milestone│ │          │
└────┬───┘ └────────┘ └──────────┘
     │
     ▼
┌──────────────┐
│ Create Media │
│ (link photo) │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Push LINE to Customer│
│ (External OA)        │
│                      │
│ "งานของคุณ PDC-...  │
│  ขั้นตอน: พันขดลวด"  │
│ [ดูรูปภาพ]           │
└──────────────────────┘
```

### **Flow 5: บันทึกผลทดสอบ (Final Test)**

```
┌─────────────────────────────────────────────────────────────┐
│ Step 5: ช่างไฟฟ้าบันทึกผลทดสอบ                             │
└─────────────────────────────────────────────────────────────┘

ช่างไฟฟ้า (Internal OA)
    │
    ├─ เลือก Job
    ├─ กรอก: Voltage, Current, RPM, IR, Vibration, Temp
    ├─ Upload รูปผลทดสอบ
    └─ กด "บันทึก"
              │
              ▼
    ┌─────────────────────┐
    │ saveTestResult()    │
    └──────────┬──────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌───────┐
│ Upload │ │ Create │ │ Update│
│ Test   │ │ Test   │ │ Job   │
│ Photos │ │ Result │ │ Status│
└────────┘ └────────┘ └───────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ Push LINE to Customer │
                │ "งานผ่านการทดสอบ"    │
                │ ผลทดสอบ: ✅          │
                └───────────────────────┘
```

### **Flow 6: รายงานสุดท้าย + ส่งมอบ (Final Report & Delivery)**

```
┌─────────────────────────────────────────────────────────────┐
│ Step 6: QC/Planner สร้างรายงานสุดท้าย                      │
└─────────────────────────────────────────────────────────────┘

QC/Planner (Internal OA)
    │
    ├─ เลือก Job
    ├─ เลือกรูป Before/After
    ├─ สรุปงานซ่อม
    ├─ กำหนด Warranty
    └─ กด "Generate Report"
              │
              ▼
    ┌─────────────────────┐
    │ generateFinalReport()│
    └──────────┬──────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌───────────┐
│ Copy   │ │Replace │ │ Export to │
│ Final  │ │ Merge  │ │ PDF       │
│ Report │ │ Fields │ │ FR-202510 │
│Template│ │        │ │   -0001   │
└────────┘ └────────┘ └─────┬─────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ Update Job:           │
                │ - final_report_pdf    │
                │ - status = COMPLETED  │
                │ - milestone = DELIVERY│
                └──────────┬────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │ Push LINE to Customer        │
            │ (External OA)                │
            │                              │
            │ "งานเสร็จสิ้น! 🎉"          │
            │ [ดูรายงานสุดท้าย] (PDF)     │
            │ [นัดรับมอเตอร์]             │
            └──────────────────────────────┘
```

---

## 👥 User Journey

### **พนักงาน (Internal OA)**

```
┌───────────┐
│  Planner  │ ← รับงาน, สร้าง Quotation
└─────┬─────┘
      │
┌─────▼─────┐
│   Sales   │ ← ติดต่อลูกค้า, ส่ง Quotation
└─────┬─────┘
      │
┌─────▼─────┐
│  Mechanic │ ← ซ่อม, อัพเดทสถานะ (9 ขั้นตอน)
└─────┬─────┘
      │
┌─────▼─────┐
│Electrical │ ← ทดสอบไฟฟ้า
└─────┬─────┘
      │
┌─────▼─────┐
│    QC     │ ← ตรวจสอบคุณภาพ, สร้าง Final Report
└─────┬─────┘
      │
┌─────▼─────┐
│  Packing  │ ← แพ็คของ, ส่งมอบ
└───────────┘
```

### **ลูกค้า (External OA)**

```
┌────────────────┐
│ Add Friend OA  │
└───────┬────────┘
        │
┌───────▼────────┐
│ รับ Quotation  │ ← LINE Notification
└───────┬────────┘
        │
┌───────▼────────┐
│ ดู Quotation   │ ← LIFF App (PDF)
│ PDF            │
└───────┬────────┘
        │
┌───────▼────────┐
│ อนุมัติ/ปฏิเสธ │ ← Quick Reply
└───────┬────────┘
        │
┌───────▼────────┐
│ ติดตามสถานะ   │ ← LINE Notification (Real-time)
│ (9 ขั้นตอน)   │
└───────┬────────┘
        │
┌───────▼────────┐
│ รับรายงาน      │ ← Final Report PDF
│ สุดท้าย        │
└───────┬────────┘
        │
┌───────▼────────┐
│ นัดรับมอเตอร์  │ ← Delivery
└────────────────┘
```

---

## 🔌 API Architecture

### **Apps Script Endpoints**

```javascript
// === doGet (GET Requests) ===

GET /exec?action=getJob&jobId=PDC-202510-0001
→ Returns Job JSON

GET /exec?action=getJobs&status=IN_PROGRESS
→ Returns Jobs Array

GET /exec?action=getQuotation&jobId=PDC-202510-0001
→ Returns Quotation PDF URL

GET /exec?action=getAllJobs
→ Returns all Jobs (for LIFF apps)

// === doPost (POST Requests) ===

POST /exec
Body: { action: "webhook", events: [...] }
→ LINE Webhook (from Cloudflare Worker)

POST /exec
Body: { action: "createJob", data: {...} }
→ Create new Job + Customer + JobItems

POST /exec
Body: { action: "updateStatus", jobId: "...", milestone: "..." }
→ Update Job status

POST /exec
Body: { action: "saveTestResult", jobId: "...", data: {...} }
→ Save Test Result

POST /exec
Body: { action: "generateQuotation", jobId: "..." }
→ Generate Quotation PDF

POST /exec
Body: { action: "generateFinalReport", jobId: "..." }
→ Generate Final Report PDF
```

### **LINE Webhook Flow**

```
LINE Platform
    │
    ▼
Cloudflare Worker (Webhook Proxy)
    │
    ├─ Validate LINE Signature (via query string)
    ├─ Forward to Apps Script
    └─ Return 200 OK immediately
            │
            ▼
    Apps Script: doPost()
            │
            ├─ Parse event type
            ├─ Detect Internal/External OA
            │
            ├─ handleMessageEvent()
            │   ├─ Internal: /help, /jobs, /stats
            │   └─ External: "สถานะ", "งานของฉัน"
            │
            ├─ handlePostbackEvent()
            │   ├─ approve_quote
            │   ├─ reject_quote
            │   └─ view_job
            │
            └─ handleFollowEvent()
                └─ Welcome message
```

---

## 🛠️ Technology Stack

### **Frontend**
- **LIFF SDK**: LINE Front-end Framework
- **HTML5/CSS3/JavaScript**: LIFF Apps UI
- **GitHub Pages**: Static file hosting

### **Backend**
- **Google Apps Script**: Server-side logic
- **Google Sheets API**: Database operations
- **Google Drive API**: File storage
- **Google Docs API**: PDF generation

### **Integration**
- **LINE Messaging API**: Push/Reply messages
- **Cloudflare Worker**: Webhook proxy
- **GitHub Actions**: Auto-deploy (optional)

### **Database**
- **Google Sheets**: Main database (9 sheets)
- **Google Drive**: File storage (PDF, Images)

### **Tools**
- **clasp**: Apps Script CLI
- **Git/GitHub**: Version control
- **VS Code**: Development IDE

---

## 📊 Database Relationships Diagram

```
Customer 1───N Job 1───N JobItems
                │
                ├───N Media
                ├───N Events
                ├───1 Approval
                └───1 TestResults

Users ───N Job (sales_owner)
```

---

## 🎯 Status & Milestone Flow

### **Job Status** (สถานะงาน)
```
DRAFT → PENDING_APPROVAL → APPROVED → IN_PROGRESS → COMPLETED → DELIVERED
  │           │               │            │            │           │
  └─────────────────────────────────────────────────────────────────┘
                            CANCELLED (ยกเลิกได้ทุกขั้น)
```

### **Job Milestone** (ขั้นตอนงาน - 14 ขั้น)
```
1. RECEIVED        (รับงาน)
2. INSPECT         (ตรวจสอบเบื้องต้น)
3. DISASSEMBLY     (ถอดชิ้นส่วน)
4. BURNOUT         (เผาขดลวด)
5. CORE            (ทำ Core)
6. REWINDING       (พันขดลวดใหม่)
7. VARNISH         (เคลือบวานิช)
8. ASSEMBLY        (ประกอบ)
9. BALANCING       (ถ่วงแบลานซ์)
10. PAINTING       (พ่นสี)
11. ELECTRICAL_TEST (ทดสอบไฟฟ้า)
12. QC             (ตรวจสอบคุณภาพ)
13. PACKING        (แพ็คของ)
14. DELIVERY       (ส่งมอบ)
```

---

## 🔐 Security & Best Practices

### **1. LINE Signature Verification**
```javascript
// Cloudflare Worker passes signature via query string
const signature = url.searchParams.get('signature');
verifySignature(body, signature, channelSecret);
```

### **2. User Authentication**
```javascript
// Check if user is Internal (พนักงาน)
function isInternalUser(userId) {
  // Search in Users sheet by internal_line_user_id
  return db.users.findByLineUserId(userId) !== null;
}
```

### **3. Role-Based Access**
```javascript
// Only Planner/Sales can create Job
if (user.role !== 'planner' && user.role !== 'sales') {
  throw new Error('Unauthorized');
}
```

### **4. Data Validation**
```javascript
// Validate Job ID format
if (!/^PDC-\d{6}-\d{4}$/.test(jobId)) {
  throw new Error('Invalid Job ID');
}
```

---

## 📈 Performance Optimization

### **1. Caching**
- Cache frequently accessed data (Customer, Users)
- Use `CacheService` for 6 hours

### **2. Batch Operations**
- Batch insert JobItems (1 API call instead of N)
- Batch update Media records

### **3. Lazy Loading**
- Load images on-demand in LIFF Apps
- Paginate Jobs list (10 per page)

### **4. Background Processing**
- PDF generation in background
- Send LINE notifications asynchronously

---

## 🚀 Deployment Flow

```
Development
    │
    ├─ Edit code in VS Code
    ├─ Test locally
    └─ Commit to Git
            │
            ▼
GitHub Repository
            │
            ├─ Push Apps Script via clasp
            └─ Deploy LIFF Apps via GitHub Pages
                    │
                    ▼
            Production (Live)
```

---

## 📝 Next Steps

1. ✅ อ่านเอกสารนี้ให้เข้าใจ
2. ✅ ดู [SETUP_GUIDE.md](IMPORTANCE/SETUP_GUIDE.md) เพื่อติดตั้ง
3. ✅ ทดสอบสร้างงาน 1 งาน
4. ✅ ทดสอบ Flow ทั้งหมด
5. ✅ Go Live!

---

**Created by:** GitHub Copilot  
**Date:** 17 ตุลาคม 2568  
**Version:** 1.0.0
