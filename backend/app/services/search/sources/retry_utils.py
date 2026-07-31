"""
Innovix — Retry Utilities for External API Calls

Provides a reusable retry decorator for HTTP requests to external services.
Uses tenacity for exponential backoff with configurable attempts.
"""

import logging

logger = logging.getLogger(__name__)

try:
    from tenacity import (
        retry,
        stop_after_attempt,
        wait_exponential,
        retry_if_exception_type,
        before_sleep_log,
    )
    import httpx

    # Reusable retry decorator for httpx calls
    # Retries up to 3 times with exponential backoff (1s, 2s, 4s)
    retry_on_http_error = retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((
            httpx.TimeoutException,
            httpx.ConnectError,
            httpx.ReadTimeout,
        )),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )

    TENACITY_AVAILABLE = True

except ImportError:
    logger.warning("[Retry] tenacity not installed — retry logic disabled")
    TENACITY_AVAILABLE = False

    # No-op decorator when tenacity is not available
    def retry_on_http_error(func):
        return func
