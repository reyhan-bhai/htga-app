# NDA API - Postman Testing Guide

## 🔗 Base URL

```
http://localhost:3000/api/nda
```

---

## 📮 API Endpoints

### 1. **Send NDA** (POST)

**URL:**

```
POST http://localhost:3000/api/nda
```

**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "action": "send",
  "recipientEmail": "jeva13@gmail.com",
  "recipientName": "Jeva Irawan",
  "documentBase64": "JVBERi0xLjQKJeLjz9MK..."
}
```

**Response Success:**

```json
{
  "success": true,
  "envelopeId": "8d234c56-89ab-4def-0123-456789abcdef",
  "evaluatorId": "jeva13",
  "message": "NDA sent successfully"
}
```

**Response Error (Email not found):**

```json
{
  "success": false,
  "error": "No evaluator found with email: unknown@gmail.com"
}
```

---

### 2. **Check NDA Status** (GET)

**Option A - By Evaluator ID:**

```
GET http://localhost:3000/api/nda?evaluatorId=jeva13
```

**Option B - By Envelope ID:**

```
GET http://localhost:3000/api/nda?envelopeId=8d234c56-89ab-4def-0123-456789abcdef
```

**Headers:**

```
(none needed)
```

**Response:**

```json
{
  "success": true,
  "evaluatorId": "jeva13",
  "nda": {
    "envelopeId": "8d234c56-89ab-4def-0123-456789abcdef",
    "status": "sent",
    "sentAt": "2025-12-20T10:00:00.000Z",
    "recipientEmail": "jeva13@gmail.com",
    "recipientName": "Jeva Irawan",
    "lastUpdated": "2025-12-20T10:00:00.000Z",
    "docusignStatus": "sent"
  },
  "envelopeDetails": {
    "status": "sent",
    "sentDateTime": "2025-12-20T10:00:00.000Z",
    "deliveredDateTime": null,
    "completedDateTime": null
  }
}
```

---

### 3. **DocuSign Webhook** (POST)

**URL:**

```
POST http://localhost:3000/api/nda
```

**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "action": "webhook",
  "event": "envelope-completed",
  "data": {
    "envelopeId": "8d234c56-89ab-4def-0123-456789abcdef",
    "status": "completed"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "evaluatorId": "jeva13",
  "status": "signed"
}
```

---

### 4. **Health Check** (PATCH)

**URL:**

```
PATCH http://localhost:3000/api/nda
```

**Response:**

```json
{
  "success": true,
  "message": "NDA API is active",
  "endpoints": {
    "POST /api/nda": "Send NDA or process webhook",
    "GET /api/nda": "Check NDA status"
  }
}
```

---

## 📁 Postman Collection Setup

### Step 1: Create New Collection

1. Open Postman
2. Click **New** → **Collection**
3. Name: `NDA API`

### Step 2: Add Requests

#### Request 1: Send NDA

- **Name**: Send NDA
- **Method**: POST
- **URL**: `http://localhost:3000/api/nda`
- **Headers**:
  - `Content-Type: application/json`
- **Body** → **raw** → **JSON**:

```json
{
  "action": "send",
  "recipientEmail": "jeva13@gmail.com",
  "recipientName": "Jeva Irawan",
  "documentBase64": "JVBERi0xLjQKJeLjz9MK..."
}
```

#### Request 2: Check Status by Evaluator ID

- **Name**: Check Status (By Evaluator)
- **Method**: GET
- **URL**: `http://localhost:3000/api/nda?evaluatorId=jeva13`

#### Request 3: Check Status by Envelope ID

- **Name**: Check Status (By Envelope)
- **Method**: GET
- **URL**: `http://localhost:3000/api/nda?envelopeId={{envelopeId}}`
- **Note**: Use Postman variable `{{envelopeId}}` from Send NDA response

#### Request 4: Simulate Webhook

- **Name**: DocuSign Webhook
- **Method**: POST
- **URL**: `http://localhost:3000/api/nda`
- **Headers**:
  - `Content-Type: application/json`
- **Body** → **raw** → **JSON**:

```json
{
  "action": "webhook",
  "event": "envelope-completed",
  "data": {
    "envelopeId": "{{envelopeId}}",
    "status": "completed"
  }
}
```

#### Request 5: Health Check

- **Name**: Health Check
- **Method**: PATCH
- **URL**: `http://localhost:3000/api/nda`

---

## 🧪 Complete Testing Flow

### Test Sequence:

1. **Health Check** (PATCH)

   - Verify API is running
   - Expected: `200 OK`

2. **Send NDA** (POST)

   - Send NDA to evaluator
   - Copy `envelopeId` from response
   - Expected: `200 OK` with `envelopeId`

3. **Check Status by Evaluator** (GET)

   - Query: `?evaluatorId=jeva13`
   - Expected: Status `sent`

4. **Check Status by Envelope** (GET)

   - Query: `?envelopeId=<from-step-2>`
   - Expected: Status `sent`

5. **Simulate Webhook - Delivered** (POST)

   ```json
   {
     "action": "webhook",
     "event": "envelope-delivered",
     "data": {
       "envelopeId": "<from-step-2>",
       "status": "delivered"
     }
   }
   ```

   - Expected: Status updated to `delivered`

6. **Check Status Again** (GET)

   - Expected: Status `delivered`

7. **Simulate Webhook - Completed** (POST)

   ```json
   {
     "action": "webhook",
     "event": "envelope-completed",
     "data": {
       "envelopeId": "<from-step-2>",
       "status": "completed"
     }
   }
   ```

   - Expected: Status updated to `signed`

8. **Final Status Check** (GET)
   - Expected: Status `signed` with `completedAt` timestamp

---

## 🔄 Using Postman Variables

### Set Environment Variables:

1. Click **Environments** → **Create Environment**
2. Name: `NDA Local`
3. Add variables:
   - `baseUrl`: `http://localhost:3000/api/nda`
   - `evaluatorId`: `jeva13`
   - `envelopeId`: (will be set dynamically)

### Auto-Set envelopeId:

In **Send NDA** request → **Tests** tab:

```javascript
// Save envelopeId to environment
const response = pm.response.json();
if (response.success && response.envelopeId) {
  pm.environment.set("envelopeId", response.envelopeId);
  pm.environment.set("evaluatorId", response.evaluatorId);
}
```

Now use `{{baseUrl}}` and `{{envelopeId}}` in your requests!

---

## 🌐 ngrok Setup (For Webhook Testing)

### Start ngrok:

```bash
ngrok http 3000
```

### Copy ngrok URL:

```
https://abc123xyz.ngrok-free.app
```

### Configure DocuSign Connect:

**Webhook URL:**

```
https://abc123xyz.ngrok-free.app/api/nda
```

**Request Body (DocuSign will send):**

```json
{
  "action": "webhook",
  "event": "envelope-completed",
  "data": {
    "envelopeSummary": {
      "envelopeId": "...",
      "status": "completed"
    }
  }
}
```

---

## 🚨 Troubleshooting

### Error: "No evaluator found with email"

- Check Firebase: `evaluators` collection
- Verify email exists in database
- Email is case-insensitive

### Error: "NDA not found"

- Send NDA first before checking status
- Verify `envelopeId` or `evaluatorId` is correct

### Error: "DocuSign API error"

- Check `.env.local` credentials
- Verify access token is valid
- Check DocuSign console for errors

### Error: "Invalid action"

- For POST requests, include `"action": "send"` or `"action": "webhook"`
- For GET requests, no action needed

---

## 📊 Response Status Codes

| Status Code | Meaning                                      |
| ----------- | -------------------------------------------- |
| `200`       | Success                                      |
| `400`       | Bad request (missing fields, invalid action) |
| `404`       | Not found (evaluator/envelope not found)     |
| `500`       | Internal server error                        |

---

## ✅ Quick cURL Commands

### Send NDA:

```bash
curl -X POST http://localhost:3000/api/nda \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send",
    "recipientEmail": "jeva13@gmail.com",
    "recipientName": "Jeva Irawan",
    "documentBase64": "JVBERi0xLjQK..."
  }'
```

### Check Status:

```bash
curl http://localhost:3000/api/nda?evaluatorId=jeva13
```

### Simulate Webhook:

```bash
curl -X POST http://localhost:3000/api/nda \
  -H "Content-Type: application/json" \
  -d '{
    "action": "webhook",
    "event": "envelope-completed",
    "data": {
      "envelopeId": "YOUR_ENVELOPE_ID",
      "status": "completed"
    }
  }'
```

---

## 🎯 Summary

**Single Unified Endpoint:** `http://localhost:3000/api/nda`

| Method    | Purpose      | Parameters                        |
| --------- | ------------ | --------------------------------- |
| **POST**  | Send NDA     | `action: "send"` + recipient info |
| **POST**  | Webhook      | `action: "webhook"` + event data  |
| **GET**   | Check Status | `evaluatorId` or `envelopeId`     |
| **PATCH** | Health Check | (none)                            |

All operations are now in **ONE endpoint**! 🚀
