# 🧪 Testing Guide - Create Evaluator API

## 📋 Prerequisites

1. ✅ Install dependencies: `npm install`
2. ✅ Configure `.env.local` dengan Firebase credentials dan Gmail
3. ✅ Pastikan Firebase Realtime Database sudah di-setup

## 🚀 Step-by-Step Testing (Tanpa UI)

### Step 1: Jalankan Development Server

```powershell
npm run dev
```

Server akan berjalan di `http://localhost:3000`

---

### Step 2: Test Email Configuration (Optional tapi Disarankan)

```powershell
node test-email-config.js
```

**Expected Output:**

```
✅ Email transporter verified successfully
```

**Jika Error:**

- ❌ Check GMAIL_FROM dan GMAIL_APP_PASSWORD di `.env.local`
- ❌ Pastikan Gmail App Password sudah di-generate (bukan password biasa)
- ❌ Pastikan GMAIL_FROM tidak ada spasi di depan/belakang

---

### Step 3: Test Create Evaluator API

#### Option A: Menggunakan Node.js Test Script

```powershell
node test-create-evaluator.js
```

**Edit test-create-evaluator.js:**

- Ganti `email: 'testeval@example.com'` dengan email yang valid
- Pastikan ADMIN_TOKEN sesuai dengan `.env.local`

#### Option B: Menggunakan PowerShell (curl)

```powershell
$body = @{
    email = "evaluator@example.com"
    displayName = "John Doe"
    specialties = @("Indonesian", "Western")
    maxAssignments = 10
    adminToken = "fd-guh2Ykwq42gWehAfRsY:APA91bGAJSaQ8jBUarcyd7CXL7diYe2qZQDJW9-_u0upyPT7eb_pZQn2iFGFH7lo_Yi2zR-33skHDGESor6lzTTE7t1JjajjroBPHrOeKxTrSmqXM9ivZWk"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/admin/create-evaluator" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body
```

#### Option C: Menggunakan VS Code REST Client

Buka `test-api.http` dan tambahkan:

```http
### Create Evaluator
POST http://localhost:3000/api/admin/create-evaluator
Content-Type: application/json

{
  "email": "evaluator@example.com",
  "displayName": "John Doe",
  "specialties": ["Indonesian", "Western"],
  "maxAssignments": 10,
  "adminToken": "fd-guh2Ykwq42gWehAfRsY:APA91bGAJSaQ8jBUarcyd7CXL7diYe2qZQDJW9-_u0upyPT7eb_pZQn2iFGFH7lo_Yi2zR-33skHDGESor6lzTTE7t1JjajjroBPHrOeKxTrSmqXM9ivZWk"
}
```

---

## ✅ Expected Success Response

```json
{
  "success": true,
  "message": "Evaluator created successfully and credentials sent via email",
  "data": {
    "uid": "firebase-user-id",
    "email": "evaluator@example.com",
    "displayName": "John Doe",
    "emailSent": true,
    "messageId": "email-message-id"
  }
}
```

## ⚠️ Warning Response (User Created, Email Failed)

```json
{
  "success": true,
  "warning": "User created but email failed to send",
  "message": "Evaluator created successfully, but failed to send credentials email",
  "data": {
    "uid": "firebase-user-id",
    "email": "evaluator@example.com",
    "displayName": "John Doe"
  },
  "emailError": "error message",
  "credentials": {
    "email": "evaluator@example.com",
    "password": "generated-password"
  }
}
```

---

## 🐛 Debugging - Common Errors

### Error 401: Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Invalid admin token"
}
```

**Solution:**

- Check ADMIN_TOKEN di `.env.local`
- Pastikan adminToken di request body atau header `x-admin-token` sama

---

### Error 400: Email Required

```json
{
  "error": "Validation Error",
  "message": "Email is required"
}
```

**Solution:**

- Pastikan `email` field ada di request body

---

### Error 409: User Already Exists

```json
{
  "error": "User Already Exists",
  "message": "Email evaluator@example.com is already registered"
}
```

**Solution:**

- Email sudah terdaftar di Firebase Auth
- Gunakan email lain atau delete user dari Firebase Console

---

### Error 500: Firebase Auth Error

```json
{
  "error": "Firebase Auth Error",
  "message": "Error creating user",
  "code": "auth/..."
}
```

**Solution:**

- Check Firebase credentials di `.env.local`
- Pastikan FIREBASE_PRIVATE_KEY formatted dengan benar (replace \\n dengan \n)
- Check Firebase Console untuk error logs

---

### Error 500: Database Error

```json
{
  "error": "Database Error",
  "message": "Failed to save evaluator data. User creation rolled back."
}
```

**Solution:**

- Check Firebase Realtime Database rules
- Pastikan FIREBASE_DATABASE_URL di `.env.local` benar
- Check database permissions

---

### Email Failed (SMTP Error)

```json
{
  "emailError": "Invalid login: 535-5.7.8 Username and Password not accepted"
}
```

**Solution:**

- GMAIL_APP_PASSWORD salah atau expired
- Generate new App Password di Google Account settings
- Format: `xxxx-xxxx-xxxx-xxxx` (tanpa spasi di .env.local)

---

## 📊 Monitoring & Logs

### Check Server Logs

Terminal yang menjalankan `npm run dev` akan menampilkan:

```
📥 Received create-evaluator request
👤 Creating evaluator for email: evaluator@example.com
✅ Password generated successfully
✅ User created in Firebase Auth. UID: abc123
✅ Custom claims set successfully
✅ Evaluator data saved to Realtime Database
✅ Credentials email sent successfully. Message ID: <message-id>
✅ Evaluator created successfully
```

### Check Firebase Console

1. **Firebase Auth**: https://console.firebase.google.com/

   - Go to Authentication > Users
   - Verify user dengan email terdaftar

2. **Realtime Database**: https://console.firebase.google.com/
   - Go to Realtime Database
   - Check path: `evaluators/{uid}`
   - Verify data tersimpan

### Check Email Inbox

- Email akan dikirim ke alamat yang di-specify
- Subject: "🔐 Akun Evaluator Anda Telah Dibuat"
- Contains: username dan password

---

## 🔧 Environment Variables Checklist

```env
# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=✅
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=✅
NEXT_PUBLIC_FIREBASE_PROJECT_ID=✅
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=✅
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=✅
NEXT_PUBLIC_FIREBASE_APP_ID=✅

# Firebase Admin (Server)
FIREBASE_PROJECT_ID=✅
FIREBASE_PRIVATE_KEY=✅ (with \\n)
FIREBASE_CLIENT_EMAIL=✅
FIREBASE_DATABASE_URL=✅

# Gmail
GMAIL_FROM=✅ (no spaces!)
GMAIL_APP_PASSWORD=✅ (format: xxxx-xxxx-xxxx-xxxx)

# Admin Token
NEXT_PUBLIC_ADMIN_TOKEN=✅ (atau ADMIN_TOKEN)
```

---

## 📝 Test Checklist

- [ ] Server running (`npm run dev`)
- [ ] Email config verified (`node test-email-config.js`)
- [ ] Create evaluator test passed
- [ ] Email received dengan credentials
- [ ] User ada di Firebase Auth
- [ ] Data tersimpan di Realtime Database
- [ ] Login dengan credentials berhasil (optional)

---

## 🎯 Next Steps

1. **Add UI untuk Admin Dashboard**

   - Form create evaluator
   - List evaluators
   - Delete/Edit evaluator

2. **Add Login Page untuk Evaluator**

   - Login dengan email/password
   - Force change password on first login

3. **Add Security Rules**

   - Firebase Auth rules
   - Realtime Database rules
   - Rate limiting

4. **Production Ready**
   - Move ADMIN_TOKEN ke server-only
   - Add proper authentication middleware
   - Add logging service
   - Add error monitoring (Sentry, etc.)

---

## 📞 Support

Jika masih ada error, check:

1. Server logs di terminal
2. Firebase Console logs
3. Network tab di browser (jika test via browser)
4. Email provider logs (Gmail)
