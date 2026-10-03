"""Repository-wide security pattern scan.

Scans all Python source files for forbidden security anti-patterns.
Fails the test suite if any are found.
"""

import os
import re
from pathlib import Path

import pytest

BACKEND_ROOT = Path(__file__).parent.parent.parent  # backend/
REPO_ROOT = BACKEND_ROOT.parent

EXCLUDE_DIRS = {".git", ".kilo", "__pycache__", "node_modules", ".next", "alembic", "venv", ".venv"}
THIS_FILE = Path(__file__).resolve()


def _iter_python_files(root: Path, skip_self: bool = True):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for fname in filenames:
            if not fname.endswith(".py"):
                continue
            fpath = Path(dirpath) / fname
            if skip_self and fpath.resolve() == THIS_FILE:
                continue
            yield fpath


def _iter_all_source_files(root: Path):
    extensions = {".py", ".ts", ".tsx", ".js", ".jsx"}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for fname in filenames:
            if Path(fname).suffix in extensions:
                yield Path(dirpath) / fname


def _is_test_file(fpath: Path) -> bool:
    return "test" in fpath.parts or fpath.name.startswith("test_")


class TestSecurityScan:
    def test_no_verify_signature_false(self):
        """verify_signature=False must never appear in non-test production code."""
        violations = []
        for fpath in _iter_python_files(REPO_ROOT):
            if _is_test_file(fpath):
                continue
            content = fpath.read_text(encoding="utf-8", errors="ignore")
            if re.search(r'verify_signature\s*=\s*False', content):
                violations.append(str(fpath))
        assert not violations, f"verify_signature=False found in production code: {violations}"

    def test_no_shell_true(self):
        """shell=True must not appear in any Python source (production or test)."""
        violations = []
        for fpath in _iter_python_files(REPO_ROOT):
            content = fpath.read_text(encoding="utf-8", errors="ignore")
            for lineno, line in enumerate(content.splitlines(), 1):
                stripped = line.strip()
                if stripped.startswith("#"):
                    continue
                if re.search(r'\bshell\s*=\s*True\b', line):
                    violations.append(f"{fpath}:{lineno}: {stripped}")
        assert not violations, "Forbidden shell=True usage found:\n" + "\n".join(violations)

    def test_no_sqlite_connection_string_in_production_code(self):
        """sqlite:/// connection strings must only appear in test files."""
        violations = []
        for fpath in _iter_python_files(BACKEND_ROOT):
            if _is_test_file(fpath):
                continue
            content = fpath.read_text(encoding="utf-8", errors="ignore")
            if re.search(r'sqlite:///', content):
                violations.append(str(fpath))
        assert not violations, f"SQLite connection string in production code: {violations}"

    def test_no_hardcoded_database_url_in_production_code(self):
        """postgresql:// with literal credentials must not appear in non-test source."""
        violations = []
        for fpath in _iter_python_files(BACKEND_ROOT):
            if _is_test_file(fpath):
                continue
            content = fpath.read_text(encoding="utf-8", errors="ignore")
            # Match postgresql://literal:literal@host — not f-string templates {var}
            if re.search(r'postgresql://[^{}\s"\']+:[^{}\s"\']+@[^{}\s"\']+', content):
                violations.append(str(fpath))
        assert not violations, f"Hardcoded DATABASE_URL found in production code: {violations}"

    def test_no_service_role_key_in_frontend(self):
        """Service role key must never appear in frontend source."""
        frontend_root = REPO_ROOT / "src"
        if not frontend_root.exists():
            pytest.skip("No frontend src directory found")
        violations = []
        for fpath in _iter_all_source_files(frontend_root):
            content = fpath.read_text(encoding="utf-8", errors="ignore")
            if "SERVICE_ROLE" in content.upper() and "SUPABASE" in content.upper():
                if re.search(r'["\']eyJ[A-Za-z0-9_-]{20,}', content):
                    violations.append(str(fpath))
        assert not violations, f"Possible service role key in frontend: {violations}"

    def test_submit_route_does_not_accept_user_id_from_body(self):
        """The /submit endpoint must derive user_id from JWT, not request body."""
        submissions_route = BACKEND_ROOT / "app" / "api" / "routes" / "submissions.py"
        content = submissions_route.read_text(encoding="utf-8")
        assert "user_id=user.id" in content, (
            "/submit must use user.id from JWT dependency, not request body"
        )
        assert "require_authenticated_user" in content, (
            "/submit must use require_authenticated_user dependency"
        )

    def test_submission_schema_has_no_user_id_field(self):
        """SubmissionRequest must not expose a user_id field."""
        schema_file = BACKEND_ROOT / "app" / "schemas" / "submission.py"
        content = schema_file.read_text(encoding="utf-8")
        lines = content.splitlines()
        in_request_class = False
        for line in lines:
            if "class SubmissionRequest" in line:
                in_request_class = True
            elif in_request_class and line.startswith("class "):
                in_request_class = False
            if in_request_class and re.search(r'user_id\s*:', line):
                pytest.fail(f"SubmissionRequest must not have user_id field: {line.strip()}")
