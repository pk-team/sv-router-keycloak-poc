# AGENTS.md

This file provides comprehensive guidance for AI agents and automated tools working with this sv-router Keycloak authentication POC.

## Pre-flight Checks

Always run `bun check` before considering any changes completed to ensure TypeScript compliance.

## Development Commands

**Install dependencies:**
```bash
pnpm i
# or
bun install
```

**Development server:**
```bash
pnpm dev
# or
bun dev
```

**Build for production:**
```bash
pnpm build
# or
bun build
```

**Type checking:**
```bash
pnpm check
# or
bun check
```

**Preview production build:**
```bash
pnpm preview
# or
bun preview
```

## Authentication Architecture

This is a proof-of-concept SvelteKit application demonstrating OAuth 2.0 + PKCE authentication with Keycloak:

### Core Components

- **auth.svelte.ts**: Central authentication service using Svelte 5 runes (`$state`)
  - Implements OAuth 2.0 with PKCE (Proof Key for Code Exchange)
  - Handles token storage in cookies with automatic refresh
  - Manages user session state reactively

- **router.ts**: sv-router configuration with authentication hooks
  - `beforeLoad`: Initializes auth service on all routes
  - `afterLoad`: Enforces authentication for protected routes (using `meta.requireAuth`)
  - Special `/redirect` route handles OAuth callback without component loading

### Key Implementation Patterns

1. **Protected Routes**: Use `meta: { requireAuth: true }` in route definitions
2. **Authentication State**: Access via `auth.username` (reactive)
3. **Token Management**: Automatic refresh using refresh tokens stored in cookies
4. **OAuth Flow**: PKCE implementation prevents authorization code interception
5. **Session Security**: Uses `sameSite: 'strict'` cookies and CSRF protection

### Environment Configuration

Required environment variables in `.env`:
- `VITE_KEYCLOAK_URL`: Keycloak OpenID Connect endpoint
- `VITE_KEYCLOAK_CLIENT_ID`: Keycloak client identifier

### Route Structure

- `/` - Public home page
- `/protected` - Requires authentication
- `/profile` - User profile page (requires authentication)
- `/redirect` - OAuth callback handler (processes auth code automatically)

The application uses sv-router's hook system to centralize authentication logic rather than component-level guards.

## Authentication Flow Implementation

### Critical Security Patterns

1. **PKCE Implementation**: Never modify the PKCE generation without understanding OAuth 2.0 security implications
2. **Token Storage**: Tokens are stored in cookies with security flags - maintain `sameSite: 'strict'` and conditional `secure` flags
3. **State Management**: Authentication state uses Svelte 5 runes (`$state`) - preserve reactivity patterns

### Code Organization Principles

- **auth.svelte.ts**: Contains all authentication logic - avoid splitting auth concerns across multiple files
- **router.ts**: Route-level authentication enforcement via hooks - don't implement component-level auth guards
- **BaseLayout.svelte**: Global navigation state - authentication UI should remain here

### Refactoring Guidelines

When modifying authentication code:

1. **Method Extraction**: Recent refactoring split `parseLoginCallback()` into smaller methods:
   - `extractOAuthCallbackParams()`: Parameter extraction and validation
   - `requestTokensFromKeycloak()`: Token exchange with error handling
   - `storeTokensSecurely()`: Secure cookie storage with detailed security comments
   - `completeLoginProcess()`: State cleanup and navigation

2. **Error Handling**: Always include try-catch blocks for network requests and token parsing
3. **Logging**: Use `console.log` for OAuth flow debugging (as seen in router hooks)

### Route Configuration Patterns

- Protected routes use `meta: { requireAuth: true }`
- OAuth callback route (`/redirect`) processes authentication before component loading
- Use `beforeLoad` hooks for authentication initialization
- Use `afterLoad` hooks for route-specific post-auth actions

### Testing Considerations

- OAuth flow requires Keycloak server running (see environment variables)
- Test both authenticated and unauthenticated states
- Verify token refresh functionality with expired tokens
- Test PKCE flow security (code verifier/challenge pairs)

### Environment Dependencies

- Keycloak server must be running on configured URL
- Client ID must be registered in Keycloak with proper redirect URIs
- Development server typically runs on `localhost:5173`

### Performance Notes

- Authentication state is reactive via Svelte runes
- Token validation happens on every route navigation
- Automatic token refresh prevents unnecessary re-authentication
- Session storage used for temporary PKCE data (automatically cleaned up)

## Common Patterns to Preserve

1. **Reactive Authentication**: Use `auth.username` for conditional rendering
2. **Hook-based Protection**: Implement auth checks in router hooks, not components
3. **Secure Defaults**: Maintain cookie security flags and HTTPS-aware settings
4. **Error Recovery**: Graceful degradation when tokens are invalid or expired