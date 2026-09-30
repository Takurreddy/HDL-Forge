"""Domain event base class for domain-driven design."""
from abc import ABC
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4


@dataclass
class DomainEvent(ABC):
    """Base class for all domain events."""
    event_id: UUID = field(default_factory=uuid4)
    occurred_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    event_type: str = field(init=False)

    def __post_init__(self) -> None:
        self.event_type = self.__class__.__name__

    def to_dict(self) -> dict[str, Any]:
        """Convert event to dictionary for serialization."""
        return {
            "event_id": str(self.event_id),
            "event_type": self.event_type,
            "occurred_at": self.occurred_at.isoformat(),
            **self._event_data(),
        }

    def _event_data(self) -> dict[str, Any]:
        """Override to include event-specific data."""
        return {}