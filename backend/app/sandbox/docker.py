import logging
import subprocess
from pathlib import Path

from app.execution.limits import ExecutionLimits
from app.execution.workspace import ExecutionWorkspace
from app.simulator.base import SimulationResult, SimulationStatus
from app.simulator.result_parser import ResultParser

logger = logging.getLogger(__name__)

DOCKER_IMAGE = "hdlforge-sandbox:latest"


class DockerSandbox:
    """Executes HDL compilation and simulation inside an isolated Docker container."""

    def __init__(self) -> None:
        self.parser = ResultParser()

    def execute(
        self,
        workspace: ExecutionWorkspace,
        limits: ExecutionLimits,
    ) -> SimulationResult:
        try:
            return self._run_in_container(workspace, limits)
        except FileNotFoundError:
            logger.warning("Docker not found, falling back to direct execution")
            return self._fallback_direct(workspace, limits)
        except Exception as e:
            logger.error("Sandbox execution failed: %s", e)
            return SimulationResult(
                status=SimulationStatus.SYSTEM_ERROR,
                message=f"Sandbox execution failed: {type(e).__name__}",
            )

    def _run_in_container(
        self,
        workspace: ExecutionWorkspace,
        limits: ExecutionLimits,
    ) -> SimulationResult:
        import uuid
        workspace_path = workspace.workspace_path
        container_name = f"hdlforge-{uuid.uuid4().hex[:8]}"

        from app.core.config import settings

        if settings.SIMULATOR.lower() == "icarus":
            sim_cmd = (
                "iverilog -g2012 -o /workspace/sim.out /workspace/submission.sv /workspace/testbench.sv "
                "&& vvp /workspace/sim.out"
            )
        else:
            sim_cmd = (
                "verilator --cc --exe --build --top-module testbench "
                "-Wall -Wno-DECLFILENAME -Wno-STMTDLY -Wno-UNUSED -Wno-fatal -o Vtestbench "
                "-Mdir /workspace/obj_dir "
                "/workspace/testbench.sv /workspace/submission.sv /workspace/sim_main.cpp "
                "&& /workspace/obj_dir/Vtestbench"
            )

        try:
            # Create container
            create_cmd = [
                "docker", "create",
                "--name", container_name,
                "--network", "none",
                "--tmpfs", "/tmp:rw,noexec,nosuid,size=64m",
                "--cpus", "2.0",
                "--memory", f"{limits.memory_mb}m",
                "--pids-limit", str(limits.process_limit),
                "--security-opt", "no-new-privileges",
                "--cap-drop", "ALL",
                "-w", "/workspace",
                DOCKER_IMAGE,
                "bash", "-c",
                sim_cmd,
            ]
            subprocess.run(create_cmd, capture_output=True, text=True, timeout=10)

            # Copy files into container
            for fname in ["submission.sv", "testbench.sv"]:
                src = workspace_path / fname
                subprocess.run(
                    ["docker", "cp", str(src), f"{container_name}:/workspace/{fname}"],
                    capture_output=True, text=True, timeout=10,
                )

            if settings.SIMULATOR.lower() != "icarus":
                # Write sim_main.cpp for Verilator (must advance time for # delays)
                sim_main = workspace_path / "sim_main.cpp"
                sim_main.write_text(
                    '#include "Vtestbench.h"\n'
                    '#include "verilated.h"\n'
                    'static double sim_time = 0.0;\n'
                    'double sc_time_stamp() { return sim_time; }\n'
                    'int main(int argc, char** argv) {\n'
                    '    Verilated::commandArgs(argc, argv);\n'
                    '    Vtestbench* tb = new Vtestbench;\n'
                    '    while (!Verilated::gotFinish()) {\n'
                    '        tb->eval();\n'
                    '        sim_time += 1.0;\n'
                    '    }\n'
                    '    delete tb;\n'
                    '    return 0;\n'
                    '}\n'
                )
                subprocess.run(
                    ["docker", "cp", str(sim_main), f"{container_name}:/workspace/sim_main.cpp"],
                    capture_output=True, text=True, timeout=10,
                )

            # Start container
            subprocess.run(
                ["docker", "start", container_name],
                capture_output=True, text=True, timeout=10,
            )

            # Wait for completion
            try:
                wait_result = subprocess.run(
                    ["docker", "wait", container_name],
                    capture_output=True, text=True, timeout=limits.timeout_seconds + 2,
                )
            except subprocess.TimeoutExpired:
                return SimulationResult(
                    status=SimulationStatus.TIME_LIMIT_EXCEEDED,
                    message="Execution timed out.",
                )

            # Get logs
            logs_result = subprocess.run(
                ["docker", "logs", container_name],
                capture_output=True, text=True, timeout=10,
            )

            # Copy out VCD if generated
            subprocess.run(
                ["docker", "cp", f"{container_name}:/workspace/simulation.vcd", str(workspace_path / "simulation.vcd")],
                capture_output=True, text=True, timeout=5,
            )

            exit_code = int(wait_result.stdout.strip()) if wait_result.stdout.strip() else -1
            stdout = logs_result.stdout
            stderr = logs_result.stderr

            if exit_code != 0 and not stdout.strip():
                sanitized = self._sanitize(stderr)
                if "syntax error" in sanitized.lower() or "error" in sanitized.lower():
                    return SimulationResult(
                        status=SimulationStatus.COMPILATION_ERROR,
                        message="Compilation failed.",
                        compilation_output=sanitized,
                    )
                return SimulationResult(
                    status=SimulationStatus.RUNTIME_ERROR,
                    message="Simulation runtime error.",
                    simulation_output=sanitized,
                )

            return self.parser.parse(stdout, stderr)

        except subprocess.TimeoutExpired:
            return SimulationResult(
                status=SimulationStatus.TIME_LIMIT_EXCEEDED,
                message="Execution timed out.",
            )
        finally:
            subprocess.run(
                ["docker", "rm", "-f", container_name],
                capture_output=True, text=True, timeout=5,
            )

    def _fallback_direct(
        self,
        workspace: ExecutionWorkspace,
        limits: ExecutionLimits,
    ) -> SimulationResult:
        from app.core.config import settings
        from app.simulator import get_simulator

        simulator = get_simulator(settings.SIMULATOR, workspace=workspace, limits=limits)
        compile_result = simulator.compile(
            submission_path=workspace.workspace_path / "submission.sv",
            testbench_path=workspace.workspace_path / "testbench.sv",
        )
        if compile_result.status != SimulationStatus.COMPILATION_OK:
            return compile_result

        binary_path = (
            workspace.workspace_path / "simulation.out"
            if settings.SIMULATOR.lower() == "icarus"
            else workspace.workspace_path / "obj_dir" / "Vtestbench"
        )
        return simulator.simulate(binary_path=binary_path)

    def _sanitize(self, output: str) -> str:
        lines = output.split("\n")
        sanitized = []
        for line in lines:
            if "/workspace/" in line or "/tmp/" in line:
                continue
            sanitized.append(line)
        return "\n".join(sanitized).strip()
