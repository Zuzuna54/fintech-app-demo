import json
import logging
from typing import Optional, Dict, Any
import redis
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class RedisQueue:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.main_queue = "payment_queue"
        self.processing_queue = "payment_processing"
        self.dead_letter_queue = "payment_dlq"
        self.retry_count_hash = "payment_retry_count"
        self.max_retries = 3

    async def enqueue_payment(self, payment_id: str, payload: Dict[str, Any]) -> None:
        """Add a payment to the processing queue."""
        try:
            self.redis.lpush(self.main_queue, json.dumps({
                "payment_id": payment_id,
                "payload": payload,
                "timestamp": datetime.utcnow().isoformat()
            }))
            logger.info(f"Payment {payment_id} enqueued successfully")
        except Exception as e:
            logger.error(f"Error enqueueing payment {payment_id}: {str(e)}")
            raise

    async def dequeue_payment(self) -> Optional[Dict[str, Any]]:
        """Get the next payment from the queue with visibility timeout."""
        try:
            # Move item from main queue to processing queue
            data = self.redis.brpoplpush(self.main_queue, self.processing_queue, timeout=1)
            if not data:
                return None

            payment_data = json.loads(data)
            payment_id = payment_data["payment_id"]
            
            # Set initial retry count if not exists
            self.redis.hsetnx(self.retry_count_hash, payment_id, 0)
            
            return payment_data
        except Exception as e:
            logger.error(f"Error dequeuing payment: {str(e)}")
            return None

    async def complete_payment(self, payment_id: str) -> None:
        """Mark a payment as completed and remove from processing queue."""
        try:
            # Find and remove the payment from processing queue
            processing_items = self.redis.lrange(self.processing_queue, 0, -1)
            for item in processing_items:
                data = json.loads(item)
                if data["payment_id"] == payment_id:
                    self.redis.lrem(self.processing_queue, 1, item)
                    self.redis.hdel(self.retry_count_hash, payment_id)
                    logger.info(f"Payment {payment_id} completed successfully")
                    return
        except Exception as e:
            logger.error(f"Error completing payment {payment_id}: {str(e)}")
            raise

    async def retry_payment(self, payment_id: str, payment_data: Dict[str, Any]) -> bool:
        """Retry a failed payment if under max retries, otherwise move to DLQ."""
        try:
            retry_count = int(self.redis.hget(self.retry_count_hash, payment_id) or 0)
            retry_count += 1
            
            if retry_count <= self.max_retries:
                # Update retry count and re-queue
                self.redis.hset(self.retry_count_hash, payment_id, retry_count)
                payment_data["retries"] = retry_count
                payment_data["timestamp"] = datetime.utcnow().isoformat()
                self.redis.lpush(self.main_queue, json.dumps(payment_data))
                logger.info(f"Payment {payment_id} requeued for retry {retry_count}/{self.max_retries}")
                return True
            else:
                # Move to dead letter queue
                self.redis.lpush(self.dead_letter_queue, json.dumps(payment_data))
                self.redis.hdel(self.retry_count_hash, payment_id)
                logger.warning(f"Payment {payment_id} moved to DLQ after {retry_count} retries")
                return False
        except Exception as e:
            logger.error(f"Error retrying payment {payment_id}: {str(e)}")
            raise

    async def get_queue_stats(self) -> Dict[str, int]:
        """Get current queue statistics."""
        try:
            return {
                "main_queue_size": self.redis.llen(self.main_queue),
                "processing_queue_size": self.redis.llen(self.processing_queue),
                "dead_letter_queue_size": self.redis.llen(self.dead_letter_queue)
            }
        except Exception as e:
            logger.error(f"Error getting queue stats: {str(e)}")
            raise

    async def cleanup_stale_processing(self, timeout_minutes: int = 30) -> None:
        """Clean up stale items in processing queue."""
        try:
            cutoff_time = datetime.utcnow() - timedelta(minutes=timeout_minutes)
            processing_items = self.redis.lrange(self.processing_queue, 0, -1)
            
            for item in processing_items:
                data = json.loads(item)
                timestamp = datetime.fromisoformat(data["timestamp"])
                
                if timestamp < cutoff_time:
                    # Retry stale payment
                    self.redis.lrem(self.processing_queue, 1, item)
                    await self.retry_payment(data["payment_id"], data)
                    logger.info(f"Cleaned up stale payment {data['payment_id']}")
        except Exception as e:
            logger.error(f"Error cleaning up stale processing: {str(e)}")
            raise 