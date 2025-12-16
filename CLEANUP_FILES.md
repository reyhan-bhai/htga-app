# 🗑️ File Cleanup Guide

## File yang Bisa Dihapus

Untuk membersihkan folder project, file-file berikut bisa dihapus:

```bash
# File test yang sudah tidak diperlukan
test-email-config.js
test-send-direct-email.js
test-api.http

# Dokumentasi duplikat
API_TESTING_GUIDE.md
FRONTEND_INTEGRATION_GUIDE.md
HTGA-README.md
```

## Cara Hapus (PowerShell)

```powershell
Remove-Item -Path "test-email-config.js", "test-send-direct-email.js", "test-api.http", "API_TESTING_GUIDE.md", "FRONTEND_INTEGRATION_GUIDE.md", "HTGA-README.md" -Force
```

## File yang TETAP Diperlukan

✅ **Jangan dihapus**:

- `test-create-evaluator.js` - untuk testing create evaluator API
- `SETUP_TESTING.md` - dokumentasi lengkap
- `TESTING_GUIDE.md` - panduan testing umum
- `.env.local` - environment variables (JANGAN commit ke Git!)
