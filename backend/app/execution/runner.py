import logging
import re
import time
from dataclasses import dataclass, field

from app.core.config import settings
from app.execution.limits import ExecutionLimits
from app.execution.workspace import ExecutionWorkspace
from app.sandbox.docker import DockerSandbox
from app.simulator.base import HDLSimulator, SimulationResult, SimulationStatus
from app.simulator import get_simulator
from app.schemas.submission import (
    SubmissionResponse,
    TestResult,
)

logger = logging.getLogger(__name__)


@dataclass
class ExecutionJob:
    problem_slug: str
    code: str
    testbench_code: str
    module_name: str
    limits: ExecutionLimits = field(default_factory=ExecutionLimits.from_env)
    waveform_enabled: bool = False


class ExecutionRunner:
    """Coordinates the full HDL execution pipeline."""

    def __init__(self, use_docker: bool = True) -> None:
        self.use_docker = use_docker
        self.sandbox = DockerSandbox() if use_docker else None

    def execute(self, job: ExecutionJob) -> SubmissionResponse:
        start_time = time.time()

        with ExecutionWorkspace() as workspace:
            workspace.write_submission(job.code)

            testbench_code = job.testbench_code
            if job.waveform_enabled:
                testbench_code = self._inject_vcd_dump(testbench_code)

            workspace.write_testbench(testbench_code)

            simulator = get_simulator(settings.SIMULATOR, workspace=workspace, limits=job.limits)

            if self.use_docker and self.sandbox is not None:
                result = self._execute_in_sandbox(workspace, job, simulator)
            else:
                result = self._execute_direct(workspace, job, simulator, job.waveform_enabled)

            elapsed = time.time() - start_time
            logger.info(
                "job_id=%s problem=%s status=%s score=%d elapsed=%.2fs waveform=%s",
                workspace.job_id,
                job.problem_slug,
                result.status.value,
                result.score,
                elapsed,
                "enabled" if job.waveform_enabled else "disabled",
            )

            return self._build_response(result, elapsed)

    def _inject_vcd_dump(self, testbench_code: str) -> str:
        vcd_lines = (
            '  initial begin\n'
            '    $dumpfile("simulation.vcd");\n'
            '    $dumpvars(0, testbench);\n'
            '  end\n\n'
        )

        module_match = re.search(r"(module\s+testbench[^;]*;)", testbench_code)
        if module_match:
            insert_pos = module_match.end()
            return testbench_code[:insert_pos] + "\n" + vcd_lines + testbench_code[insert_pos:]

        return testbench_code + "\n" + vcd_lines

    def _execute_direct(
        self,
        workspace: ExecutionWorkspace,
        job: ExecutionJob,
        simulator: HDLSimulator,
        trace_enabled: bool = False,
    ) -> SimulationResult:
        compile_result = simulator.compile(
            submission_path=workspace.workspace_path / "submission.sv",
            testbench_path=workspace.workspace_path / "testbench.sv",
            trace_enabled=trace_enabled,
        )
        if compile_result.status != SimulationStatus.COMPILATION_OK:
            return compile_result

        # Each simulator knows where it places its compiled output.
        # Verilator → obj_dir/Vtestbench  |  Icarus → simulation.out
        from app.simulator.icarus import IcarusSimulator
        if isinstance(simulator, IcarusSimulator):
            binary_path = workspace.workspace_path / "simulation.out"
        else:
            binary_path = workspace.workspace_path / "obj_dir" / "Vtestbench"

        return simulator.simulate(binary_path=binary_path)

    def _execute_in_sandbox(
        self,
        workspace: ExecutionWorkspace,
        job: ExecutionJob,
        simulator: VerilatorSimulator,
    ) -> SimulationResult:
        assert self.sandbox is not None
        return self.sandbox.execute(
            workspace=workspace,
            limits=job.limits,
        )

    def _build_response(
        self, result: SimulationResult, elapsed: float
    ) -> SubmissionResponse:
        status_map = {
            SimulationStatus.PASSED: "PASSED",
            SimulationStatus.FAILED: "FAILED",
            SimulationStatus.COMPILATION_ERROR: "COMPILATION_ERROR",
            SimulationStatus.RUNTIME_ERROR: "RUNTIME_ERROR",
            SimulationStatus.TIME_LIMIT_EXCEEDED: "TIME_LIMIT_EXCEEDED",
            SimulationStatus.MEMORY_LIMIT_EXCEEDED: "MEMORY_LIMIT_EXCEEDED",
            SimulationStatus.OUTPUT_LIMIT_EXCEEDED: "OUTPUT_LIMIT_EXCEEDED",
            SimulationStatus.SYSTEM_ERROR: "SYSTEM_ERROR",
        }

        tests = [
            TestResult(
                name=t.name,
                passed=t.passed,
                expected=t.expected,
                received=t.received,
            )
            for t in result.tests
        ]

        tests_passed = sum(1 for t in result.tests if t.passed)
        tests_total = len(tests)

        return SubmissionResponse(
            status=status_map.get(result.status, "SYSTEM_ERROR"),
            message=result.message,
            compilation_message=result.compilation_output or None,
            tests=tests,
            score=result.score,
            tests_passed=tests_passed,
            tests_total=tests_total,
            execution_time=elapsed,
        )
