# NDA Signature Tracking Implementation

## Overview

System untuk tracking status NDA signature dari DocuSign dan update ke Firebase Realtime Database. Sistem otomatis mendeteksi evaluatorId berdasarkan email.

## Prerequisites

### 1. Install ngrok (Required for Local Testing)

Download dan install ngrok: https://ngrok.com/download

**Windows:**

```powershell
# Download ngrok dan extract
# Atau install via chocolatey:
choco install ngrok
```

**Verify installation:**

```bash
ngrok --version
```

### 2. Setup ngrok Account (Free)

1. Sign up di https://dashboard.ngrok.com/signup
2. Get Auth Token: https://dashboard.ngrok.com/get-started/your-authtoken
3. Configure auth token:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

## Database Structure

### Firebase Realtime Database

```json
{
  "evaluators": {
    "evaluatorId": {
      "name": "John Doe",
      "email": "john@example.com",
      "nda": {
        "envelopeId": "abc123-envelope-id",
        "status": "sent|delivered|signed|declined|voided",
        "sentAt": "2025-12-20T10:00:00.000Z",
        "recipientEmail": "john@example.com",
        "recipientName": "John Doe",
        "lastUpdated": "2025-12-20T10:00:00.000Z",
        "docusignStatus": "sent|delivered|completed|declined|voided",
        "completedAt": "2025-12-20T11:00:00.000Z"
      }
    }
  }
}
```

## API Endpoints

### 1. Send NDA

**POST** `/api/send-nda`

Send NDA document via DocuSign. Sistem akan otomatis mencari evaluatorId berdasarkan email.

**Request Body:**

```json
{
  "recipientEmail": "evaluator@example.com",
  "recipientName": "John Doe",
  "documentBase64": "JVBERi0xLjQKJeLjz..."
}
```

**Response:**

```json
{
  "success": true,
  "envelopeId": "abc123-envelope-id",
  "evaluatorId": "jeva13",
  "message": "NDA sent successfully"
}
```

**Error Responses:**

```json
// Email tidak ditemukan di database
{
  "success": false,
  "error": "No evaluator found with email: evaluator@example.com"
}

// Missing fields
{
  "success": false,
  "error": "Missing required fields: recipientEmail, recipientName, documentBase64"
}
```

### 2. DocuSign Webhook

**POST** `/api/docusign-webhook`

Receives status updates from DocuSign and updates Firebase automatically.

**DocuSign Payload Example:**

```json
{
  "event": "envelope-completed",
  "data": {
    "envelopeId": "abc123-envelope-id",
    "status": "completed",
    "envelopeSummary": {
      "envelopeId": "abc123-envelope-id",
      "status": "completed"
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "evaluatorId": "evaluator-id",
  "status": "signed"
}
```

### 3. Check NDA Status

**GET** `/api/check-nda-status?evaluatorId=xxx` or `?envelopeId=xxx`

Check current NDA status (from Firebase + live DocuSign API).

**Response:**

```json
{
  "success": true,
  "evaluatorId": "evaluator-id",
  "nda": {
    "envelopeId": "abc123-envelope-id",
    "status": "signed",
    "sentAt": "2025-12-20T10:00:00.000Z",
    "recipientEmail": "john@example.com",
    "recipientName": "John Doe",
    "lastUpdated": "2025-12-20T11:00:00.000Z",
    "docusignStatus": "completed",
    "completedAt": "2025-12-20T11:00:00.000Z"
  },
  "envelopeDetails": {
    "status": "completed",
    "sentDateTime": "2025-12-20T10:00:00.000Z",
    "deliveredDateTime": "2025-12-20T10:05:00.000Z",
    "completedDateTime": "2025-12-20T11:00:00.000Z"
  }
}
```

## Status Mapping

| DocuSign Status | Our Status  | Description                  |
| --------------- | ----------- | ---------------------------- |
| `sent`          | `sent`      | NDA sent to evaluator        |
| `delivered`     | `delivered` | Email delivered to evaluator |
| `completed`     | `signed`    | Evaluator signed the NDA     |
| `declined`      | `declined`  | Evaluator declined to sign   |
| `voided`        | `voided`    | Admin voided the envelope    |

## Setup DocuSign Webhook

### Step 1: Start ngrok (Terminal 1)

Buka terminal pertama dan jalankan:

```bash
ngrok http 3000
```

**Output:**

```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**IMPORTANT:** Copy URL `https://abc123xyz.ngrok-free.app` (ini akan berubah setiap restart ngrok)

**Tips:**

- ⚠️ ngrok free account: URL berubah setiap restart
- 💡 ngrok paid: bisa custom domain permanent
- 🔄 Keep terminal running selama testing
- 📊 Monitor requests di http://127.0.0.1:4040

### Step 2: Start Next.js Dev Server (Terminal 2)

Buka terminal kedua:

```bash
npm run dev
```

Server running di http://localhost:3000

### Step 3: Setup DocuSign Connect Webhook

#### 3.1 Login DocuSign Admin Portal

https://admindemo.docusign.com

#### 3.2 Navigate to Connect Settings

1. Click **Settings** (⚙️ icon di sidebar)
2. Click **Connect** tab
3. Click **ADD CONFIGURATION** button

#### 3.3 Fill Configuration Form

**General Settings:**

- **Configuration Name**: `NDA Status Webhook - Development`
- **Description**: `Webhook untuk update NDA status ke Firebase`

**URL Settings:**

- **URL to Publish**: `https://abc123xyz.ngrok-free.app/api/docusign-webhook`
  _(Ganti dengan ngrok URL Anda)_

**Event Selection:**
Enable events yang diperlukan:

- ☑️ **Envelope Sent** - Ketika NDA dikirim
- ☑️ **Envelope Delivered** - Email diterima evaluator
- ☑️ **Envelope Completed** - Evaluator sudah sign
- ☑️ **Envelope Declined** - Evaluator menolak sign
- ☑️ **Envelope Voided** - Admin membatalkan

**Additional Settings:**

- Include Documents: ❌ (tidak perlu)
- Include Certificate of Completion: ❌ (tidak perlu)
- Include Envelope Status: ✅ (perlu)

**Message Format:**

- Format: `JSON`

**Test Configuration:**

- Click **SAVE**
- Click **TEST** button untuk test webhook
- Check terminal/ngrok untuk melihat test request

### Step 4: Verify Webhook Setup

#### 4.1 Check ngrok Inspector

Buka http://127.0.0.1:4040 di browser

Anda akan melihat:

- HTTP requests yang masuk
- Request headers
- Request body (JSON payload)
- Response status

#### 4.2 Check Terminal Logs

Di terminal Next.js, Anda akan melihat:

```
📩 DocuSign Webhook received: {
  event: 'envelope-completed',
  data: {...}
}
```

### Step 5: Test Webhook Manually

#### 5.1 Test dengan curl

```bash
curl -X POST https://abc123xyz.ngrok-free.app/api/docusign-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "envelope-completed",
    "data": {
      "envelopeId": "test-envelope-123",
      "status": "completed"
    }
  }'
```

#### 5.2 Test dengan Postman

```
POST https://abc123xyz.ngrok-free.app/api/docusign-webhook
Content-Type: application/json

{
  "event": "envelope-completed",
  "data": {
    "envelopeId": "YOUR_ENVELOPE_ID_HERE",
    "status": "completed"
  }
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "evaluatorId": "jeva13",
  "status": "signed"
}
```

## Complete Testing Flow

### Test 1: Send NDA (Simplified - Auto-detect evaluatorId)

**Request Body** (Tidak perlu evaluatorId):

```json
{
  "recipientEmail": "evaluator@gmail.com",
  "recipientName": "John Doe",
  "documentBase64": "JVBERi0xLjQKJeLjz9MK..."
}
```

**Postman Setup:**

```
Method: POST
URL: http://localhost:3000/api/send-nda
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "recipientEmail": "jeva13@gmail.com",
  "recipientName": "Jeva Irawan",
  "documentBase64": "JVBERi0xLjQKJeLjz9MK..."
}
```

**Response Success:**

```json
{
  "success": true,
  "message": "NDA sent successfully",
  "envelopeId": "8d234c56-89ab-4def-0123-456789abcdef",
  "evaluatorId": "jeva13"
}
```

**Response Error (Email not found):**

```json
{
  "error": "Evaluator not found",
  "message": "No evaluator found with email: unknown@gmail.com"
}
```

**curl Command:**

```bash
curl -X POST http://localhost:3000/api/send-nda \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "jeva13@gmail.com",
    "recipientName": "Jeva Irawan",
    "documentBase64": "JVBERi0xLjQKJeLjz9MK..."
  }'
```

**What Happens:**

1. ✅ System searches Firebase evaluators collection for matching email
2. ✅ If found, auto-detects evaluatorId
3. ✅ Sends NDA via DocuSign
4. ✅ Saves to Firebase at `evaluators/{evaluatorId}/nda`
5. ✅ Returns evaluatorId in response

**Check Firebase After Send:**

```
evaluators/
  └── jeva13/
      └── nda/
          ├── envelopeId: "8d234c56-89ab-4def-0123-456789abcdef"
          ├── status: "sent"
          ├── sentAt: 1735668800000
          ├── recipientEmail: "jeva13@gmail.com"
          └── recipientName: "Jeva Irawan"
```

---

### Test 2: Check NDA Status

**By evaluatorId:**

```bash
GET http://localhost:3000/api/check-nda-status?evaluatorId=jeva13
```

**By envelopeId:**

```bash
GET http://localhost:3000/api/check-nda-status?envelopeId=8d234c56-89ab-4def-0123-456789abcdef
```

**Postman Setup:**

```
Method: GET
URL: http://localhost:3000/api/check-nda-status?evaluatorId=jeva13
Headers: (none needed)
```

**Response:**

```json
{
  "success": true,
  "nda": {
    "envelopeId": "8d234c56-89ab-4def-0123-456789abcdef",
    "status": "sent",
    "sentAt": 1735668800000,
    "recipientEmail": "jeva13@gmail.com",
    "recipientName": "Jeva Irawan"
  },
  "synced": true,
  "message": "Status synced with DocuSign"
}
```

**What Happens:**

1. ✅ Fetches from Firebase
2. ✅ Calls DocuSign API to get live status
3. ✅ Compares Firebase vs DocuSign
4. ✅ Updates Firebase if status changed
5. ✅ Returns latest status

---

### Test 3: Webhook Auto-Update (Requires ngrok)

**Full Flow:**

1. ✅ **Start ngrok**: `ngrok http 3000`
2. ✅ **Copy URL**: `https://abc123xyz.ngrok-free.app`
3. ✅ **Configure DocuSign Connect**: Paste `https://abc123xyz.ngrok-free.app/api/docusign-webhook`
4. 📧 **Send NDA** via `/api/send-nda`
5. 📬 **Evaluator receives email** from DocuSign
6. ⚡ **Webhook triggered** → Firebase updated to `delivered`
7. ✍️ **Evaluator clicks link and signs**
8. ⚡ **Webhook triggered again** → Firebase updated to `signed` with `completedAt`

**Webhook Events:**

```
envelope-sent      → status: "sent"
envelope-delivered → status: "delivered"
envelope-completed → status: "signed"
envelope-declined  → status: "declined"
envelope-voided    → status: "voided"
```

**Check Firebase After Webhook:**

```
evaluators/
  jeva13/
    nda/
      envelopeId: "8d234c56-89ab-4def-0123-456789abcdef"
      status: "signed"  ← Updated automatically
      sentAt: 1735668800000
      completedAt: 1735669200000  ← Added when signed
      recipientEmail: "jeva13@gmail.com"
      recipientName: "Jeva Irawan"
```

**Test Webhook Manually (Without DocuSign):**

```bash
curl -X POST http://localhost:3000/api/docusign-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "envelope-completed",
    "data": {
      "envelopeId": "8d234c56-89ab-4def-0123-456789abcdef",
      "status": "completed"
    }
  }'
```

**Postman Test Webhook:**

```
Method: POST
URL: http://localhost:3000/api/docusign-webhook
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "event": "envelope-completed",
  "data": {
    "envelopeId": "8d234c56-89ab-4def-0123-456789abcdef",
    "status": "completed"
  }
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "evaluatorId": "jeva13",
  "status": "signed"
}
```

---

### Test 4: Convert PDF to Base64 (Helper)

**Node.js Script:**

```js
// test-convert-pdf.js
const fs = require("fs");
const path = require("path");

const pdfPath = path.join(__dirname, "sample-nda.pdf");
const pdfBuffer = fs.readFileSync(pdfPath);
const base64 = pdfBuffer.toString("base64");

console.log("Base64 length:", base64.length);
console.log("First 100 chars:", base64.substring(0, 100));

// Save to file for Postman
fs.writeFileSync("nda-base64.txt", base64);
console.log("✅ Saved to nda-base64.txt");
```

**Run:**

```bash
node test-convert-pdf.js
```

**Use in Postman:**
Copy content dari `nda-base64.txt` dan paste ke request body field `documentBase64`

## Usage in Admin Dashboard

### Display NDA Status in Evaluators Table

```tsx
// In evaluators page
const { evaluators } = useEvaluators();

// Add column for NDA status
<TableColumn>NDA Status</TableColumn>

// In table body
<TableCell>
  {evaluator.nda?.status ? (
    <Chip
      color={
        evaluator.nda.status === "signed"
          ? "success"
          : evaluator.nda.status === "sent"
          ? "warning"
          : "danger"
      }
      size="sm"
      variant="flat"
    >
      {evaluator.nda.status.toUpperCase()}
    </Chip>
  ) : (
    <Chip size="sm" variant="flat" color="default">
      NOT SENT
    </Chip>
  )}
</TableCell>
```

### Check Status Button

```tsx
const handleCheckNDAStatus = async (evaluatorId: string) => {
  try {
    const response = await fetch(
      `/api/check-nda-status?evaluatorId=${evaluatorId}`
    );
    const data = await response.json();

    await Swal.fire({
      icon: "info",
      title: "NDA Status",
      html: `
        <div style="text-align: left;">
          <p><strong>Status:</strong> ${data.nda.status}</p>
          <p><strong>Sent:</strong> ${new Date(data.nda.sentAt).toLocaleString()}</p>
          ${
            data.nda.completedAt
              ? `<p><strong>Signed:</strong> ${new Date(data.nda.completedAt).toLocaleString()}</p>`
              : ""
          }
        </div>
      `,
      confirmButtonColor: "#A67C37",
    });
  } catch (error) {
    console.error(error);
  }
};
```

## Production Deployment

### 1. Update Webhook URL

Change webhook URL from ngrok to production domain:

```
https://your-production-domain.com/api/docusign-webhook
```

### 2. Environment Variables

```env
DOCUSIGN_INTEGRATION_KEY=your-production-key
DOCUSIGN_USER_ID=your-production-user-id
DOCUSIGN_ACCOUNT_ID=your-production-account-id
DOCUSIGN_BASE_PATH=https://na3.docusign.net/restapi
DOCUSIGN_PRIVATE_KEY="..."
```

### 3. Test Production Webhook

DocuSign provides a test feature in Connect configuration:

1. Go to Connect settings
2. Click **Test** next to your configuration
3. DocuSign will send test events to your webhook

## Troubleshooting

### Webhook not receiving events

1. Check DocuSign Connect configuration
2. Verify URL is publicly accessible (use ngrok for local)
3. Check webhook logs in terminal
4. Verify events are enabled in Connect config

### Status not updating

1. Check Firebase rules allow write
2. Verify evaluatorId matches in Firebase
3. Check envelopeId matches
4. View webhook payload in console logs

### 403 Forbidden on webhook

1. Remove authentication requirement on webhook endpoint
2. DocuSign doesn't support auth headers
3. Use signature verification instead (optional)

## Security Best Practices

### 1. Verify DocuSign Signature (Optional)

```ts
// Add to webhook endpoint
import crypto from "crypto";

const verifyDocuSignSignature = (
  payload: string,
  signature: string,
  secret: string
) => {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest("base64");
  return calculatedSignature === signature;
};
```

### 2. Rate Limiting

Add rate limiting to webhook endpoint to prevent abuse.

### 3. IP Whitelist (Optional)

DocuSign IP ranges:

- 162.248.184.0/24
- 199.47.217.0/24

## Next Steps

1. ✅ Send NDA via API
2. ✅ Save envelope info to Firebase
3. ✅ Setup webhook to receive status updates
4. ✅ Create check status endpoint
5. 🔲 Display NDA status in admin dashboard
6. 🔲 Add "Send NDA" button in evaluator modal
7. 🔲 Add status badge in evaluators table
8. 🔲 Setup production webhook URL
