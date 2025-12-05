# Restaurant Evaluator Assignment System - API Documentation

Backend system untuk assign evaluator ke restaurant dengan constraint:

- ✅ 2 evaluator per restaurant
- ✅ Evaluator harus punya specialty yang match dengan category restaurant
- ✅ Tidak boleh evaluator yang sama dalam 1 assignment
- ✅ Load balancing: distribute assignments evenly

## 🗄️ Database Structure (Firebase Realtime Database)

```
/evaluators
  /{evaluatorId}
    - name: string
    - specialties: string[] (e.g., ["Bakery", "Italy"])
    - maxAssignments: number (optional)
    - createdAt: ISO string
    - updatedAt: ISO string

/establishments
  /{establishmentId}
    - name: string
    - category: string (e.g., "Bakery", "Italy", "FastFood")
    - address: string (optional)
    - createdAt: ISO string
    - updatedAt: ISO string

/assignments
  /{assignmentId}
    - establishmentId: string
    - evaluator1Id: string
    - evaluator2Id: string
    - status: "pending" | "in-progress" | "completed"
    - assignedAt: ISO string
    - completedAt: ISO string (optional)
    - notes: string (optional)
```

---

## 🚀 Quick Start Testing (No Frontend)

### 1. Seed Database with Sample Data

**Endpoint:** `POST /api/seed`

```bash
# Populate database dengan sample data
curl -X POST http://localhost:8080/api/seed

# Clear existing data dan reseed
curl -X POST "http://localhost:8080/api/seed?clear=true"
```

**Response:**

```json
{
  "message": "Database seeded successfully",
  "stats": {
    "evaluators": 3,
    "establishments": 15
  },
  "evaluatorIds": ["eval1", "eval2", "eval3"],
  "establishmentIds": ["est1", "est2", ...]
}
```

### 2. Check Database Statistics

**Endpoint:** `GET /api/seed`

```bash
curl http://localhost:8080/api/seed
```

**Response:**

```json
{
  "message": "Database statistics",
  "stats": {
    "evaluators": 3,
    "establishments": 15,
    "assignments": 0
  },
  "isEmpty": false
}
```

### 3. Auto-Assign All Establishments

**Endpoint:** `POST /api/assignments/auto-assign`

```bash
# Auto assign semua establishments ke evaluators
curl -X POST http://localhost:8080/api/assignments/auto-assign

# Clear existing assignments dan assign ulang
curl -X POST "http://localhost:8080/api/assignments/auto-assign?clearExisting=true"
```

**Response:**

```json
{
  "message": "Auto-assignment completed",
  "summary": {
    "totalEstablishments": 15,
    "successfulAssignments": 15,
    "failedAssignments": 0,
    "evaluatorSummary": [
      {
        "name": "Ahmad Bakri",
        "specialties": ["Bakery", "Italy", "FastFood"],
        "assignedCount": 10
      },
      {
        "name": "Maria Rossi",
        "specialties": ["Italy", "FastFood", "Bakery"],
        "assignedCount": 10
      },
      {
        "name": "John Burger",
        "specialties": ["FastFood", "Bakery"],
        "assignedCount": 10
      }
    ],
    "categorySummary": {
      "Bakery": 5,
      "Italy": 5,
      "FastFood": 5
    }
  },
  "assignments": [...],
  "failures": []
}
```

### 4. View Assignment Statistics

**Endpoint:** `GET /api/assignments/auto-assign`

```bash
curl http://localhost:8080/api/assignments/auto-assign
```

**Response:**

```json
{
  "statistics": {
    "totalEvaluators": 3,
    "totalEstablishments": 15,
    "totalAssignments": 15,
    "unassignedEstablishments": 0
  },
  "evaluatorStats": [
    {
      "id": "eval1",
      "name": "Ahmad Bakri",
      "specialties": ["Bakery", "Italy", "FastFood"],
      "assignedCount": 10
    }
  ],
  "unassignedEstablishments": [],
  "violations": [],
  "isValid": true
}
```

---

## 📋 CRUD Operations

### Evaluators

#### Get All Evaluators

```bash
curl http://localhost:8080/api/evaluators
```

#### Get Specific Evaluator

```bash
curl "http://localhost:8080/api/evaluators?id=EVALUATOR_ID"
```

#### Create Evaluator

```bash
curl -X POST http://localhost:8080/api/evaluators \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Evaluator",
    "specialties": ["Bakery", "Italy"],
    "maxAssignments": 20
  }'
```

#### Update Evaluator

```bash
curl -X PUT http://localhost:8080/api/evaluators \
  -H "Content-Type: application/json" \
  -d '{
    "id": "EVALUATOR_ID",
    "name": "Updated Name",
    "specialties": ["Bakery", "Italy", "FastFood"]
  }'
```

#### Delete Evaluator

```bash
curl -X DELETE "http://localhost:8080/api/evaluators?id=EVALUATOR_ID"
```

---

### Establishments

#### Get All Establishments

```bash
curl http://localhost:8080/api/establishments
```

#### Get by Category

```bash
curl "http://localhost:8080/api/establishments?category=Bakery"
```

#### Create Establishment

```bash
curl -X POST http://localhost:8080/api/establishments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Restaurant",
    "category": "Italy",
    "address": "123 Main St"
  }'
```

#### Update Establishment

```bash
curl -X PUT http://localhost:8080/api/establishments \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ESTABLISHMENT_ID",
    "name": "Updated Name",
    "category": "FastFood"
  }'
```

#### Delete Establishment

```bash
curl -X DELETE "http://localhost:8080/api/establishments?id=ESTABLISHMENT_ID"
```

---

### Assignments

#### Get All Assignments

```bash
# Basic
curl http://localhost:8080/api/assignments

# With details (includes evaluator & establishment data)
curl "http://localhost:8080/api/assignments?includeDetails=true"

# Filter by establishment
curl "http://localhost:8080/api/assignments?establishmentId=EST_ID&includeDetails=true"

# Filter by evaluator
curl "http://localhost:8080/api/assignments?evaluatorId=EVAL_ID&includeDetails=true"

# Filter by status
curl "http://localhost:8080/api/assignments?status=pending&includeDetails=true"
```

#### Create Assignment (Auto-Match)

```bash
# Auto-select best 2 evaluators based on specialty and load balancing
curl -X POST http://localhost:8080/api/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "establishmentId": "ESTABLISHMENT_ID"
  }'
```

#### Create Assignment (Manual)

```bash
# Manually specify evaluators
curl -X POST http://localhost:8080/api/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "establishmentId": "ESTABLISHMENT_ID",
    "evaluator1Id": "EVALUATOR_1_ID",
    "evaluator2Id": "EVALUATOR_2_ID"
  }'
```

#### Reassign (Force)

```bash
curl -X POST http://localhost:8080/api/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "establishmentId": "ESTABLISHMENT_ID",
    "forceReassign": true
  }'
```

#### Update Assignment Status

```bash
curl -X PUT http://localhost:8080/api/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ASSIGNMENT_ID",
    "status": "completed",
    "notes": "Evaluation completed successfully"
  }'
```

#### Delete Assignment

```bash
curl -X DELETE "http://localhost:8080/api/assignments?id=ASSIGNMENT_ID"
```

---

## 🧪 Testing Workflow

### Complete Test Flow (Copy-Paste Ready)

```bash
# 1. Start dev server
npm run dev

# 2. Seed database
curl -X POST http://localhost:8080/api/seed

# 3. Verify data seeded
curl http://localhost:8080/api/seed

# 4. Auto-assign all establishments
curl -X POST http://localhost:8080/api/assignments/auto-assign

# 5. Check assignments with details
curl "http://localhost:8080/api/assignments?includeDetails=true"

# 6. Check statistics
curl http://localhost:8080/api/assignments/auto-assign

# 7. Get specific establishment's assignment
curl "http://localhost:8080/api/assignments?establishmentId=EST_ID&includeDetails=true"

# 8. Update assignment status to in-progress
curl -X PUT http://localhost:8080/api/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ASSIGNMENT_ID",
    "status": "in-progress"
  }'

# 9. Complete assignment
curl -X PUT http://localhost:8080/api/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ASSIGNMENT_ID",
    "status": "completed",
    "notes": "All checks passed"
  }'
```

---

## ✅ Validation Rules

### Auto-Assignment Algorithm:

1. **Specialty Matching**: Evaluator must have the establishment's category in their specialties
2. **No Duplicates**: Same evaluator cannot be assigned twice to same establishment
3. **Load Balancing**: Assignments distributed evenly across evaluators
4. **Minimum Requirement**: Need at least 2 evaluators with matching specialty

### Error Scenarios:

- ❌ Not enough evaluators with matching specialty
- ❌ Establishment already assigned (use forceReassign=true)
- ❌ Same evaluator selected twice
- ❌ Evaluator doesn't have matching specialty
- ❌ Evaluator or establishment not found

---

## 📊 Sample Data

### Evaluators:

- **Ahmad Bakri**: Bakery, Italy, FastFood
- **Maria Rossi**: Italy, FastFood, Bakery
- **John Burger**: FastFood, Bakery

### Establishments:

- **Bakery**: Bread Paradise, Golden Croissant, Sweet Pastry, Cake Heaven, Dough Delight
- **Italy**: Pasta Amore, Pizza Napoli, Trattoria Roma, Bella Italia, Venezia Kitchen
- **FastFood**: Quick Burger, Speedy Fries, Fast Bite, Rapid Food, Express Meal

---

## 🔍 Debug Tips

### Check Firebase Realtime Database:

1. Go to Firebase Console
2. Navigate to Realtime Database
3. View data structure at: `https://fcm-demo-a6720-default-rtdb.firebaseio.com/`

### Check Console Logs:

```bash
# Watch logs in terminal where `npm run dev` is running
# Logs will show:
# - ✅ Success operations
# - ❌ Errors
# - 📊 Statistics
# - 🏢 Processing details
```

### Clear All Data:

```bash
curl -X DELETE http://localhost:8080/api/seed
```

---

## 🎯 Expected Results

After running full test flow, you should have:

- ✅ 3 Evaluators created
- ✅ 15 Establishments created
- ✅ 15 Assignments created
- ✅ Each establishment has exactly 2 evaluators
- ✅ Both evaluators have matching specialty
- ✅ No duplicate evaluators in same assignment
- ✅ Assignments evenly distributed (load balanced)

**Load Distribution Example:**

- Ahmad Bakri: 10 assignments (covers all 3 categories)
- Maria Rossi: 10 assignments (covers all 3 categories)
- John Burger: 10 assignments (covers 2 categories)

Total: 30 evaluator slots filled across 15 establishments (15 × 2 = 30)
