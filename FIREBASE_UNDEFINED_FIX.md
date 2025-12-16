# Firebase Undefined Values Fix

## Issue
Firebase Realtime Database does not allow `undefined` values in data objects. When creating evaluators with optional fields, we were passing `undefined` values which caused the error:

```
Error: set failed: value argument contains undefined in property 'evaluators.JEVA01.maxAssignments'
```

## Root Cause
The original code was setting optional fields to `undefined`:

```typescript
const newEvaluator: Omit<Evaluator, "id"> = {
  name,
  email,
  phone: phone || undefined,          // ❌ Could be undefined
  position: position || undefined,     // ❌ Could be undefined
  company: company || undefined,       // ❌ Could be undefined
  maxAssignments: maxAssignments || undefined,  // ❌ Could be undefined
  ...
};
```

## Solution
Only include properties that have actual values (not `undefined` or `null`):

```typescript
// Build evaluator object with required fields
const newEvaluator: any = {
  name,
  email,
  specialties: specialtiesArray,
  password: hashPassword(generatedPassword),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Only add optional fields if they have values
if (phone) newEvaluator.phone = phone;
if (position) newEvaluator.position = position;
if (company) newEvaluator.company = company;
if (maxAssignments !== undefined && maxAssignments !== null) {
  newEvaluator.maxAssignments = maxAssignments;
}
```

## Changes Made

### POST /api/evaluators (Create)
- Changed from object spread with `|| undefined` to conditional property assignment
- Only adds optional fields if they have truthy values
- Uses explicit checks for `maxAssignments` to allow 0 as a valid value

### PUT /api/evaluators (Update)
- Added null checks alongside undefined checks
- Ensures Firebase `update()` doesn't receive undefined values

## Testing
After this fix:
1. ✅ Can create evaluator without phone/position/company
2. ✅ Can create evaluator with maxAssignments = 0
3. ✅ Can create evaluator with all optional fields
4. ✅ No undefined values stored in Firebase
5. ✅ Update operations work correctly

## Example Data Structure

**With all fields:**
```json
{
  "JEVA01": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "position": "Senior Chef",
    "company": "ABC Restaurant",
    "specialties": ["Italian", "Bakery"],
    "maxAssignments": 5,
    "password": "hashedPassword",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

**With minimal fields (no optional fields):**
```json
{
  "JEVA02": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "specialties": ["Bakery"],
    "password": "hashedPassword",
    "createdAt": "2025-01-15T10:35:00Z",
    "updatedAt": "2025-01-15T10:35:00Z"
  }
}
```

Note: Optional fields (`phone`, `position`, `company`, `maxAssignments`) are completely omitted if not provided, rather than stored as `undefined`.

## Best Practices for Firebase

### ❌ Don't Do This
```typescript
const data = {
  field1: value1,
  field2: value2 || undefined,  // Bad
  field3: undefined,             // Bad
};
```

### ✅ Do This Instead
```typescript
const data: any = {
  field1: value1,
};

if (value2) data.field2 = value2;  // Good
// or
if (value3 !== undefined && value3 !== null) {
  data.field3 = value3;  // Good for numbers that could be 0
}
```

## Related Files
- `src/app/api/evaluators/route.ts` - Fixed POST and PUT handlers
