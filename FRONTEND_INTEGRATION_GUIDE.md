# Frontend Integration Guide - Restaurant Assignment System

Panduan lengkap untuk frontend developer mengintegrasikan dengan backend API.

## 📦 Components Yang Sudah Dibuat

### 1. **AssignmentList.tsx**

Component untuk display semua assignment dengan detail evaluator dan establishment.

```typescript
import AssignmentList from "@/components/AssignmentList";

// Use in your page
<AssignmentList />
```

### 2. **EvaluatorList.tsx**

Component untuk display semua evaluator dengan specialties mereka.

```typescript
import EvaluatorList from "@/components/EvaluatorList";

<EvaluatorList />
```

### 3. **EstablishmentList.tsx**

Component untuk display semua restaurant, grouped by category.

```typescript
import EstablishmentList from "@/components/EstablishmentList";

<EstablishmentList />
```

### 4. **AdminDashboard.tsx**

Admin panel untuk seed database, auto-assign, dan manage data.

```typescript
import AdminDashboard from "@/components/AdminDashboard";

<AdminDashboard />
```

---

## 🔌 API Endpoints Reference

### **Fetch Data (GET)**

#### Get All Evaluators

```typescript
const response = await fetch("/api/evaluators");
const data = await response.json();
// Returns: { evaluators: Evaluator[], count: number }
```

#### Get All Establishments

```typescript
const response = await fetch("/api/establishments");
const data = await response.json();
// Returns: { establishments: Establishment[], count: number }
```

#### Get All Assignments (with details)

```typescript
const response = await fetch("/api/assignments?includeDetails=true");
const data = await response.json();
// Returns: { assignments: AssignmentWithDetails[], count: number }
```

#### Get Assignments by Establishment

```typescript
const response = await fetch(
  `/api/assignments?establishmentId=${id}&includeDetails=true`
);
const data = await response.json();
```

#### Get Assignments by Evaluator

```typescript
const response = await fetch(
  `/api/assignments?evaluatorId=${id}&includeDetails=true`
);
const data = await response.json();
```

#### Get Statistics

```typescript
const response = await fetch("/api/assignments/auto-assign");
const data = await response.json();
// Returns: { statistics: {...}, evaluatorStats: [...], ... }
```

---

### **Create Data (POST)**

#### Create New Evaluator

```typescript
const response = await fetch("/api/evaluators", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "New Evaluator",
    specialties: ["Bakery", "Italy"],
    maxAssignments: 20, // optional
  }),
});
const data = await response.json();
```

#### Create New Establishment

```typescript
const response = await fetch("/api/establishments", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "New Restaurant",
    category: "Bakery", // or "Italy" or "FastFood"
    address: "123 Street", // optional
  }),
});
const data = await response.json();
```

#### Create Assignment (Auto-match evaluators)

```typescript
const response = await fetch("/api/assignments", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    establishmentId: "establishment-id-here",
  }),
});
const data = await response.json();
// System will automatically pick 2 best evaluators
```

#### Create Assignment (Manual evaluators)

```typescript
const response = await fetch("/api/assignments", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    establishmentId: "establishment-id-here",
    evaluator1Id: "evaluator-1-id",
    evaluator2Id: "evaluator-2-id",
  }),
});
const data = await response.json();
```

---

### **Update Data (PUT)**

#### Update Evaluator

```typescript
const response = await fetch("/api/evaluators", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    id: "evaluator-id",
    name: "Updated Name",
    specialties: ["Bakery", "Italy", "FastFood"],
  }),
});
```

#### Update Establishment

```typescript
const response = await fetch("/api/establishments", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    id: "establishment-id",
    name: "Updated Name",
    category: "Italy",
  }),
});
```

#### Update Assignment Status

```typescript
const response = await fetch("/api/assignments", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    id: "assignment-id",
    status: "in-progress", // or "completed"
    notes: "Optional notes here",
  }),
});
```

---

### **Delete Data (DELETE)**

#### Delete Evaluator

```typescript
const response = await fetch(`/api/evaluators?id=${evaluatorId}`, {
  method: "DELETE",
});
```

#### Delete Establishment

```typescript
const response = await fetch(`/api/establishments?id=${establishmentId}`, {
  method: "DELETE",
});
```

#### Delete Assignment

```typescript
const response = await fetch(`/api/assignments?id=${assignmentId}`, {
  method: "DELETE",
});
```

---

### **Admin Operations**

#### Seed Database

```typescript
const response = await fetch("/api/seed", { method: "POST" });
const data = await response.json();
// Populates with sample data
```

#### Auto-Assign All Establishments

```typescript
const response = await fetch("/api/assignments/auto-assign", {
  method: "POST",
});
const data = await response.json();
// Automatically assigns all unassigned establishments
```

#### Clear Database

```typescript
const response = await fetch("/api/seed", { method: "DELETE" });
const data = await response.json();
// Clears all data
```

---

## 📊 TypeScript Types

Semua types sudah ada di `src/types/restaurant.ts`:

```typescript
import {
  Evaluator,
  Establishment,
  Assignment,
  AssignmentWithDetails,
} from "@/types/restaurant";
```

### Type Definitions:

```typescript
interface Evaluator {
  id: string;
  name: string;
  specialties: string[];
  maxAssignments?: number;
  createdAt: string;
  updatedAt: string;
}

interface Establishment {
  id: string;
  name: string;
  category: string; // "Bakery" | "Italy" | "FastFood"
  address?: string;
  createdAt: string;
  updatedAt: string;
}

interface Assignment {
  id: string;
  establishmentId: string;
  evaluator1Id: string;
  evaluator2Id: string;
  status: "pending" | "in-progress" | "completed";
  assignedAt: string;
  completedAt?: string;
  notes?: string;
}

interface AssignmentWithDetails extends Assignment {
  establishment: Establishment;
  evaluator1: Evaluator;
  evaluator2: Evaluator;
}
```

---

## 🎯 Common Use Cases

### 1. Display Assignments for Specific Restaurant

```typescript
async function getRestaurantAssignment(establishmentId: string) {
  const response = await fetch(
    `/api/assignments?establishmentId=${establishmentId}&includeDetails=true`
  );
  const data = await response.json();
  return data.assignments[0]; // Will return single assignment
}
```

### 2. Display All Assignments for Evaluator

```typescript
async function getEvaluatorAssignments(evaluatorId: string) {
  const response = await fetch(
    `/api/assignments?evaluatorId=${evaluatorId}&includeDetails=true`
  );
  const data = await response.json();
  return data.assignments;
}
```

### 3. Filter Establishments by Category

```typescript
async function getEstablishmentsByCategory(category: string) {
  const response = await fetch(`/api/establishments?category=${category}`);
  const data = await response.json();
  return data.establishments;
}
```

### 4. Create Form Component

```typescript
"use client";

import { useState } from "react";
import { TextField, Button, Box } from "@mui/material";

export default function CreateEstablishmentForm() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/establishments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category })
    });

    if (response.ok) {
      alert('Restaurant created!');
      setName('');
      setCategory('');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        label="Restaurant Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button type="submit" variant="contained">
        Create Restaurant
      </Button>
    </Box>
  );
}
```

---

## 🚨 Error Handling

Semua API akan return error dalam format:

```json
{
  "error": "Error message here"
}
```

Best practice error handling:

```typescript
try {
  const response = await fetch("/api/evaluators");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  // Use data here
} catch (error) {
  console.error(error);
  // Show error to user
}
```

---

## 🔄 Real-time Updates (Optional)

Jika ingin real-time updates, bisa polling atau pakai Firebase Realtime Database listener:

```typescript
import { db } from "@/lib/firebase-admin";

// Server-side only
const ref = db.ref("assignments");
ref.on("value", (snapshot) => {
  const data = snapshot.val();
  // Update UI
});
```

---

## 📱 Example Page Layout

```typescript
// app/admin/page.tsx
import AdminDashboard from "@/components/AdminDashboard";
import AssignmentList from "@/components/AssignmentList";
import EvaluatorList from "@/components/EvaluatorList";
import EstablishmentList from "@/components/EstablishmentList";
import { Box, Tabs, Tab } from "@mui/material";

export default function AdminPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Tabs value={tab} onChange={(e, v) => setTab(v)}>
        <Tab label="Dashboard" />
        <Tab label="Assignments" />
        <Tab label="Evaluators" />
        <Tab label="Restaurants" />
      </Tabs>

      {tab === 0 && <AdminDashboard />}
      {tab === 1 && <AssignmentList />}
      {tab === 2 && <EvaluatorList />}
      {tab === 3 && <EstablishmentList />}
    </Box>
  );
}
```

---

## ✅ Testing Frontend Integration

1. **Start dev server**: `npm run dev`
2. **Import component**: Import any component dari `/components`
3. **Test API calls**: Use browser DevTools Network tab
4. **Check Firebase Console**: Verify data in Realtime Database

---

## 🎯 Next Steps untuk Frontend Dev:

1. ✅ Import components yang sudah dibuat
2. ✅ Customize styling sesuai design
3. ✅ Add form validation
4. ✅ Add loading states
5. ✅ Add error messages
6. ✅ Add pagination (jika data banyak)
7. ✅ Add search/filter functionality
8. ✅ Add authentication (jika perlu)

Semua backend logic sudah selesai dan tested. Frontend tinggal consume API! 🚀
