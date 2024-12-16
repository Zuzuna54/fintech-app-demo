import asyncio
from typing import Optional
from uuid import UUID

# Create an async queue for payments
payment_queue: asyncio.Queue[str] = asyncio.Queue()

async def enqueue_payment(payment_id: str) -> None:
    """Add a payment to the processing queue."""
    await payment_queue.put(payment_id)

async def dequeue_payment() -> Optional[str]:
    """Get the next payment from the queue."""
    try:
        return await payment_queue.get()
    except asyncio.QueueEmpty:
        return None 