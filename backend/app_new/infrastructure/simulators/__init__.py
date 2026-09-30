"""Simulator factory — registry pattern (Open/Closed: register new simulators without changing callers)."""
from typing import Callable

from app_new.infrastructure.simulators.base.simulator import Simulator, SimulationStatus
from app_new.infrastructure.simulators.verilator.verilator_simulator import VerilatorSimulator
from app_new.infrastructure.simulators.icarus.icarus_simulator import IcarusSimulator


_REGISTRY: dict[str, Callable[..., Simulator]] = {}


def register_simulator(name: str, factory: Callable[..., Simulator]) -> None:
    """Register a simulator factory under a name."""
    _REGISTRY[name.lower()] = factory


def create_simulator(name: str, timeout: int = 5) -> Simulator:
    """Create a simulator by name. Falls back to Verilator."""
    factory = _REGISTRY.get(name.lower())
    if factory is None:
        factory = _REGISTRY["verilator"]
    return factory(timeout=timeout)


# Built-in registrations
register_simulator("verilator", VerilatorSimulator)
register_simulator("icarus", IcarusSimulator)


def parse_testbench_output(output: str) -> list:
    """Parse HDLFORGE_TEST_* markers from testbench stdout."""
    from app_new.infrastructure.simulators.base.simulator import ParsedTest

    tests: list[ParsedTest] = []
    current_name = ""
    expected = ""
    received = ""

    for raw_line in output.splitlines():
        line = raw_line.strip()
        if line.startswith("HDLFORGE_TEST_NAME:"):
            current_name = line.split(":", 1)[1]
        elif line.startswith("HDLFORGE_EXPECTED:"):
            expected = line.split(":", 1)[1]
        elif line.startswith("HDLFORGE_RECEIVED:"):
            received = line.split(":", 1)[1]
        elif line == "HDLFORGE_TEST_PASS":
            tests.append(ParsedTest(name=current_name, passed=True, expected=expected, received=received))
            expected, received = "", ""
        elif line == "HDLFORGE_TEST_FAIL":
            tests.append(ParsedTest(name=current_name, passed=False, expected=expected, received=received))
            expected, received = "", ""

    return tests


__all__ = [
    "register_simulator",
    "create_simulator",
    "parse_testbench_output",
    "SimulationStatus",
]