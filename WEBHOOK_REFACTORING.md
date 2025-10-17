# 🔄 Webhook Refactoring - Separation of Concerns

**วันที่:** 17 ตุลาคม 2568  
**Status:** ✅ แก้ไขเรียบร้อย

---

## 📋 ปัญหาเดิม (Before)

### **Webhook.js เดิม:**
```
❌ ไฟล์เดียว 700+ บรรทัด
❌ Internal + External logic รวมกัน
❌ ยากต่อการแก้ไข
❌ ยากต่อการทดสอบ
❌ ซับซ้อน มีโค้ดซ้ำ
```

---

## ✅ โครงสร้างใหม่ (After)

### **แยกเป็น 3 ไฟล์:**

```
📁 apps-script/
├── Webhook.js              ← Main Router (150 lines)
├── WebhookInternal.js      ← Internal OA Handler (550+ lines)
└── WebhookExternal.js      ← External OA Handler (550+ lines)
```

---

## 🎯 หน้าที่แต่ละไฟล์

### **1. Webhook.js (Main Router)**
```javascript
/**
 * หน้าที่: ตัวกลางระหว่าง LINE Platform กับ handlers
 */

// จัดการ Event types
- handleLineEvent()         → Route ไปยัง handlers
- handleMessageEvent()      → ตรวจสอบ Internal/External
- handlePostbackEvent()     → ตรวจสอบ Internal/External
- handleFollowEvent()       → ตรวจสอบ Internal/External
- isInternalUser()          → เช็คว่าเป็นพนักงานหรือไม่
```

**Flow:**
```
LINE Webhook
    ↓
Webhook.js (Router)
    ↓
Check: isInternalUser(userId)
    ↓
├─ YES → WebhookInternal.js (พนักงาน)
└─ NO  → WebhookExternal.js (ลูกค้า)
```

---

### **2. WebhookInternal.js (พนักงาน)**
```javascript
/**
 * หน้าที่: จัดการ Internal OA (พนักงาน)
 */

// Message Handlers
- handleInternalMessage()           → รับข้อความจากพนักงาน
- handleInternalCommand()           → จัดการคำสั่ง /help, /jobs, etc.
- handleInternalHelp()              → แสดงคำสั่งทั้งหมด

// Command Handlers
- handleJobsList()                  → /jobs [all|pending|progress]
- handleJobDetail()                 → /job [JOB_ID]
- handlePendingJobs()               → /pending
- handleMyTasks()                   → /mytasks
- handleStats()                     → /stats
- handleQuickApprove()              → /approve [JOB_ID]

// Postback Handlers
- handleInternalPostback()          → จัดการ postback events
- handleAssignJob()                 → รับงาน
- handleStartJob()                  → เริ่มงาน
- handleCompleteMilestone()         → อัพเดท milestone
- handleViewJobInternal()           → ดูรายละเอียดงาน
- handleViewPDFInternal()           → ดู PDF

// Event Handlers
- handleInternalFollowEvent()       → พนักงาน Add Friend

// Utilities
- getUserByLineUserId()             → หา user จาก LINE ID
```

**คำสั่งที่รองรับ:**
```
/help              - แสดงความช่วยเหลือ
/jobs [filter]     - ดูรายการงาน
/job [JOB_ID]      - ดูรายละเอียดงาน
/pending           - งานรอดำเนินการ
/mytasks           - งานที่ assign ให้ฉัน
/stats             - สถิติรวม
/approve [JOB_ID]  - อนุมัติงานเร็ว

หรือพิมพ์:
"งานของฉัน", "งานรอ", "สร้างงาน", "ช่วยเหลือ"
```

---

### **3. WebhookExternal.js (ลูกค้า)**
```javascript
/**
 * หน้าที่: จัดการ External OA (ลูกค้า)
 */

// Message Handlers
- handleExternalMessage()           → รับข้อความจากลูกค้า
- handleExternalHelp()              → แสดงคำสั่งทั้งหมด

// Command Handlers
- handleStatusCommand()             → ดูสถานะงาน
- handleMyJobsCommand()             → ดูงานทั้งหมด
- handleQuotationCommand()          → ดูใบเสนอราคา

// Action Handlers
- handleApproveQuotation()          → อนุมัติใบเสนอราคา
- handleRejectQuotation()           → ปฏิเสธใบเสนอราคา

// Postback Handlers
- handleExternalPostback()          → จัดการ postback events
- handleViewPDFExternal()           → ดู PDF (Quotation, Final Report)
- handleViewPhotos()                → ดูรูปภาพ
- handleViewJobExternal()           → ดูรายละเอียดงาน
- handleContactSales()              → ติดต่อฝ่ายขาย

// Event Handlers
- handleExternalFollowEvent()       → ลูกค้า Add Friend

// Utilities
- getCustomerByLineUserId()         → หา customer จาก LINE ID
- getJobsByLineUserId()             → หางานของลูกค้า
- notifyInternalTeam()              → แจ้งเตือนทีมงาน
```

**คำสั่งที่รองรับ:**
```
พิมพ์:
"สถานะ"           - ดูสถานะงาน
"งานของฉัน"       - ดูงานทั้งหมด
"ใบเสนอราคา"      - ดูใบเสนอราคา
"ช่วยเหลือ"        - แสดงคำสั่งทั้งหมด
```

---

## 🔄 Data Flow

### **Message Event Flow:**
```
LINE → Webhook.js → isInternalUser(userId)
                           ↓
              ┌────────────┴────────────┐
              ↓                         ↓
    WebhookInternal.js         WebhookExternal.js
    (พนักงาน)                   (ลูกค้า)
              ↓                         ↓
    - /jobs, /stats              - "สถานะ", "งานของฉัน"
    - ดูงานทั้งหมด               - อนุมัติใบเสนอราคา
    - อัพเดทสถานะ                - ดูรูปภาพ
```

### **Postback Event Flow:**
```
LINE Flex Message Button
         ↓
    Postback Event
         ↓
    Webhook.js → isInternalUser(userId)
                       ↓
          ┌────────────┴────────────┐
          ↓                         ↓
handleInternalPostback    handleExternalPostback
          ↓                         ↓
- assign_job                  - approve
- start_job                   - reject
- complete_milestone          - view_pdf
- view_pdf                    - view_photos
```

### **Follow Event Flow:**
```
User Add Friend LINE OA
         ↓
    Follow Event
         ↓
    Webhook.js → isInternalUser(userId)
                       ↓
          ┌────────────┴────────────┐
          ↓                         ↓
handleInternalFollowEvent  handleExternalFollowEvent
          ↓                         ↓
"ยินดีต้อนรับพนักงาน"      "ยินดีต้อนรับลูกค้า"
พิมพ์ /help                พิมพ์ "ช่วยเหลือ"
```

---

## ✅ ข้อดีของโครงสร้างใหม่

### **1. Separation of Concerns** 🎯
```
✅ แต่ละไฟล์มีหน้าที่ชัดเจน
✅ ไม่ปนกันระหว่าง Internal/External
✅ ง่ายต่อการเข้าใจโค้ด
```

### **2. Maintainability** 🔧
```
✅ แก้ Internal ไม่กระทบ External
✅ แก้ External ไม่กระทบ Internal
✅ เพิ่มฟีเจอร์ได้ง่าย
```

### **3. Testability** 🧪
```
✅ Test Internal แยกได้
✅ Test External แยกได้
✅ Mock data ง่ายกว่า
```

### **4. Scalability** 📈
```
✅ เพิ่มคำสั่งใหม่ได้ง่าย
✅ เพิ่ม OA ตัวที่ 3 ได้ (ถ้าจำเป็น)
✅ แยก logic ซับซ้อนออกได้
```

### **5. Readability** 📖
```
✅ โค้ดสั้นลง อ่านง่ายขึ้น
✅ Function names ชัดเจน
✅ มี JSDoc ครบ
```

---

## 🔍 ตัวอย่างการใช้งาน

### **Example 1: พนักงานพิมพ์ /jobs**
```
1. พนักงานพิมพ์: /jobs pending
2. LINE → Webhook.js → handleMessageEvent()
3. isInternalUser(userId) → TRUE
4. → handleInternalMessage()
5. → handleInternalCommand("/jobs pending")
6. → handleJobsList("pending")
7. ← Reply: "📋 รายการงาน (pending): ..."
```

### **Example 2: ลูกค้าพิมพ์ "สถานะ"**
```
1. ลูกค้าพิมพ์: สถานะ
2. LINE → Webhook.js → handleMessageEvent()
3. isInternalUser(userId) → FALSE
4. → handleExternalMessage()
5. → handleStatusCommand(userId)
6. → getJobsByLineUserId(userId)
7. ← Reply: "📊 สถานะงาน: ..."
```

### **Example 3: ลูกค้ากดอนุมัติ**
```
1. ลูกค้ากดปุ่ม "อนุมัติ" (Flex Message)
2. LINE → Webhook.js → handlePostbackEvent()
3. isInternalUser(userId) → FALSE
4. → handleExternalPostback("approve", jobId)
5. → handleApproveQuotation(userId, jobId)
6. → approveQuotation() (LiffBackend.js)
7. → notifyInternalTeam() (แจ้งพนักงาน)
8. ← Reply: "✅ อนุมัติสำเร็จ!"
```

---

## 🚀 การ Deploy

### **ใน Apps Script:**
```
1. เปิด Apps Script Editor
2. สร้างไฟล์ใหม่:
   - WebhookInternal.js
   - WebhookExternal.js
3. แก้ไข Webhook.js (เป็น Router)
4. Save All
5. Deploy (version ใหม่)
```

### **Testing:**
```
1. Test Internal:
   - ใช้พนักงาน LINE ID
   - พิมพ์ /help
   - ควรแสดงคำสั่งพนักงาน

2. Test External:
   - ใช้ลูกค้า LINE ID
   - พิมพ์ "ช่วยเหลือ"
   - ควรแสดงคำสั่งลูกค้า
```

---

## 📝 Migration Checklist

- [x] สร้าง WebhookInternal.js
- [x] สร้าง WebhookExternal.js
- [x] แก้ไข Webhook.js เป็น Router
- [x] เพิ่ม handleInternalFollowEvent()
- [x] เพิ่ม handleExternalFollowEvent()
- [x] เพิ่ม notifyInternalTeam()
- [ ] ทดสอบ Internal Commands
- [ ] ทดสอบ External Commands
- [ ] ทดสอบ Postback Actions
- [ ] ทดสอบ Follow Events
- [ ] Deploy Production

---

## 🎯 Next Steps

### **Phase 1: Testing** (ลำดับความสำคัญสูง)
```
1. ทดสอบ Internal Commands (/help, /jobs, /stats)
2. ทดสอบ External Commands (สถานะ, งานของฉัน)
3. ทดสอบ Follow Events (Add Friend)
4. ทดสอบ Postback Actions (approve, reject)
```

### **Phase 2: Enhancement** (ทำต่อไป)
```
1. เพิ่ม Flex Messages สำหรับ Rich UI
2. เพิ่ม Quick Reply buttons
3. เพิ่ม Rich Menu integration
4. เพิ่ม Image Carousel สำหรับรูปภาพ
```

### **Phase 3: Monitoring** (ติดตาม)
```
1. เพิ่ม Logging สำหรับทุก action
2. เพิ่ม Error tracking
3. เพิ่ม Performance monitoring
4. เพิ่ม Usage analytics
```

---

## 💡 Best Practices

### **1. Naming Convention**
```javascript
// Internal functions
handleInternalXXX()
getInternalXXX()

// External functions
handleExternalXXX()
getExternalXXX()
```

### **2. Error Handling**
```javascript
try {
  // Do something
  replyMessage(replyToken, [response], isInternal);
} catch (error) {
  logError('Function error', { error: error.message });
  replyMessage(replyToken, [{
    type: 'text',
    text: '❌ เกิดข้อผิดพลาด'
  }], isInternal);
}
```

### **3. Logging**
```javascript
// ใช้ logInfo, logError แทน Logger.log
logInfo('Action performed', { userId: userId, action: action });
logError('Error occurred', { error: error.message });
```

---

## 📚 Related Files

```
apps-script/
├── Webhook.js              ← Main Router
├── WebhookInternal.js      ← Internal OA
├── WebhookExternal.js      ← External OA
├── LineAPI.js              ← pushMessage(), replyMessage()
├── LiffBackend.js          ← approveQuotation(), etc.
├── Database.js             ← CRUD operations
└── Config.js               ← Constants
```

---

## 🎉 Summary

**ก่อนแก้:**
- ❌ 1 ไฟล์ 700+ บรรทัด
- ❌ Logic ปนกัน
- ❌ ยากต่อการแก้ไข

**หลังแก้:**
- ✅ 3 ไฟล์ แยกชัดเจน
- ✅ Separation of Concerns
- ✅ ง่ายต่อการแก้ไข
- ✅ Scalable & Maintainable

---

**Created by:** GitHub Copilot  
**Date:** 17 ตุลาคม 2568  
**Status:** ✅ Ready for Testing
