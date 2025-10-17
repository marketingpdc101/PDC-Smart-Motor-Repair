# 🌐 Cloudflare Worker Configuration

**วันที่:** 17 ตุลาคม 2568  
**Status:** ✅ Single Unified Proxy

---

## 📋 Overview

### **Cloudflare Worker = Webhook Proxy**
```
LINE Platform (Internal + External OA)
            ↓
    Cloudflare Worker (1 endpoint)
            ↓
    Apps Script (@5 deployment)
            ↓
    isInternalUser(userId)?
            ↓
    ├─ YES → WebhookInternal.js
    └─ NO  → WebhookExternal.js
```

---

## ❓ FAQ: ต้องแยก Worker เป็น 2 ตัวไหม?

### **คำตอบ: ไม่ต้อง! ❌**

**เหตุผล:**

#### **1. Worker เป็นแค่ Proxy** 🔄
```javascript
// Worker ทำแค่นี้:
1. รับ webhook จาก LINE
2. ส่งต่อไป Apps Script
3. Return 200 OK

// ไม่มี business logic อะไรเลย!
```

#### **2. Logic แยกอยู่ที่ Apps Script แล้ว** 🎯
```javascript
// ใน Apps Script:
function handleMessageEvent(event) {
  const userId = event.source.userId;
  const isInternal = isInternalUser(userId); // ← แยกที่นี่!
  
  if (isInternal) {
    handleInternalMessage(...); // → WebhookInternal.js
  } else {
    handleExternalMessage(...); // → WebhookExternal.js
  }
}
```

#### **3. ถ้าแยก = ซับซ้อนเกินไป** 🚫
```
❌ แยกเป็น 2 Workers:
- Internal Worker → Apps Script
- External Worker → Apps Script

ปัญหา:
✗ ต้อง deploy 2 workers
✗ ต้อง maintain 2 endpoints
✗ ต้อง config 2 webhook URLs ใน LINE Console
✗ ต้องจ่ายเงิน Cloudflare 2 เท่า
✗ ถ้าเปลี่ยน Apps Script URL ต้องแก้ 2 ที่
```

---

## ✅ โครงสร้างปัจจุบัน (Recommended)

### **1 Worker = 1 Apps Script = แยก Logic ใน Apps Script**

```
┌─────────────────────────────────────────────────────┐
│          LINE Platform                              │
├─────────────────────────────────────────────────────┤
│  - Internal OA (m/MmqpcxQBY...)                    │
│  - External OA (t8XoQTz7YT0...)                    │
└──────────────┬──────────────────────────────────────┘
               │
               │ Webhook URL (เดียวกัน):
               │ https://pdc-webhook-proxy.workers.dev
               │
               ▼
┌─────────────────────────────────────────────────────┐
│     Cloudflare Worker (Unified Proxy)               │
├─────────────────────────────────────────────────────┤
│  worker.js:                                         │
│  1. Get x-line-signature                           │
│  2. Forward to Apps Script                         │
│  3. Return 200 OK to LINE                          │
└──────────────┬──────────────────────────────────────┘
               │
               │ Apps Script URL:
               │ https://script.google.com/.../exec
               │
               ▼
┌─────────────────────────────────────────────────────┐
│          Apps Script (@5 deployment)                │
├─────────────────────────────────────────────────────┤
│  Webhook.js (Router):                              │
│  - handleLineEvent()                               │
│  - isInternalUser(userId) ← แยกที่นี่!            │
│                                                     │
│  ├─ WebhookInternal.js (พนักงาน)                  │
│  │  - handleInternalMessage()                      │
│  │  - handleInternalCommand()                      │
│  │  - /help, /jobs, /stats                        │
│  │                                                  │
│  └─ WebhookExternal.js (ลูกค้า)                   │
│     - handleExternalMessage()                       │
│     - handleStatusCommand()                         │
│     - "สถานะ", "งานของฉัน"                         │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration

### **Worker Environment Variables**
```javascript
// worker.js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzbmnu29mXdvX9bJlHJLSaNo7B78uEbuBgIfNOr_8S9TR3BSGuNLrDIgyw6YijvnmT0/exec';
```

### **LINE Webhook URLs (Both use same endpoint)**
```
Internal OA Webhook:
https://pdc-webhook-proxy.workers.dev

External OA Webhook:
https://pdc-webhook-proxy.workers.dev

← เดียวกัน! แยกที่ Apps Script
```

---

## 📊 Data Flow

### **Message from Internal OA (พนักงาน):**
```
1. พนักงานพิมพ์: /jobs
2. Internal OA → LINE Platform
3. LINE Platform → Cloudflare Worker
4. Cloudflare Worker → Apps Script
5. Apps Script: isInternalUser(userId) = TRUE
6. Apps Script → WebhookInternal.js
7. handleInternalCommand("/jobs")
8. handleJobsList()
9. Reply → LINE Platform
10. LINE Platform → พนักงาน
```

### **Message from External OA (ลูกค้า):**
```
1. ลูกค้าพิมพ์: สถานะ
2. External OA → LINE Platform
3. LINE Platform → Cloudflare Worker (same URL)
4. Cloudflare Worker → Apps Script
5. Apps Script: isInternalUser(userId) = FALSE
6. Apps Script → WebhookExternal.js
7. handleStatusCommand()
8. Reply → LINE Platform
9. LINE Platform → ลูกค้า
```

---

## 🚀 Deployment

### **Cloudflare Worker:**
```bash
# Deploy worker
wrangler deploy

# หรือใช้ Dashboard
1. Go to Cloudflare Dashboard
2. Workers & Pages
3. Create/Edit Worker
4. Paste worker.js code
5. Save and Deploy
```

### **Get Worker URL:**
```
https://pdc-webhook-proxy.workers.dev
```

### **Set in LINE Console:**
```
1. Go to https://developers.line.biz/console/
2. Select Channel (Internal OA)
   → Messaging API tab
   → Webhook URL: https://pdc-webhook-proxy.workers.dev
   → Use webhook: ENABLED
   → Click Verify (should show Success)

3. Select Channel (External OA)
   → Messaging API tab
   → Webhook URL: https://pdc-webhook-proxy.workers.dev (เดียวกัน!)
   → Use webhook: ENABLED
   → Click Verify (should show Success)
```

---

## 🔍 Debugging

### **Check Worker Logs:**
```bash
# Real-time logs
wrangler tail

# หรือใช้ Dashboard:
1. Cloudflare Dashboard
2. Workers & Pages
3. เลือก Worker
4. Logs tab
```

### **Test Worker:**
```bash
# Test GET (health check)
curl https://pdc-webhook-proxy.workers.dev

# Test POST (simulate webhook)
curl -X POST https://pdc-webhook-proxy.workers.dev \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: test123" \
  -d '{"events":[]}'
```

### **Expected Response:**
```json
{
  "status": "success"
}
```

---

## ⚠️ Important Notes

### **1. Apps Script URL**
```javascript
// ✅ ใช้ @5 deployment (stable)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzbmnu...T0/exec';

// ❌ อย่าใช้ @HEAD (dev mode)
// @HEAD จะเปลี่ยนทุกครั้งที่ save code
```

### **2. LINE Signature**
```javascript
// Worker ส่ง signature ผ่าน query string
// เพราะ Apps Script อ่าน custom headers ไม่ได้
const url = `${APPS_SCRIPT_URL}?signature=${lineSignature}`;
```

### **3. Always Return 200**
```javascript
// ต้อง return 200 OK ไป LINE เสมอ
// ถ้า return error LINE จะ retry webhook
return new Response(JSON.stringify(data), {
  status: 200, // ← เสมอ!
  headers: { 'Content-Type': 'application/json' }
});
```

---

## 📝 Maintenance

### **When to Update Worker:**
```
✅ เมื่อ Apps Script URL เปลี่ยน
✅ เมื่อต้องการเพิ่ม logging
✅ เมื่อต้องการเพิ่ม rate limiting
✅ เมื่อต้องการเพิ่ม IP whitelist
```

### **When NOT to Update Worker:**
```
❌ เมื่อเพิ่มฟีเจอร์ใหม่ (แก้ที่ Apps Script)
❌ เมื่อแก้ bug ใน webhook handlers (แก้ที่ Apps Script)
❌ เมื่อเพิ่ม Internal/External logic (แก้ที่ Apps Script)
```

---

## 💡 Best Practices

### **1. Single Responsibility**
```
Worker: Proxy only
Apps Script: Business logic
```

### **2. Stateless**
```
Worker ไม่เก็บ state อะไร
ทุกอย่างส่งต่อไป Apps Script
```

### **3. Fast Response**
```
Worker ต้อง return 200 ภายใน < 5 วินาที
ถ้าช้ากว่านั้น LINE จะ timeout
```

### **4. Error Handling**
```javascript
try {
  // Forward to Apps Script
} catch (error) {
  // Still return 200 to LINE
  return new Response(JSON.stringify({
    status: 'error',
    message: error.message
  }), { status: 200 });
}
```

---

## 🎯 Summary

| Aspect | Decision | Reason |
|--------|----------|--------|
| **Number of Workers** | 1 (Unified) | Simple, cost-effective |
| **Webhook URLs** | Same for both OAs | Easy to manage |
| **Logic Separation** | At Apps Script | Flexible, easy to change |
| **Deployment** | Cloudflare Workers | Fast, global CDN |
| **Apps Script URL** | @5 (Stable) | Consistent, reliable |

---

## 📞 Troubleshooting

### **Problem: Webhook not working**
```
1. Check Worker logs: wrangler tail
2. Check Apps Script logs: Apps Script Editor → Executions
3. Test Worker: curl https://pdc-webhook-proxy.workers.dev
4. Verify LINE webhook: LINE Console → Webhook → Verify
```

### **Problem: Wrong OA responding**
```
❌ ปัญหา: Internal OA ตอบแบบ External
✅ แก้: ตรวจสอบ isInternalUser() ใน Apps Script
     ตรวจสอบ internal_line_user_id ใน Users sheet
```

### **Problem: Signature verification failed**
```
❌ ปัญหา: Apps Script reject webhook
✅ แก้: ตรวจสอบ channel secret ใน Config.js
     ตรวจสอบว่า Worker ส่ง signature ถูก query string
```

---

## 🔗 Related Files

```
Cloudflare Worker:
├── worker.js                ← This file

Apps Script:
├── Webhook.js               ← Main router
├── WebhookInternal.js       ← Internal handlers
├── WebhookExternal.js       ← External handlers
└── Config.js                ← Channel secrets
```

---

**Conclusion:** 1 Worker ก็พอ! ไม่ต้องแยก เพราะ logic แยกอยู่ที่ Apps Script แล้ว ✅

---

**Created by:** GitHub Copilot  
**Date:** 17 ตุลาคม 2568  
**Status:** ✅ Production Ready
