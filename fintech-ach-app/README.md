# Fintech ACH Application

A full-stack application for managing ACH (Automated Clearing House) payments with Plaid integration.

## Project Structure

```
fintech-ach-app/
├── frontend/          # Next.js TypeScript frontend
├── backend/           # FastAPI Python backend
├── TICKETS.md        # Development tickets/tasks
├── README.md         # This file
└── docker-compose.yml # Docker compose configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker and Docker Compose (optional)

### Development Setup

1. Frontend Setup:

```bash
cd frontend
npm install
npm run dev
```

2. Backend Setup:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

3. Docker Setup (Alternative):

```bash
docker-compose up --build
```

### Environment Variables

1. Frontend (.env.local):

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

2. Backend (.env):

```
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
```

## Available Services

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Architecture

- Frontend: Next.js with TypeScript, styled-components, and SWR
- Backend: FastAPI with Pydantic and in-memory queue
- Integration: Plaid for bank account connections
- Containerization: Docker with multi-stage builds
