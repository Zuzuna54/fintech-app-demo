import logging
import logging.handlers
import os
from datetime import datetime

# Create logs directory if it doesn't exist
LOGS_DIR = "logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

# Define log file paths
ERROR_LOG = os.path.join(LOGS_DIR, "error.log")
INFO_LOG = os.path.join(LOGS_DIR, "info.log")
DEBUG_LOG = os.path.join(LOGS_DIR, "debug.log")
AUTH_LOG = os.path.join(LOGS_DIR, "auth.log")

# Custom formatter with more details
class DetailedFormatter(logging.Formatter):
    def format(self, record):
        record.request_id = getattr(record, 'request_id', '-')
        record.user_id = getattr(record, 'user_id', '-')
        record.ip = getattr(record, 'ip', '-')
        
        return super().format(record)

# Logging configuration
LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'detailed': {
            '()': DetailedFormatter,
            'format': '[%(asctime)s] %(levelname)s [%(name)s:%(lineno)s] [%(request_id)s] [User:%(user_id)s] [IP:%(ip)s] %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
        'simple': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'INFO',
            'formatter': 'simple',
            'stream': 'ext://sys.stdout'
        },
        'error_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': 'ERROR',
            'formatter': 'detailed',
            'filename': ERROR_LOG,
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5
        },
        'info_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': 'INFO',
            'formatter': 'detailed',
            'filename': INFO_LOG,
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5
        },
        'debug_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': 'DEBUG',
            'formatter': 'detailed',
            'filename': DEBUG_LOG,
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5
        },
        'auth_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': 'INFO',
            'formatter': 'detailed',
            'filename': AUTH_LOG,
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5
        }
    },
    'loggers': {
        '': {  # Root logger
            'handlers': ['console', 'error_file', 'info_file', 'debug_file'],
            'level': 'DEBUG',
            'propagate': True
        },
        'auth': {  # Auth specific logger
            'handlers': ['auth_file', 'error_file'],
            'level': 'DEBUG',
            'propagate': False
        },
        'uvicorn': {
            'handlers': ['info_file'],
            'level': 'INFO',
            'propagate': False
        },
        'sqlalchemy': {
            'handlers': ['debug_file'],
            'level': 'WARNING',
            'propagate': False
        }
    }
}

def setup_logging():
    """Initialize logging configuration"""
    logging.config.dictConfig(LOGGING_CONFIG)

def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name"""
    return logging.getLogger(name) 