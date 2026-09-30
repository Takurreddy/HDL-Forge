"""Mappers converting between ORM models and domain entities (DIP-friendly)."""
from uuid import UUID

from app_new.domain.entities.problems.problem import Problem
from app_new.domain.entities.submissions.submission import Submission
from app_new.domain.entities.users.user import User
from app_new.domain.value_objects.problems import (
    Difficulty,
    ProblemCategory,
    ProblemSlug,
    ProblemTitle,
    ProblemDescription,
    TestBenchCode,
    TestVisibility,
    TestCaseWeight,
)
from app_new.domain.value_objects.problems.test_case import (
    TestCase,
    TestCaseId,
    TestCaseName,
    TestCaseDescription,
    TestCaseExecutionOrder,
    TestCaseEnabled,
)
from app_new.domain.value_objects.users import (
    Username,
    Email,
    PasswordHash,
    DisplayName,
    AvatarUrl,
    UserXP,
    UserLevel,
    UserRole,
)
from app_new.domain.value_objects.submissions import (
    SourceCode,
    Language,
    SubmissionStatus,
    Score,
    TestsPassed,
    TestsTotal,
    ExecutionTime,
    CompilationMessage,
)
from app_new.infrastructure.database.orm.models import (
    ProblemORM,
    TestCaseORM,
    UserORM,
    SubmissionORM,
)


class ProblemMapper:
    """Maps between ProblemORM and Problem domain entity."""

    @staticmethod
    def to_domain(orm: ProblemORM) -> Problem:
        test_cases = [_map_test_case(tc) for tc in orm.test_cases]
        problem = Problem(
            id=UUID(orm.id),
            slug=ProblemSlug(orm.slug),
            title=ProblemTitle(orm.title),
            description=ProblemDescription(orm.description),
            difficulty=orm.difficulty,
            category=orm.category,
            testbench=TestBenchCode(orm.testbench or ""),
            time_limit=orm.time_limit,
            memory_limit=orm.memory_limit,
            points=orm.points,
            tags=list(orm.tags or []),
            is_published=orm.is_published,
            created_by=UUID(orm.created_by) if orm.created_by else None,
            test_cases=test_cases,
        )
        problem.created_at = orm.created_at
        problem.updated_at = orm.updated_at
        return problem

    @staticmethod
    def to_orm(domain: Problem) -> ProblemORM:
        orm = ProblemORM(
            id=str(domain.id),
            slug=domain.slug.value,
            title=domain.title.value,
            description=domain.description.value,
            difficulty=domain.difficulty,
            category=domain.category,
            testbench=domain.testbench.value,
            time_limit=domain.time_limit,
            memory_limit=domain.memory_limit,
            points=domain.points,
            tags=domain.tags,
            is_published=domain.is_published,
            created_by=str(domain.created_by) if domain.created_by else None,
            created_at=domain.created_at,
            updated_at=domain.updated_at,
        )
        orm.test_cases = [_map_test_case_to_orm(tc, str(domain.id)) for tc in domain.test_cases]
        return orm


def _map_test_case(orm: TestCaseORM) -> TestCase:
    return TestCase(
        id=TestCaseId(UUID(int=orm.id)),
        name=TestCaseName(orm.name),
        description=TestCaseDescription(orm.description or ""),
        testbench=TestBenchCode(orm.testbench),
        visibility=orm.visibility,
        weight=TestCaseWeight(orm.weight),
        execution_order=TestCaseExecutionOrder(orm.execution_order),
        enabled=TestCaseEnabled(orm.enabled),
    )


def _map_test_case_to_orm(tc: TestCase, problem_id: str) -> TestCaseORM:
    return TestCaseORM(
        problem_id=problem_id,
        name=tc.name.value,
        description=tc.description.value,
        testbench=tc.testbench.value,
        visibility=tc.visibility,
        weight=tc.weight.value,
        execution_order=tc.execution_order.value,
        enabled=tc.enabled.value,
    )


class UserMapper:
    """Maps between UserORM and User domain entity."""

    @staticmethod
    def to_domain(orm: UserORM) -> User:
        user = User(
            id=UUID(orm.id),
            username=Username(orm.username),
            email=Email(orm.email),
            password_hash=PasswordHash(orm.password_hash),
            display_name=DisplayName(orm.display_name),
            role=orm.role,
            avatar_url=AvatarUrl(orm.avatar_url),
            xp=UserXP(orm.xp),
            level=UserLevel(orm.level),
            solved_count=orm.solved_count,
            total_submissions=orm.total_submissions,
            is_active=orm.is_active,
            last_login_at=orm.last_login_at,
        )
        user.created_at = orm.created_at
        user.updated_at = orm.updated_at
        return user

    @staticmethod
    def to_orm(domain: User) -> UserORM:
        return UserORM(
            id=str(domain.id),
            username=domain.username.value,
            email=domain.email.value,
            password_hash=domain.password_hash.value,
            display_name=domain.display_name.value,
            role=domain.role,
            avatar_url=domain.avatar_url.value if domain.avatar_url else None,
            xp=domain.xp.value,
            level=domain.level.value,
            solved_count=domain.solved_count,
            total_submissions=domain.total_submissions,
            is_active=domain.is_active,
            is_admin=domain.role == UserRole.ADMIN,
            last_login_at=domain.last_login_at,
            created_at=domain.created_at,
            updated_at=domain.updated_at,
        )


class SubmissionMapper:
    """Maps between SubmissionORM and Submission domain entity."""

    @staticmethod
    def to_domain(orm: SubmissionORM) -> Submission:
        from app_new.domain.value_objects.submissions import TestResult

        test_results = [
            TestResult(
                name=tr.test_name,
                passed=tr.status == "PASSED",
                expected=tr.expected,
                received=tr.actual,
                message=tr.message,
            )
            for tr in orm.test_results
        ]

        submission = Submission(
            id=UUID(orm.id),
            problem_id=UUID(orm.problem_id),
            user_id=UUID(orm.user_id) if orm.user_id else None,
            code=SourceCode(orm.code),
            language=orm.language,
            status=orm.status,
            score=Score(orm.score),
            tests_passed=TestsPassed(orm.tests_passed),
            tests_total=TestsTotal(orm.tests_total),
            execution_time=ExecutionTime(orm.execution_time),
            compilation_message=CompilationMessage(orm.compilation_message)
            if orm.compilation_message
            else None,
            test_results=test_results,
            waveform_id=orm.waveform_id,
            xp_earned=orm.xp_earned,
        )
        submission.created_at = orm.created_at
        return submission

    @staticmethod
    def to_orm(domain: Submission) -> SubmissionORM:
        return SubmissionORM(
            id=str(domain.id),
            problem_id=str(domain.problem_id),
            user_id=str(domain.user_id) if domain.user_id else None,
            code=domain.code.value,
            language=domain.language,
            status=domain.status,
            score=domain.score.value,
            tests_passed=domain.tests_passed.value,
            tests_total=domain.tests_total.value,
            execution_time=domain.execution_time.value,
            compilation_message=domain.compilation_message.value
            if domain.compilation_message
            else None,
            waveform_id=domain.waveform_id,
            xp_earned=domain.xp_earned,
            created_at=domain.created_at,
        )