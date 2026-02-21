# HTGA (HalalTrip Gastronomy Award) — Project Handover

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Feature Overview](#feature-overview)
6. [Architecture Deep Dives](#architecture-deep-dives)
   - [Firebase Realtime Database Schema](#firebase-realtime-database-schema)
   - [Zoho Webhook Integration](#zoho-webhook-integration)
   - [Push Notifications (FCM + PWA)](#push-notifications-fcm--pwa)
   - [DocuSign NDA Flow](#docusign-nda-flow)
7. [Admin Panel Features](#admin-panel-features)
8. [Evaluator (User) Features](#evaluator-user-features)
9. [API Routes Reference](#api-routes-reference)
10. [Environment Variables](#environment-variables)
11. [Known Quirks & Gotchas](#known-quirks--gotchas)
12. [Deployment](#deployment)

---

## Project Overview

HTGA is a web application for managing restaurant evaluations for the HalalTrip Gastronomy Award program. It connects **admins** who assign restaurants to **evaluators** who complete on-site evaluations via Zoho Forms. The system handles:

- Evaluator registration & authentication
- NDA signing via DocuSign
- Restaurant-to-evaluator assignment management
- Evaluation form submission tracking (via Zoho webhooks)
- Budget & reimbursement tracking
- Push notifications (FCM)
- Google Sheets data sync
- Evaluator handbook document management

---

## Tech Stack

| Layer            | Technology                              |
| ---------------- | --------------------------------------- |
| Framework        | Next.js 14+ (App Router)                |
| Language         | TypeScript (strict mode)                |
| Database         | Firebase Realtime Database              |
| Auth             | Firebase Authentication                 |
| NDA Signing      | DocuSign eSignature API                 |
| Evaluation Forms | Zoho Forms (external, webhook callback) |
| Notifications    | Firebase Cloud Messaging (FCM)          |
| Email            | Nodemailer (Gmail SMTP)                 |
| Spreadsheet Sync | Google Sheets API                       |
| UI Libraries     | NextUI, Material UI, Tailwind CSS       |
| PWA              | Custom service worker + manifest        |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables (see Environment Variables section below)
cp .env.example .env.local

# 3. Generate service worker env vars
node sw-env-vars.js

# 4. Run development server
npm run dev
# App runs at https://localhost:3010
```

---

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── admin/                    # Admin panel pages
│   │   ├── page.tsx              # Main assigned view (evaluator/restaurant)
│   │   ├── budget/page.tsx       # Budget & reimbursement management
│   │   ├── feedback/page.tsx     # Feedback, reports, reassign requests
│   │   ├── handbook/page.tsx     # Handbook document management
│   │   └── notifications/page.tsx # Push notification sender
│   ├── user/                     # Evaluator-facing pages
│   │   ├── (auth)/               # Auth route group (login, register, forgot-password)
│   │   ├── dashboard/page.tsx    # Evaluator dashboard
│   │   ├── nda/page.tsx          # NDA signing page
│   │   ├── handbook/page.tsx     # Handbook viewer
│   │   ├── profile/              # Profile page
│   │   └── notifications/        # Notification list
│   └── api/                      # API routes (backend)
│       ├── admin/
│       │   ├── handbook/route.ts     # CRUD for handbook docs
│       │   ├── nda/route.ts          # DocuSign NDA operations
│       │   ├── notifications/        # Broadcast notifications
│       │   │   ├── route.ts          # Send to all subscribers
│       │   │   └── send/route.ts     # Send to specific user
│       │   ├── receipt-update/       # Receipt image upload
│       │   ├── seed/route.ts         # Seed sample data
│       │   ├── tokens/               # FCM token CRUD
│       │   └── webhook-zoho/route.ts # ⭐ Zoho form submission webhook
│       ├── sheets/route.ts           # Google Sheets sync
│       └── user/
│           ├── auth/route.ts         # Registration + login
│           ├── forgot-password/      # Password reset
│           ├── reassign-requests/    # Evaluator reassign requests
│           └── restaurant-requests/  # Restaurant recommendations
├── components/
│   ├── admin/                    # Admin UI components (table, modal, header)
│   ├── dashboard/                # Dashboard header
│   ├── evaluator/                # Evaluator-specific components
│   └── notifications/            # Push notification components
├── context/
│   ├── AuthContext.tsx            # Auth state (Firebase Auth + user data)
│   └── admin/AssignedContext.tsx  # Admin data context (assignments, evaluators, establishments)
├── lib/
│   ├── firebase.ts               # Firebase Client SDK (singleton)
│   ├── firebase-admin.ts         # Firebase Admin SDK (server-side, singleton)
│   ├── nda-service.ts            # ⭐ DocuSign NDA service (send, check, webhook)
│   ├── docusign-config.ts        # DocuSign auth & config
│   ├── emailService.ts           # Email sending via Nodemailer
│   ├── fcmTokenHelper.ts         # ⭐ FCM token management (client-side)
│   ├── api-error-handler.ts      # Standardized API error responses
│   ├── assignedPageUtils.ts      # Admin page data transformation utilities
│   └── notifications.ts          # Notification helper stubs
├── types/
│   └── htga.ts                   # Core TypeScript interfaces
└── public/
    ├── firebase-messaging-sw.js  # ⭐ FCM service worker
    ├── sw-process-env.js         # Generated env vars for service worker
    └── manifest.json             # PWA manifest
```

---

## Feature Overview

| Feature                  | Admin | Evaluator | Key Files                                              |
| ------------------------ | :---: | :-------: | ------------------------------------------------------ |
| Authentication           |   ✅   |     ✅     | `AuthContext.tsx`, `api/user/auth/route.ts`             |
| NDA Signing (DocuSign)   |   ✅   |     ✅     | `nda-service.ts`, `api/admin/nda/route.ts`             |
| Assignment Management    |   ✅   |     ✅     | `admin/page.tsx`, `AssignedContext.tsx`                 |
| Evaluation Tracking      |   ✅   |     ✅     | `api/admin/webhook-zoho/route.ts`                      |
| Budget & Reimbursement   |   ✅   |           | `admin/budget/page.tsx`                                |
| Handbook Management      |   ✅   |     ✅     | `admin/handbook/page.tsx`, `user/handbook/page.tsx`     |
| Push Notifications       |   ✅   |     ✅     | `fcmTokenHelper.ts`, `firebase-messaging-sw.js`        |
| Feedback & Reports       |   ✅   |     ✅     | `admin/feedback/page.tsx`                              |
| Google Sheets Sync       |   ✅   |           | `api/sheets/route.ts`                                  |
| PWA (Add to Home Screen) |       |     ✅     | `manifest.json`, service worker files                  |

---

## Architecture Deep Dives

### Firebase Realtime Database Schema

```
/
├── evaluators/
│   └── {evaluatorId}/
│       ├── name: string
│       ├── email: string
│       ├── phone: string
│       ├── company: string
│       ├── position: string
│       ├── specialties: string | string[] | object
│       ├── firebaseUid: string
│       ├── password: string (hashed)
│       ├── maxAssignments: number
│       ├── fcmTokens: string (latest FCM token)
│       ├── createdAt: string (ISO)
│       ├── updatedAt: string (ISO)
│       └── nda/
│           ├── envelopeId: string (DocuSign)
│           ├── status: "sent" | "delivered" | "signed" | "declined" | "voided"
│           ├── sentAt: string (ISO)
│           ├── completedAt: string (ISO)
│           ├── recipientEmail: string
│           ├── recipientName: string
│           ├── docusignStatus: string
│           └── lastUpdated: string (ISO)
│
├── establishments/
│   └── {establishmentId}/
│       ├── name: string
│       ├── category: string
│       ├── address: string
│       ├── contactInfo: string
│       ├── rating: number
│       ├── budget: string
│       ├── currency: string
│       ├── halalStatus: string
│       ├── remarks: string
│       └── source: string
│
├── assignments/
│   └── {assignmentId}/
│       ├── establishmentId: string (ref to /establishments)
│       ├── evaluator1Id: string (ref to /evaluators)
│       ├── evaluator2Id: string (ref to /evaluators)
│       ├── evaluator1AssignedAt: string (ISO)
│       ├── evaluator2AssignedAt: string (ISO)
│       ├── evaluator1Status: "pending" | "submitted"
│       ├── evaluator2Status: "pending" | "submitted"
│       ├── assignedAt: string (ISO)
│       ├── completedAt: string (ISO)
│       └── evaluators/
│           ├── JEVA_FIRST/
│           │   ├── receiptUrl: string
│           │   ├── amountSpent: number
│           │   └── currency: string
│           └── JEVA_SECOND/
│               ├── receiptUrl: string
│               ├── amountSpent: number
│               └── currency: string
│
├── handbooks/
│   └── {handbookId}/
│       ├── title: string
│       ├── description: string
│       ├── fileUrl: string
│       ├── uploadedAt: string (ISO)
│       ├── isActive: boolean
│       └── order: number
│
├── fcmTokens/
│   └── {userId}/
│       └── token: string
│
├── dropdown/
│   ├── category/          # Specialty/category options
│   └── halalstatus/       # Halal status options
│
├── reassignRequests/
│   └── {requestId}/       # Evaluator reassign requests
│
├── restaurantRequests/
│   └── {requestId}/       # Restaurant recommendation requests
│
└── reports/
    └── {reportId}/        # Issue reports (closed restaurant, food poisoning, etc.)
```

> **Important:** The `specialties` field on evaluators is inconsistently typed across the codebase
> (can be `string`, `string[]`, or Firebase object). All read paths handle all three formats.
> See `assignedPageUtils.ts` lines 136-155 and `api/sheets/route.ts` lines 128-138.

---

### Zoho Webhook Integration

**This is one of the trickiest parts of the system.**

#### How It Works

```
┌──────────────┐     ┌──────────────┐     ┌─────────────────────────────────┐
│  Evaluator   │────>│  Zoho Form   │────>│  POST /api/admin/webhook-zoho   │
│  (browser)   │     │  (external)  │     │  (Next.js API route)            │
└──────────────┘     └──────────────┘     └──────────┬──────────────────────┘
                                                     │
                                                     ▼
                                          ┌─────────────────────┐
                                          │  Firebase Realtime   │
                                          │  Database            │
                                          │  /assignments/{id}   │
                                          └─────────────────────┘
```

#### Flow Details

1. **Evaluator clicks "Start Evaluation"** on their dashboard (`user/dashboard/page.tsx` line ~170).
   The app opens a Zoho form URL with pre-filled query parameters:
   ```
   https://forms.zohopublic.com/.../formperma/...
     ?unique_id={uniqueId}
     &assignment_id={assignmentId}
     &eva_email={evaluatorEmail}
     &eva_id={evaluatorId}
     &restaurant_name={restaurantName}
   ```

2. **Evaluator completes the form** on Zoho's website.

3. **Zoho sends a webhook** `POST /api/admin/webhook-zoho` with:
   ```json
   {
     "assignment_id": "...",
     "evaluator_id": "..."
   }
   ```

4. **The webhook handler** (`src/app/api/admin/webhook-zoho/route.ts`):
   - Looks up the assignment in Firebase by `assignment_id`
   - Determines which evaluator slot submitted (evaluator1 or evaluator2) by matching `evaluator_id`
   - Updates the corresponding status to `"submitted"`
   - If **both** evaluators have submitted, sets `completedAt` timestamp
   - Updates Firebase atomically via `assignmentRef.update(updates)`

#### Key Gotcha — Evaluator Slot Detection

The webhook must figure out **which** evaluator slot (1 or 2) the submission belongs to.
It does this by comparing the incoming `evaluator_id` against `assignment.evaluator1Id` and
`assignment.evaluator2Id`. **If the evaluator ID doesn't match either slot, the update is skipped.**

```typescript
// Simplified logic from webhook-zoho/route.ts
if (evaluator_id === assignment.evaluator1Id) {
  updates.evaluator1Status = "submitted";
} else if (evaluator_id === assignment.evaluator2Id) {
  updates.evaluator2Status = "submitted";
}

// Both done? Mark assignment complete
if (newEval1Status === "submitted" && newEval2Status === "submitted") {
  updates.completedAt = new Date().toISOString();
}
```

#### Zoho Configuration (External)

The Zoho form must be configured with a **webhook integration** that POSTs to:
```
https://{YOUR_DOMAIN}/api/admin/webhook-zoho
```

The form must pass `assignment_id` and `evaluator_id` fields in the webhook payload.
These fields are populated from the URL query parameters when the evaluator opens the form.

> **⚠️ No authentication** is currently on this webhook endpoint. Anyone who knows the URL
> can POST to it. Consider adding a shared secret or signature verification in production.

---

### Push Notifications (FCM + PWA)

**This is the other tricky part.** Push notifications involve multiple moving pieces across
client, server, and service worker.

#### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT SIDE                          │
│                                                         │
│  ┌──────────────────┐    ┌────────────────────────┐     │
│  │ PushNotifications│    │ fcmTokenHelper.ts      │     │
│  │ Provider         │    │ - getFCMToken()        │     │
│  │ (Context)        │    │ - saveFCMTokenToServer()│    │
│  │                  │───>│ - removeFCMTokenFrom   │     │
│  │ Initializes      │    │   Server()             │     │
│  │ Firebase         │    │ - storeFCMToken()      │     │
│  │ Messaging        │    │ - isPushNotification   │     │
│  └──────────────────┘    │   Supported()          │     │
│                          └───────────┬────────────┘     │
│                                      │                  │
│  ┌──────────────────┐                │ POST/DELETE      │
│  │ Service Worker   │                │ /api/admin/tokens│
│  │ firebase-        │                │                  │
│  │ messaging-sw.js  │<── background  │                  │
│  │                  │    messages     │                  │
│  └──────────────────┘                │                  │
└──────────────────────────────────────┼──────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────┐
│                    SERVER SIDE                          │
│                                                         │
│  ┌─────────────────────────────┐                        │
│  │ /api/admin/tokens           │  FCM token CRUD        │
│  │   POST   - Save token       │  in Firebase           │
│  │   DELETE - Remove token      │  /fcmTokens/{userId}  │
│  │   GET    - Count subscribers │                        │
│  └─────────────────────────────┘                        │
│                                                         │
│  ┌─────────────────────────────┐                        │
│  │ /api/admin/notifications    │  Broadcast to ALL      │
│  │   POST - Send to all tokens │  via Firebase Admin    │
│  └─────────────────────────────┘  admin.messaging()     │
│                                                         │
│  ┌─────────────────────────────┐                        │
│  │ /api/admin/notifications/   │  Send to SPECIFIC user │
│  │   send                      │  (FCM + Email +        │
│  │   POST - Multi-channel send │   WhatsApp fallback)   │
│  └─────────────────────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

#### Token Lifecycle

1. **Registration/Collection** — Happens in two places:
   - **NDA Page** (`user/nda/page.tsx`): After signing NDA, user is prompted to allow notifications.
     If granted, `getFCMToken()` gets a token from Firebase Messaging, then `saveFCMTokenToServer()`
     POSTs it to `/api/admin/tokens`.
   - **Dashboard** (`user/dashboard/page.tsx`): On load, checks if permission already granted
     and syncs token. Toggle button allows enable/disable.

2. **Storage** — Token is stored in:
   - Firebase Realtime Database: `/fcmTokens/{userId}/token`
   - Also on the evaluator node: `/evaluators/{userId}/fcmTokens`
   - Browser localStorage (via `storeFCMToken()`)

3. **Removal** — On logout (`AuthContext.tsx` line ~287):
   ```typescript
   // Cleanup FCM token on logout
   const fcmToken = getStoredFCMToken();
   if (fcmToken && userId) {
     await removeFCMTokenFromServer(fcmToken, userId);
     removeFCMToken(); // localStorage cleanup
   }
   ```

#### Service Worker Setup

The service worker file is at `public/firebase-messaging-sw.js`. It:
- Loads Firebase compat SDK from CDN
- Imports env vars from `public/sw-process-env.js` (generated by `node sw-env-vars.js`)
- Handles `onBackgroundMessage` — shows native notification with icon and action
- Handles `notificationclick` — opens the app URL from notification data

> **⚠️ Critical:** `sw-process-env.js` is generated at build time by `sw-env-vars.js`.
> If env vars change, you **must** re-run `node sw-env-vars.js` before building.
> Currently the checked-in file has `'undefined'` for all values — this is expected;
> it gets overwritten during deployment.

#### iOS / PWA Considerations

Push notifications on iOS **only work when the app is installed as a PWA** (Add to Home Screen).
The code handles this with:

- `isPushNotificationSupported()` — checks for ServiceWorker, PushManager, Notification API support
- `isIOS()` — detects iOS devices
- `isRunningAsPWA()` — checks `standalone` display mode
- `needsPWAInstall` — context value that triggers "Add to Home Screen" instruction popup

If iOS user hasn't installed as PWA, the notification prompt shows instructions instead of
requesting permission.

#### Sending Notifications

**Broadcast to all subscribers** (admin panel):
```
POST /api/admin/notifications
Body: { notificationTitle, notificationBody, url? }
```
- Fetches all tokens from `/fcmTokens/`
- Sends via `admin.messaging().send()` for each token
- Removes invalid/expired tokens automatically

**Send to specific user** (e.g., NDA reminder):
```
POST /api/admin/notifications/send
Body: { token?, userId?, title, message, url? }
```
- Sends FCM if token provided
- Falls back to email if userId provided (looks up email from `/evaluators/{userId}`)
- WhatsApp integration is stubbed but not implemented

---

### DocuSign NDA Flow

```
┌──────────┐    ┌────────────┐    ┌──────────┐    ┌──────────┐
│  Admin    │───>│ POST       │───>│ DocuSign │───>│ Evaluator│
│  creates  │    │ /api/admin │    │ API      │    │ receives │
│  evaluator│    │ /nda       │    │ (send    │    │ email    │
└──────────┘    │ {send}     │    │ envelope)│    │ to sign  │
                └────────────┘    └──────┬───┘    └────┬─────┘
                                         │             │
                                         │   signs     │
                                         │<────────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ DocuSign     │
                                  │ Webhook      │──> POST /api/admin/nda
                                  │ (status      │    {webhook}
                                  │  change)     │
                                  └──────────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ Firebase     │
                                  │ /evaluators/ │
                                  │ {id}/nda     │
                                  │ status →     │
                                  │ "signed"     │
                                  └──────────────┘
```

The NDA service (`src/lib/nda-service.ts`) is a centralized module handling:
- **`sendNDA()`** — Creates and sends a DocuSign envelope with the NDA PDF
- **`checkNDAStatus()`** — Queries DocuSign for live status, syncs back to Firebase
- **`processWebhook()`** — Handles DocuSign Connect webhook events (status changes)
- **`findEvaluatorByEnvelopeId()`** — Reverse lookup: finds which evaluator owns an envelope
- **`updateNDAStatus()`** — Updates Firebase with mapped status + timestamps

Status mapping:
| DocuSign Status | Internal Status |
| --------------- | --------------- |
| `sent`          | `sent`          |
| `delivered`     | `delivered`     |
| `completed`     | `signed`        |
| `declined`      | `declined`      |
| `voided`        | `voided`        |

---

## Admin Panel Features

### Assigned Page (`/admin`)
- Two views: **By Evaluator** and **By Restaurant**
- Data comes from `AssignedContext` which listens to Firebase in real-time
- Supports: edit evaluator/establishment, manual match, send NDA, send reminders
- NDA reminder sends via `/api/admin/notifications/send` (FCM + email)

### Budget Page (`/admin/budget`)
- Shows per-assignment budget data for each evaluator slot
- Displays receipt images, amount spent, budget allocation, reimbursement calculation
- Reimbursement = `min(amountSpent, budget)`
- Receipt upload via `/api/admin/receipt-update`

### Handbook Page (`/admin/handbook`)
- CRUD for handbook documents (title, description, link URL)
- Toggle active/inactive (hidden from evaluators)
- Firebase real-time listener auto-updates the list

### Feedback Page (`/admin/feedback`)
- Three tabs: Restaurant requests, Issue reports, Reassign requests
- All data from Firebase real-time listeners

### Notifications Page (`/admin/notifications`)
- Shows subscriber count
- Form to broadcast push notifications to all subscribers
- Debug: shows current Firebase token, subscribe/unsubscribe buttons

---

## Evaluator (User) Features

### Registration & Login
- Registration creates Firebase Auth user + evaluator record in RTDB
- Sends credentials via email + triggers NDA send via DocuSign
- Login via email/password with Firebase Auth

### NDA Page (`/user/nda`)
- Canvas-based signature capture
- After signing, prompts for push notification permission
- NDA status tracked via DocuSign integration

### Dashboard (`/user/dashboard`)
- Shows assigned restaurants with evaluation status
- "Start Evaluation" opens pre-filled Zoho form
- "Submit Form" marks evaluation for processing
- Report issues (closed restaurant, food poisoning)
- Notification toggle

### Handbook (`/user/handbook`)
- Read-only view of active handbook documents
- Links open in new tab

---

## API Routes Reference

| Method | Route                              | Description                       |
| ------ | ---------------------------------- | --------------------------------- |
| POST   | `/api/user/auth`                   | Register new evaluator            |
| POST   | `/api/user/forgot-password`        | Send password reset email         |
| POST   | `/api/user/reassign-requests`      | Submit reassign request           |
| POST   | `/api/user/restaurant-requests`    | Submit restaurant recommendation  |
| GET    | `/api/admin/handbook`              | List handbook documents           |
| POST   | `/api/admin/handbook`              | Create handbook document          |
| PUT    | `/api/admin/handbook`              | Update handbook document          |
| DELETE | `/api/admin/handbook?id={id}`      | Delete handbook document          |
| POST   | `/api/admin/nda`                   | Send NDA or process webhook       |
| GET    | `/api/admin/nda?evaluatorId={id}`  | Check NDA status                  |
| PATCH  | `/api/admin/nda`                   | Health check / API docs           |
| POST   | `/api/admin/notifications`         | Broadcast notification to all     |
| POST   | `/api/admin/notifications/send`    | Send notification to specific user|
| GET    | `/api/admin/tokens`                | Get subscriber count              |
| POST   | `/api/admin/tokens`                | Save FCM token                    |
| DELETE | `/api/admin/tokens`                | Remove FCM token                  |
| POST   | `/api/admin/webhook-zoho`          | Zoho form submission webhook      |
| POST   | `/api/admin/receipt-update`        | Upload receipt image              |
| POST   | `/api/admin/seed`                  | Seed sample data                  |
| GET/POST | `/api/sheets`                    | Google Sheets sync                |

---

## Environment Variables

```bash
# Firebase Client (public — exposed to browser)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
NEXT_PUBLIC_DATABASE_URL=

# Firebase Admin (server-side only)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_DATABASE_URL=

# DocuSign
DOCUSIGN_INTEGRATION_KEY=
DOCUSIGN_USER_ID=
DOCUSIGN_ACCOUNT_ID=
DOCUSIGN_RSA_PRIVATE_KEY=
DOCUSIGN_BASE_PATH=          # https://demo.docusign.net/restapi (sandbox)
DOCUSIGN_OAUTH_BASE_PATH=    # account-d.docusign.com (sandbox)

# Email (Gmail SMTP)
GMAIL_FROM=
GMAIL_APP_PASSWORD=

# Google Sheets
GOOGLE_SHEETS_PRIVATE_KEY=
GOOGLE_SHEETS_CLIENT_EMAIL=
GOOGLE_SHEETS_SPREADSHEET_ID=

# App
NEXT_PUBLIC_APP_URL=          # https://your-domain.com
ADMIN_NOTIFICATION_EMAIL=     # Email for admin notifications
```

---

## Known Quirks & Gotchas

### 1. `specialties` field inconsistency
The evaluator `specialties` field can be `string`, `string[]`, or a Firebase object.
Every place that reads it must handle all three. Search the codebase for `specialties`
to find all handling locations.

### 2. Service worker env vars
`public/sw-process-env.js` is generated and should **not** contain real values in git.
Run `node sw-env-vars.js` before each deployment to inject current env vars.

### 3. Zoho webhook has no auth
The `/api/admin/webhook-zoho` endpoint accepts unauthenticated POST requests.
Consider adding a shared secret validation header.

### 4. DocuSign sandbox vs production
The DocuSign integration uses sandbox URLs by default. When moving to production:
- Change `DOCUSIGN_BASE_PATH` to `https://na1.docusign.net/restapi` (or appropriate region)
- Change `DOCUSIGN_OAUTH_BASE_PATH` to `account.docusign.com`
- Update the integration key in DocuSign admin console

### 5. FCM token stored in two places
The FCM token is saved to both `/fcmTokens/{userId}` and `/evaluators/{userId}/fcmTokens`.
The broadcast notification route reads from `/fcmTokens/`, while the single-user send
reads from `/evaluators/{userId}`. Both must stay in sync.

### 6. Budget page data transformation
The budget page (`admin/budget/page.tsx`) transforms assignment data on the client side.
It creates **two rows per assignment** (one per evaluator slot). The `evaluators.JEVA_FIRST`
and `JEVA_SECOND` keys in the assignment node hold receipt/amount data.

### 7. `sw-process-env.js` checked in with `undefined` values
This is intentional. The file is regenerated at build time. Don't commit real values.

### 8. Firebase client vs admin SDK
- **Client SDK** (`src/lib/firebase.ts`): Used in Client Components, real-time listeners
- **Admin SDK** (`src/lib/firebase-admin.ts`): Used in API routes, Server Components
- Never import the admin SDK in client code

---

## Deployment

The project includes a `Procfile` suggesting Heroku/Railway-style deployment:

```bash
# Build
npm run build

# Generate SW env vars (must happen before or during build)
node sw-env-vars.js

# Start
npm start
```

Ensure all environment variables are set in the deployment platform.
The HTTPS certificate files in `certificates/` are for local development only.