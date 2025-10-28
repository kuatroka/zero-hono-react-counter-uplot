# Zero Custom Mutators

## ADDED Requirements

### Requirement: Server-Side Mutation Validation

The system SHALL validate all mutations server-side before executing them against the database, preventing invalid or malicious mutations from clients.

#### Scenario: Validate mutation parameters with Zod

- **WHEN** a client sends a mutation request
- **THEN** the server SHALL validate parameters using Zod schemas
- **AND** SHALL reject mutations with invalid parameters
- **AND** SHALL return descriptive error messages for validation failures

#### Scenario: Prevent invalid counter operations

- **WHEN** a client attempts to increment a non-existent counter
- **THEN** the server SHALL validate the counter exists
- **AND** SHALL reject the mutation with error "Counter not found"
- **AND** SHALL NOT modify the database

#### Scenario: Enforce business logic rules

- **WHEN** a mutation violates business logic rules
- **THEN** the server SHALL reject the mutation
- **AND** SHALL return an error describing the rule violation
- **AND** SHALL NOT execute the mutation

### Requirement: Auth-Aware Mutations

The system SHALL enforce authentication and authorization in all mutations, using user context from session cookies that cannot be spoofed by clients.

#### Scenario: Require authentication for mutations

- **WHEN** an unauthenticated client attempts a mutation
- **THEN** the server SHALL reject the mutation
- **AND** SHALL return error "Not authenticated"
- **AND** SHALL NOT execute the mutation

#### Scenario: Enforce user context from session

- **WHEN** a mutation requires user context
- **THEN** the server SHALL extract userId from the session cookie
- **AND** SHALL NOT accept userId from client request body
- **AND** SHALL use the session userId for all permission checks
- **AND** clients SHALL NOT be able to spoof userId

#### Scenario: Enforce ownership permissions

- **WHEN** a user attempts to update another user's message
- **THEN** the server SHALL verify the user owns the message
- **AND** SHALL reject the mutation if ownership check fails
- **AND** SHALL return error "Permission denied"

### Requirement: Custom Mutator Factory

The system SHALL provide a factory function that creates custom mutators with user context, defined in `zero/mutators.ts`.

#### Scenario: Create mutators with user context

- **WHEN** `createMutators(userId)` is called
- **THEN** it SHALL return an object containing all custom mutators
- **AND** each mutator SHALL have access to the userId
- **AND** each mutator SHALL receive a Zero Transaction object
- **AND** mutators SHALL be namespaced by entity (e.g., `counter.increment`)

#### Scenario: Mutators without authentication

- **WHEN** `createMutators(undefined)` is called
- **THEN** it SHALL return mutators that reject authenticated operations
- **AND** SHALL allow public operations (if any)
- **AND** SHALL throw "Not authenticated" for protected operations

### Requirement: Counter Mutators

The system SHALL provide custom mutators for counter operations that validate and enforce business logic.

#### Scenario: Increment counter

- **WHEN** a client calls `z.mutate.counter.increment()`
- **THEN** the server SHALL verify the user is authenticated
- **AND** SHALL verify the counter exists
- **AND** SHALL increment the counter value by 1
- **AND** SHALL persist the change to the database
- **AND** SHALL sync the change to all connected clients

#### Scenario: Decrement counter

- **WHEN** a client calls `z.mutate.counter.decrement()`
- **THEN** the server SHALL verify the user is authenticated
- **AND** SHALL verify the counter exists
- **AND** SHALL decrement the counter value by 1
- **AND** SHALL persist the change to the database
- **AND** SHALL sync the change to all connected clients

#### Scenario: Counter not found error

- **WHEN** a counter operation targets a non-existent counter
- **THEN** the server SHALL throw error "Counter not found"
- **AND** SHALL NOT create a new counter
- **AND** SHALL NOT modify any database records

### Requirement: Message Mutators

The system SHALL provide custom mutators for message operations with validation and permission enforcement when message functionality is enabled.

#### Scenario: Create message with validation

- **WHEN** a client calls `z.mutate.message.create({ body, labels, mediumId })`
- **THEN** the server SHALL validate the message body is not empty
- **AND** SHALL validate labels is an array (if provided)
- **AND** SHALL validate mediumId exists
- **AND** SHALL set senderId to the authenticated user's ID
- **AND** SHALL set timestamp to current server time
- **AND** SHALL insert the message into the database

#### Scenario: Update own message

- **WHEN** a user updates their own message
- **THEN** the server SHALL verify the user owns the message
- **AND** SHALL allow the update
- **AND** SHALL persist the changes

#### Scenario: Prevent updating other user's message

- **WHEN** a user attempts to update another user's message
- **THEN** the server SHALL verify ownership
- **AND** SHALL reject the mutation with "Permission denied"
- **AND** SHALL NOT modify the message

#### Scenario: Delete message with authentication

- **WHEN** an authenticated user deletes a message
- **THEN** the server SHALL verify the user is authenticated
- **AND** SHALL allow the deletion (per current permissions)
- **AND** SHALL remove the message from the database

### Requirement: Transaction Support

The system SHALL execute all mutations within Zero transactions to ensure atomicity and consistency.

#### Scenario: Atomic mutation execution

- **WHEN** a mutator executes multiple database operations
- **THEN** all operations SHALL execute within a single transaction
- **AND** if any operation fails, all operations SHALL be rolled back
- **AND** the database SHALL remain in a consistent state

#### Scenario: Query within transaction

- **WHEN** a mutator needs to read data before writing
- **THEN** it SHALL use `tx.query` to read within the transaction
- **AND** reads SHALL see uncommitted writes from the same transaction
- **AND** reads SHALL be isolated from other transactions

#### Scenario: Mutate within transaction

- **WHEN** a mutator writes data
- **THEN** it SHALL use `tx.mutate` to write within the transaction
- **AND** writes SHALL be atomic with other operations in the transaction
- **AND** writes SHALL be committed or rolled back together

### Requirement: Error Handling

The system SHALL provide descriptive error messages for mutation failures and handle errors gracefully.

#### Scenario: Validation error messages

- **WHEN** a mutation fails validation
- **THEN** the error message SHALL describe what validation failed
- **AND** SHALL include the invalid value (if safe to expose)
- **AND** SHALL suggest how to fix the issue

#### Scenario: Authentication error messages

- **WHEN** a mutation fails authentication
- **THEN** the error message SHALL be "Not authenticated"
- **AND** SHALL NOT expose sensitive information
- **AND** SHALL include HTTP status 401

#### Scenario: Permission error messages

- **WHEN** a mutation fails authorization
- **THEN** the error message SHALL be "Permission denied"
- **AND** SHALL NOT expose why permission was denied (security)
- **AND** SHALL include HTTP status 403

#### Scenario: Database error handling

- **WHEN** a mutation fails due to database error
- **THEN** the error SHALL be caught and logged
- **AND** a generic error message SHALL be returned to client
- **AND** sensitive database details SHALL NOT be exposed

### Requirement: Client-Side Mutator Usage

The system SHALL allow clients to call custom mutators through the Zero client API with simple method calls.

#### Scenario: Call mutator from client

- **WHEN** a client component calls `await z.mutate.counter.increment()`
- **THEN** Zero SHALL send the mutation request to the server
- **AND** the server SHALL execute the custom mutator
- **AND** the result SHALL be synced back to the client
- **AND** the client SHALL receive the updated data

#### Scenario: Handle mutator errors on client

- **WHEN** a mutator throws an error
- **THEN** the client SHALL receive the error
- **AND** SHALL be able to catch it with try/catch
- **AND** SHALL display the error message to the user

#### Scenario: Optimistic updates (optional)

- **WHEN** a client calls a mutator
- **THEN** Zero MAY apply an optimistic update immediately
- **AND** SHALL revert the update if the server rejects the mutation
- **AND** SHALL apply the server's response when received

### Requirement: Mutator Location Detection

The system SHALL allow mutators to detect whether they are executing on client or server for conditional logic.

#### Scenario: Server-side timestamp generation

- **WHEN** a mutator creates a record with a timestamp
- **AND** `tx.location === 'server'`
- **THEN** the mutator SHALL use the current server time
- **AND** SHALL NOT trust client-provided timestamps

#### Scenario: Client-side optimistic timestamp

- **WHEN** a mutator creates a record with a timestamp
- **AND** `tx.location === 'client'`
- **THEN** the mutator MAY use a client-provided timestamp for optimistic UI
- **AND** the server SHALL override with server time when processing

### Requirement: No Direct Client Mutations

The system SHALL NOT allow clients to directly mutate data without going through custom mutators for protected operations.

#### Scenario: Prevent direct counter updates

- **WHEN** a client attempts `z.mutate.counter.update({ id: 'main', value: 999 })`
- **THEN** the server SHALL reject the mutation
- **AND** SHALL require using `z.mutate.counter.increment()` or `decrement()`
- **AND** SHALL NOT allow arbitrary value changes

#### Scenario: Enforce mutator usage

- **WHEN** a protected table has custom mutators
- **THEN** clients SHALL use the custom mutators
- **AND** SHALL NOT use direct `insert`, `update`, or `delete` operations
- **AND** the server SHALL enforce this restriction
