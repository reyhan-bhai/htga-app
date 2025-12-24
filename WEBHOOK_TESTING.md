# DocuSign Webhook Testing Guide

## Flow yang Benar

1. ✅ Send NDA via Postman → DocuSign kirim email ke jeva15
2. ✅ Jeva15 terima email → klik link → tandatangani NDA → klik selesai
3. ✅ DocuSign kirim webhook ke backend (POST https://your-domain.com/api/nda)
4. ✅ Backend receive webhook → update Firebase Realtime Database status jadi "signed"/"completed"

## Setup DocuSign Webhook URL

### Webhook URL

```
https://your-ngrok-url.ngrok-free.app/api/nda
```

### DocuSign Connect Configuration

1. Login ke DocuSign
2. Go to **Settings** → **Connect** → **Add Configuration**
3. Set webhook URL: `https://your-domain.com/api/nda`
4. Enable events:
   - ✅ Envelope Sent
   - ✅ Envelope Delivered
   - ✅ Envelope Completed (PENTING!)
   - ✅ Envelope Declined
   - ✅ Envelope Voided

## Supported Webhook Formats

### Format 1: Standard Event/Data

```json
{
  "event": "envelope-completed",
  "data": {
    "envelopeId": "77ce1f91-3840-85a0-8135-9a5685c51736",
    "status": "completed"
  }
}
```

### Format 2: Direct Envelope Data

```json
{
  "envelopeId": "77ce1f91-3840-85a0-8135-9a5685c51736",
  "status": "completed"
}
```

### Format 3: DocuSign Connect XML-to-JSON

```json
{
  "EnvelopeStatus": {
    "EnvelopeID": "77ce1f91-3840-85a0-8135-9a5685c51736",
    "Status": "Completed"
  }
}
```

## Manual Testing via Postman

### ⚡ QUICK TEST - Update Status Now (for jeva15)

```http
POST http://localhost:3000/api/nda
Content-Type: application/json

{
  "envelopeId": "a78c1212-ff8a-839a-8141-a65bdfc01f18",
  "status": "completed"
}
```

Response yang diharapkan:

```json
{
  "success": true,
  "message": "Webhook processed and Firebase updated successfully",
  "evaluatorId": "jeva15",
  "status": "signed"
}
```

### ⚡ ALTERNATIVE - Check & Sync from DocuSign API

```http
GET http://localhost:3000/api/nda?evaluatorId=jeva15&sync=true
```

Ini akan fetch live status dari DocuSign dan auto-update Firebase.

### Test Webhook Manually (Generic)

```http
POST https://your-domain.com/api/nda
Content-Type: application/json

{
  "envelopeId": "77ce1f91-3840-85a0-8135-9a5685c51736",
  "status": "completed"
}
```

## Status Mapping

- `sent` → Firebase: "sent"
- `delivered` → Firebase: "delivered"
- `completed` → Firebase: "signed" ✅
- `declined` → Firebase: "declined"
- `voided` → Firebase: "voided"

## Check Logs

Backend akan log setiap webhook yang diterima:

```
📩 ============================================
📩 DocuSign Webhook received
📩 Full Payload: {...}
📝 Extracted - Envelope ID: xxx
📝 Extracted - Status: completed
🔍 Finding evaluator for envelope: xxx
✅ Found evaluator: jeva15
📋 Current status in DB: sent
🔄 Status mapping: completed → signed
💾 Updating Firebase for evaluator jeva15...
✅ Webhook processed successfully!
📩 ============================================
```

## Troubleshooting

### ⚠️ PENTING - Verify DocuSign Connect Configuration

**Step 1: Check DocuSign Connect Settings**

1. Login ke DocuSign → **Settings** → **Connect**
2. Find your configuration: **"nextjs-project"**
3. Verify:
   - ✅ URL: `https://unenfranchised-unsolvably-mayola.ngrok-free.dev/api/nda` (NO trailing slash!)
   - ✅ Status: **Active Connection** (warna hijau)
   - ✅ Events enabled: Envelope Sent, Delivered, **Completed**, Declined, Voided
4. Click **"Test"** button → harus sukses (green checkmark)
5. Check logs di terminal → harus ada request masuk

**Step 2: Verify ngrok is running**

```powershell
# Check ngrok status
Get-Process ngrok -ErrorAction SilentlyContinue
```

Jika tidak ada, jalankan:

```powershell
ngrok http 3000
```

**Step 3: Check if Putra Indika (jeva15) has signed the NDA**

- Check email dari DocuSign yang dikirim ke: `dikamatrial76@upi.edu`
- Pastikan sudah klik link dan **finish signing** (klik tombol "Finish")
- Jika belum sign, webhook tidak akan dikirim!

### Problem: Status tidak update di Firebase setelah user tandatangan

**Quick Fix - Test Manual Webhook (LATEST envelopeId):**

```powershell
# PowerShell - Test webhook untuk envelope terbaru (90e61e76-3dc0-848d-8010-907dedc0174c)
Invoke-WebRequest -Uri "http://localhost:3000/api/nda" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"envelopeId":"90e61e76-3dc0-848d-8010-907dedc0174c","status":"completed"}'

# Check & sync status dari DocuSign
Invoke-WebRequest -Uri "http://localhost:3000/api/nda?evaluatorId=jeva15&sync=true" |
  Select-Object -ExpandProperty Content
```

```bash
# curl - Test webhook
curl -X POST http://localhost:3000/api/nda \
-H "Content-Type: application/json" \
-d '{
  "envelopeId": "90e61e76-3dc0-848d-8010-907dedc0174c",
  "status": "completed"
}'

# Check & sync dari DocuSign API
curl -X GET "http://localhost:3000/api/nda?evaluatorId=jeva15&sync=true"
```

**Long-term Solution:**

1. Check webhook URL di DocuSign Connect sesuai: `https://unenfranchised-unsolvably-mayola.ngrok-free.dev/api/nda`
2. Check ngrok masih running: `ngrok http 3000`
3. Check logs di terminal untuk melihat webhook diterima
4. Test DocuSign Connect dengan "Test" button
5. Pastikan DocuSign Connect configuration status: "Active Connection"

### Problem: Webhook tidak diterima dari DocuSign

**Solution:**

1. Pastikan ngrok running: `ngrok http 3000`
2. Copy ngrok URL ke DocuSign Connect (tanpa trailing slash)
3. Test connection di DocuSign Connect settings (klik "Test")
4. Check logs terminal, harus ada:
   ```
   🌐 POST /api/nda - Request received
   🔔 Processing webhook...
   ✅ Webhook processed successfully
   ```
5. Jika tidak ada logs, webhook tidak sampai ke server
6. Check firewall/antivirus tidak block ngrok

### Problem: envelopeId tidak ditemukan

**Solution:**

1. Pastikan NDA sudah dikirim via Postman
2. Check Firebase database ada envelopeId
3. Check envelopeId di webhook sama dengan di database

## Test Complete Flow

### Step 1: Send NDA

```http
POST http://localhost:3000/api/nda
Content-Type: application/json

{
  "recipientEmail": "dikamatrial76@upi.edu",
  "recipientName": "Putra Indika",
  "documentBase64": "JVBERi0xLjQKJeLj..."
}
```

### Step 2: Check Status in Firebase

```
evaluators/
  jeva15/
    nda/
      envelopeId: "77ce1f91-3840-85a0-8135-9a5685c51736"
      status: "sent"  ← Should be this initially
```

### Step 3: Jeva15 Sign NDA via Email

- Jeva15 buka email dari DocuSign
- Klik link sign
- Tandatangani
- Klik "Finish"

### Step 4: DocuSign Sends Webhook

```
POST /api/nda
{
  "envelopeId": "77ce1f91-3840-85a0-8135-9a5685c51736",
  "status": "completed"
}
```

### Step 5: Check Status Updated in Firebase

```
evaluators/
  jeva15/
    nda/
      envelopeId: "77ce1f91-3840-85a0-8135-9a5685c51736"
      status: "signed"  ← Should update to this! ✅
      completedAt: "2025-12-23T11:47:35.820Z"
```

## Notes

- Webhook akan otomatis update Firebase Realtime Database
- Tidak perlu manual refresh atau call API lagi
- Status akan update real-time setelah user sign NDA
