# LIFF Apps Integration Fix

## ปัญหาที่พบ

LIFF Apps ไม่เชื่อมโยงกันผ่าน Job ID เพราะ:

1. **Job Creation** → สร้างงานได้แล้ว แต่ไม่ได้ส่ง LIFF URL ให้ลูกค้า
2. **Quotation, Status Update, etc.** → รอรับ `jobId` จาก URL parameter แต่ไม่มีใครส่งมาให้
3. **LINE Notifications** → ส่งแค่ข้อความธรรมดา ไม่มี LIFF URLs

## สาเหตุ

ขาดการส่ง **Flex Message with Action Buttons** ที่มี LIFF URLs

## วิธีแก้

เพิ่ม LIFF URLs ใน LINE Notifications ทุกขั้นตอน:

### 1. หลังสร้างงาน (Job Created)
```
📄 ใบเสนอราคา: [เปิดดู] → liff://2008297943-16G8DPPz?jobId=PDC-202510-0001
```

### 2. หลังอนุมัติ (Quotation Approved)
```
📋 ใบสั่งงาน: [เปิดดู] → liff://2008297943-goJa0bbw?jobId=PDC-202510-0001
```

### 3. อัพเดทสถานะ (Status Update)
```
🔔 สถานะ: [อัพเดท] → liff://2008297943-n63AYqqD?jobId=PDC-202510-0001
```

### 4. ทดสอบไฟฟ้า (Final Test)
```
⚡ ทดสอบ: [บันทึกผล] → liff://2008297943-lvmPvjjb?jobId=PDC-202510-0001
```

### 5. งานเสร็จ (Final Report)
```
✅ รายงาน: [ดูรายงาน] → liff://2008297943-RqO9znnK?jobId=PDC-202510-0001
```

## LIFF IDs (จาก config.js)

```javascript
const LIFF_IDS = {
  JOB_CREATION: '2008297943-J69z7PPp',
  QUOTATION: '2008297943-16G8DPPz',
  STATUS_UPDATE: '2008297943-n63AYqqD',
  FINAL_TEST: '2008297943-lvmPvjjb',
  WORK_ORDER: '2008297943-goJa0bbw',
  FINAL_REPORT: '2008297943-RqO9znnK'
};
```

## การแก้ไข

### ไฟล์ที่ต้องแก้:

1. **config.js** - เพิ่ม LIFF IDs
2. **LineAPI.js** - แก้ไขฟังก์ชัน notification ให้รวม LIFF URLs
3. **WebhookInternal.js** - เพิ่มปุ่ม LIFF URLs ในคำสั่ง `/job`, `/pending`
4. **WebhookExternal.js** - เพิ่มปุ่ม LIFF URLs ในคำสั่ง "สถานะ", "งานของฉัน"

## Data Flow (ที่ควรเป็น)

```
1. Sales → Job Creation LIFF → สร้างงาน → ✅
2. System → ส่ง Quotation LIFF URL → ลูกค้า → ✅
3. ลูกค้า → เปิด Quotation LIFF (with jobId) → อนุมัติ → ✅
4. System → ส่ง Work Order LIFF URL → ช่าง → ✅
5. ช่าง → เปิด Work Order LIFF (with jobId) → รับงาน → ✅
6. ช่าง → อัพเดทสถานะผ่าน Status Update LIFF (with jobId) → ✅
7. ช่าง → บันทึกผลทดสอบผ่าน Final Test LIFF (with jobId) → ✅
8. ช่าง → สร้างรายงานผ่าน Final Report LIFF (with jobId) → ✅
9. System → ส่ง Final Report PDF → ลูกค้า → ✅
```

## ตัวอย่าง Flex Message

```javascript
{
  type: 'flex',
  altText: 'ใบเสนอราคา PDC-202510-0001',
  contents: {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '📄 ใบเสนอราคา',
          weight: 'bold',
          size: 'xl'
        },
        {
          type: 'text',
          text: 'PDC-202510-0001',
          size: 'sm',
          color: '#aaaaaa'
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          style: 'primary',
          action: {
            type: 'uri',
            label: '📄 เปิดใบเสนอราคา',
            uri: 'https://liff.line.me/2008297943-16G8DPPz?jobId=PDC-202510-0001'
          }
        }
      ]
    }
  }
}
```

## สรุป

**ปัญหา:** ไม่มีการส่ง LIFF URLs ระหว่างขั้นตอน  
**วิธีแก้:** เพิ่ม LIFF URLs ใน Flex Messages ทุกขั้นตอน  
**ผลลัพธ์:** LIFF Apps เชื่อมโยงกันผ่าน Job ID ได้ครบทุกขั้นตอน ✅
