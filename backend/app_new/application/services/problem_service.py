"""Problem application service - implements problem use cases."""
from typing import Optional, List
from uuid import UUID

from app_new.application.use_cases.problems.problem_use_cases import ProblemUseCases
from app_new.application.dto.problems import ProblemCreateDTO, ProblemUpdateDTO, ProblemDTO, ProblemListDTO
from app_new.domain.entities.problems.problem import Problem
from app_new.domain.value_objects.problems import Difficulty, ProblemCategory, ProblemSlug
from app_new.domain.repositories.problems.problem_repository import ProblemRepository
from app_new.domain.exceptions import EntityNotFoundException, ValidationException


class ProblemService(ProblemUseCases):
    """Application service for problem management."""

    def __init__(self, problem_repository: ProblemRepository):
        self._problem_repository = problem_repository

    async def create_problem(self, dto: ProblemCreateDTO, created_by: UUID) -> ProblemDTO:
        """Create a new problem."""
        # Check if slug already exists
        existing = await self._problem_repository.get_by_slug(ProblemSlug(dto.slug))
        if existing:
            raise ValidationException("slug", f"Problem with slug '{dto.slug}' already exists")

        # Create problem entity
        problem = Problem.create(
            slug=dto.slug,
            title=dto.title,
            description=dto.description,
            difficulty=dto.difficulty,
            category=dto.category,
            testbench=dto.testbench,
            time_limit=dto.time_limit,
            memory_limit=dto.memory_limit,
            points=dto.points,
            tags=dto.tags,
            created_by=created_by,
        )

        # Add test cases if provided
        if dto.test_cases:
            from app_new.domain.value_objects.problems.test_case import TestCase
            from app_new.domain.value_objects.problems import TestVisibility
            for i, tc_data in enumerate(dto.test_cases):
                test_case = TestCase.create(
                    name=tc_data.get("name", f"Test {i+1}"),
                    testbench=tc_data.get("testbench", ""),
                    visibility=TestVisibility(tc_data.get("visibility", "PUBLIC")),
                    weight=tc_data.get("weight", 1.0),
                    description=tc_data.get("description", ""),
                    execution_order=tc_data.get("execution_order", i),
                    enabled=tc_data.get("enabled", True),
                )
                problem.add_test_case(test_case)

        # Save to repository
        saved_problem = await self._problem_repository.add(problem)
        return self._to_dto(saved_problem)

    async def get_problem(self, problem_id: UUID) -> Optional[ProblemDTO]:
        """Get problem by ID."""
        problem = await self._problem_repository.get_by_id(problem_id)
        if not problem:
            return None
        return self._to_dto(problem)

    async def get_problem_by_slug(self, slug: str) -> Optional[ProblemDTO]:
        """Get problem by slug."""
        problem = await self._problem_repository.get_by_slug(ProblemSlug(slug))
        if not problem:
            return None
        return self._to_dto(problem)

    async def list_problems(
        self,
        difficulty: Optional[str] = None,
        category: Optional[str] = None,
        published_only: bool = True,
        page: int = 1,
        page_size: int = 20,
    ) -> ProblemListDTO:
        """List problems with filters."""
        diff = Difficulty(difficulty) if difficulty else None
        cat = ProblemCategory(category) if category else None

        problems = await self._problem_repository.get_all(
            difficulty=diff,
            category=cat,
            published_only=published_only,
            limit=page_size,
            offset=(page - 1) * page_size,
        )

        total = await self._problem_repository.count(
            difficulty=diff,
            category=cat,
            published_only=published_only,
        )

        return ProblemListDTO(
            problems=[self._to_dto(p) for p in problems],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size,
        )

    async def search_problems(self, query: str, limit: int = 20) -> List[ProblemDTO]:
        """Search problems."""
        problems = await self._problem_repository.search(query, limit)
        return [self._to_dto(p) for p in problems]

    async def update_problem(self, problem_id: UUID, dto: ProblemUpdateDTO) -> Optional[ProblemDTO]:
        """Update a problem."""
        problem = await self._problem_repository.get_by_id(problem_id)
        if not problem:
            raise EntityNotFoundException("Problem", problem_id)

        if dto.title is not None:
            problem.title = ProblemTitle(dto.title)
        if dto.description is not None:
            problem.description = ProblemDescription(dto.description)
        if dto.difficulty is not None:
            problem.difficulty = dto.difficulty
        if dto.category is not None:
            problem.category = dto.category
        if dto.testbench is not None:
            problem.testbench = TestBenchCode(dto.testbench)
        if dto.time_limit is not None:
            problem.time_limit = dto.time_limit
        if dto.memory_limit is not None:
            problem.memory_limit = dto.memory_limit
        if dto.points is not None:
            problem.points = dto.points
        if dto.tags is not None:
            problem.tags = dto.tags
        if dto.is_published is not None:
            if dto.is_published:
                problem.publish()
            else:
                problem.unpublish()

        updated = await self._problem_repository.update(problem)
        return self._to_dto(updated)

    async def delete_problem(self, problem_id: UUID) -> bool:
        """Delete a problem."""
        return await self._problem_repository.delete(problem_id)

    async def publish_problem(self, problem_id: UUID) -> Optional[ProblemDTO]:
        """Publish a problem."""
        problem = await self._problem_repository.get_by_id(problem_id)
        if not problem:
            return None
        problem.publish()
        updated = await self._problem_repository.update(problem)
        return self._to_dto(updated)

    async def unpublish_problem(self, problem_id: UUID) -> Optional[ProblemDTO]:
        """Unpublish a problem."""
        problem = await self._problem_repository.get_by_id(problem_id)
        if not problem:
            return None
        problem.unpublish()
        updated = await self._problem_repository.update(problem)
        return self._to_dto(updated)

    def _to_dto(self, problem: Problem) -> ProblemDTO:
        """Convert Problem entity to DTO."""
        return ProblemDTO(
            id=problem.id,
            slug=problem.slug.value,
            title=problem.title.value,
            description=problem.description.value,
            difficulty=problem.difficulty,
            category=problem.category,
            time_limit=problem.time_limit,
            memory_limit=problem.memory_limit,
            points=problem.points,
            tags=problem.tags,
            is_published=problem.is_published,
            created_at=problem.created_at.isoformat(),
            updated_at=problem.updated_at.isoformat(),
            test_cases_count=len(problem.test_cases),
            public_test_cases_count=len(problem.get_public_test_cases()),
        )