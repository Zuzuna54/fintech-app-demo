# Fintech ACH Application Backend Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [API Documentation](#api-documentation)
5. [Authentication & Authorization](#authentication--authorization)
6. [Dependencies](#dependencies)
7. [Setup Instructions](#setup-instructions)
8. [Data Flows](#data-flows)

## System Overview

The Fintech ACH Application is a comprehensive banking and payment processing system built with FastAPI. It provides functionality for managing organizations, users, bank accounts, and ACH payments.

### Key Features

- Multi-tenant organization management
- Role-based access control (Superuser and Organization Admin roles)
- Internal and external bank account management
- ACH payment processing
- Plaid integration for bank account verification
- Asynchronous task processing with Redis queue
- Comprehensive logging and monitoring

## System Architecture

### Component Structure

```
backend/
├── api/                    # API endpoints
│   ├── accounts.py         # Account management endpoints
│   ├── payments.py         # Payment processing endpoints
│   └── plaid_integration.py# Plaid API integration
├── auth/                   # Authentication & authorization
│   ├── jwt.py             # JWT token handling
│   ├── management.py      # User management
│   ├── routes.py          # Auth endpoints
│   └── service.py         # Auth business logic
├── config/                 # Configuration
│   ├── database.py        # Database configuration
│   ├── logging_config.py  # Logging setup
│   └── auth.py           # Auth configuration
├── domain/                # Domain models
│   ├── models.py         # Pydantic models
│   ├── schemas.py        # API schemas
│   └── sql_models.py     # SQLAlchemy models
├── message_queue/        # Async processing
│   ├── queue_worker.py   # Background workers
│   └── redis_queue.py    # Redis queue implementation
└── migrations/           # Database migrations
```

### Technology Stack

- **Web Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Task Queue**: Redis
- **API Integration**: Plaid API
- **Migration Tool**: Alembic

## Database Schema

### Core Tables

1. **organizations**

   - Primary key: id (UUID)
   - Fields: name, description, status, created_at, updated_at

2. **superusers**

   - Primary key: id (UUID)
   - Fields: email, hashed_password, first_name, last_name, role, created_at, updated_at

3. **organization_administrators**

   - Primary key: id (UUID)
   - Fields: email, hashed_password, first_name, last_name, role, organization_id, created_at, updated_at
   - Foreign key: organization_id references organizations(id)

4. **internal_organization_bank_accounts**

   - Primary key: uuid
   - Fields: name, type, account_type, account_number, routing_number, balance, status, created_at, updated_at

5. **external_organization_bank_accounts**

   - Primary key: uuid
   - Fields: name, plaid_account_id, account_type, account_number, routing_number, balance, status, organization_id, created_at, updated_at
   - Foreign key: organization_id references organizations(id)

6. **payments**
   - Primary key: uuid
   - Fields: from_account, to_account, amount, status, description, source_routing_number, destination_routing_number, payment_type, idempotency_key, created_at, updated_at

## API Documentation

### Authentication Endpoints

- POST `/auth/token`: Login and get access token
- POST `/auth/refresh`: Refresh access token
- GET `/auth/me`: Get current user info

### User Management Endpoints

- POST `/management/users`: Create new user
- GET `/management/users`: List users
- GET `/management/users/{user_id}`: Get user details
- PUT `/management/users/{user_id}`: Update user
- DELETE `/management/users/{user_id}`: Delete user

### Organization Endpoints

- POST `/management/organizations`: Create organization
- GET `/management/organizations`: List organizations
- GET `/management/organizations/{org_id}`: Get organization details
- PUT `/management/organizations/{org_id}`: Update organization
- DELETE `/management/organizations/{org_id}`: Delete organization

### Account Endpoints

- POST `/accounts/internal`: Create internal account
- GET `/accounts/internal`: List internal accounts
- GET `/accounts/internal/{account_id}`: Get internal account details
- PUT `/accounts/internal/{account_id}`: Update internal account
- DELETE `/accounts/internal/{account_id}`: Delete internal account

Similar endpoints exist for external accounts under `/accounts/external`

### Payment Endpoints

- POST `/payments`: Create payment
- GET `/payments`: List payments
- GET `/payments/{payment_id}`: Get payment details
- PUT `/payments/{payment_id}`: Update payment status
- DELETE `/payments/{payment_id}`: Cancel payment

### Plaid Integration Endpoints

- POST `/plaid/link/token`: Create Plaid link token
- POST `/plaid/exchange/public-token`: Exchange public token
- GET `/plaid/accounts`: Get Plaid accounts

## Authentication & Authorization

### JWT Token System

- Access tokens expire after 30 minutes
- Refresh tokens expire after 7 days
- Tokens include user role and organization ID (for org admins)

### User Roles

1. **Superuser**

   - Full system access
   - Can manage all organizations and users
   - Can perform all operations

2. **Organization Admin**
   - Limited to their organization
   - Can manage organization users
   - Can manage organization accounts
   - Can view and create payments

## Dependencies

### Core Dependencies

- **fastapi**: Web framework
- **uvicorn**: ASGI server
- **sqlalchemy**: ORM
- **alembic**: Database migrations
- **asyncpg**: Async PostgreSQL driver
- **pydantic**: Data validation
- **python-jose**: JWT handling
- **passlib**: Password hashing
- **bcrypt**: Password encryption
- **redis**: Task queue
- **plaid-python**: Plaid API client

### Testing Dependencies

- **pytest**: Testing framework
- **pytest-asyncio**: Async test support
- **pytest-cov**: Test coverage
- **httpx**: HTTP client

## Setup Instructions

1. **Database Setup**

   ```bash
   # Create PostgreSQL database
   createdb fintech_ach_db

   # Set environment variables
   cp .env.example .env
   # Edit .env with your configuration

   # Run migrations
   alembic upgrade head
   ```

2. **Redis Setup**

   ```bash
   # Install Redis
   brew install redis  # macOS
   sudo apt-get install redis-server  # Ubuntu

   # Start Redis
   redis-server
   ```

3. **Application Setup**

   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate

   # Install dependencies
   pip install -r requirements.txt

   # Start the application
   uvicorn main:app --reload
   ```

### Default Test Users

After running migrations, the following test users are available:

1. **Superuser**

   - Email: test.admin@example.com
   - Password: password123

2. **Organization Admins**
   - Emails: admin1@example.com through admin5@example.com
   - Password: password123

## Data Flows

### Authentication Flow

1. User submits credentials
2. Auth service verifies credentials
3. JWT tokens generated and returned
4. Access token used for subsequent requests
5. Refresh token used to get new access token

### Payment Processing Flow

1. Payment request received
2. Validation of accounts and balances
3. Payment record created with PENDING status
4. Added to Redis queue for processing
5. Background worker processes payment
6. Status updated to COMPLETED/FAILED
7. Notifications sent (if configured)

### Account Creation Flow

1. Account details submitted
2. For external accounts:
   - Plaid link token generated
   - Public token exchanged
   - Account details retrieved
3. Account record created
4. Organization association made
5. Account activated for use

### Organization Management Flow

1. Organization created by superuser
2. Admin users assigned
3. Accounts created and associated
4. Users can be added/removed
5. Organization status can be updated
