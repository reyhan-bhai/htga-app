# HTGA - HalalTrip Gastronomy Award Evaluator App

## 📱 Overview

Aplikasi HTGA (HalalTrip Gastronomy Award) adalah aplikasi Progressive Web App (PWA) untuk evaluator dalam menilai dan mengevaluasi restoran-restoran yang terdaftar dalam program HalalTrip Gastronomy Award.

## 🎨 Design System

### Color Palette

**Solid Colors:**
- Black: `#1B1B1B`
- Grey: `#939393`
- White: `#FFFDFA`
- Light Grey: `#F4F4F4`
- Red: `#D62C2C`
- Orange: `#FFA200`
- Light Orange: `#FFEDCC`

**Gradients:**
- Gradient 1: `#FFA200` → `#D7302B`
- Gradient 2: `#FFA200` → `#FF6B00`

**Background:**
- Cream: `#FFF4E6`

## 🗂️ Project Structure

```
src/
├── app/
│   └── htga/                    # HTGA Routes (App Router)
│       ├── layout.tsx           # HTGA Layout with AuthProvider
│       ├── page.tsx             # Redirect to login
│       ├── login/
│       │   └── page.tsx         # Login Page
│       ├── nda/
│       │   └── page.tsx         # NDA Signature Page
│       ├── restaurants/
│       │   └── page.tsx         # Restaurant List Page
│       ├── dashboard/
│       │   └── page.tsx         # Dashboard/Evaluation Page
│       └── profile/
│           └── page.tsx         # Profile Page
│
└── htga-app/                    # HTGA Shared Resources
    ├── context/
    │   └── AuthContext.tsx      # Authentication Context
    ├── data/
    │   └── dummyData.ts         # Dummy Data (8 restaurants)
    ├── types/
    │   └── index.ts             # TypeScript Types
    └── styles/
        └── htga.css             # HTGA Custom Styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm atau yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Access HTGA App

Open browser and navigate to:
```
http://localhost:8080/htga
```

Atau langsung ke login:
```
http://localhost:8080/htga/login
```

## 🔐 Login Credentials (Dummy)

```
Username: evaluator
Password: 123456
```

## 📄 Pages & Features

### 1. Login Page (`/htga/login`)
- **Features:**
  - Username & password input
  - Show/hide password toggle
  - Remember me checkbox
  - Social login icons (Google, Facebook, LinkedIn) - static
  - Orange gradient background
  - Form validation

### 2. NDA Signature Page (`/htga/nda`)
- **Features:**
  - NDA document display (scrollable)
  - Canvas signature drawing (mouse & touch support)
  - Clear signature button
  - Terms & conditions checkbox
  - Warning banner (3 days left)
  - Signature validation before proceeding

### 3. Restaurant List Page (`/htga/restaurants`)
- **Features:**
  - Display 8 dummy restaurants
  - Restaurant selection buttons with orange styling
  - Download guide button
  - Next button to proceed to dashboard
  - Header with notification bell and profile avatar

### 4. Dashboard Page (`/htga/dashboard`)
- **Features:**
  - Good morning greeting with user name
  - Add new restaurant button
  - Evaluation category filters (All, Concept, Ethnic, Specialty)
  - Evaluation progress card showing completion status
  - Due evaluation alert banner
  - Filter and sort options
  - Evaluation task list with:
    - Restaurant name and location
    - Category badge
    - Due date
    - Status badge (Completed/Continue/Start)
    - Color-coded left border

### 5. Profile Page (`/htga/profile`)
- **Features:**
  - Large profile avatar with gradient background
  - User information display (name, username, role)
  - Edit profile button
  - Back button to dashboard
  - Notification bell icon

## 🎯 User Flow

```
1. Login (/htga/login)
   ↓
2. NDA Signature (/htga/nda)
   ↓
3. Restaurant List (/htga/restaurants)
   ↓
4. Dashboard (/htga/dashboard)
   ↓
5. Profile (/htga/profile) - accessible from dashboard
```

## 📊 Dummy Data

### Establishments (Restaurants)
- Total: 8 restaurants
- Categories: Concept, Ethnic, Specialty
- Each restaurant includes:
  - Name, address, contact
  - Rating, budget, halal status
  - Completion status (Completed/Continue/Start)
  - Evaluator information
  - Assignment date

### User
- Name: "Evaluator Name"
- Username: "evaluator"
- Role: "evaluator"

## 🔒 Authentication

Authentication menggunakan:
- **Context API** (`AuthContext.tsx`)
- **localStorage** untuk persist login state
- Dummy credentials validation
- Protected routes (redirect if not authenticated)

## 🎨 Styling

### CSS Classes
- `.bg-gradient-1` - Orange to Red gradient
- `.bg-gradient-2` - Orange to Dark Orange gradient
- `.bg-cream` - Cream background
- `.htga-button` - Button with hover effects
- `.htga-card` - Card with shadow and border radius
- `.htga-input` - Input with focus effects
- `.badge-complete` - Green badge for completed status
- `.badge-continue` - Orange badge for continue status
- `.badge-start` - Red badge for start status

### Responsive Design
- Max width: 448px (mobile-first design)
- Centered on larger screens
- Touch-friendly interface

## 🛠️ Technologies Used

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React Context API**
- **HTML5 Canvas** (for signature)
- **localStorage** (for auth persistence)

## 📝 Notes

- Ini adalah **static/dummy implementation** tanpa backend
- Tidak ada API calls atau database integration
- Authentication menggunakan localStorage
- Semua data hardcoded dalam `dummyData.ts`
- Ready untuk integrasi backend di kemudian hari

## 🔜 Next Steps (Integration)

Ketika backend sudah siap:
1. Replace dummy data dengan API calls
2. Implement real authentication (JWT/OAuth)
3. Add real NDA signature upload
4. Connect restaurant evaluation forms
5. Implement real-time updates
6. Add push notifications
7. Pindahkan dari `/htga` ke root aplikasi

## 📧 Contact

Untuk pertanyaan atau issue, silakan hubungi tim development.

---

**Version:** 1.0.0  
**Last Updated:** December 2, 2025
