"""Application ports - interfaces for external dependencies."""
from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app_new.domain.value_objects.execution import (
    ExecutionJobData,
    SimulationStatus,
    SimulatorType,
)
from app_new.domain.value_objects.problems import TestCase


class HDLExecutionPort(ABC):
    """Port for HDL code execution."""

    @abstractmethod
    async def execute(self, job: ExecutionJobData) -> "ExecutionResult":
        """Execute HDL code against testbench."""
        ...

    @abstractmethod
    async def compile_only(self, job: ExecutionJobData) -> "CompilationResult":
        """Compile HDL code without running simulation."""
        ...


class ExecutionResult:
    """Result of HDL execution."""
    def __init__(
        self,
        status: SimulationStatus,
        score: int,
        message: str,
        compilation_output: str,
        simulation_output: str,
        tests: list[TestCase],
    ):
        self.status = status
        self.score = score
        self.message = message
        self.compilation_output = compilation_output
        self.simulation_output = simulation_output
        self.tests = tests


class CompilationResult:
    """Result of HDL compilation."""
    def __init__(
        self,
        status: SimulationStatus,
        output: str,
    ):
        self.status = status
        self.output = output


class WaveformStoragePort(ABC):
    """Port for waveform storage."""

    @abstractmethod
    async def save_waveform(self, submission_id: UUID, vcd_data: bytes) -> str:
        """Save waveform and return waveform ID."""
        ...

    @abstractmethod
    async def get_waveform(self, waveform_id: str) -> Optional[bytes]:
        """Get waveform data by ID."""
        ...

    @abstractmethod
    async def delete_waveform(self, waveform_id: str) -> bool:
        """Delete waveform by ID."""
        ...


class AIServicePort(ABC):
    """Port for AI assistance services."""

    @abstractmethod
    async def get_hint(self, problem_slug: str, code: str, error: str) -> str:
        """Get AI hint for a problem."""
        ...

    @abstractmethod
    async def explain_code(self, code: str) -> str:
        """Explain HDL code."""
        ...

    @abstractmethod
    async def suggest_fix(self, code: str, error: str) -> str:
        """Suggest fix for compilation/runtime error."""
        ...


class AuthenticationPort(ABC):
    """Port for authentication services."""

    @abstractmethod
    async def hash_password(self, password: str) -> str:
        """Hash a password."""
        ...

    @abstractmethod
    async def verify_password(self, password: str, hashed: str) -> bool:
        """Verify a password against hash."""
        ...

    @abstractmethod
    async def create_token(self, user_id: UUID) -> str:
        """Create access token for user."""
        ...

    @abstractmethod
    async def verify_token(self, token: str) -> Optional[UUID]:
        """Verify token and return user ID."""
        ...

    @abstractmethod
    async def create_refresh_token(self, user_id: UUID) -> str:
        """Create refresh token."""
        ...

    @abstractmethod
    async def verify_refresh_token(self, token: str) -> Optional[UUID]:
        """Verify refresh token."""
        ...


class EmailServicePort(ABC):
    """Port for email services."""

    @abstractmethod
    async def send_email(self, to: str, subject: str, body: str) -> bool:
        """Send an email."""
        ...

    @abstractmethod
    async def send_verification_email(self, email: str, token: str) -> bool:
        """Send email verification."""
        ...

    @abstractmethod
    async def send_password_reset_email(self, email: str, token: str) -> bool:
        """Send password reset email."""
        ...