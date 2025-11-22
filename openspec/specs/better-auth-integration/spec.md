# better-auth-integration Specification

## Purpose
TBD - created by archiving change migrate-to-ztunes-architecture. Update Purpose after archive.
## Requirements
### Requirement: Session-Based Authentication

The system SHALL use Better Auth for session-based authentication with secure HTTP-only cookies, replacing JWT-based authentication.

#### Scenario: User login with credentials

- **WHEN** a user submits valid email and password
- **THEN** Better Auth SHALL verify the credentials
- **AND** SHALL create a new session in the database
- **AND** SHALL set an HTTP-only session cookie
- **AND** SHALL return success to the client

#### Scenario: Invalid login credentials

- **WHEN** a user submits invalid credentials
- **THEN** Better Auth SHALL reject the login attempt
- **AND** SHALL NOT create a session
- **AND** SHALL NOT set a cookie
- **AND** SHALL return error "Invalid credentials"

#### Scenario: Session persistence

- **WHEN** a user has an active session
- **THEN** the session cookie SHALL persist across page reloads
- **AND** SHALL be sent with all requests to the server
- **AND** SHALL remain valid until expiration or logout

### Requirement: Better Auth Configuration

The system SHALL configure Better Auth with PostgreSQL database connection and session settings in `lib/auth.ts`.

#### Scenario: Configure database connection

- **WHEN** Better Auth is initialized
- **THEN** it SHALL connect to PostgreSQL using DATABASE_URL
- **AND** SHALL use the same database as the application
- **AND** SHALL create auth tables if they don't exist

#### Scenario: Configure session settings

- **WHEN** Better Auth is configured
- **THEN** session cookies SHALL be HTTP-only
- **AND** SHALL be secure in production (HTTPS only)
- **AND** SHALL have SameSite=Lax or Strict
- **AND** SHALL have a reasonable max age (e.g., 7 days)

#### Scenario: Configure cookie cache

- **WHEN** Better Auth session cache is configured
- **THEN** it SHALL enable cookie caching
- **AND** SHALL set cache max age (e.g., 5 minutes)
- **AND** SHALL reduce database queries for session validation

### Requirement: Auth Database Tables

The system SHALL create database tables for Better Auth to store sessions and user accounts.

#### Scenario: Sessions table

- **WHEN** Better Auth tables are created
- **THEN** a `sessions` table SHALL exist
- **AND** SHALL include columns: id, user_id, expires_at, created_at
- **AND** SHALL have a foreign key to users table

#### Scenario: Accounts table (optional)

- **WHEN** OAuth providers are configured
- **THEN** an `accounts` table SHALL exist
- **AND** SHALL include columns: id, user_id, provider, provider_account_id
- **AND** SHALL support multiple auth providers per user

### Requirement: Auth API Route

The system SHALL provide a TanStack Start API route at `/api/auth/[...all]` that handles all Better Auth requests.

#### Scenario: Handle auth requests

- **WHEN** a request is made to `/api/auth/*`
- **THEN** the API route SHALL forward the request to Better Auth handler
- **AND** SHALL handle both GET and POST requests
- **AND** SHALL return Better Auth's response

#### Scenario: Login endpoint

- **WHEN** a POST request is made to `/api/auth/login`
- **THEN** Better Auth SHALL process the login
- **AND** SHALL set session cookie on success
- **AND** SHALL return user data or error

#### Scenario: Logout endpoint

- **WHEN** a POST request is made to `/api/auth/logout`
- **THEN** Better Auth SHALL invalidate the session
- **AND** SHALL clear the session cookie
- **AND** SHALL return success

#### Scenario: Session endpoint

- **WHEN** a GET request is made to `/api/auth/session`
- **THEN** Better Auth SHALL return current session data
- **AND** SHALL include user information if authenticated
- **AND** SHALL return null if not authenticated

### Requirement: Client Auth Integration

The system SHALL provide client-side auth utilities for login, logout, and session management.

#### Scenario: Login from client

- **WHEN** a component calls the login function
- **THEN** it SHALL POST credentials to `/api/auth/login`
- **AND** SHALL receive session data on success
- **AND** SHALL update auth state in the application
- **AND** SHALL redirect to authenticated page

#### Scenario: Logout from client

- **WHEN** a component calls the logout function
- **THEN** it SHALL POST to `/api/auth/logout`
- **AND** SHALL clear local auth state
- **AND** SHALL redirect to login page

#### Scenario: Check auth status

- **WHEN** a component needs to check if user is authenticated
- **THEN** it SHALL fetch from `/api/auth/session`
- **AND** SHALL receive current user data if authenticated
- **AND** SHALL receive null if not authenticated

### Requirement: Cookie Forwarding to Zero Cache

The system SHALL configure Zero cache to forward session cookies to the application's Zero endpoints for auth context.

#### Scenario: Forward cookies to get-queries endpoint

- **WHEN** Zero cache calls `/api/zero/get-queries`
- **THEN** it SHALL forward all cookies from the original request
- **AND** the endpoint SHALL receive the session cookie
- **AND** SHALL be able to extract user context from the session

#### Scenario: Forward cookies to mutate endpoint

- **WHEN** Zero cache calls `/api/zero/mutate`
- **THEN** it SHALL forward all cookies from the original request
- **AND** the endpoint SHALL receive the session cookie
- **AND** SHALL be able to extract user context for mutation validation

#### Scenario: Configure cookie forwarding

- **WHEN** Zero cache is configured
- **THEN** `ZERO_GET_QUERIES_FORWARD_COOKIES` SHALL be set to "true"
- **AND** `ZERO_MUTATE_FORWARD_COOKIES` SHALL be set to "true"
- **AND** cookies SHALL be forwarded automatically

### Requirement: Session Extraction in Zero Endpoints

The system SHALL extract user session from cookies in Zero API endpoints to provide auth context for mutations and queries.

#### Scenario: Extract session in mutate endpoint

- **WHEN** `/api/zero/mutate` receives a request
- **THEN** it SHALL extract the session cookie
- **AND** SHALL validate the session with Better Auth
- **AND** SHALL extract userId from the session
- **AND** SHALL pass userId to `createMutators(userId)`

#### Scenario: Extract session in get-queries endpoint

- **WHEN** `/api/zero/get-queries` receives a request
- **THEN** it SHALL extract the session cookie
- **AND** SHALL validate the session with Better Auth
- **AND** SHALL extract userId from the session
- **AND** SHALL use userId for permission checks (if needed)

#### Scenario: Invalid or expired session

- **WHEN** a Zero endpoint receives an invalid session cookie
- **THEN** it SHALL treat the request as unauthenticated
- **AND** SHALL pass `undefined` as userId to mutators
- **AND** mutators SHALL reject authenticated operations

### Requirement: Remove JWT Authentication

The system SHALL remove all JWT-based authentication code and dependencies after Better Auth is fully integrated.

#### Scenario: Remove JWT token generation

- **WHEN** JWT code is removed
- **THEN** no code SHALL generate JWT tokens
- **AND** no code SHALL sign tokens with `jose`
- **AND** the `jose` library SHALL be uninstalled

#### Scenario: Remove JWT verification

- **WHEN** JWT code is removed
- **THEN** no code SHALL verify JWT tokens
- **AND** no code SHALL decode JWT payloads
- **AND** no middleware SHALL check for JWT tokens

#### Scenario: Remove JWT from client

- **WHEN** JWT code is removed
- **THEN** no client code SHALL store JWT tokens
- **AND** no client code SHALL send Authorization headers
- **AND** no client code SHALL refresh JWT tokens

### Requirement: Auth State Management

The system SHALL manage authentication state on the client using Better Auth session data.

#### Scenario: Initialize auth state on app load

- **WHEN** the application loads
- **THEN** it SHALL fetch current session from `/api/auth/session`
- **AND** SHALL initialize auth state with user data
- **AND** SHALL render authenticated or unauthenticated UI accordingly

#### Scenario: Update auth state on login

- **WHEN** a user logs in successfully
- **THEN** auth state SHALL be updated with user data
- **AND** authenticated UI SHALL be rendered
- **AND** protected routes SHALL become accessible

#### Scenario: Clear auth state on logout

- **WHEN** a user logs out
- **THEN** auth state SHALL be cleared
- **AND** unauthenticated UI SHALL be rendered
- **AND** protected routes SHALL redirect to login

### Requirement: Protected Routes

The system SHALL protect routes that require authentication using Better Auth session validation.

#### Scenario: Access protected route when authenticated

- **WHEN** an authenticated user navigates to a protected route
- **THEN** the route SHALL render normally
- **AND** SHALL have access to user context
- **AND** SHALL be able to perform authenticated operations

#### Scenario: Access protected route when unauthenticated

- **WHEN** an unauthenticated user navigates to a protected route
- **THEN** they SHALL be redirected to the login page
- **AND** SHALL see a message to log in
- **AND** SHALL be redirected back after successful login

#### Scenario: Session expiration during use

- **WHEN** a user's session expires while using the app
- **THEN** the next authenticated operation SHALL fail
- **AND** the user SHALL be redirected to login
- **AND** SHALL see a message that their session expired

### Requirement: Email/Password Provider

The system SHALL support email and password authentication as the primary auth provider.

#### Scenario: Register new user

- **WHEN** a new user registers with email and password
- **THEN** Better Auth SHALL hash the password securely
- **AND** SHALL create a user record in the database
- **AND** SHALL create a session for the user
- **AND** SHALL return success

#### Scenario: Password requirements

- **WHEN** a user sets a password
- **THEN** it SHALL meet minimum length requirements (e.g., 8 characters)
- **AND** SHALL be hashed with a secure algorithm (e.g., bcrypt)
- **AND** SHALL NOT be stored in plain text

#### Scenario: Email uniqueness

- **WHEN** a user registers with an email
- **THEN** the email SHALL be unique in the database
- **AND** duplicate emails SHALL be rejected
- **AND** SHALL return error "Email already exists"

### Requirement: OAuth Providers

The system SHALL support OAuth providers (e.g., Google, GitHub) for authentication in addition to email/password when OAuth functionality is configured.

#### Scenario: Login with OAuth provider

- **WHEN** a user clicks "Login with Google"
- **THEN** they SHALL be redirected to Google's OAuth page
- **AND** SHALL authorize the application
- **AND** SHALL be redirected back with an auth code
- **AND** Better Auth SHALL exchange the code for user data
- **AND** SHALL create or update the user account
- **AND** SHALL create a session

#### Scenario: Link OAuth account to existing user

- **WHEN** an authenticated user links an OAuth account
- **THEN** Better Auth SHALL associate the OAuth account with the user
- **AND** SHALL allow login with either email/password or OAuth
- **AND** SHALL maintain a single user identity

### Requirement: Security Best Practices

The system SHALL follow security best practices for session-based authentication.

#### Scenario: HTTP-only cookies

- **WHEN** a session cookie is set
- **THEN** it SHALL have the HttpOnly flag
- **AND** SHALL NOT be accessible via JavaScript
- **AND** SHALL prevent XSS attacks from stealing sessions

#### Scenario: Secure cookies in production

- **WHEN** the application runs in production
- **THEN** session cookies SHALL have the Secure flag
- **AND** SHALL only be sent over HTTPS
- **AND** SHALL prevent man-in-the-middle attacks

#### Scenario: SameSite cookie protection

- **WHEN** a session cookie is set
- **THEN** it SHALL have SameSite=Lax or Strict
- **AND** SHALL prevent CSRF attacks
- **AND** SHALL only be sent with same-site requests

#### Scenario: Session expiration

- **WHEN** a session is created
- **THEN** it SHALL have an expiration time
- **AND** SHALL be automatically invalidated after expiration
- **AND** SHALL require re-authentication after expiration

