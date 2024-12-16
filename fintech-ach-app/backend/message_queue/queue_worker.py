import asyncio
import logging
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from domain.sql_models import (
    Payment,
    PaymentStatus,
    InternalOrganizationBankAccount,
    ExternalOrganizationBankAccount
)
from config.database import get_db
from .redis_queue import RedisQueue

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Redis queue
queue = RedisQueue()

async def process_payment(payment: Payment, session: AsyncSession) -> bool:
    """Process a single payment."""
    try:
        # Get accounts
        from_account = await session.get(ExternalOrganizationBankAccount, payment.from_account)
        to_account = await session.get(InternalOrganizationBankAccount, payment.to_account)
            
        if not from_account or not to_account:
            logger.error(f"Account not found for payment {payment.uuid}")
            payment.status = PaymentStatus.FAILED
            await session.commit()
            return False
            
        # Check sufficient funds
        if from_account.balance < payment.amount:
            logger.error(f"Insufficient funds for payment {payment.uuid}")
            payment.status = PaymentStatus.FAILED
            await session.commit()
            return False
            
        # Process payment
        from_account.balance -= payment.amount
        to_account.balance += payment.amount
        payment.status = PaymentStatus.COMPLETED
        
        await session.commit()
        logger.info(f"Successfully processed payment {payment.uuid}")
        return True
        
    except Exception as e:
        logger.error(f"Error processing payment {payment.uuid}: {str(e)}")
        payment.status = PaymentStatus.FAILED
        await session.commit()
        return False

async def process_payment_queue() -> None:
    """Process payments from the queue."""
    try:
        while True:
            try:
                # Get next payment from queue
                payment_data = await queue.dequeue_payment()
                if not payment_data:
                    await asyncio.sleep(1)  # Wait before checking again
                    continue

                payment_id = payment_data["payment_id"]
                
                # Get DB session
                async for session in get_db():
                    # Get payment from DB
                    payment = await session.get(Payment, UUID(payment_id))
                    if not payment:
                        logger.error(f"Payment {payment_id} not found in database")
                        continue
                        
                    # Process payment
                    success = await process_payment(payment, session)
                    
                    if success:
                        await queue.complete_payment(payment_id)
                    else:
                        # Retry failed payment
                        retry_success = await queue.retry_payment(payment_id, payment_data)
                        if not retry_success:
                            logger.error(f"Payment {payment_id} failed after max retries")
                
            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.error(f"Error in payment queue processing: {str(e)}")
                await asyncio.sleep(1)  # Wait before retrying
                
    except asyncio.CancelledError:
        logger.info("Payment queue worker cancelled")
        raise

async def cleanup_worker() -> None:
    """Periodically clean up stale processing items."""
    try:
        while True:
            try:
                await queue.cleanup_stale_processing()
                await asyncio.sleep(300)  # Run every 5 minutes
            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.error(f"Error in cleanup worker: {str(e)}")
                await asyncio.sleep(60)  # Wait before retrying
    except asyncio.CancelledError:
        logger.info("Cleanup worker cancelled")
        raise

async def monitor_worker() -> None:
    """Periodically log queue statistics."""
    try:
        while True:
            try:
                stats = await queue.get_queue_stats()
                logger.info(f"Queue stats: {stats}")
                await asyncio.sleep(60)  # Log every minute
            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.error(f"Error in monitor worker: {str(e)}")
                await asyncio.sleep(60)  # Wait before retrying
    except asyncio.CancelledError:
        logger.info("Monitor worker cancelled")
        raise

async def start_worker() -> None:
    """Start all workers."""
    logger.info("Starting queue workers...")
    try:
        # Start all workers concurrently
        await asyncio.gather(
            process_payment_queue(),
            cleanup_worker(),
            monitor_worker()
        )
    except asyncio.CancelledError:
        logger.info("Queue workers stopped")
        raise

# Create background tasks for the workers
worker_tasks = []

def start_background_workers():
    """Start all workers in the background."""
    global worker_tasks
    loop = asyncio.get_event_loop()
    if not worker_tasks:
        worker_tasks = [
            loop.create_task(start_worker())
        ]
    return worker_tasks