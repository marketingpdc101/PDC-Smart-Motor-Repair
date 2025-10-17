# PDC Smart Motor Repair - LIFF IDs

**ข้อมูลอัพเดทล่าสุด:** 17 ตุลาคม 2568

## 📱 LIFF Applications

### **Internal OA (สำหรับพนักงาน)**

| LIFF App | LIFF ID | Endpoint URL | หน้าที่ |
|----------|---------|--------------|---------|
| **Job Creation** | `2008297943-J69z7PPp` | [/liff-apps/job-creation/app.html](https://marketingpdc101.github.io/PDC-Smart-Motor-Repair/liff-apps/job-creation/app.html) | สร้างงานใหม่ + ใบเสนอราคา (Planner/Sales) |
| **Status Update** | `2008297943-n63AYqqD` | [/liff-apps/status-update/app.html](https://marketingpdc101.github.io/PDC-Smart-Motor-Repair/liff-apps/status-update/app.html) | อัพเดทสถานะงาน 14 ขั้นตอน (ช่าง/QC) |
| **Final Test** | `2008297943-lvmPvjjb` | [/liff-apps/final-test/app.html](https://marketingpdc101.github.io/PDC-Smart-Motor-Repair/liff-apps/final-test/app.html) | บันทึกผลทดสอบไฟฟ้า (Electrical) |
| **Work Order** | `2008297943-goJa0bbw` | [/liff-apps/work-order/app.html](https://marketingpdc101.github.io/PDC-Smart-Motor-Repair/liff-apps/work-order/app.html) | ดูใบสั่งงาน (Read-only) |
| **Final Report** | `2008297943-RqO9znnK` | [/liff-apps/final-report/app.html](https://marketingpdc101.github.io/PDC-Smart-Motor-Repair/liff-apps/final-report/app.html) | รายงานสุดท้าย + ส่งมอบ (Packing/QC) |

### **External OA (สำหรับลูกค้า)**

| LIFF App | LIFF ID | Endpoint URL | หน้าที่ |
|----------|---------|--------------|---------|
| **Quotation** | `2008297943-16G8DPPz` | [/liff-apps/quotation/app.html](https://marketingpdc101.github.io/PDC-Smart-Motor-Repair/liff-apps/quotation/app.html) | อนุมัติ/ปฏิเสธใบเสนอราคา |

---

## 🔧 การใช้งาน

### เปิด LIFF App จาก LINE
```
line://app/{LIFF_ID}
```

ตัวอย่าง:
```
line://app/2008297943-J69z7PPp  // Job Creation
line://app/2008297943-16G8DPPz  // Quotation
```

### เปิด LIFF App จาก Browser
```
https://liff.line.me/{LIFF_ID}
```

### เปิดพร้อม Parameters
```
line://app/{LIFF_ID}?jobId=PDC-202510-0001
```

---

## 📋 Rich Menu Configuration

### Internal OA Rich Menu
```json
{
  "areas": [
    {
      "bounds": { "x": 0, "y": 0, "width": 833, "height": 843 },
      "action": {
        "type": "uri",
        "label": "สร้างงานใหม่",
        "uri": "line://app/2008297943-J69z7PPp"
      }
    },
    {
      "bounds": { "x": 833, "y": 0, "width": 833, "height": 843 },
      "action": {
        "type": "uri",
        "label": "อัพเดทสถานะ",
        "uri": "line://app/2008297943-n63AYqqD"
      }
    },
    {
      "bounds": { "x": 1666, "y": 0, "width": 834, "height": 843 },
      "action": {
        "type": "uri",
        "label": "บันทึกผลทดสอบ",
        "uri": "line://app/2008297943-lvmPvjjb"
      }
    },
    {
      "bounds": { "x": 0, "y": 843, "width": 1250, "height": 843 },
      "action": {
        "type": "uri",
        "label": "ดูใบสั่งงาน",
        "uri": "line://app/2008297943-goJa0bbw"
      }
    },
    {
      "bounds": { "x": 1250, "y": 843, "width": 1250, "height": 843 },
      "action": {
        "type": "uri",
        "label": "รายงานสุดท้าย",
        "uri": "line://app/2008297943-RqO9znnK"
      }
    }
  ]
}
```

### External OA Rich Menu
```json
{
  "areas": [
    {
      "bounds": { "x": 0, "y": 0, "width": 2500, "height": 1686 },
      "action": {
        "type": "uri",
        "label": "ดูใบเสนอราคา",
        "uri": "line://app/2008297943-16G8DPPz"
      }
    }
  ]
}
```

---

## 🔐 LINE Channel Information

### Internal OA (PDC Smart Motor - Internal)
- **Channel ID:** 2008297943
- **Channel Secret:** `5b3f68c142ea9607cba34c5bd7970a27`
- **Channel Access Token:** 
  ```
  m/MmqpcxQBYvIcp1GldZSRvTUqoVOlNdXBcMj7qrFniIEICKVZ3lR3UdMO1KcQehU+kYwNsW20w/IGDlmyXPggupiG/sIxgKJ6/3sNENQDGcGwDpl2TjwMru+8BRJHutsVNZHNwvYY++2eJUrd3j6gdB04t89/1O/w1cDnyilFU=
  ```
- **Rich Menu ID:** `richmenu-e873969384f2b7647d5621c2a5148b68`

### External OA (P.D.C Service)
- **Channel ID:** 2008297943
- **Channel Secret:** `ea0b3942437efe393a544e748670448c`
- **Channel Access Token:**
  ```
  t8XoQTz7YT0tS6/r0lSAVs0GrzNsJRNe+hp5z3ShjCidGsJLpNBsZXKhJI/vGSO3iJ0LFO9V0r4IXi0QK+3F1ji9+HkqIYkSeVfIAa+tj0cXCV3b55YJmZxoXa9CCJ1GD9VaR4776d8znmQy+B2u/gdB04t89/1O/w1cDnyilFU=
  ```
- **Rich Menu ID:** `richmenu-a0dac4dc9ed57499382c05f9f3a836dd`

---

## 🔄 Update History

- **2025-10-17:** เพิ่ม Job Creation LIFF (`2008297943-J69z7PPp`)
- **2025-10-15:** สร้าง LIFF Apps ทั้งหมด 5 ตัว
- **2025-10-14:** สร้าง Rich Menus (Internal & External)

---

## 📝 Notes

- ใช้ **Internal OA** สำหรับพนักงาน (Planner, Mechanic, QC, etc.)
- ใช้ **External OA** สำหรับลูกค้า (ดูใบเสนอราคา, อนุมัติ)
- LIFF Apps ทั้งหมด deploy บน **GitHub Pages**
- Backend API อยู่ที่ **Google Apps Script**

---

## 🚀 Quick Links

- **LINE Developers Console:** https://developers.line.biz/console/
- **GitHub Repository:** https://github.com/marketingpdc101/PDC-Smart-Motor-Repair
- **GitHub Pages:** https://marketingpdc101.github.io/PDC-Smart-Motor-Repair/
- **Apps Script:** https://script.google.com/macros/s/AKfycbzbmnu29mXdvX9bJlHJLSaNo7B78uEbuBgIfNOr_8S9TR3BSGuNLrDIgyw6YijvnmT0/exec
