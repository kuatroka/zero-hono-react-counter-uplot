# Counter Buttons Fix

## Problem
Counter buttons were not working properly:
- First click would change the value (optimistic update)
- Then it would revert to 0
- After that, buttons stopped working entirely

## Root Cause
The issue was caused by **incorrect configuration for legacy CRUD mutators**:

1. **Permissions Format**: The permissions for the `counters` table were using the wrong format. Zero requires `preMutation` and `postMutation` to be explicitly defined for update operations.

2. **Unnecessary Mutate Endpoint**: Legacy CRUD mutators (like `z.mutate.counters.update()`) are handled **directly by zero-cache** against the database using Zero's built-in permissions system. They do NOT need a custom mutate endpoint or PushProcessor.

## Solution

### 1. Fixed Permissions Format
Updated `src/schema.ts` to use the correct permissions format:

```typescript
counters: {
  row: {
    select: ANYONE_CAN,
    update: {
      preMutation: ANYONE_CAN,  // ✅ Required
      postMutation: ANYONE_CAN, // ✅ Required
    },
  },
},
```

**Before** (incorrect):
```typescript
counters: {
  row: {
    select: ANYONE_CAN,
    update: ANYONE_CAN,  // ❌ Wrong format
  },
},
```

### 2. Removed Unnecessary Configuration
Removed `ZERO_MUTATE_URL` from `.env` because:
- Legacy CRUD mutators don't use custom mutate endpoints
- They're processed directly by zero-cache using the permissions system
- The mutate endpoint is only needed for **custom mutators** (not legacy CRUD)

## How It Works Now

1. **Client** calls `z.mutate.counters.update({ id, value })`
2. **Optimistic update** happens immediately on the client
3. **zero-cache** receives the mutation and applies it directly to the database
4. **Permissions** are checked using the `definePermissions` rules in `schema.ts`
5. **Database** is updated if permissions allow
6. **Changes replicate** back to all connected clients

## Testing
After restarting the dev server:
```bash
bun run dev
```

The counter buttons should now:
- ✅ Increment/decrement the counter value
- ✅ Persist changes to the database
- ✅ Update the UI reactively
- ✅ Work consistently on every click

## Key Learnings

### Legacy CRUD Mutators vs Custom Mutators

**Legacy CRUD Mutators** (what we're using):
- Auto-generated: `z.mutate.<table>.insert/update/delete()`
- Handled by zero-cache directly
- Use `definePermissions` for authorization
- No server endpoint needed
- Being deprecated in favor of custom mutators

**Custom Mutators** (recommended for new code):
- Defined explicitly with `createMutators()`
- Require a server push endpoint with `PushProcessor`
- Need `ZERO_MUTATE_URL` configured
- Allow arbitrary server-side logic
- More flexible for complex operations

## Files Changed
- `src/schema.ts` - Fixed permissions format
- `.env` - Removed `ZERO_MUTATE_URL`

## Files Created (Can be Removed)
These files were created during troubleshooting but are not needed for legacy CRUD mutators:
- `api/routes/zero/mutate.ts` - Only needed for custom mutators
- `docs/COUNTER-FIX.md` - Superseded by this document

## References
- [Zero Permissions Documentation](https://zero.rocicorp.dev/docs/permissions)
- [Zero Writing Data (Legacy CRUD)](https://zero.rocicorp.dev/docs/writing-data)
- [Zero Custom Mutators](https://zero.rocicorp.dev/docs/custom-mutators) - For future migration
