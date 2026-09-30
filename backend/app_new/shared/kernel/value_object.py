"""Base value object class for domain value objects."""
from abc import ABC
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True, eq=False)
class ValueObject(ABC):
    """Base class for all value objects. Immutable and compared by value."""

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, self.__class__):
            return False
        return self.__dict__ == other.__dict__

    def __hash__(self) -> int:
        return hash(tuple(sorted(self.__dict__.items())))