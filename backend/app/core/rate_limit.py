import time
import functools
from collections import defaultdict
from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitStore:
    """Simple in-memory rate limit storage using sliding window."""

    def __init__(self):
        self._requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_calls: int, period: int) -> tuple[bool, int, float]:
        """
        Check if a request is allowed.
        Returns (allowed, remaining, retry_after_seconds).
        """
        now = time.time()
        window_start = now - period

        # Clean old entries
        self._requests[key] = [t for t in self._requests[key] if t > window_start]

        current_count = len(self._requests[key])

        if current_count >= max_calls:
            # Calculate retry-after
            oldest = self._requests[key][0]
            retry_after = oldest + period - now
            return False, 0, max(retry_after, 1.0)

        # Allow request
        self._requests[key].append(now)
        remaining = max_calls - current_count - 1
        return True, remaining, 0.0

    def cleanup(self, max_age: int = 3600):
        """Remove entries older than max_age seconds."""
        now = time.time()
        cutoff = now - max_age
        keys_to_delete = []
        for key, timestamps in self._requests.items():
            self._requests[key] = [t for t in timestamps if t > cutoff]
            if not self._requests[key]:
                keys_to_delete.append(key)
        for key in keys_to_delete:
            del self._requests[key]


# Global store instance
_store = RateLimitStore()


def rate_limit(max_calls: int = 60, period: int = 60):
    """
    Decorator for rate limiting FastAPI endpoints.

    Args:
        max_calls: Maximum number of calls allowed in the period.
        period: Time period in seconds.
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from kwargs
            request = kwargs.get("request")
            if request is None:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if request is None:
                return await func(*args, **kwargs)

            # Build key from client IP and endpoint path
            client_ip = request.client.host if request.client else "unknown"
            key = f"{client_ip}:{request.url.path}"

            allowed, remaining, retry_after = _store.is_allowed(key, max_calls, period)

            if not allowed:
                raise HTTPException(
                    status_code=429,
                    detail="Demasiadas solicitudes. Intenta de nuevo mas tarde.",
                    headers={
                        "Retry-After": str(int(retry_after)),
                        "X-RateLimit-Limit": str(max_calls),
                        "X-RateLimit-Remaining": "0",
                    },
                )

            return await func(*args, **kwargs)

        return wrapper
    return decorator


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Global rate limiting middleware.
    Applies a generous global limit to all endpoints.
    """

    def __init__(self, app, max_calls: int = 120, period: int = 60):
        super().__init__(app)
        self.max_calls = max_calls
        self.period = period

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip rate limiting for health check and docs
        if request.url.path in ("/health", "/docs", "/redoc", "/openapi.json"):
            return await call_next(request)

        # Skip CORS preflight requests
        if request.method == "OPTIONS":
            return await call_next(request)

        # Skip WebSocket connections
        if request.url.path.startswith("/ws"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        key = f"global:{client_ip}"

        allowed, remaining, retry_after = _store.is_allowed(key, self.max_calls, self.period)

        if not allowed:
            from starlette.responses import JSONResponse
            return JSONResponse(
                status_code=429,
                content={"detail": "Demasiadas solicitudes. Intenta de nuevo mas tarde."},
                headers={
                    "Retry-After": str(int(retry_after)),
                    "X-RateLimit-Limit": str(self.max_calls),
                    "X-RateLimit-Remaining": "0",
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.max_calls)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
