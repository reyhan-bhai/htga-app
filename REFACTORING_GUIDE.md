# Next.js App Router Refactoring Guide

## Overview
This document details the structural refactoring of your Next.js project, moving all HTGA features from `src/app/htga/` to `src/app/`, making the root URL `/` the login interface.

---

## 1. Project Structure Changes

### Before:
```
src/app/
├── htga/
│   ├── layout.tsx          (Custom layout with providers)
│   ├── login/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── nda/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   └── restaurants/
│       └── page.tsx
├── layout.tsx              (Basic root layout)
└── page.tsx                (Empty or unused)
```

### After:
```
src/app/
├── page.tsx                (Login page - was htga/login/page.tsx)
├── dashboard/
│   └── page.tsx            (Dashboard - was htga/dashboard/page.tsx)
├── nda/
│   └── page.tsx            (NDA - was htga/nda/page.tsx)
├── profile/
│   └── page.tsx            (Profile - was htga/profile/page.tsx)
├── restaurants/
│   └── page.tsx            (Restaurants - was htga/restaurants/page.tsx)
├── layout.tsx              (Enhanced with HTGA providers)
├── admin/
├── api/
├── favicon.ico
├── globals.css
└── manifest.ts
```

---

## 2. Changes Made

### 2.1 Root Layout Update (`src/app/layout.tsx`)

**Added imports:**
```tsx
import { AuthProvider } from "../htga-app/context/AuthContext";
import PushNotificationsProvider from "@/components/notifications/PushNotificationsProvider";
import "../htga-app/styles/htga.css";
```

**Updated metadata:**
```tsx
export const metadata: Metadata = {
  title: "HTGA - HalalTrip Gastronomy Award",
  description: "Evaluator App for HalalTrip Gastronomy Award",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HTGA",
  },
};
```

**Wrapped children with providers:**
```tsx
<PushNotificationsProvider>
  <AuthProvider>
    <div className="max-w-md mx-auto">{children}</div>
  </AuthProvider>
</PushNotificationsProvider>
```

### 2.2 Root Page (`src/app/page.tsx`)

Now contains the **complete Login component** from `htga/login/page.tsx` with:
- Updated imports: `../../htga-app/context/AuthContext` (instead of `../../../`)
- Updated navigation: `router.push("/nda")` (instead of `/htga/nda`)

### 2.3 Dashboard Page (`src/app/dashboard/page.tsx`)

**Key changes:**
- Import: `../../htga-app/context/AuthContext` 
- Navigation updates:
  - `router.push("/restaurants")` ← was `/htga/restaurants`
  - `router.push("/profile")` ← was `/htga/profile`

### 2.4 NDA Page (`src/app/nda/page.tsx`)

**Key changes:**
- Import: `../../htga-app/context/AuthContext`
- Navigation: `router.push("/restaurants")` ← was `/htga/restaurants`

### 2.5 Profile Page (`src/app/profile/page.tsx`)

**Key changes:**
- Import: `../../htga-app/context/AuthContext`
- Navigation: `router.push("/dashboard")` ← was `/htga/dashboard`

### 2.6 Restaurants Page (`src/app/restaurants/page.tsx`)

**Key changes:**
- Import: `../../htga-app/context/AuthContext`
- Navigation updates:
  - `router.push("/dashboard/${id}")` ← was `/htga/dashboard/${id}`
  - `router.push("/dashboard")` ← was `/htga/dashboard`

---

## 3. Import Path Changes Summary

All pages moved from nested `htga/*/page.tsx` to `*/page.tsx`, requiring import path adjustments:

| Item | Old Path | New Path |
|------|----------|----------|
| AuthContext | `../../../htga-app/context/AuthContext` | `../../htga-app/context/AuthContext` |
| Data | `../../../htga-app/data/dummyData` | `../../htga-app/data/dummyData` |
| Styles | `../../htga-app/styles/htga.css` (in layout) | `../htga-app/styles/htga.css` (in root layout) |

---

## 4. Navigation Route Changes Summary

All navigation routes now point directly to the app level:

| Page | Old Routes | New Routes |
|------|-----------|-----------|
| **Login (/)** | N/A | `/nda` |
| **Dashboard** | `/htga/restaurants`, `/htga/profile` | `/restaurants`, `/profile` |
| **NDA** | `/htga/restaurants` | `/restaurants` |
| **Profile** | `/htga/dashboard` | `/dashboard` |
| **Restaurants** | `/htga/dashboard/{id}`, `/htga/dashboard` | `/dashboard/{id}`, `/dashboard` |

---

## 5. Old Files Status

The original `src/app/htga/` folder structure can be deleted as all content has been:
- ✅ Migrated to new locations
- ✅ Import paths updated
- ✅ Navigation routes updated

---

## 6. Testing Checklist

After deployment, verify the following:

- [ ] **Root URL (`/`)** displays login page
- [ ] **Login submission** redirects to `/nda` 
- [ ] **NDA signature** redirects to `/restaurants`
- [ ] **Restaurants page** redirects to `/dashboard` and dashboard details
- [ ] **Dashboard profile button** navigates to `/profile`
- [ ] **Profile back button** returns to `/dashboard`
- [ ] **All imports resolve correctly** (no 404s in browser console)
- [ ] **Auth context and providers work** across all pages
- [ ] **Styling** (HTGA CSS) applies correctly
- [ ] **Notifications** initialize properly on NDA page

---

## 7. Key Benefits of This Refactoring

✅ **Simpler URL structure** - No `/htga` prefix needed  
✅ **Root login** - `/` is now the entry point  
✅ **Flatter folder hierarchy** - Easier navigation and maintenance  
✅ **Unified layout** - All pages share the enhanced root layout with providers  
✅ **Cleaner imports** - Shorter import paths from pages to shared utilities  

---

## 8. Rollback Instructions (if needed)

If you need to revert:
1. Restore original `src/app/htga/` folder from git history
2. Revert `src/app/layout.tsx` to original version
3. Clear `src/app/page.tsx`
4. Delete `src/app/dashboard/`, `nda/`, `profile/`, `restaurants/` folders

---

## Additional Notes

- **Environment variables**: No changes needed if they were working before
- **API routes**: No changes to `/app/api` structure
- **Admin routes**: No changes to `/app/admin` structure
- **Assets**: All public assets remain unchanged
- **Config files**: No changes to Next.js configuration needed

For questions or issues, review the individual page files in `src/app/` for the complete updated code.
