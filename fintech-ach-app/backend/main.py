from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
import json
from datetime import datetime
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from dotenv import load_dotenv
from config.database import init_db
from message_queue.redis_queue import RedisQueue
from message_queue.queue_worker import start_background_workers
from auth.routes import router as auth_router
from auth.management import router as management_router
from api.plaid_integration import router as plaid_router
from api.payments import router as payments_router
from api.accounts import router as accounts_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
logger.info("Environment variables loaded")

# Initialize Redis queue
queue = RedisQueue(os.getenv("REDIS_URL", "redis://localhost:6379"))
logger.info("Redis queue initialized")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = datetime.now()
        
        # Extract request details
        request_id = os.urandom(8).hex()
        request.state.request_id = request_id
        request.state.timestamp = start_time.isoformat()
        
        request_details = {
            "id": request_id,
            "method": request.method,
            "url": str(request.url),
            "client_ip": request.client.host,
            "user_agent": request.headers.get("user-agent", "unknown"),
            "timestamp": start_time.isoformat()
        }
        
        # Log request
        logger.info("Incoming request", extra={"request": request_details})
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration = (datetime.now() - start_time).total_seconds()
            
            # Log response
            logger.info(
                "Request completed",
                extra={
                    "request_id": request_id,
                    "status_code": response.status_code,
                    "duration": duration
                }
            )
            
            return response
            
        except Exception as e:
            # Log error
            logger.error(
                "Request failed",
                extra={
                    "request_id": request_id,
                    "error": str(e),
                    "duration": (datetime.now() - start_time).total_seconds()
                },
                exc_info=True
            )
            raise

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events manager for FastAPI application."""
    try:
        # Startup: Initialize database and workers
        logger.info("Starting application initialization")
        await init_db()
        logger.info("Database initialized")
        workers = start_background_workers()
        logger.info("Background workers started")
        yield
        # Shutdown: Clean up resources
        logger.info("Starting application shutdown")
        for worker in workers:
            if not worker.done():
                worker.cancel()
        logger.info("Application shutdown complete")
    except Exception as e:
        logger.error(f"Error during application lifecycle: {str(e)}", exc_info=True)
        raise

app = FastAPI(lifespan=lifespan, title="Fintech ACH API")

# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)
logger.info("CORS middleware configured")

@app.get("/queue/stats")
async def get_queue_stats(request: Request):
    """Get current queue statistics."""
    try:
        stats = await queue.get_queue_stats()
        logger.info("Queue stats retrieved successfully")
        return stats
    except Exception as e:
        logger.error(f"Error retrieving queue stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error retrieving queue statistics")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        logger.info("Health check endpoint called")
        # Add basic system checks here
        return {"status": "healthy"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="System health check failed")

# Include routers
app.include_router(auth_router, tags=["auth"])
app.include_router(management_router, tags=["management"])
app.include_router(accounts_router, tags=["accounts"])
app.include_router(payments_router, tags=["payments"])
app.include_router(plaid_router, tags=["plaid"])
logger.info("API routers configured")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting application server")
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=True
    ) 