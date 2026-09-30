"""Submission application service - implements submission use cases."""
from typing import Optional, List
from uuid import UUID

from app_new.application.use_cases.submissions.submission_use_cases import SubmissionUseCases
from app_new.application.dto.submissions import (
    SubmissionRunDTO,
    SubmissionSubmitDTO,
    SubmissionResponseDTO,
    SubmissionDTO,
    TestResultDTO,
)
from app_new.domain.entities.submissions.submission import Submission
from app_new.domain.entities.problems.problem import Problem
from app_new.domain.value_objects.submissions import Language, SubmissionStatus, TestResult
from app_new.domain.value_objects.problems import ProblemSlug, TestVisibility
from app_new.domain.repositories.submissions.submission_repository import SubmissionRepository
from app_new.domain.repositories.problems.problem_repository import ProblemRepository
from app_new.application.ports import HDLExecutionPort, WaveformStoragePort
from app_new.domain.exceptions import EntityNotFoundException


class SubmissionService(SubmissionUseCases):
    """Application service for submission management."""

    def __init__(
        self,
        submission_repository: SubmissionRepository,
        problem_repository: ProblemRepository,
        execution_port: HDLExecutionPort,
        waveform_storage: WaveformStoragePort,
    ):
        self._submission_repository = submission_repository
        self._problem_repository = problem_repository
        self._execution_port = execution_port
        self._waveform_storage = waveform_storage

    async def run_code(self, dto: SubmissionRunDTO, user_id: Optional[UUID] = None) -> SubmissionResponseDTO:
        """Run code against public test cases."""
        problem = await self._get_problem_by_slug(dto.problem_slug)
        if not problem:
            return self._error_response(f"Problem '{dto.problem_slug}' not found.")

        if dto.language not in (Language.SYSTEMVERILOG, Language.VERILOG):
            return self._error_response(f"Language '{dto.language.value}' is not supported.")

        # Get public test cases
        test_cases = problem.get_public_test_cases()
        if not test_cases and problem.testbench:
            # Fallback to legacy testbench
            from app_new.domain.value_objects.problems.test_case import TestCase
            test_cases = [TestCase.create(
                name="Legacy testbench",
                testbench=problem.testbench.value,
                visibility=TestVisibility.PUBLIC,
                weight=1.0,
            )]

        if not test_cases:
            return self._error_response("No testbench available for this problem yet.")

        return await self._execute_tests(problem, dto.code, dto.language, test_cases, user_id, is_submit=False)

    async def submit_code(self, dto: SubmissionSubmitDTO, user_id: Optional[UUID] = None) -> SubmissionResponseDTO:
        """Submit code for final judging (all test cases)."""
        problem = await self._get_problem_by_slug(dto.problem_slug)
        if not problem:
            return self._error_response(f"Problem '{dto.problem_slug}' not found.")

        if dto.language not in (Language.SYSTEMVERILOG, Language.VERILOG):
            return self._error_response(f"Language '{dto.language.value}' is not supported.")

        # Get all enabled test cases
        test_cases = problem.get_all_enabled_test_cases()
        if not test_cases and problem.testbench:
            from app_new.domain.value_objects.problems.test_case import TestCase
            test_cases = [TestCase.create(
                name="Legacy testbench",
                testbench=problem.testbench.value,
                visibility=TestVisibility.PUBLIC,
                weight=1.0,
            )]

        if not test_cases:
            return self._error_response("No testbench available for this problem yet.")

        return await self._execute_tests(problem, dto.code, dto.language, test_cases, user_id, is_submit=True)

    async def get_submission(self, submission_id: UUID) -> Optional[SubmissionDTO]:
        """Get submission by ID."""
        submission = await self._submission_repository.get_by_id(submission_id)
        if not submission:
            return None
        return self._to_dto(submission)

    async def get_user_submissions(
        self,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> List[SubmissionDTO]:
        """Get submissions for a user."""
        submissions = await self._submission_repository.get_user_submissions(user_id, limit, offset)
        return [self._to_dto(s) for s in submissions]

    async def get_problem_submissions(
        self,
        problem_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> List[SubmissionDTO]:
        """Get submissions for a problem."""
        submissions = await self._submission_repository.get_problem_submissions(problem_id, limit, offset)
        return [self._to_dto(s) for s in submissions]

    async def get_user_best_submission(
        self,
        user_id: UUID,
        problem_id: UUID,
    ) -> Optional[SubmissionDTO]:
        """Get user's best submission for a problem."""
        submission = await self._submission_repository.get_best_submission(user_id, problem_id)
        if not submission:
            return None
        return self._to_dto(submission)

    async def _get_problem_by_slug(self, slug: str) -> Optional[Problem]:
        """Get problem by slug."""
        return await self._problem_repository.get_by_slug(ProblemSlug(slug))

    async def _execute_tests(
        self,
        problem: Problem,
        code: str,
        language: Language,
        test_cases: List,
        user_id: Optional[UUID],
        is_submit: bool,
    ) -> SubmissionResponseDTO:
        """Execute tests and return response."""
        import time
        start_time = time.time()

        total_weight = sum(tc.weight.value for tc in test_cases)
        if total_weight == 0:
            total_weight = 1.0

        all_test_results: List[TestResultDTO] = []
        test_executions = []
        waveform_id: Optional[str] = None

        for idx, tc in enumerate(sorted(test_cases, key=lambda x: x.execution_order.value)):
            limits = problem.get_execution_limits()
            enable_waveform = (not is_submit) and (idx == 0)

            job_data = {
                "problem_slug": problem.slug.value,
                "code": code,
                "testbench_code": tc.testbench.value,
                "module_name": problem.slug.value.replace("-", "_"),
                "timeout_seconds": limits.timeout_seconds,
                "memory_mb": limits.memory_mb,
                "waveform_enabled": enable_waveform,
                "simulator_type": None,  # Will be determined by execution port
            }

            try:
                result = await self._execution_port.execute(job_data)
            except Exception as e:
                # Handle execution error
                test_result = TestResultDTO(
                    name=tc.name.value,
                    passed=False,
                    message=f"Execution error: {str(e)}",
                )
                all_test_results.append(test_result)
                test_executions.append({
                    "test_case": tc,
                    "result": test_result,
                    "score": 0.0,
                })
                continue

            # Save waveform if enabled
            if enable_waveform and waveform_id is None and hasattr(result, 'vcd_data') and result.vcd_data:
                waveform_id = await self._waveform_storage.save_waveform(
                    UUID(int=0),  # Temporary, will update after submission saved
                    result.vcd_data,
                )

            test_passed = result.status == SimulationStatus.PASSED
            if test_passed:
                test_score = (result.score / 100.0) * tc.weight.value if result.score > 0 else tc.weight.value
            else:
                test_score = 0.0

            # Filter hidden test details
            visible_result = self._filter_hidden_details(tc, result, test_passed)
            all_test_results.append(visible_result)
            test_executions.append({
                "test_case": tc,
                "result": visible_result,
                "score": test_score,
            })

        weighted_score = sum(te["score"] for te in test_executions)
        normalized_score = int(round((weighted_score / total_weight) * 100))
        normalized_score = max(0, min(100, normalized_score))

        tests_passed = sum(1 for te in test_executions if te["result"].passed)
        tests_total = len(test_executions)

        if any(te["result"].passed is None for te in test_executions):
            final_status = SubmissionStatus.JUDGE_ERROR
        elif tests_passed == tests_total:
            final_status = SubmissionStatus.PASSED
        elif tests_passed == 0:
            final_status = SubmissionStatus.FAILED
        else:
            final_status = SubmissionStatus.PARTIAL

        compilation_msg = None
        for te in test_executions:
            if te["result"].message and "Compilation" in te["result"].message:
                compilation_msg = te["result"].message
                break

        elapsed = time.time() - start_time

        # Create submission entity
        submission = Submission.create(
            problem_id=problem.id,
            code=code,
            language=language,
            user_id=user_id,
        )
        submission.complete(
            status=final_status,
            score=normalized_score,
            tests_passed=tests_passed,
            tests_total=tests_total,
            execution_time=elapsed,
            test_results=[TestResult(
                name=r.name,
                passed=r.passed,
                expected=r.expected,
                received=r.received,
                message=r.message,
            ) for r in all_test_results],
            compilation_message=compilation_msg,
        )

        if waveform_id:
            submission.set_waveform(waveform_id)

        # Save submission
        saved_submission = await self._submission_repository.add(submission)

        # Update waveform with actual submission ID
        if waveform_id:
            await self._waveform_storage.save_waveform(saved_submission.id, b"")  # Update reference

        return SubmissionResponseDTO(
            status=final_status,
            message=f"{tests_passed}/{tests_total} tests passed.",
            compilation_message=compilation_msg,
            tests=all_test_results,
            score=normalized_score,
            tests_passed=tests_passed,
            tests_total=tests_total,
            execution_time=elapsed,
            submission_id=saved_submission.id,
            waveform_id=waveform_id,
        )

    def _filter_hidden_details(
        self,
        tc,
        result: "ExecutionResult",
        test_passed: bool,
    ) -> TestResultDTO:
        """Filter information returned for hidden tests."""
        original = None
        for t in result.tests:
            if t.name == tc.name.value or (not t.name and len(result.tests) == 1):
                original = t
                break

        if original is None:
            return TestResultDTO(
                name=tc.name.value,
                passed=test_passed,
                message="PASSED" if test_passed else "FAILED",
            )

        if tc.visibility == TestVisibility.HIDDEN:
            return TestResultDTO(
                name=tc.name.value,
                passed=original.passed,
                message="Your design passed this test." if original.passed else "Your design failed this test.",
            )

        return TestResultDTO(
            name=tc.name.value,
            passed=original.passed,
            expected=original.expected,
            received=original.received,
            message=original.message,
        )

    def _error_response(self, message: str) -> SubmissionResponseDTO:
        """Create error response."""
        return SubmissionResponseDTO(
            status=SubmissionStatus.SYSTEM_ERROR,
            message=message,
        )

    def _to_dto(self, submission: Submission) -> SubmissionDTO:
        """Convert Submission entity to DTO."""
        return SubmissionDTO(
            id=submission.id,
            problem_id=submission.problem_id,
            problem_slug="",  # Would need to fetch from problem
            user_id=submission.user_id,
            code=submission.code.value,
            language=submission.language,
            status=submission.status,
            score=submission.score.value,
            tests_passed=submission.tests_passed.value,
            tests_total=submission.tests_total.value,
            execution_time=submission.execution_time.value,
            compilation_message=submission.compilation_message.value if submission.compilation_message else None,
            test_results=[
                TestResultDTO(
                    name=r.name,
                    passed=r.passed,
                    expected=r.expected,
                    received=r.received,
                    message=r.message,
                ) for r in submission.test_results
            ],
            waveform_id=submission.waveform_id,
            xp_earned=submission.xp_earned,
            created_at=submission.created_at.isoformat(),
        )