"""HDL execution adapter — implements the application's HDLExecutionPort (DIP).

Orchestrates: workspace lifecycle -> simulator compile -> simulate -> testbench parse.
Falls back from Docker sandbox to direct execution when the sandbox fails.
"""
import logging
import re
import time

from app_new.application.ports import HDLExecutionPort, ExecutionResult, CompilationResult
from app_new.domain.value_objects.execution import SimulationStatus, SimulatorType
from app_new.infrastructure.configuration import config
from app_new.infrastructure.sandbox.workspace import Workspace
from app_new.infrastructure.sandbox.docker_sandbox import DockerSandbox
from app_new.infrastructure.simulators import (
    create_simulator,
    parse_testbench_output,
)

logger = logging.getLogger(__name__)


class HDLExecutionAdapter(HDLExecutionPort):
    """Concrete execution adapter wiring simulators + sandbox + workspace."""

    def __init__(self, use_docker: bool | None = None, simulator_name: str | None = None):
        self._simulator_name = simulator_name or config.execution.simulator
        if use_docker is None:
            use_docker = config.execution.use_docker
        self._use_docker = bool(use_docker and DockerSandbox.is_available())
        self._sandbox = DockerSandbox() if self._use_docker else None

    async def execute(self, job: dict) -> ExecutionResult:
        start = time.time()

        with Workspace() as workspace:
            workspace.write_submission(job["code"])
            testbench = job["testbench_code"]
            if job.get("waveform_enabled"):
                testbench = self._inject_vcd_dump(testbench)
            workspace.write_testbench(testbench)

            timeout = job.get("timeout_seconds") or config.execution.default_timeout
            memory_mb = job.get("memory_mb") or config.execution.default_memory_mb

            simulator = create_simulator(self._simulator_name, timeout=timeout)

            if self._use_docker and self._sandbox:
                result = self._execute_in_sandbox(workspace, job, timeout, memory_mb)
                if result is None or (
                    result.status == SimulationStatus.SYSTEM_ERROR
                    and "Sandbox" in result.message
                ):
                    logger.warning("Sandbox failed, falling back to direct execution")
                    result = self._execute_direct(workspace, simulator, job)
            else:
                result = self._execute_direct(workspace, simulator, job)

            # Parse testbench markers
            output = result.simulation_output or ""
            parsed_tests = parse_testbench_output(output)

            if parsed_tests:
                passed = sum(1 for t in parsed_tests if t.passed)
                score = int(round(100 * passed / len(parsed_tests)))
                if passed == len(parsed_tests):
                    status = SimulationStatus.PASSED
                elif passed == 0:
                    status = SimulationStatus.FAILED
                else:
                    status = SimulationStatus.FAILED
            else:
                score = 100 if result.status == SimulationStatus.PASSED else 0
                parsed_tests = []
                status = result.status

            # Collect VCD if requested
            vcd_data = None
            if job.get("waveform_enabled") and workspace.has_vcd():
                vcd_data = workspace.read_vcd()

            elapsed = time.time() - start
            logger.info(
                "job=%s status=%s score=%d elapsed=%.2fs",
                workspace.job_id, status.value, score, elapsed,
            )

            return ExecutionResult(
                status=status,
                score=score,
                message=result.message,
                compilation_output=result.compilation_output,
                simulation_output=output,
                tests=parsed_tests,
                vcd_data=vcd_data,
            )

    async def compile_only(self, job: dict) -> CompilationResult:
        with Workspace() as workspace:
            workspace.write_submission(job["code"])
            workspace.write_testbench(job["testbench_code"])

            timeout = job.get("timeout_seconds") or config.execution.default_timeout
            simulator = create_simulator(self._simulator_name, timeout=timeout)
            result = simulator.compile(
                submission_path=workspace.submission_path,
                testbench_path=workspace.testbench_path,
            )
            return CompilationResult(
                status=result.status,
                output=result.compilation_output,
            )

    def _execute_direct(self, workspace: Workspace, simulator, job: dict):
        compile_result = simulator.compile(
            submission_path=workspace.submission_path,
            testbench_path=workspace.testbench_path,
            trace_enabled=bool(job.get("waveform_enabled")),
        )
        if compile_result.status != SimulationStatus.COMPILATION_OK:
            return compile_result
        return simulator.simulate(simulator.binary_path(workspace.path))

    def _execute_in_sandbox(
        self, workspace: Workspace, job: dict, timeout: int, memory_mb: int
    ):
        assert self._sandbox is not None
        proc = self._sandbox.execute(
            workspace, timeout_seconds=timeout, memory_mb=memory_mb
        )
        if proc is None:
            from app_new.infrastructure.simulators.base.simulator import SimulationResult
            return SimulationResult(
                status=SimulationStatus.SYSTEM_ERROR,
                message="Sandbox execution failed.",
            )

        from app_new.infrastructure.simulators.base.simulator import SimulationResult
        output = (proc.stdout or "") + (proc.stderr or "")
        tests = parse_testbench_output(output)
        status = SimulationStatus.PASSED if tests and all(t.passed for t in tests) else (
            SimulationStatus.FAILED if tests else SimulationStatus.SYSTEM_ERROR
        )
        return SimulationResult(
            status=status,
            simulation_output=output,
            message="Sandbox executed." if status != SimulationStatus.SYSTEM_ERROR else "Sandbox error.",
        )

    @staticmethod
    def _inject_vcd_dump(testbench_code: str) -> str:
        vcd_lines = (
            '  initial begin\n'
            '    $dumpfile("simulation.vcd");\n'
            '    $dumpvars(0, testbench);\n'
            '  end\n\n'
        )
        module_match = re.search(r"(module\s+testbench[^;]*;)", testbench_code)
        if module_match:
            pos = module_match.end()
            return testbench_code[:pos] + "\n" + vcd_lines + testbench_code[pos:]
        return testbench_code + "\n" + vcd_lines