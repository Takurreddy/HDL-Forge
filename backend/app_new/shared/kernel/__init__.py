"""Shared kernel - core building blocks used across all layers."""
from app_new.shared.kernel.base_entity import BaseEntity
from app_new.shared.kernel.value_object import ValueObject
from app_new.shared.kernel.domain_event import DomainEvent
from app_new.shared.kernel.repository import Repository
from app_new.shared.kernel.unit_of_work import UnitOfWork

__all__ = [
    "BaseEntity",
    "ValueObject",
    "DomainEvent",
    "Repository",
    "UnitOfWork",
]