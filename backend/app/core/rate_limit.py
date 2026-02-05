"""
Simple in-memory rate limiting middleware.
For production, consider using Redis-based rate limiting.
"""
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Callable

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import settings


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting."""
    # Default limits (requests per minute)
    default_rpm: int = 100
    # Auth endpoints (login, etc.) - stricter limits
    auth_rpm: int = 10
    # Admin endpoints
    admin_rpm: int = 30
    # Write operations (POST, PUT, DELETE)
    write_rpm: int = 60


@dataclass
class RequestCounter:
    """Track request counts with sliding window."""
    counts: dict = field(default_factory=lambda: defaultdict(list))

    def is_rate_limited(self, key: str, limit: int, window_seconds: int = 60) -> bool:
        """Check if the key has exceeded the rate limit."""
        now = time.time()
        cutoff = now - window_seconds

        # Clean old entries
        self.counts[key] = [t for t in self.counts[key] if t > cutoff]

        # Check if over limit
        if len(self.counts[key]) >= limit:
            return True

        # Record this request
        self.counts[key].append(now)
        return False

    def get_remaining(self, key: str, limit: int, window_seconds: int = 60) -> int:
        """Get remaining requests in the current window."""
        now = time.time()
        cutoff = now - window_seconds
        current_count = len([t for t in self.counts[key] if t > cutoff])
        return max(0, limit - current_count)

    def cleanup(self, max_age_seconds: int = 120) -> None:
        """Remove stale entries to prevent memory leaks."""
        now = time.time()
        cutoff = now - max_age_seconds
        keys_to_remove = []

        for key, timestamps in self.counts.items():
            self.counts[key] = [t for t in timestamps if t > cutoff]
            if not self.counts[key]:
                keys_to_remove.append(key)

        for key in keys_to_remove:
            del self.counts[key]


# Global rate limit counter (for single-instance deployments)
# For multi-instance, use Redis instead
_counter = RequestCounter()
_config = RateLimitConfig()
_last_cleanup = time.time()


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, considering proxies."""
    # Check X-Forwarded-For header (set by proxies/load balancers)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP in the chain (original client)
        return forwarded_for.split(",")[0].strip()

    # Check X-Real-IP header (nginx)
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # Fall back to direct client IP
    if request.client:
        return request.client.host

    return "unknown"


def get_rate_limit_for_path(path: str, method: str) -> int:
    """Determine the rate limit based on the request path and method."""
    path_lower = path.lower()

    # Auth endpoints - strictest limits (prevent brute force)
    if "/auth/" in path_lower or path_lower.endswith("/auth"):
        return _config.auth_rpm

    # Admin endpoints
    if "/admin/" in path_lower:
        return _config.admin_rpm

    # Write operations
    if method in ("POST", "PUT", "PATCH", "DELETE"):
        return _config.write_rpm

    # Default for read operations
    return _config.default_rpm


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using sliding window algorithm.

    Limits are per-IP and vary by endpoint type:
    - Auth endpoints: 10 req/min (prevent brute force)
    - Admin endpoints: 30 req/min
    - Write operations: 60 req/min
    - Read operations: 100 req/min
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        global _last_cleanup

        # Skip rate limiting in development if configured
        if settings.env == "dev" and not getattr(settings, 'rate_limit_in_dev', False):
            return await call_next(request)

        # Skip health checks
        if request.url.path in ("/api/health", "/api/health/db", "/health"):
            return await call_next(request)

        # Periodic cleanup (every 2 minutes)
        now = time.time()
        if now - _last_cleanup > 120:
            _counter.cleanup()
            _last_cleanup = now

        # Get client identifier
        client_ip = get_client_ip(request)

        # Determine rate limit for this request
        limit = get_rate_limit_for_path(request.url.path, request.method)

        # Create rate limit key (IP + path prefix for granular limits)
        path_prefix = "/".join(request.url.path.split("/")[:4])  # e.g., /api/auth/login
        rate_key = f"{client_ip}:{path_prefix}"

        # Check rate limit
        if _counter.is_rate_limited(rate_key, limit):
            remaining = _counter.get_remaining(rate_key, limit)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "rate_limit_exceeded",
                    "message": "Trop de requêtes. Veuillez réessayer plus tard.",
                    "retry_after_seconds": 60,
                },
                headers={
                    "Retry-After": "60",
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": str(remaining),
                },
            )

        # Process request and add rate limit headers
        response = await call_next(request)

        remaining = _counter.get_remaining(rate_key, limit)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)

        return response
