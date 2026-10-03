import logging
import subprocess
from pathlib import Path

from app.core.config import settings
from app.execution.limits import ExecutionLimits
from app.execution.workspace import ExecutionWorkspace
from app.simulator.base import SimulationResult, SimulationStatus
from app.simulator.result_parser import ResultParser

logger = logging.getLogger(__name__)

DOCKER_IMAGE = settings.HDL_SANDBOX_IMAGE


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
            logger.exception("Docker is unavailable; refusing unsandboxed HDL execution")
            return SimulationResult(
                status=SimulationStatus.SYSTEM_ERROR,
                message="Sandbox unavailable; HDL was not executed.",
            )
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
        guarded_sim_cmd = (
            "while [ ! -f /workspace/.hdlforge-ready ]; do sleep 0.1; done; "
            f"{sim_cmd}"
        )

        try:
            # Create container
            create_cmd = [
                "docker", "create",
                "--name", container_name,
                "--network", "none",
                "--read-only",
                "--tmpfs", "/tmp:rw,noexec,nosuid,size=64m",
                "--tmpfs", f"/workspace:rw,noexec,nosuid,size=128m,uid=10001,gid=10001",
                "--cpus", "1.0",
                "--ulimit", f"cpu={limits.cpu_seconds}:{limits.cpu_seconds}",
                "--memory", f"{limits.memory_mb}m",
                "--pids-limit", str(limits.process_limit),
                "--security-opt", "no-new-privileges",
                "--cap-drop", "ALL",
                "--user", "10001:10001",
                "--log-driver", "local",
                "--log-opt", f"max-size={max(1024, limits.max_output_size)}",
                "--log-opt", "max-file=2",
                "-w", "/workspace",
                DOCKER_IMAGE,
                "bash", "-c",
                guarded_sim_cmd,
            ]
            create_result = subprocess.run(create_cmd, capture_output=True, text=True, timeout=10)
            if create_result.returncode != 0:
                return SimulationResult(
                    status=SimulationStatus.SYSTEM_ERROR,
                    message="Sandbox container could not be created.",
                    compilation_output=self._sanitize(create_result.stderr),
                )

            # Start first so Docker mounts the writable workspace tmpfs before
            # source files are streamed through `docker exec`.
            start_result = subprocess.run(
                ["docker", "start", container_name],
                capture_output=True, text=True, timeout=10,
            )
            if start_result.returncode != 0:
                logger.error("Sandbox container failed to start: %s", self._sanitize(start_result.stderr))
                return SimulationResult(
                    status=SimulationStatus.SYSTEM_ERROR,
                    message="Sandbox container could not be started.",
                )

            # `docker cp` writes through the container rootfs on some engines,
            # which rejects writes when the rootfs is read-only even for tmpfs
            # mounts. Stream the source through the running container instead.
            for fname in ["submission.sv", "testbench.sv"]:
                src = workspace_path / fname
                copy_result = subprocess.run(
                    ["docker", "exec", "-i", container_name, "sh", "-c", f"cat > /workspace/{fname}"],
                    input=src.read_bytes(), capture_output=True, timeout=10,
                )
                if copy_result.returncode != 0:
                    logger.error("Sandbox source staging failed: %s", self._sanitize(copy_result.stderr.decode(errors="replace")))
                    return SimulationResult(
                        status=SimulationStatus.SYSTEM_ERROR,
                        message="Sandbox source could not be staged.",
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
                copy_result = subprocess.run(
                    ["docker", "exec", "-i", container_name, "sh", "-c", "cat > /workspace/sim_main.cpp"],
                    input=sim_main.read_bytes(), capture_output=True, timeout=10,
                )
                if copy_result.returncode != 0:
                    logger.error("Sandbox simulator staging failed: %s", self._sanitize(copy_result.stderr.decode(errors="replace")))
                    return SimulationResult(
                        status=SimulationStatus.SYSTEM_ERROR,
                        message="Sandbox simulator could not be staged.",
                    )

            release_result = subprocess.run(
                ["docker", "exec", container_name, "touch", "/workspace/.hdlforge-ready"],
                capture_output=True, text=True, timeout=10,
            )
            if release_result.returncode != 0:
                return SimulationResult(
                    status=SimulationStatus.SYSTEM_ERROR,
                    message="Sandbox execution could not be released.",
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

    def _sanitize(self, output: str) -> str:
        lines = output.split("\n")
        sanitized = []
        for line in lines:
            if "/workspace/" in line or "/tmp/" in line:
                continue
            sanitized.append(line)
        return "\n".join(sanitized).strip()
