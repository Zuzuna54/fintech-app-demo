# Fintech ACH Application Frontend Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [System Architecture](#system-architecture)
3. [Component Structure](#component-structure)
4. [State Management](#state-management)
5. [Authentication Flow](#authentication-flow)
6. [Dependencies](#dependencies)
7. [Setup Instructions](#setup-instructions)
8. [Testing](#testing)

## System Overview

The Fintech ACH Application frontend is a modern React application built with Next.js 14, featuring:

- Server and client components
- Role-based access control
- Real-time data updates
- Responsive design with Tailwind CSS
- Comprehensive testing setup

### Key Features

- Multi-tenant organization management
- User management with role-based access
- Bank account management (internal and external)
- Payment processing interface
- Real-time payment status updates
- Responsive and accessible UI
- Dark/light mode support

## System Architecture

### Directory Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js 14 app directory
│   │   ├── (auth)/         # Protected routes
���   │   ├── (public)/       # Public routes
│   │   └── layout.tsx      # Root layout
│   ├── components/         # Reusable components
│   │   ├── ui/            # Base UI components
│   │   ├── modals/        # Modal components
│   │   └── tables/        # Table components
│   ├── context/           # React context providers
│   │   └── auth/          # Authentication context
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   └── types/             # TypeScript types
├── public/                # Static assets
└── tests/                # Test files
```

### Technology Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + SWR
- **Testing**: Jest + React Testing Library + Playwright
- **API Client**: Axios
- **Form Handling**: React Hook Form
- **UI Components**: Custom components with Tailwind

## Component Structure

### Core Components

1. **Layout Components**

   - `RootLayout`: Base layout with providers
   - `AuthLayout`: Layout for authenticated routes
   - `PublicLayout`: Layout for public routes

2. **Authentication Components**

   - `AuthProvider`: Authentication context provider
   - `LoginForm`: User login form
   - `withAuth`: HOC for route protection

3. **UI Components**

   - `Button`: Customizable button component
   - `Input`: Form input component
   - `Select`: Dropdown select component
   - `Card`: Container component
   - `Badge`: Status indicator component
   - `LoadingSpinner`: Loading state component

4. **Feature Components**

   - `UsersTable`: User management table
   - `OrganizationsTable`: Organization management
   - `AccountsTable`: Bank account management
   - `PaymentsTable`: Payment tracking

5. **Modal Components**
   - `UserModal`: User creation/editing
   - `OrganizationModal`: Organization management
   - `AccountModal`: Account management
   - `PaymentModal`: Payment details

### Component Patterns

- Server vs Client Components
- Compound Components
- Render Props
- Higher-Order Components
- Custom Hooks

## State Management

### Authentication State

- JWT token management
- User role and permissions
- Organization context
- Auto refresh token mechanism

### Data Fetching

- SWR for data fetching and caching
- Optimistic updates
- Real-time updates
- Error handling and retries

### Form State

- Form validation
- Error handling
- Submit handling
- Field state management

## Authentication Flow

1. **Login Process**

   ```typescript
   // Example login flow
   const login = async credentials => {
     const response = await api.post('/auth/token', credentials);
     setTokens(response.data);
     await fetchUserData();
   };
   ```

2. **Token Management**

   - Access token storage
   - Refresh token handling
   - Auto refresh mechanism
   - Token expiration handling

3. **Protected Routes**
   - Role-based access control
   - Organization-based access control
   - Redirect handling
   - Loading states

## Dependencies

### Core Dependencies

- **next**: ^14.0.4 (App Router, Server Components)
- **react**: ^18.2.0
- **react-dom**: ^18.2.0
- **typescript**: ^5.3.3
- **tailwindcss**: ^3.4.0
- **@heroicons/react**: ^2.1.1
- **swr**: ^2.2.4
- **axios**: ^1.6.2
- **react-hook-form**: ^7.49.2
- **zod**: ^3.22.4

### UI Dependencies

- **@headlessui/react**: ^1.7.17
- **@radix-ui/react-dialog**: ^1.0.5
- **framer-motion**: ^10.16.16
- **lucide-react**: ^0.303.0
- **tailwind-merge**: ^2.2.0

### Development Dependencies

- **@types/node**: ^20.10.5
- **@types/react**: ^18.2.45
- **@typescript-eslint/eslint-plugin**: ^6.15.0
- **eslint**: ^8.56.0
- **prettier**: ^3.1.1
- **jest**: ^29.7.0
- **@testing-library/react**: ^14.1.2
- **playwright**: ^1.40.1

## Setup Instructions

1. **Installation**

   ```bash
   # Install dependencies
   npm install

   # Setup environment variables
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

2. **Development**

   ```bash
   # Start development server
   npm run dev

   # Build for production
   npm run build

   # Start production server
   npm start
   ```

3. **Environment Variables**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Testing

### Unit Testing

```bash
# Run Jest tests
npm test

# Run tests with coverage
npm run test:coverage
```

### E2E Testing

```bash
# Run Playwright tests
npm run test:e2e

# Open Playwright UI
npm run test:e2e:ui
```

### Test Structure

```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── e2e/              # End-to-end tests
```

### Testing Patterns

1. **Component Testing**

   ```typescript
   describe('Button', () => {
     it('renders correctly', () => {
       render(<Button>Click me</Button>);
       expect(screen.getByText('Click me')).toBeInTheDocument();
     });
   });
   ```

2. **Hook Testing**

   ```typescript
   describe('useAuth', () => {
     it('handles login correctly', async () => {
       const { result } = renderHook(() => useAuth());
       await act(() => result.current.login(credentials));
       expect(result.current.isAuthenticated).toBe(true);
     });
   });
   ```

3. **E2E Testing**
   ```typescript
   test('user can login', async ({ page }) => {
     await page.goto('/login');
     await page.fill('[name=email]', 'test@example.com');
     await page.fill('[name=password]', 'password');
     await page.click('button[type=submit]');
     await expect(page).toHaveURL('/dashboard');
   });
   ```
