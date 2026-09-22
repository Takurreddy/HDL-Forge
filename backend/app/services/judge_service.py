"""Judge service - orchestrates HDL test execution with public/hidden tests and weighted scoring."""

import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.db.models import (
    Difficulty,
    Problem,
    ProgressStatus,
    Submission,
    SubmissionStatus,
    SubmissionTestResult,
    TestCase,
    TestVisibility,
    Profile,
    UserProblemProgress,
)
from app.execution.runner import ExecutionJob, ExecutionRunner
from app.execution.limits import ExecutionLimits
from app.execution.workspace import ExecutionWorkspace
from app.schemas.submission import (
    AchievementInfo,
    SubmissionRequest,
    SubmissionResponse,
    TestResult,
)
from app.services.achievement_service import (
    DIFFICULTY_XP,
    award_solve_xp,
    calculate_level,
    evaluate_achievements,
)
from app.services.waveform_service import waveform_storage

logger = logging.getLogger(__name__)


@dataclass
class TestExecution:
    test_case: TestCase
    result: TestResult | None = None
    score: float = 0.0


class JudgeService:
    """Orchestrates HDL testing with public/hidden test separation and weighted scoring."""

    def __init__(self, runner: ExecutionRunner | None = None) -> None:
        self.runner = runner or ExecutionRunner(use_docker=False)

    def judge_run(
        self,
        db: Session,
        request: SubmissionRequest,
        user_id: str | None = None,
    ) -> SubmissionResponse:
        """Execute PUBLIC tests only (for Run button)."""
        problem = db.query(Problem).filter(Problem.slug == request.problem_slug).first()
        if not problem:
            return SubmissionResponse(
                status="error",
                message=f"Problem '{request.problem_slug}' not found.",
                submission_id=0,
            )

        if request.language.value != "SYSTEMVERILOG":
            return SubmissionResponse(
                status="error",
                message="Only SystemVerilog is currently supported.",
                submission_id=0,
            )

        if request.testbench_code:
            test_cases = [
                TestCase(
                    id=0,
                    problem_id=problem.id,
                    name="Custom Testbench",
                    description="Profile provided testbench",
                    testbench=request.testbench_code,
                    visibility=TestVisibility.PUBLIC,
                    weight=1.0,
                    execution_order=0,
                    enabled=True,
                )
            ]
        else:
            test_cases = [
                tc for tc in problem.test_cases_list
                if tc.enabled and tc.visibility == TestVisibility.PUBLIC
            ]
            if not test_cases:
                test_cases = self._fallback_legacy_testcases(problem)

        if not test_cases:
            return SubmissionResponse(
                status="error",
                message="No testbench available for this problem yet.",
                submission_id=0,
            )

        return self._execute_tests(db, problem, request, test_cases, is_submit=False, user_id=user_id)

    def judge_submit(
        self,
        db: Session,
        request: SubmissionRequest,
        user_id: str | None = None,
    ) -> SubmissionResponse:
        """Execute ALL tests (PUBLIC + HIDDEN) for final judging."""
        problem = db.query(Problem).filter(Problem.slug == request.problem_slug).first()
        if not problem:
            return SubmissionResponse(
                status="error",
                message=f"Problem '{request.problem_slug}' not found.",
                submission_id=0,
            )

        if request.language.value != "SYSTEMVERILOG":
            return SubmissionResponse(
                status="error",
                message="Only SystemVerilog is currently supported.",
                submission_id=0,
            )

        test_cases = [
            tc for tc in problem.test_cases_list
            if tc.enabled
        ]
        if not test_cases:
            test_cases = self._fallback_legacy_testcases(problem)

        if not test_cases:
            return SubmissionResponse(
                status="error",
                message="No testbench available for this problem yet.",
                submission_id=0,
            )

        return self._execute_tests(db, problem, request, test_cases, is_submit=True, user_id=user_id)

    def _execute_tests(
        self,
        db: Session,
        problem: Problem,
        request: SubmissionRequest,
        test_cases: list[TestCase],
        is_submit: bool,
        user_id: str | None = None,
    ) -> SubmissionResponse:
        start_time = time.time()
        total_weight = sum(tc.weight for tc in test_cases)

        if total_weight == 0:
            total_weight = 1.0

        test_executions: list[TestExecution] = []
        all_test_results: list[TestResult] = []
        waveform_id: str | None = None

        for idx, tc in enumerate(sorted(test_cases, key=lambda x: x.execution_order)):
            limits = ExecutionLimits(
                timeout_seconds=problem.time_limit or 5,
                memory_mb=problem.memory_limit or 256,
                max_source_size=50000,
                max_output_size=100000,
            )

            enable_waveform = (not is_submit) and (idx == 0)

            job = ExecutionJob(
                problem_slug=problem.slug,
                code=request.code,
                testbench_code=tc.testbench,
                module_name=problem.slug.replace("-", "_"),
                limits=limits,
                waveform_enabled=enable_waveform,
            )

            try:
                response = self.runner.execute(job)
            except Exception as e:
                logger.exception("Test execution failed for test %s", tc.name)
                te = TestExecution(
                    test_case=tc,
                    result=TestResult(
                        name=tc.name,
                        passed=False,
                        message="Judge error during execution.",
                    ),
                    score=0.0,
                )
                test_executions.append(te)
                all_test_results.append(te.result)
                continue

            if enable_waveform and waveform_id is None:
                waveform_workspace = self._find_waveform_workspace(job)
                if waveform_workspace and waveform_workspace.waveform_exists():
                    wf_size = waveform_workspace.get_waveform_size()
                    if wf_size > 0 and wf_size <= limits.max_waveform_size:
                        waveform_obj = waveform_storage.save_waveform(
                            db, 0, waveform_workspace
                        )
                        if waveform_obj:
                            waveform_id = waveform_obj.waveform_id

            test_passed = response.status == "PASSED"
            if test_passed:
                test_score = (response.score / 100.0) * tc.weight if response.score > 0 else tc.weight
            else:
                test_score = 0.0

            visible_result = self._filter_hidden_details(tc, response, test_passed)

            te = TestExecution(
                test_case=tc,
                result=visible_result,
                score=test_score,
            )
            test_executions.append(te)
            all_test_results.append(visible_result)

        weighted_score = sum(te.score for te in test_executions)
        normalized_score = int(round((weighted_score / total_weight) * 100))
        normalized_score = max(0, min(100, normalized_score))

        tests_passed = sum(1 for te in test_executions if te.result and te.result.passed)
        tests_total = len(test_executions)

        if any(te.result and te.result.passed is None for te in test_executions):
            final_status = "JUDGE_ERROR"
        elif tests_passed == tests_total:
            final_status = "PASSED"
        elif tests_passed == 0:
            final_status = "FAILED"
        else:
            final_status = "PARTIAL"

        compilation_msg = None
        for te in test_executions:
            if te.result and te.result.message and "Compilation" in te.result.message:
                compilation_msg = te.result.message
                break

        elapsed = time.time() - start_time

        submission = Submission(
            problem_id=problem.id,
            user_id=user_id,
            code=request.code,
            language=request.language,
            status=SubmissionStatus(final_status),
            score=float(normalized_score),
            tests_passed=tests_passed,
            tests_total=tests_total,
            execution_time=elapsed,
            compilation_message=compilation_msg or "",
        )
        db.add(submission)
        db.flush()

        if waveform_id:
            waveform_storage.update_submission_id(db, waveform_id, submission.id)

        for te in test_executions:
            if te.result:
                str_result = SubmissionTestResult(
                    submission_id=submission.id,
                    test_case_id=te.test_case.id if te.test_case.id else None,
                    test_name=te.test_case.name,
                    status="PASSED" if te.result.passed else "FAILED",
                    score=te.score,
                    message=te.result.message or "",
                    expected=te.result.expected or "",
                    actual=te.result.received or "",
                )
                db.add(str_result)

        if user_id and is_submit:
            xp_earned, xp_total, level, progress_status, achievements_unlocked = self._update_user_progress(
                db, user_id, problem, final_status, normalized_score
            )
        else:
            xp_earned = 0
            xp_total = 0
            level = 1
            progress_status = None
            achievements_unlocked = []

        db.commit()
        db.refresh(submission)

        logger.info(
            "submission_id=%d problem=%s status=%s score=%d tests=%d/%d elapsed=%.2fs waveform=%s user=%s",
            submission.id,
            problem.slug,
            final_status,
            normalized_score,
            tests_passed,
            tests_total,
            elapsed,
            waveform_id or "none",
            user_id or "anonymous",
        )

        visible_tests = [te.result for te in test_executions if te.result]

        submitted_by = None
        submitted_by_display = None
        if user_id:
            user_obj = db.query(Profile).filter(Profile.id == user_id).first()
            if user_obj:
                submitted_by = user_obj.username
                submitted_by_display = user_obj.display_name

        return SubmissionResponse(
            status=final_status,
            message=f"{tests_passed}/{tests_total} tests passed.",
            compilation_message=compilation_msg,
            tests=visible_tests,
            score=normalized_score,
            tests_passed=tests_passed,
            tests_total=tests_total,
            execution_time=elapsed,
            submission_id=submission.id,
            waveform_id=waveform_id,
            xp_earned=xp_earned,
            xp_total=xp_total,
            level=level,
            progress_status=progress_status,
            achievements_unlocked=achievements_unlocked,
            submitted_by=submitted_by,
            submitted_by_display=submitted_by_display,
        )

    def _update_user_progress(
        self,
        db: Session,
        user_id: str,
        problem: Problem,
        final_status: str,
        score: int,
    ) -> tuple[int, int, int, str | None, list[AchievementInfo]]:
        """Update user progress after submission. Returns (xp_earned, xp_total, level, progress_status, achievements)."""
        user = db.query(Profile).filter(Profile.id == user_id).first()
        if not user:
            return 0, 0, 1, None, []

        progress = (
            db.query(UserProblemProgress)
            .filter(
                UserProblemProgress.user_id == user_id,
                UserProblemProgress.problem_id == problem.id,
            )
            .first()
        )

        if not progress:
            progress = UserProblemProgress(
                user_id=user_id,
                problem_id=problem.id,
                status=ProgressStatus.NOT_STARTED,
            )
            db.add(progress)

        progress.attempts += 1
        progress.last_attempt_at = datetime.now(timezone.utc)

        if score > progress.best_score:
            progress.best_score = float(score)

        user.total_submissions += 1

        xp_earned = 0
        progress_status = None

        if final_status == "PASSED":
            if progress.status != ProgressStatus.SOLVED:
                xp_earned = award_solve_xp(user, problem)
                user.xp += xp_earned
                user.level = calculate_level(user.xp)
                user.solved_count += 1
            progress.status = ProgressStatus.SOLVED
            if not progress.solved_at:
                progress.solved_at = datetime.now(timezone.utc)
            progress_status = "SOLVED"
        elif final_status in ("PARTIAL", "FAILED") and progress.status == ProgressStatus.NOT_STARTED:
            progress.status = ProgressStatus.ATTEMPTED
            progress_status = "ATTEMPTED"

        newly_unlocked = evaluate_achievements(db, user)
        achievements = [
            AchievementInfo(
                slug=a.slug,
                name=a.name,
                description=a.description,
                icon=a.icon,
                xp_reward=a.xp_reward,
            )
            for a in newly_unlocked
        ]

        return xp_earned, user.xp, user.level, progress_status, achievements

    def _find_waveform_workspace(self, job: ExecutionJob) -> ExecutionWorkspace | None:
        import os
        from pathlib import Path
        import tempfile

        base_dir = Path(tempfile.gettempdir()) / "hdlforge"
        if not base_dir.exists():
            return None

        for d in sorted(base_dir.iterdir(), key=os.path.getmtime, reverse=True):
            if d.is_dir() and (d / "simulation.vcd").exists():
                ws = ExecutionWorkspace()
                ws.workspace_path = d
                ws._created = True
                return ws

        return None

    def _filter_hidden_details(
        self,
        tc: TestCase,
        response: SubmissionResponse,
        test_passed: bool,
    ) -> TestResult:
        """Filter information returned for hidden tests."""
        original = None
        for t in response.tests:
            if t.name == tc.name or (not t.name and len(response.tests) == 1):
                original = t
                break

        if original is None:
            original = TestResult(
                name=tc.name,
                passed=test_passed,
                message="PASSED" if test_passed else "FAILED",
            )

        if tc.visibility == TestVisibility.HIDDEN:
            return TestResult(
                name=tc.name,
                passed=original.passed,
                message="Your design passed this test." if original.passed else "Your design failed this test.",
            )

        return TestResult(
            name=tc.name,
            passed=original.passed,
            expected=original.expected,
            received=original.received,
            message=original.message,
        )

    def _fallback_legacy_testcases(self, problem: Problem) -> list[TestCase]:
        """Create fallback test cases from the legacy test_cases text field."""
        if not problem.test_cases:
            return []

        return [
            TestCase(
                id=0,
                problem_id=problem.id,
                name="Legacy testbench",
                description="",
                testbench=problem.test_cases,
                visibility=TestVisibility.PUBLIC,
                weight=1.0,
                execution_order=0,
                enabled=True,
            )
        ]
