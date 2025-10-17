# ⚡ แก้ไข Webhook 401 Error - ทำตามนี้เลย!

## ปัญหา
```
❌ Error 401 Unauthorized จาก LINE Webhook
```

## สาเหตุ
ระบบไม่ได้ verify LINE Signature

## วิธีแก้ (3 ขั้นตอน)

### 📌 Step 1: Update Google Apps Script

1. เปิด Google Sheets → Extensions → Apps Script

2. **Copy-Paste โค้ดใหม่:**
   - เปิดไฟล์ `apps-script/Code.gs` → Copy ทั้งหมด → Paste ลงใน Code.gs
   - เปิดไฟล์ `apps-script/Utils.gs` → Copy ทั้งหมด → Paste ลงใน Utils.gs

3. **Deploy ใหม่:**
   ```
   Deploy → Manage deployments → Edit (ไอคอนดินสอ)
   New version → Deploy
   ```

---

### 📌 Step 2: Update Vercel Webhook Proxy

**วิธีที่ 1: Redeploy ผ่าน Dashboard (ง่ายสุด)**
1. ไปที่ https://vercel.com/dashboard
2. เลือก project webhook-proxy
3. Settings → Deployments → Latest → Redeploy

**วิธีที่ 2: Deploy ด้วย CLI**
```powershell
cd "c:\Users\admin\Downloads\PDC Database\PDC-Smart-Motor-Repair\webhook-proxy"
vercel --prod
```

---

### 📌 Step 3: Verify Webhook

1. ไปที่ LINE Developers Console
2. Messaging API tab
3. Webhook URL: `https://YOUR_VERCEL_URL/api/webhook`
4. คลิก **"Verify"**
5. ถ้าขึ้น ✅ **Success** = เสร็จสิ้น!

---

## 🧪 ทดสอบ

1. เปิด LINE App
2. เพิ่มเพื่อน Official Account (P.D.C Service)
3. ส่งข้อความ "สวัสดี"
4. ควรได้รับตอบกลับทันที ✅

---

## 🔍 ถ้ายังไม่ได้

### Debug Vercel Logs
```
Vercel Dashboard → Your Project → Logs
ดูว่ามี "X-Line-Signature" ใน request headers หรือไม่
```

### Debug Apps Script Logs
```
Apps Script Editor → Executions (ด้านซ้าย)
ดู error messages
```

---

## สิ่งที่แก้ไขแล้ว

✅ `webhook.js` - Forward X-Line-Signature header  
✅ `Code.gs` - รับและตรวจสอบ signature  
✅ `Utils.gs` - เพิ่มฟังก์ชัน verifyLineSignature()

---

ขอให้โชคดีครับ! 🚀
