# zero-custom-mutators Specification Delta

## REMOVED Requirements

### Requirement: Server-Side Mutation Validation

**Reason**: Custom mutators are being replaced by simple TanStack Query mutations with API endpoints. The app has minimal mutations (counter updates) that don't require the Zero mutator pattern.

**Migration**: Use `useMutation()` from TanStack Query with standard POST/PUT/DELETE API endpoints.

### Requirement: Auth-Aware Mutations

**Reason**: Authentication for mutations will be handled by standard API middleware (JWT validation in Hono).

**Migration**: Include auth token in API request headers; Hono middleware validates.

### Requirement: Custom Mutator Factory

**Reason**: Not needed; standard TanStack Query mutation pattern is sufficient.

**Migration**: Define mutations inline or create simple mutation helper functions.

### Requirement: Counter Mutators

**Reason**: Counter increment/decrement will use simple API endpoints with TanStack Query mutations.

**Migration**: 
```typescript
const mutation = useMutation({
  mutationFn: (delta: number) => fetch('/api/counter', {
    method: 'POST',
    body: JSON.stringify({ delta }),
  }),
  onSuccess: () => queryClient.invalidateQueries(['counter']),
});
```

### Requirement: Message Mutators

**Reason**: Message functionality was the original Zero demo; not actively used.

**Migration**: Remove message-related code or migrate to TanStack Query mutations if needed.

### Requirement: Transaction Support

**Reason**: Atomic operations will be handled by API endpoint implementations.

**Migration**: API endpoints handle transactions server-side.

### Requirement: Error Handling

**Reason**: TanStack Query provides standard error handling for mutations.

**Migration**: Use `onError` callback or `mutation.isError` state.

### Requirement: Client-Side Mutator Usage

**Reason**: Replaced by `useMutation()` from TanStack Query.

**Migration**: Use TanStack Query mutation pattern.

### Requirement: Mutator Location Detection

**Reason**: Server timestamps will be generated in API endpoints.

**Migration**: API endpoints set `created_at`, `updated_at` timestamps.

### Requirement: No Direct Client Mutations

**Reason**: Principle maintained; mutations go through API endpoints.

**Migration**: All mutations via TanStack Query `useMutation()` calling API endpoints.
