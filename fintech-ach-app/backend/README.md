# Fintech ACH Application Backend

A comprehensive banking and payment processing system built with FastAPI, PostgreSQL, and Redis.

## Quick Start

1. **Prerequisites**

   - Python 3.9+
   - PostgreSQL
   - Redis

2. **Setup**

   ```bash
   # Clone repository
   git clone <repository-url>
   cd fintech-ach-app/backend

   # Create and activate virtual environment
   python -m venv venv
   source venv/bin/activate  # Unix
   # or
   .\venv\Scripts\activate  # Windows

   # Install dependencies
   pip install -r requirements.txt

   # Set up environment variables
   cp .env.example .env
   # Edit .env with your configuration

   # Create database and run migrations
   createdb fintech_ach_db
   alembic upgrade head

   # Start the application
   uvicorn main:app --reload
   ```

3. **Test Users**
   - Superuser: test.admin@example.com / password123
   - Org Admin: admin1@example.com / password123

## Documentation

For comprehensive documentation, including:

- System Architecture
- API Documentation
- Database Schema
- Authentication & Authorization
- Data Flows
- And more...

Please see [DOCUMENTATION.md](./DOCUMENTATION.md)

## Development

- API documentation available at: http://localhost:8000/docs
- ReDoc alternative: http://localhost:8000/redoc
- OpenAPI Schema: http://localhost:8000/openapi.json

## Testing

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=.
```

## License

[MIT License](LICENSE)
