# 🎯 Setup & Testing Create Evaluator (Tanpa UI)

## Step 1: Cek Environment Variables

Buka `.env.local` dan pastikan tidak ada spasi:

```bash
GMAIL_FROM=proyekkonsultasi733@gmail.com  # ✅ BENAR (tanpa spasi)
# GMAIL_FROM= proyekkonsultasi733@gmail.com  # ❌ SALAH (ada spasi)
```

## Step 2: Jalankan Server

```bash
npm run dev
```

Tunggu sampai muncul: `✓ Ready in ...s`

## Step 3: Test Email (Opsional)

```bash
node test-email-config.js
```

Expected: `✅ Email configuration is VALID!`

## Step 4: Test Create Evaluator

```bash
node test-create-evaluator.js
```

Expected output:

```
✅ SUCCESS! Evaluator created successfully!
📧 Email sent to: dikamatrial76@gmail.com
```

## Step 5: Verifikasi

1. **Cek Firebase Console**: Authentication → Users (harus ada user baru)
2. **Cek Realtime Database**: `evaluators/{uid}` (harus ada data)
3. **Cek Email**: Inbox harus ada email dengan username & password

---

## 🐛 Troubleshooting

### Error: "535 Authentication failed"

- Hapus spasi di `GMAIL_FROM`
- Generate App Password baru di Google Account
- Restart server

### Error: "email-already-exists"

- Gunakan email lain, atau
- Hapus user dari Firebase Console

### Error: "ECONNREFUSED"

- Pastikan server running
- Ganti `https://` ke `http://` di test script jika perlu

### Error: "Cannot find module"

```bash
npm install nodemailer @types/nodemailer
```

---

## 📝 Manual Test dengan PowerShell

```powershell
$body = @{
    email = "test@example.com"
    displayName = "Test User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://localhost:3000/api/admin/create-evaluator" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -SkipCertificateCheck
```

---

## ✅ Success Checklist

- [ ] Server running tanpa error
- [ ] Email config test berhasil
- [ ] Create evaluator API return status 201
- [ ] User muncul di Firebase Auth
- [ ] Data tersimpan di Realtime Database
- [ ] Email terkirim dan diterima
