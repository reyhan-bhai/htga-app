# Assignment Algorithm Implementation

## Firebase Structure

### What is STORED in Firebase:
```
assignments/
  {assignmentId}/
    establishmentId: string          // Reference to establishment
    evaluator1Id: string              // Reference to evaluator 1
    evaluator2Id: string              // Reference to evaluator 2
    status: "pending" | "in-progress" | "completed"
    assignedAt: string (ISO timestamp)
    completedAt: string (ISO timestamp, optional)
    notes: string (optional)
```

### What is RETRIEVED Dynamically (NOT stored in assignments):
- **Evaluator details** (name, email, phone, specialty) → Retrieved from `evaluators/{evaluatorId}`
- **Restaurant details** (name, category) → Retrieved from `establishments/{establishmentId}`
- **NDA status** → Retrieved from evaluator record (`evaluators/{evaluatorId}/ndaStatus`)
- **Progress/completion** → Calculated from assignment status

### Why This Structure?
1. **No data duplication** - If an evaluator's email changes, you only update one place
2. **Single source of truth** - All details come from the original records
3. **Smaller storage** - Only relationship IDs are stored
4. **Easy queries** - Can filter assignments by evaluatorId, establishmentId, status
5. **Flexible** - Can add new evaluator/restaurant fields without touching assignments

---

## Assignment Algorithm Rules

### Rule 1: Each Restaurant = 2 Evaluators
- Every restaurant must be assigned exactly 2 evaluators
- The 2 evaluators must have the restaurant's category in their specialties
- Cannot assign the same evaluator twice to one restaurant

### Rule 2: Each Evaluator = Multiple Restaurants
- An evaluator can be assigned to unlimited restaurants
- Limited only by their specialties (must match restaurant category)

### Rule 3: Specialty Matching (ENFORCED)
- ✅ **Restaurant Category** = `"Italian"`
- ✅ **Evaluator Specialties** = `["Italian", "FastFood"]` → **MATCH**
- ❌ **Evaluator Specialties** = `["Bakery", "FastFood"]` → **NO MATCH**

---

## Implementation Details

### 1. Match Evaluator (Auto-Assignment)
**Button**: "Match Evaluator"

**Algorithm**:
```typescript
1. Find all unassigned restaurants
2. For each restaurant:
   a. Get all evaluators with matching specialty
   b. Count current assignments per evaluator
   c. Sort evaluators by least assignments first
   d. Select top 2 evaluators
   e. Create assignment record
3. Show success/failure summary
```

**API Call**: `POST /api/assignments`
```json
{
  "establishmentId": "rest_123"
  // API auto-selects evaluator1Id and evaluator2Id
}
```

---

### 2. Manual Match
**Button**: "Manual Match"

**Algorithm**:
```typescript
1. Admin selects an evaluator from dropdown
2. Admin selects a restaurant from dropdown
3. System validates:
   a. Evaluator specialty matches restaurant category ✅
   b. Restaurant doesn't already have 2 evaluators ✅
   c. Evaluator not already assigned to this restaurant ✅
4. If validated:
   a. API auto-selects the 2nd evaluator
   b. Create assignment with both evaluators
```

**API Call**: `POST /api/assignments`
```json
{
  "establishmentId": "rest_123",
  "evaluator1Id": "eval_456"
  // API auto-selects evaluator2Id
}
```

**Validation Messages**:
- ❌ "Specialty Mismatch" - Evaluator doesn't have required specialty
- ❌ "Maximum Evaluators Reached" - Restaurant already has 2 evaluators
- ❌ "Already Assigned" - Evaluator already assigned to this restaurant
- ✅ "Assignment Created" - Success

---

## Admin Views

### Evaluator View
Shows all evaluators with their assignment details:

| Column | Data Source | Description |
|--------|-------------|-------------|
| Name | `evaluators/{id}/name` | Evaluator name |
| Email | `evaluators/{id}/email` | Contact email |
| Phone | `evaluators/{id}/phone` | Contact phone |
| Specialty | `evaluators/{id}/specialties` | Comma-separated list |
| NDA Status | `evaluators/{id}/ndaStatus` | Signed/Pending/Not Sent |
| Total Rest. | Calculated | Count of assignments |
| Completed | Calculated | Count of completed assignments |

**Calculation Logic**:
```typescript
// Count assignments for evaluator
const assignments = assignments.filter(
  a => a.evaluator1Id === evaluatorId || a.evaluator2Id === evaluatorId
);

const total = assignments.length;
const completed = assignments.filter(a => a.status === "completed").length;
```

---

### Restaurant View
Shows all restaurants with their assignment details:

| Column | Data Source | Description |
|--------|-------------|-------------|
| Name | `establishments/{id}/name` | Restaurant name |
| Category | `establishments/{id}/category` | Category |
| Matched | Calculated | Yes/Partial/No |
| Date Assigned | `assignments/{id}/assignedAt` | Assignment date |
| Evaluator 1 | `evaluators/{eval1Id}/name` | First evaluator |
| Evaluator 2 | `evaluators/{eval2Id}/name` | Second evaluator |
| Eva 1 Progress | `assignments/{id}/status` | Yes/No completion |
| Eva 2 Progress | `assignments/{id}/status` | Yes/No completion |

**Match Status Logic**:
```typescript
if (no assignment) return "No";
if (assignment exists) return "Yes";
// Future: if only 1 evaluator assigned return "Partial";
```

---

## API Endpoints Used

### GET /api/assignments
```typescript
// Get all assignments with evaluator/restaurant details
GET /api/assignments?includeDetails=true

// Response:
{
  assignments: [{
    id: string,
    establishmentId: string,
    evaluator1Id: string,
    evaluator2Id: string,
    status: string,
    assignedAt: string,
    establishment: { id, name, category, ... },
    evaluator1: { id, name, email, specialties, ... },
    evaluator2: { id, name, email, specialties, ... }
  }],
  count: number
}
```

### POST /api/assignments
```typescript
// Auto-assign (both evaluators)
POST /api/assignments
{ establishmentId: "rest_123" }

// Manual assign (specify 1st evaluator)
POST /api/assignments
{ 
  establishmentId: "rest_123",
  evaluator1Id: "eval_456"
}

// Response:
{
  message: "Assignment created successfully",
  assignment: { /* full details */ }
}
```

### PUT /api/assignments
```typescript
// Update assignment status
PUT /api/assignments
{
  id: "assignment_123",
  status: "completed",
  notes: "Optional notes"
}
```

### DELETE /api/assignments
```typescript
// Delete assignment
DELETE /api/assignments?id=assignment_123
```

---

## Why No API in lib/ Folder?

You're right! We don't need to create API helpers in `lib/` because:

1. **Direct API Calls** - Next.js route handlers (`route.ts`) already provide clean APIs
2. **Simpler Architecture** - Frontend directly calls `/api/assignments` 
3. **No Duplication** - No need to wrap API calls in another layer
4. **Standard Next.js Pattern** - This is the recommended Next.js 13+ App Router pattern

The `route.ts` files ARE your API layer. They handle:
- ✅ Data validation
- ✅ Firebase operations
- ✅ Business logic (matching algorithm)
- ✅ Error handling
- ✅ Response formatting

---

## Testing the Implementation

### Test Auto-Assignment:
1. Add evaluators with specialties matching restaurant categories
2. Add restaurants with categories
3. Click "Match Evaluator" button
4. Check Firebase `assignments/` to see new records
5. Verify both evaluators have matching specialties

### Test Manual Assignment:
1. Click "Manual Match" button
2. Select an evaluator
3. Select a restaurant
4. Verify specialty matching validation
5. Check Firebase `assignments/` for new record

### Test Views:
1. **Evaluator View** - Shows all evaluators with assignment counts
2. **Restaurant View** - Shows all restaurants with assignment status
3. Verify stats update correctly

---

## Future Enhancements

1. **NDA Status Integration**
   - Add `ndaStatus` field to evaluator records
   - Track NDA email sending
   - Show real NDA status in evaluator view

2. **Partial Matching**
   - Allow restaurants with only 1 evaluator assigned
   - Show "Partial" match status

3. **Assignment Limits**
   - Add `maxAssignments` to evaluator records
   - Enforce max assignment limits per evaluator

4. **Reassignment**
   - Allow changing evaluators for a restaurant
   - Use `forceReassign: true` parameter

5. **Bulk Operations**
   - Assign multiple restaurants at once
   - Import assignments from CSV
