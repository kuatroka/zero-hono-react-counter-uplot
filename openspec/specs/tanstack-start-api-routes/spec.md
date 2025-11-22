# tanstack-start-api-routes Specification

## Purpose
TBD - created by archiving change migrate-to-ztunes-architecture. Update Purpose after archive.
## Requirements
### Requirement: File-Based API Routes

The system SHALL use TanStack Start's file-based API routes for server-side endpoints, replacing the Hono API server.

#### Scenario: Create API route file

- **WHEN** a developer creates a file in `app/routes/api/`
- **THEN** it SHALL automatically become an API endpoint
- **AND** the file path SHALL determine the URL path
- **AND** SHALL support dynamic route segments with `$` prefix

#### Scenario: API route exports

- **WHEN** an API route file is created
- **THEN** it SHALL export a Route using `createAPIFileRoute()`
- **AND** SHALL define handlers for HTTP methods (GET, POST, PUT, DELETE)
- **AND** SHALL have access to request and response objects

#### Scenario: Co-located with frontend code

- **WHEN** API routes are defined
- **THEN** they SHALL be in the same repository as frontend code
- **AND** SHALL be in the `app/routes/api/` directory
- **AND** SHALL share types and utilities with frontend code

### Requirement: Zero Mutate API Route

The system SHALL provide an API route at `/api/zero/mutate` that handles Zero mutation requests with server-side validation.

#### Scenario: Handle mutation request

- **WHEN** Zero cache POSTs to `/api/zero/mutate`
- **THEN** the endpoint SHALL parse the mutation request
- **AND** SHALL extract user session from cookies
- **AND** SHALL create mutators with user context
- **AND** SHALL execute the requested mutation
- **AND** SHALL return the result to Zero cache

#### Scenario: Validate mutation parameters

- **WHEN** a mutation request is received
- **THEN** the endpoint SHALL validate parameters with Zod
- **AND** SHALL reject invalid parameters
- **AND** SHALL return descriptive error messages

#### Scenario: Enforce authentication

- **WHEN** a mutation requires authentication
- **THEN** the endpoint SHALL verify the session is valid
- **AND** SHALL extract userId from the session
- **AND** SHALL pass userId to the mutator
- **AND** SHALL reject unauthenticated requests for protected mutations

#### Scenario: Handle mutation errors

- **WHEN** a mutation throws an error
- **THEN** the endpoint SHALL catch the error
- **AND** SHALL log the error for debugging
- **AND** SHALL return an appropriate error response
- **AND** SHALL NOT expose sensitive information

### Requirement: Zero Get-Queries API Route

The system SHALL provide an API route at `/api/zero/get-queries` that handles Zero query requests with validation.

#### Scenario: Handle query request

- **WHEN** Zero cache calls `/api/zero/get-queries`
- **THEN** the endpoint SHALL parse the query request
- **AND** SHALL look up the query definition
- **AND** SHALL validate query parameters with Zod
- **AND** SHALL execute the query against PostgreSQL
- **AND** SHALL return results to Zero cache

#### Scenario: Validate query parameters

- **WHEN** a query request is received
- **THEN** the endpoint SHALL validate parameters with the query's Zod schema
- **AND** SHALL reject invalid parameters
- **AND** SHALL return descriptive error messages

#### Scenario: Extract user context (optional)

- **WHEN** a query needs user context for permissions
- **THEN** the endpoint SHALL extract user session from cookies
- **AND** SHALL use userId for permission checks
- **AND** SHALL filter results based on user permissions

#### Scenario: Handle query errors

- **WHEN** a query fails
- **THEN** the endpoint SHALL catch the error
- **AND** SHALL log the error for debugging
- **AND** SHALL return an appropriate error response
- **AND** SHALL NOT expose sensitive database details

### Requirement: Better Auth API Route

The system SHALL provide an API route at `/api/auth/[...all]` that handles all Better Auth requests.

#### Scenario: Catch-all auth route

- **WHEN** a request is made to `/api/auth/*`
- **THEN** the `[...all]` route SHALL catch all sub-paths
- **AND** SHALL forward the request to Better Auth handler
- **AND** SHALL return Better Auth's response

#### Scenario: Handle GET requests

- **WHEN** a GET request is made to an auth endpoint
- **THEN** the route SHALL call Better Auth handler with the request
- **AND** SHALL return the response (e.g., session data)

#### Scenario: Handle POST requests

- **WHEN** a POST request is made to an auth endpoint
- **THEN** the route SHALL call Better Auth handler with the request
- **AND** SHALL return the response (e.g., login success)

### Requirement: Request and Response Handling

The system SHALL provide access to request and response objects in API routes for reading data and setting headers.

#### Scenario: Read request body

- **WHEN** an API route receives a POST request
- **THEN** it SHALL be able to read the request body
- **AND** SHALL parse JSON automatically
- **AND** SHALL handle parsing errors gracefully

#### Scenario: Read request headers

- **WHEN** an API route needs to read headers
- **THEN** it SHALL access headers from the request object
- **AND** SHALL be able to read cookies
- **AND** SHALL be able to read authorization headers

#### Scenario: Set response headers

- **WHEN** an API route needs to set headers
- **THEN** it SHALL set headers on the response object
- **AND** SHALL be able to set cookies
- **AND** SHALL be able to set CORS headers

#### Scenario: Return JSON response

- **WHEN** an API route returns data
- **THEN** it SHALL return a JSON response
- **AND** SHALL set Content-Type to application/json
- **AND** SHALL serialize data automatically

#### Scenario: Return error response

- **WHEN** an API route encounters an error
- **THEN** it SHALL return an appropriate HTTP status code
- **AND** SHALL include an error message in the response
- **AND** SHALL NOT expose sensitive information

### Requirement: Bun Runtime Support

The system SHALL run TanStack Start API routes using Bun as the runtime, not Node.js.

#### Scenario: Use Bun for API routes

- **WHEN** TanStack Start server is started
- **THEN** it SHALL use Bun as the runtime
- **AND** SHALL NOT require Node.js
- **AND** all API routes SHALL execute in Bun

#### Scenario: Bun-specific APIs

- **WHEN** API routes need Bun-specific features
- **THEN** they SHALL be able to use Bun APIs
- **AND** SHALL have access to Bun's fast file I/O
- **AND** SHALL have access to Bun's built-in SQLite (if needed)

### Requirement: Vinxi Server Framework

The system SHALL use Vinxi as the underlying server framework for TanStack Start, configured for Bun runtime.

#### Scenario: Configure Vinxi for Bun

- **WHEN** TanStack Start is configured
- **THEN** Vinxi SHALL be configured to use Bun
- **AND** SHALL start the server on the configured port
- **AND** SHALL handle routing for both frontend and API routes

#### Scenario: Development server

- **WHEN** the development server is started
- **THEN** Vinxi SHALL provide hot module replacement
- **AND** SHALL reload API routes on changes
- **AND** SHALL provide error overlays for debugging

#### Scenario: Production build

- **WHEN** the application is built for production
- **THEN** Vinxi SHALL bundle API routes
- **AND** SHALL optimize for production
- **AND** SHALL generate a production server

### Requirement: Type Safety

The system SHALL provide full type safety for API routes with TypeScript inference.

#### Scenario: Type-safe request parameters

- **WHEN** an API route accesses request parameters
- **THEN** TypeScript SHALL infer parameter types
- **AND** SHALL provide autocomplete for parameter names
- **AND** SHALL produce errors for invalid parameter access

#### Scenario: Type-safe response data

- **WHEN** an API route returns data
- **THEN** TypeScript SHALL validate the return type
- **AND** SHALL ensure response data matches expected type
- **AND** SHALL produce errors for type mismatches

#### Scenario: Shared types between client and server

- **WHEN** types are defined for API requests/responses
- **THEN** they SHALL be shared between client and server
- **AND** SHALL be imported from a common location
- **AND** SHALL ensure client and server stay in sync

### Requirement: Error Handling

The system SHALL handle errors in API routes gracefully with appropriate status codes and messages.

#### Scenario: Validation error response

- **WHEN** an API route receives invalid data
- **THEN** it SHALL return HTTP 400 Bad Request
- **AND** SHALL include validation error details
- **AND** SHALL NOT execute the operation

#### Scenario: Authentication error response

- **WHEN** an API route requires authentication and user is not authenticated
- **THEN** it SHALL return HTTP 401 Unauthorized
- **AND** SHALL include error message "Not authenticated"
- **AND** SHALL NOT execute the operation

#### Scenario: Authorization error response

- **WHEN** an API route requires authorization and user lacks permission
- **THEN** it SHALL return HTTP 403 Forbidden
- **AND** SHALL include error message "Permission denied"
- **AND** SHALL NOT execute the operation

#### Scenario: Not found error response

- **WHEN** an API route is called for a non-existent resource
- **THEN** it SHALL return HTTP 404 Not Found
- **AND** SHALL include error message describing what was not found

#### Scenario: Server error response

- **WHEN** an API route encounters an unexpected error
- **THEN** it SHALL return HTTP 500 Internal Server Error
- **AND** SHALL log the error for debugging
- **AND** SHALL return a generic error message to the client
- **AND** SHALL NOT expose sensitive information

### Requirement: CORS Configuration

The system SHALL configure CORS headers for API routes to allow requests from the frontend application.

#### Scenario: Same-origin requests

- **WHEN** API routes are called from the same origin
- **THEN** CORS headers SHALL NOT be required
- **AND** requests SHALL be allowed by default

#### Scenario: Cross-origin requests (if needed)

- **WHEN** API routes need to accept cross-origin requests
- **THEN** CORS headers SHALL be configured
- **AND** SHALL specify allowed origins
- **AND** SHALL specify allowed methods
- **AND** SHALL specify allowed headers

### Requirement: Remove Hono Server

The system SHALL remove the Hono API server and all related code after TanStack Start API routes are fully implemented.

#### Scenario: Delete Hono server directory

- **WHEN** Hono is removed
- **THEN** the `api/` directory SHALL be deleted
- **AND** all Hono route files SHALL be deleted
- **AND** the Hono server entry point SHALL be deleted

#### Scenario: Remove Hono dependencies

- **WHEN** Hono is removed
- **THEN** the `hono` package SHALL be uninstalled
- **AND** SHALL be removed from package.json
- **AND** no code SHALL import from `hono`

#### Scenario: Remove Hono dev script

- **WHEN** Hono is removed
- **THEN** the Hono dev script SHALL be removed from package.json
- **AND** the dev command SHALL only start TanStack Start
- **AND** no separate API server process SHALL be required

### Requirement: Middleware Support

The system SHALL support middleware in API routes for cross-cutting concerns like logging and error handling.

#### Scenario: Request logging middleware

- **WHEN** an API route is called
- **THEN** middleware SHALL log the request method and path
- **AND** SHALL log the response status code
- **AND** SHALL log the request duration

#### Scenario: Error handling middleware

- **WHEN** an API route throws an error
- **THEN** error handling middleware SHALL catch the error
- **AND** SHALL log the error with stack trace
- **AND** SHALL return an appropriate error response
- **AND** SHALL prevent the server from crashing

#### Scenario: Authentication middleware (optional)

- **WHEN** multiple API routes require authentication
- **THEN** authentication middleware MAY be used
- **AND** SHALL extract and validate the session
- **AND** SHALL attach user context to the request
- **AND** SHALL reject unauthenticated requests

### Requirement: Development Experience

The system SHALL provide a good development experience for working with API routes.

#### Scenario: Hot reload on changes

- **WHEN** an API route file is modified
- **THEN** the server SHALL reload the route automatically
- **AND** SHALL NOT require manual server restart
- **AND** SHALL preserve application state where possible

#### Scenario: Error messages in development

- **WHEN** an API route has an error in development
- **THEN** the error SHALL be displayed in the browser
- **AND** SHALL include the stack trace
- **AND** SHALL highlight the relevant code

#### Scenario: API route testing

- **WHEN** a developer wants to test an API route
- **THEN** they SHALL be able to call it directly with HTTP tools
- **AND** SHALL be able to write automated tests
- **AND** SHALL be able to mock dependencies

