# 🔧 แก้ไข Webhook 401 Unauthorized Error

## ปัญหาที่พบ
```
Error: The webhook returned an HTTP status code other than 200.(401 Unauthorized)
```

**สาเหตุ:** LINE Platform ต้องการ Signature Verification แต่ระบบเราไม่ได้ verify

---

## ✅ สิ่งที่แก้ไขแล้ว

### 1. **webhook-proxy/api/webhook.js**
- ✅ เพิ่มการ forward `X-Line-Signature` header ไปยัง Apps Script
- ✅ เพิ่ม logging เพื่อ debug

### 2. **apps-script/Code.gs**
- ✅ เพิ่มการรับ `X-Line-Signature` จาก header
- ✅ เพิ่มการเรียกใช้ `verifyLineSignature()` เพื่อตรวจสอบความถูกต้อง
- ✅ เพิ่ม error logging

### 3. **apps-script/Utils.gs**
- ✅ เพิ่มฟังก์ชัน `verifyLineSignature()` สำหรับ verify signature

---

## 🚀 ขั้นตอนการ Deploy (สำคัญ!)

### Step 1: Re-deploy Google Apps Script

1. **ไปที่ Apps Script Editor**
   - เปิด Google Sheets ของคุณ
   - Extensions → Apps Script

2. **Copy โค้ดใหม่**
   - เปิดไฟล์ `apps-script/Code.gs`
   - Copy ทั้งหมด → Paste ลงใน Code.gs
   - เปิดไฟล์ `apps-script/Utils.gs`
   - Copy ทั้งหมด → Paste ลงใน Utils.gs

3. **Deploy ใหม่**
   ```
   Deploy → Manage deployments
   คลิก Edit (ไอคอนดินสอ) ที่ deployment ปัจจุบัน
   New version → เลือก "New version"
   Description: "Add LINE signature verification"
   Deploy
   ```

4. **ตรวจสอบ URL**
   - ได้ Web App URL เดิมคือ:
   ```
   https://script.google.com/macros/s/AKfycby38I6KW9G0Fw6gNwIszCDeDTs8sC3_rSW7tcFtcEXAX53p29wDAjDrmBbC_n8cSzAd/exec
   ```

---

### Step 2: Re-deploy Webhook Proxy (Vercel)

#### Option A: Deploy ผ่าน Vercel Dashboard (แนะนำ)

1. **ไปที่ Vercel Dashboard**
   - https://vercel.com/dashboard

2. **เลือก Project ของคุณ**
   - คลิกที่ project webhook-proxy

3. **Redeploy**
   ```
   Settings → Deployments → Latest Deployment
   คลิก "..." (3 จุด) → Redeploy
   ```

#### Option B: Deploy ผ่าน Vercel CLI

```powershell
# 1. ติดตั้ง Vercel CLI (ถ้ายังไม่มี)
npm install -g vercel

# 2. เข้าไปที่โฟลเดอร์ webhook-proxy
cd "c:\Users\admin\Downloads\PDC Database\PDC-Smart-Motor-Repair\webhook-proxy"

# 3. Login Vercel
vercel login

# 4. Deploy
vercel --prod
```

#### Option C: Re-upload ไฟล์ผ่าน Vercel Dashboard

1. ไปที่ Vercel Dashboard → Your Project
2. คลิก "Deploy" → "Upload Files"
3. Upload ไฟล์ที่แก้ไขแล้ว:
   - `api/webhook.js`
   - `vercel.json`
   - `package.json`

---

### Step 3: ทดสอบ Webhook

#### 1. ทดสอบผ่าน LINE Developers Console

```
1. ไปที่ LINE Developers Console
   https://developers.line.biz/console/

2. เลือก Channel ของคุณ (External OA - P.D.C Service)

3. ไปที่ Messaging API tab

4. ตั้งค่า Webhook URL:
   https://YOUR_VERCEL_URL/api/webhook

5. คลิก "Verify" เพื่อทดสอบ

6. ถ้าขึ้น ✅ Success แสดงว่าแก้ไขสำเร็จ!
```

#### 2. ทดสอบด้วยการส่งข้อความ

```
1. เปิด LINE App
2. เพิ่มเพื่อน Official Account (P.D.C Service)
3. ส่งข้อความ "สวัสดี"
4. ควรได้รับตอบกลับอัตโนมัติ
```

---

## 🔍 การ Debug

### ดู Logs ของ Vercel

```
1. ไปที่ Vercel Dashboard → Your Project
2. คลิก "Logs" tab
3. ดูว่ามี request เข้ามาหรือไม่
4. ตรวจสอบ X-Line-Signature ใน headers
```

### ดู Logs ของ Apps Script

```
1. ไปที่ Apps Script Editor
2. คลิก "Executions" (ด้านซ้าย)
3. ดู execution logs
4. หรือเปิด Logger → View → Logs
```

### Debug Signature Verification

ถ้ายังมีปัญหา ให้ **ปิด signature verification ชั่วคราว**:

ใน `apps-script/Code.gs` ประมาณบรรทัด 35:

```javascript
// Verify LINE Signature (ตรวจสอบว่า request มาจาก LINE จริง)
if (signature && CONFIG.DEBUG.LOG_WEBHOOK_PAYLOADS) {
  const isValid = verifyLineSignature(requestBody, signature);
  Logger.log('Signature verification: ' + (isValid ? 'VALID' : 'INVALID'));
  
  // หากต้องการ enforce signature validation (แนะนำใน production)
  // if (!isValid) {  // <-- ปิดบรรทัดนี้ไว้ชั่วคราว
  //   return ContentService.createTextOutput(JSON.stringify({
  //     status: 'error',
  //     message: 'Invalid signature'
  //   })).setMimeType(ContentService.MimeType.JSON);
  // }
}
```

**หมายเหตุ:** ในตอนนี้ signature verification ยัง **ไม่ได้ enforce** (comment ไว้) เพื่อให้ระบบทำงานได้ก่อน เมื่อทดสอบผ่านแล้วค่อย uncomment เพื่อเปิดใช้งาน

---

## ✅ Checklist

- [ ] Copy โค้ดใหม่ลงใน Apps Script (Code.gs, Utils.gs)
- [ ] Deploy Apps Script version ใหม่
- [ ] Re-deploy Webhook Proxy บน Vercel
- [ ] Verify webhook ใน LINE Developers Console
- [ ] ทดสอบส่งข้อความใน LINE

---

## 📝 เพิ่มเติม

### สาเหตุที่ต้อง Verify Signature

LINE Platform ส่ง `X-Line-Signature` มาพร้อม webhook เพื่อ:
1. **ยืนยันตัวตน** - ว่า request มาจาก LINE จริงๆ ไม่ใช่คนอื่นแอบส่ง
2. **ความปลอดภัย** - ป้องกัน MITM (Man-in-the-Middle) attacks
3. **Integrity** - ตรวจสอบว่า data ไม่ถูกแก้ไขระหว่างทาง

### วิธีการ Verify Signature

```
1. คำนวณ HMAC-SHA256 ของ request body ด้วย Channel Secret
2. เข้ารหัสเป็น Base64
3. เปรียบเทียบกับ X-Line-Signature ที่ส่งมา
4. ถ้าตรงกัน = ถูกต้อง ✅
```

---

## 🆘 ยังมีปัญหาอยู่?

### Error: 401 Unauthorized
- ✅ ตรวจสอบว่า deploy Apps Script ใหม่แล้ว
- ✅ ตรวจสอบว่า Channel Secret ใน Config.gs ถูกต้อง
- ✅ ลอง comment signature validation ออกชั่วคราว

### Error: 500 Internal Server Error
- ตรวจสอบ Apps Script Logs
- ดูว่ามี error ใน verifyLineSignature() หรือไม่

### Webhook ไม่ตอบกลับ
- ตรวจสอบ Vercel Logs ว่ามี request เข้ามาหรือไม่
- ตรวจสอบ Apps Script URL ใน webhook.js ถูกต้องหรือไม่

---

## 📞 ติดต่อ

หากยังมีปัญหา กรุณาส่ง screenshot ของ:
1. LINE Developers Console → Webhook verification result
2. Vercel Logs
3. Apps Script Execution logs

ขอให้โชคดีครับ! 🚀
