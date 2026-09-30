"""Domain exceptions."""
from typing import Any


class DomainException(Exception):
    """Base domain exception."""
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class EntityNotFoundException(DomainException):
    """Raised when an entity is not found."""
    def __init__(self, entity_type: str, identifier: Any):
        super().__init__(
            f"{entity_type} not found: {identifier}",
            {"entity_type": entity_type, "identifier": str(identifier)}
        )


class EntityAlreadyExistsException(DomainException):
    """Raised when trying to create an entity that already exists."""
    def __init__(self, entity_type: str, identifier: Any):
        super().__init__(
            f"{entity_type} already exists: {identifier}",
            {"entity_type": entity_type, "identifier": str(identifier)}
        )


class InvalidEntityStateException(DomainException):
    """Raised when an entity is in an invalid state for the operation."""
    def __init__(self, entity_type: str, message: str):
        super().__init__(
            f"Invalid state for {entity_type}: {message}",
            {"entity_type": entity_type, "message": message}
        )


class BusinessRuleViolationException(DomainException):
    """Raised when a business rule is violated."""
    def __init__(self, rule: str, message: str):
        super().__init__(
            f"Business rule violation: {rule} - {message}",
            {"rule": rule, "message": message}
        )


class ValidationException(DomainException):
    """Raised when validation fails."""
    def __init__(self, field: str, message: str):
        super().__init__(
            f"Validation error for {field}: {message}",
            {"field": field, "message": message}
        )