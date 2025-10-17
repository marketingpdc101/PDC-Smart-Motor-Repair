# 🚀 Deployment Checklist - PDC Smart Motor Repair

## ✅ Status Overview

### Completed:
- ✅ **Database Initialized** - 9 sheets created
- ✅ **Templates & Folders Setup** - 3 templates + 9 folders
- ✅ **Cloudflare Worker Deployed** - pdc-webhook-proxy.marketingpdc101.workers.dev
- ✅ **Dual Webhook Architecture** - Code ready in GitHub
- ✅ **LIFF Apps on GitHub Pages** - 6 apps deployed
- ✅ **Rich Menu Generator** - Fixed Thai font support

### In Progress:
- 🔄 **Deploy Apps Script @9** - With Dual Webhook support
- 🔄 **Setup LINE Webhooks** - Configure both OAs

### Pending:
- ⏳ **Test Dual Webhook** - Verify routing works
- ⏳ **Create Sample Data** - Test job with items
- ⏳ **Test PDF Generator** - Verify PDF creation
- ⏳ **Test LIFF Apps** - End-to-end testing

---

## 📦 1. Deploy Apps Script (Version 2.1)

### Files Changed:
- `code.js` - Added `isInternal` parameter handling
- `Webhook.js` - Use `event._isInternal` flag instead of `isInternalUser()`

### Steps:

1. **Open Apps Script Editor:**
   - URL: https://script.google.com
   - Project: PDC Smart Motor Repair

2. **Update code.gs:**
   ```
   - Open code.gs
   - Select All (Ctrl+A)
   - Paste from apps-script/code.js
   - Check Thai characters display correctly
   - Save (Ctrl+S)
   ```

3. **Update Webhook.gs:**
   ```
   - Open Webhook.gs  
   - Select All (Ctrl+A)
   - Paste from apps-script/Webhook.js
   - Check Thai characters display correctly
   - Save (Ctrl+S)
   ```

4. **Deploy New Version:**
   ```
   - Click "Deploy" > "New deployment"
   - Type: Web app
   - Description: "v2.1 - Dual Webhook Support"
   - Execute as: Me
   - Who has access: Anyone
   - Click "Deploy"
   ```

5. **Copy Deployment URL:**
   - New URL will be generated (Deployment @9)
   - **Note:** Worker already points to @8, no need to update

### Current Deployment:
- **Deployment @8:** `AKfycbx2nmE9w5ea5qBGmfJfK8SCXn4pERD6WPhqoF1PIsxAU09KqdKFhKbTdlmiYh0m4Zpg`
- **Use this URL** - Already configured in Cloudflare Worker

---

## 🌐 2. Cloudflare Worker

### Status: ✅ **DEPLOYED**

### Details:
- **Worker Name:** pdc-webhook-proxy
- **URL:** https://pdc-webhook-proxy.marketingpdc101.workers.dev
- **Version:** 2.0.0 (Dual Webhook Architecture)

### Endpoints:
1. **Internal OA:** `/webhook/internal`
2. **External OA:** `/webhook/external`  
3. **Health Check:** `/health`

### Test Health:
```bash
curl https://pdc-webhook-proxy.marketingpdc101.workers.dev/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "PDC Smart Motor Repair Webhook Proxy",
  "version": "2.0.0",
  "endpoints": {
    "internal": "/webhook/internal",
    "external": "/webhook/external",
    "health": "/health"
  }
}
```

---

## 📱 3. Setup LINE Webhook URLs

### Internal OA (พนักงาน)

**Webhook URL:**
```
https://pdc-webhook-proxy.marketingpdc101.workers.dev/webhook/internal
```

**Steps:**
1. Go to: https://developers.line.biz/console
2. Select **Internal OA** (Channel: PDC Sys...Internal)
3. Navigate to **Messaging API** tab
4. **Webhook settings:**
   - Webhook URL: `https://pdc-webhook-proxy.marketingpdc101.workers.dev/webhook/internal`
   - Click **Update**
   - Click **Verify** → Should return **200 OK** ✅
5. Toggle **Use webhook**: **ON** ✅
6. Toggle **Auto-reply messages**: **OFF**
7. Toggle **Greeting messages**: **OFF** (optional)

---

### External OA (ลูกค้า)

**Webhook URL:**
```
https://pdc-webhook-proxy.marketingpdc101.workers.dev/webhook/external
```

**Steps:**
1. Go to: https://developers.line.biz/console
2. Select **External OA** (Channel: PDC Motor Service)
3. Navigate to **Messaging API** tab
4. **Webhook settings:**
   - Webhook URL: `https://pdc-webhook-proxy.marketingpdc101.workers.dev/webhook/external`
   - Click **Update**
   - Click **Verify** → Should return **200 OK** ✅
5. Toggle **Use webhook**: **ON** ✅
6. Toggle **Auto-reply messages**: **OFF**
7. Toggle **Greeting messages**: **OFF** (optional)

---

## 🧪 4. Test Dual Webhook

### Test Internal OA:

1. **Open Internal OA in LINE app**
2. **Send test message:** "Hello"
3. **Expected behavior:**
   - Message routes to `handleInternalMessage()`
   - Bot responds with Internal OA features
   - Check Apps Script logs: `channel: internal`

### Test External OA:

1. **Open External OA in LINE app**
2. **Send test message:** "Hello"
3. **Expected behavior:**
   - Message routes to `handleExternalMessage()`
   - Bot responds with External OA features
   - Check Apps Script logs: `channel: external`

### Verify Logs:

**Apps Script:**
1. Go to Apps Script Editor
2. Click **Executions** (left sidebar)
3. Look for "Webhook received" logs
4. Verify `channel: internal` or `channel: external`

**Cloudflare:**
1. Go to Cloudflare Dashboard
2. Navigate to **Workers & Pages**
3. Click **pdc-webhook-proxy**
4. View **Logs** tab
5. Check requests to `/webhook/internal` and `/webhook/external`

---

## 📊 5. System URLs Reference

### Apps Script:
- **Editor:** https://script.google.com
- **Current Deployment:** @8
- **URL:** `https://script.google.com/macros/s/AKfycbx2nmE9w5ea5qBGmfJfK8SCXn4pERD6WPhqoF1PIsxAU09KqdKFhKbTdlmiYh0m4Zpg/exec`

### Cloudflare Worker:
- **Dashboard:** https://dash.cloudflare.com
- **Worker URL:** https://pdc-webhook-proxy.marketingpdc101.workers.dev
- **Health Check:** https://pdc-webhook-proxy.marketingpdc101.workers.dev/health

### GitHub Pages:
- **Repository:** https://github.com/marketingpdc101/PDC-Smart-Motor-Repair
- **LIFF Apps:** https://marketingpdc101.github.io/PDC-Smart-Motor-Repair/
- **Rich Menu Generator:** https://marketingpdc101.github.io/PDC-Smart-Motor-Repair/rich-menu-generator/

### LINE Developer Console:
- **Console:** https://developers.line.biz/console
- **Internal OA:** Channel ID `m/MmqpcxQBY...`
- **External OA:** Channel ID `t8XoQTz7YT0...`

### Google Drive:
- **Templates Folder:** Contains 3 PDF templates
- **Jobs Folder:** ROOT folder with 9 subfolders

---

## 🎯 6. Next Steps

### Immediate (Required for functionality):
1. ✅ **Deploy Apps Script @9** with Dual Webhook support
2. ✅ **Setup LINE Webhook URLs** for both OAs
3. ✅ **Test Dual Webhook** - Send messages to verify routing

### Testing Phase:
4. **Create Sample Job Data**
   - Run `createJob()` in Apps Script
   - Add 2-3 JobItems
   - Verify data in sheets

5. **Test Job Creation LIFF**
   - Open Job Creation LIFF app
   - Fill in customer details
   - Add repair items
   - Submit → Check job created

6. **Test PDF Generator**
   - Run `generateQuotationPDF(jobId)`
   - Run `generateWorkOrderPDF(jobId)`
   - Run `generateFinalReportPDF(jobId)`
   - Verify PDFs generated in Google Drive

7. **Test LINE Notifications**
   - Create new job → Check customer notification
   - Approve quotation → Check internal notification
   - Update status → Check customer notification
   - Complete job → Check final report notification

8. **Test All LIFF Apps**
   - Job Creation ✅
   - Quotation Approval
   - Status Update
   - Final Test Input
   - Work Order View
   - Final Report View

---

## 🔧 7. Troubleshooting

### Problem: Webhook verification fails
**Solution:**
- Check Cloudflare Worker is running: `/health` endpoint
- Verify Apps Script deployment is active
- Check webhook URL has no typos

### Problem: Messages go to wrong handler
**Solution:**
- Verify webhook URLs are correct:
  - Internal: `/webhook/internal`
  - External: `/webhook/external`
- Check Apps Script logs for `isInternal` flag
- Verify Cloudflare Worker code matches GitHub

### Problem: Thai characters show as "??????"
**Solution:**
- Re-deploy Apps Script with clasp (preserves UTF-8)
- Or carefully copy-paste and verify Thai text displays correctly
- Check Apps Script Editor is set to UTF-8

### Problem: PDF generation fails
**Solution:**
- Verify template IDs in `config.js`
- Check folder IDs are correct
- Run `setupTemplatesAndFolders()` if templates missing
- Check Google Drive permissions

---

## 📝 8. Documentation

- **Setup Guide:** `docs/DUAL_WEBHOOK_SETUP.md`
- **Architecture:** `ARCHITECTURE.md`
- **Gap Analysis:** `GAP_ANALYSIS.md`
- **LINE Setup:** `docs/LINE_SETUP.md`
- **PDF Generator:** `docs/PDF_GENERATOR_SETUP.md`
- **LIFF Integration:** `docs/LIFF_INTEGRATION_FIX.md`

---

## ✅ Deployment Completion Checklist

- [ ] Apps Script @9 deployed with Dual Webhook support
- [ ] Internal OA webhook URL configured and verified
- [ ] External OA webhook URL configured and verified
- [ ] Test message sent to Internal OA (routes correctly)
- [ ] Test message sent to External OA (routes correctly)
- [ ] Sample job data created in sheets
- [ ] PDF Generator tested (all 3 types)
- [ ] Job Creation LIFF tested
- [ ] Quotation LIFF tested
- [ ] Status Update LIFF tested
- [ ] Final Test LIFF tested
- [ ] Work Order LIFF tested
- [ ] Final Report LIFF tested
- [ ] LINE Notifications working
- [ ] Rich Menu uploaded to both OAs

---

## 🎉 System Ready When:

All items above are checked ✅

**Expected Timeline:**
- Deploy & Setup: ~30 minutes
- Testing: ~1 hour
- **Total: ~1.5 hours to full deployment**

---

**Last Updated:** October 17, 2025  
**Version:** 2.1 (Dual Webhook Architecture)  
**Status:** 🔄 In Progress
