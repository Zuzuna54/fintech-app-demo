import pytest
import asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from httpx import AsyncClient
from main import app

@pytest.fixture(scope="session")
def event_loop_policy():
    """Create and return the event loop policy for the test session."""
    return asyncio.get_event_loop_policy()

@pytest.fixture(scope="session")
def event_loop(event_loop_policy: asyncio.AbstractEventLoopPolicy) -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create and return an event loop for the test session."""
    loop = event_loop_policy.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def client() -> TestClient:
    """Create a test client for the FastAPI application."""
    return TestClient(app)

@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client for the FastAPI application."""
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client

@pytest.fixture(autouse=True)
def mock_queue_worker(monkeypatch):
    """Mock the queue worker to process payments immediately in tests."""
    from message_queue.message_queue import enqueue_payment
    from domain.models import PaymentStatus
    from domain.db import payments_db

    async def mock_process_payment(payment_id: str) -> None:
        if payment_id in payments_db:
            payment = payments_db[payment_id]
            payment.status = PaymentStatus.COMPLETED

    async def mock_enqueue_payment(payment_id: str) -> None:
        await mock_process_payment(payment_id)

    monkeypatch.setattr("message_queue.message_queue.enqueue_payment", mock_enqueue_payment)
    return mock_enqueue_payment