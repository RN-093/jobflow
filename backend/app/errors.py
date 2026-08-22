from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class ApiError(Exception):
    def __init__(self, code: str, message: str, status_code: int, details: Any = None) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details


def unauthorized(message: str = "Unauthorized", details: Any = None) -> ApiError:
    return ApiError("unauthorized", message, status.HTTP_401_UNAUTHORIZED, details)


def forbidden(message: str = "Forbidden", details: Any = None) -> ApiError:
    return ApiError("forbidden", message, status.HTTP_403_FORBIDDEN, details)


def not_found(message: str = "Not found", details: Any = None) -> ApiError:
    return ApiError("not_found", message, status.HTTP_404_NOT_FOUND, details)


def conflict(message: str = "Conflict", details: Any = None) -> ApiError:
    return ApiError("conflict", message, status.HTTP_409_CONFLICT, details)


def validation_error(message: str = "Validation error", details: Any = None) -> ApiError:
    return ApiError("validation_error", message, status.HTTP_422_UNPROCESSABLE_ENTITY, details)


def _envelope(code: str, message: str, details: Any = None) -> dict:
    return {"error": {"code": code, "message": message, "details": details}}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def handle_api_error(request: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=_envelope(exc.code, exc.message, exc.details))

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_envelope("validation_error", "Validation failed", exc.errors()),
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        code_map = {
            401: "unauthorized",
            403: "forbidden",
            404: "not_found",
            409: "conflict",
            422: "validation_error",
        }
        code = code_map.get(exc.status_code, "error")
        message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return JSONResponse(status_code=exc.status_code, content=_envelope(code, message, None))
