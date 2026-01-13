# Web Application Development Guidelines

## Programming Language: TypeScript

**TypeScript Best Practices:**
- Use strict TypeScript configuration with `"strict": true`
- Prefer interfaces over type aliases for object shapes
- Use explicit return types for all public functions
- Avoid `any` type - use `unknown` or proper typing instead
- Use utility types (Pick, Omit, Partial) for type transformations
- Implement proper null/undefined checking
- Define types for Firebase Realtime Database data structures
- Use generics for reusable component and function types
- Leverage TypeScript's discriminated unions for complex state management

## Framework: Next.js

**Next.js Development Guidelines:**
- Use App Router (app directory) for new features and pages
- Implement proper SEO with the metadata API
- Use Server Components by default, Client Components when necessary
- Follow Next.js performance best practices and caching strategies
- Implement proper loading states and error pages
- Use Next.js API routes for backend functionality
- Leverage `next/image` for optimized image delivery
- Implement route groups for better organization
- Use parallel and intercepting routes when appropriate
- Configure proper environment variables with `.env.local`
- Implement middleware for auth and request handling
- Use `generateStaticParams` for dynamic routes when possible

## Backend: Firebase Realtime Database

**Firebase Realtime Database Best Practices:**
- Initialize Firebase only once using singleton pattern
- Use Firebase Admin SDK in API routes/server components
- Implement proper Realtime Database security rules
- Use Firebase client SDK only in Client Components
- Design flat, denormalized data structures for optimal performance
- Avoid deep nesting (max 32 levels, aim for 2-3 levels)
- Use push IDs for unique keys when creating new data
- Implement proper error handling for database operations
- Use Firebase Authentication with proper session management
- Enable offline persistence for better UX
- Implement rate limiting and quota management
- Use multi-path updates for atomic operations across nodes
- Leverage real-time listeners efficiently (cleanup on unmount)
- Implement proper pagination with `limitToFirst()` and `limitToLast()`

**Realtime Database Architecture Patterns:**
```typescript
// services/firebase/config.ts - Singleton initialization
// services/firebase/auth.ts - Authentication utilities
// services/firebase/database.ts - Database operations and queries
// services/firebase/storage.ts - File storage operations
// lib/firebase-admin.ts - Server-side Firebase Admin
```

**Data Structure Design:**
```typescript
// BAD: Deep nesting
{
  users: {
    user1: {
      posts: {
        post1: { /* data */ },
        post2: { /* data */ }
      }
    }
  }
}

// GOOD: Flat structure with references
{
  users: {
    user1: { name: "John", email: "..." }
  },
  posts: {
    post1: { userId: "user1", title: "..." },
    post2: { userId: "user1", title: "..." }
  },
  userPosts: {
    user1: {
      post1: true,
      post2: true
    }
  }
}
```

**Database Operations Best Practices:**
- Use `.on()` for real-time listeners, `.once()` for one-time reads
- Always call `.off()` to remove listeners when component unmounts
- Use queries (`orderByChild`, `equalTo`, `startAt`, `endAt`) efficiently
- Index frequently queried fields in database rules
- Batch related reads with a single listener when possible
- Use transactions for concurrent write operations
- Implement optimistic updates with rollback on failure
- Cache frequently accessed data client-side
- Use server timestamps for consistency: `ServerValue.TIMESTAMP`
- Implement pagination for large datasets
- Avoid downloading entire lists when only summary needed

**Real-time Listener Patterns:**
```typescript
// Good: Cleanup listener
useEffect(() => {
  const dbRef = ref(database, 'path/to/data');
  const unsubscribe = onValue(dbRef, (snapshot) => {
    // Handle data
  });
  
  return () => unsubscribe(); // Cleanup
}, [dependencies]);

// Good: Error handling
onValue(dbRef, 
  (snapshot) => { /* success */ },
  (error) => { /* handle error */ }
);
```

**Security Rules Guidelines:**
- Write rules that validate data structure and types
- Implement proper authentication checks
- Use `.validate` rules for data validation
- Limit read/write access based on user roles
- Use `.indexOn` for optimized queries
- Test security rules thoroughly with emulator
- Never trust client-side validation alone
- Implement rate limiting in rules when possible

**Example Security Rules:**
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        ".validate": "newData.hasChildren(['name', 'email'])",
        "name": {
          ".validate": "newData.isString() && newData.val().length < 100"
        }
      }
    }
  }
}
```

## Progressive Web App (PWA)

**PWA Requirements:**
- Configure `manifest.json` with proper icons and metadata
- Implement service worker with Workbox
- Define offline fallback pages
- Implement proper caching strategies:
  - Cache-first for static assets
  - Network-first for dynamic content
  - Stale-while-revalidate for semi-dynamic content
- Add "Add to Home Screen" prompt
- Implement push notifications (if applicable)
- Test on multiple devices and browsers
- Ensure app works offline for critical features
- Optimize for mobile performance and battery usage
- Implement app update notifications
- Use lighthouse PWA audit to validate implementation
- Handle online/offline status changes gracefully
- Queue database writes when offline, sync when online

**PWA Configuration:**
```typescript
// next.config.js - Configure PWA plugin
// public/manifest.json - App manifest
// public/sw.js - Service worker
// app/layout.tsx - Meta tags and PWA setup
```

**Offline Handling with Realtime Database:**
- Enable offline persistence: `enablePersistence()`
- Implement connection state monitoring
- Queue writes when offline, sync when reconnected
- Show offline indicator to users
- Handle conflicts on reconnection
- Cache critical data for offline access

## Code Style: Clean Code

**Clean Code Principles:**
- Write self-documenting code with meaningful names
- Keep functions small and focused on a single responsibility
- Avoid deep nesting and complex conditional statements
- Use consistent formatting and indentation
- Write code that tells a story and is easy to understand
- Refactor ruthlessly to eliminate code smells
- Follow DRY (Don't Repeat Yourself) principle
- Apply SOLID principles where applicable
- Use descriptive variable names (avoid single letters except loops)
- Limit function parameters (max 3-4, use objects for more)
- Extract magic numbers and strings into named constants
- Write pure functions when possible

## Project Structure

**Recommended Directory Structure:**
```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── (dashboard)/       # Protected routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── features/         # Feature-specific components
│   └── layouts/          # Layout components
├── lib/                   # Utility functions and configurations
│   ├── firebase/         # Firebase utilities
│   ├── utils/            # Helper functions
│   └── constants/        # App constants
├── hooks/                 # Custom React hooks
│   ├── useDatabase.ts    # Database hooks
│   └── useAuth.ts        # Auth hooks
├── types/                 # TypeScript type definitions
│   └── database.ts       # Database schema types
├── services/              # Business logic and API services
│   └── database/         # Database service layer
├── store/                 # State management (if using)
├── styles/                # Global styles and Tailwind config
├── public/                # Static assets and PWA files
└── middleware.ts          # Next.js middleware
```

## State Management

**State Management Guidelines:**
- Use React Server Components to minimize client-side state
- Prefer URL state for shareable/bookmarkable state
- Use React Context for global client state (theme, user preferences)
- Leverage SWR or React Query for server state caching
- Use `useState` and `useReducer` for local component state
- Implement optimistic UI updates for better UX
- Consider Zustand or Jotai for complex client state (avoid Redux unless necessary)
- Sync Realtime Database listeners with local state efficiently
- Debounce rapid database writes from user input
- Use connection state to manage UI (online/offline indicators)

## Performance Optimization

**Performance Best Practices:**
- Implement code splitting and lazy loading
- Use `React.memo()` for expensive components
- Optimize bundle size with proper tree-shaking
- Implement proper image optimization with `next/image`
- Use dynamic imports for heavy components
- Implement virtualization for long lists (react-window)
- Minimize JavaScript bundle sent to client
- Use Web Vitals monitoring (CLS, FID, LCP)
- Implement proper caching headers
- Lazy load below-the-fold content
- Optimize fonts with `next/font`
- Use `Suspense` boundaries appropriately

**Database Performance Optimization:**
- Use shallow queries when you don't need full data depth
- Implement pagination instead of loading all data at once
- Use indexes defined in security rules for queries
- Minimize listener scope (listen to specific paths, not root)
- Debounce writes from user input (e.g., 500ms delay)
- Cache frequently accessed, rarely changed data
- Use `once()` instead of `on()` when real-time updates aren't needed
- Avoid downloading large lists when only count/metadata needed
- Implement incremental loading (load more as user scrolls)

## Security Practices

**Security Guidelines:**
- Never expose Firebase config with write access client-side
- Implement proper Realtime Database security rules
- Validate all inputs on both client and server
- Use environment variables for sensitive data
- Implement CSRF protection in API routes
- Use HTTP-only cookies for sensitive tokens
- Sanitize user-generated content (XSS prevention)
- Implement rate limiting on API endpoints
- Use Firebase App Check to prevent abuse
- Keep dependencies updated and scan for vulnerabilities
- Implement proper authentication flows
- Use HTTPS only in production
- Validate data structure and types in security rules
- Never trust client-side timestamps (use ServerValue.TIMESTAMP)

## Testing Strategy

**Testing Guidelines:**
- Write unit tests for utility functions and hooks
- Implement integration tests for critical user flows
- Use Jest and React Testing Library
- Test Firebase operations with Realtime Database emulator
- Implement E2E tests with Playwright or Cypress
- Aim for meaningful coverage, not just high percentages
- Test error states and edge cases
- Mock database operations in unit tests
- Test real-time listener behavior (updates, cleanup)
- Test PWA functionality (offline mode, caching)
- Implement visual regression testing for critical pages
- Test security rules with emulator

**Database Testing Pattern:**
```typescript
// Use Firebase Emulator for testing
import { connectDatabaseEmulator } from 'firebase/database';

if (process.env.NODE_ENV === 'test') {
  connectDatabaseEmulator(database, 'localhost', 9000);
}
```

## Error Handling

**Error Handling Patterns:**
- Implement global error boundary in root layout
- Use try-catch blocks for async operations
- Provide user-friendly error messages
- Log errors to error tracking service (Sentry, etc.)
- Implement proper loading and error states
- Handle Firebase-specific errors appropriately:
  - PERMISSION_DENIED
  - NETWORK_ERROR
  - UNAVAILABLE (offline)
- Implement retry logic for transient failures
- Provide fallback UI for critical errors
- Validate form inputs with clear feedback
- Handle network failures gracefully
- Show meaningful errors when database rules reject writes
- Handle connection state changes (disconnected, reconnected)

## Accessibility (a11y)

**Accessibility Requirements:**
- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure keyboard navigation works properly
- Maintain sufficient color contrast (WCAG AA minimum)
- Provide alternative text for images
- Use proper heading hierarchy
- Implement focus management
- Test with screen readers
- Ensure forms are properly labeled
- Support reduced motion preferences
- Make interactive elements easily tappable (min 44x44px)
- Announce dynamic content updates to screen readers
- Provide loading announcements for real-time updates

## Documentation

**Documentation Standards:**
- Document complex business logic
- Write JSDoc comments for public APIs
- Maintain up-to-date README with setup instructions
- Document environment variables and configuration
- Create architecture decision records (ADRs)
- **Document Realtime Database schema and data structure**
- **Document denormalization patterns and data relationships**
- **Maintain security rules documentation**
- Keep API documentation current
- Document deployment procedures
- Maintain changelog for significant updates
- Document offline behavior and sync strategies

**Database Schema Documentation Example:**
```typescript
/**
 * Database Schema
 * 
 * /users/{userId}
 *   - name: string
 *   - email: string
 *   - createdAt: timestamp
 * 
 * /posts/{postId}
 *   - userId: string (ref to /users)
 *   - title: string
 *   - content: string
 *   - createdAt: timestamp
 * 
 * /userPosts/{userId}/{postId}: boolean
 *   - Index for querying user's posts
 */
```

## Git Workflow

**Version Control Best Practices:**
- Use conventional commits (feat:, fix:, docs:, etc.)
- Keep commits atomic and focused
- Write descriptive commit messages
- Create feature branches from main/development
- Use pull requests for code review
- Squash commits before merging when appropriate
- Tag releases semantically (v1.0.0)
- Keep branches short-lived
- Resolve merge conflicts promptly

## AI Code Generation Preferences

When generating code, please:

- Generate complete, working code examples with proper imports
- Include inline comments **only for complex logic** that isn't obvious from code
- **DO NOT generate README or documentation files unless explicitly asked**
- **DO NOT add JSDoc for simple, self-explanatory functions**
- Focus on generating working code first, documentation second
- Follow the established patterns and conventions in this project
- Suggest improvements and alternative approaches when relevant
- Consider performance, security, and maintainability
- Include error handling and edge case considerations
- Generate unit tests **only when explicitly requested**
- Follow accessibility best practices for UI components
- Implement proper TypeScript types for Realtime Database data structures
- Include Firebase Realtime Database error handling patterns
- Consider PWA implications (offline functionality, caching)
- Suggest appropriate Next.js rendering strategies (SSR, SSG, ISR, CSR)
- Include loading states and skeleton screens
- Implement optimistic updates when appropriate
- Design flat, denormalized database structures
- Include real-time listener cleanup patterns
- Consider query performance and indexing
- Implement proper connection state handling
- Handle offline/online state transitions
- Use multi-path updates for atomic operations across nodes

**Important: Code First, Docs Later**
- Prioritize generating **working, tested code**
- Add comments only where business logic is complex
- Skip documentation generation unless specifically requested
- Don't auto-generate README, CHANGELOG, or other docs