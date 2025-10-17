# Dual Webhook Architecture - Setup Guide

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    LINE Platform                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Internal OA (พนักงาน)              External OA (ลูกค้า)    │
│       │                                      │               │
│       └──────────┐                ┌──────────┘               │
│                  │                │                          │
└──────────────────┼────────────────┼──────────────────────────┘
                   │                │
                   ▼                ▼
         ┌─────────────────────────────────┐
         │   Cloudflare Worker Proxy        │
         │  (pdc-webhook-proxy.workers.dev) │
         ├─────────────────────────────────┤
         │                                  │
         │  /webhook/internal  → flag:true  │
         │  /webhook/external  → flag:false │
         │                                  │
         └──────────────┬───────────────────┘
                        │
                        ▼
         ┌─────────────────────────────────┐
         │   Google Apps Script             │
         │   (Deployment @8)                │
         ├─────────────────────────────────┤
         │                                  │
         │  doPost(e) {                     │
         │    isInternal = e.parameter      │
         │    handleLineWebhook(isInternal) │
         │  }                               │
         │                                  │
         │  Webhook.js → Route by flag      │
         │  ├─ Internal handlers            │
         │  └─ External handlers            │
         └─────────────────────────────────┘
```

## 📝 Setup Steps

### 1. Deploy Cloudflare Worker

#### Prerequisites:
- Cloudflare account
- Node.js installed
- Wrangler CLI: `npm install -g wrangler`

#### Deploy Commands:
```bash
cd webhook-proxy

# Login to Cloudflare
wrangler login

# Deploy
wrangler deploy

# Output will show:
# ✅ https://pdc-webhook-proxy.workers.dev
```

### 2. Update Apps Script

**Files Modified:**
- `code.js` - Added `isInternal` parameter handling
- `Webhook.js` - Changed from `isInternalUser()` to `event._isInternal` flag

**Already Done:** ✅ Files are ready in this commit

### 3. Setup LINE Webhook URLs

#### Internal OA (พนักงาน):
1. Go to: https://developers.line.biz/console
2. Select **Internal OA** (Channel ID: m/MmqpcxQBY...)
3. Navigate to **Messaging API** tab
4. Set **Webhook URL**:
   ```
   https://pdc-webhook-proxy.workers.dev/webhook/internal
   ```
5. Click **Verify** → Should return 200 OK
6. Enable **Use webhook**
7. Disable **Auto-reply messages** (optional)

#### External OA (ลูกค้า):
1. Go to: https://developers.line.biz/console
2. Select **External OA** (Channel ID: t8XoQTz7YT0...)
3. Navigate to **Messaging API** tab
4. Set **Webhook URL**:
   ```
   https://pdc-webhook-proxy.workers.dev/webhook/external
   ```
5. Click **Verify** → Should return 200 OK
6. Enable **Use webhook**
7. Disable **Auto-reply messages** (optional)

## 🧪 Testing

### Test Internal OA:
```bash
# Send test webhook
curl -X POST https://pdc-webhook-proxy.workers.dev/webhook/internal \
  -H "Content-Type: application/json" \
  -d '{"events": [{"type": "message", "message": {"type": "text", "text": "test"}}]}'
```

### Test External OA:
```bash
# Send test webhook
curl -X POST https://pdc-webhook-proxy.workers.dev/webhook/external \
  -H "Content-Type: application/json" \
  -d '{"events": [{"type": "message", "message": {"type": "text", "text": "test"}}]}'
```

### Health Check:
```bash
curl https://pdc-webhook-proxy.workers.dev/health
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
  },
  "timestamp": "2025-10-17T14:47:00.000Z"
}
```

## 🔍 How It Works

### 1. Cloudflare Worker (Proxy Layer)
- **Receives** webhook from LINE
- **Determines** channel type from URL path:
  - `/webhook/internal` → `isInternal=true`
  - `/webhook/external` → `isInternal=false`
- **Forwards** to Apps Script with flag:
  - Query param: `?isInternal=true`
  - Header: `X-Channel-Type: internal`

### 2. Apps Script (Backend)
- **Receives** request with `isInternal` flag
- **Parses** flag from `e.parameter.isInternal` or `e.postData.headers`
- **Adds** flag to event object: `event._isInternal = true/false`
- **Routes** to appropriate handler:
  ```javascript
  const isInternal = event._isInternal === true;
  
  if (isInternal) {
    handleInternalMessage(...);  // พนักงาน
  } else {
    handleExternalMessage(...);  // ลูกค้า
  }
  ```

### 3. Webhook Handlers
- **Internal handlers** (`WebhookInternal.js`):
  - งานทั้งหมด, สร้างงานใหม่, Dashboard
  - Commands for staff
  - Full access to system

- **External handlers** (`WebhookExternal.js`):
  - ดูสถานะงาน, งานของฉัน
  - Customer-facing features
  - Limited access

## ✅ Benefits

### Before (isInternalUser() approach):
- ❌ Depends on Users sheet
- ❌ Slow (queries sheet every request)
- ❌ Breaks if sheet is empty
- ❌ Requires user registration

### After (Dual Webhook approach):
- ✅ **Fast** - No database queries
- ✅ **Reliable** - No dependencies on sheet data
- ✅ **Clear separation** - Determined at webhook level
- ✅ **Easier debugging** - Can see channel type in logs
- ✅ **Scalable** - Worker caching, edge computing

## 🛠️ Troubleshooting

### Problem: Webhook verification fails
**Solution:** 
- Check Cloudflare Worker is deployed
- Test health endpoint: `/health`
- Check Apps Script deployment is active

### Problem: Messages go to wrong handler
**Solution:**
- Check Webhook URL in LINE Console
- Verify `/internal` or `/external` path
- Check Apps Script logs for `isInternal` value

### Problem: 404 Not Found
**Solution:**
- Verify Worker is deployed: `wrangler deployments list`
- Check URL pattern in `wrangler.toml`
- Ensure correct path: `/webhook/internal` not `/internal`

## 📊 Monitoring

### Cloudflare Dashboard:
- Analytics → Workers
- View request count, errors, response time
- Filter by route: `/webhook/internal` vs `/webhook/external`

### Apps Script Logs:
- Executions → View logs
- Search for "Webhook received"
- Check `channel: internal/external`

## 🔐 Security Notes

- ✅ Verify `X-Line-Signature` header (already implemented)
- ✅ Use HTTPS only (enforced by Cloudflare)
- ✅ Rate limiting (Cloudflare built-in)
- ✅ CORS headers configured
- ⚠️ Consider adding API key for extra security

## 📝 Maintenance

### Update Worker:
```bash
cd webhook-proxy
# Edit index.js
wrangler deploy
```

### Update Apps Script URL:
Edit `APPS_SCRIPT_URL` in `webhook-proxy/index.js`:
```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec';
```

### Rollback:
```bash
wrangler rollback --message "Rollback to previous version"
```

## 🎉 Done!

Your Dual Webhook Architecture is now set up:
- ✅ Cloudflare Worker with 2 endpoints
- ✅ Apps Script with flag-based routing
- ✅ Clear separation of Internal/External handlers
- ✅ No dependency on Users sheet
- ✅ Fast, reliable, scalable

Next: Setup Webhook URLs in LINE Developers Console! 🚀
