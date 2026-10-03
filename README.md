# HDLForge

A browser-based HDL (Hardware Description Language) practice platform built with Next.js and FastAPI.

## Architecture

```
Vercel: Next.js frontend
          |                     \
          | HTTPS                 \ Supabase Auth
          v                       \
FastAPI API -----------------> PostgreSQL
          |
          | private HTTPS or VPC + shared token
          v
Private HDL worker -- Docker socket --> Isolated sandbox container
                                      (Icarus / Verilator)
```

## Requirements

- **Python** 3.11+
- **Node.js** 20.9+ (required by Next.js 16)
- **PostgreSQL** 14+
- **Verilator** (for direct execution mode)
- **Docker** (optional, for sandboxed execution)

## Quick Start

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE hdlforge;
CREATE USER hdlforge WITH PASSWORD 'hdlforge';
GRANT ALL PRIVILEGES ON DATABASE hdlforge TO hdlforge;
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run migrations
alembic upgrade head

# Seed problems with testbenches
python -m app.seed

# Start the server
uvicorn app.main:app --reload
```

Backend runs at http://localhost:8000

API docs available at:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

### 3. Frontend Setup

```bash
# From project root
npm install
npm run dev
```

Frontend runs at http://localhost:3000

### 4. HDL Execution Setup

**Option A: Direct Execution (Recommended for Development)**

Install Verilator:
- **Ubuntu/Debian**: `sudo apt-get install verilator`
- **macOS**: `brew install verilator`
- **Windows**: Use WSL2 or install from source

Set in `backend/.env`:
```
HDL_USE_DOCKER=false
```

**Option B: Private Docker Worker (Required for production)**

The public API does not receive Docker socket access. It sends authenticated
execution requests to a private worker, which launches short lived containers
from the hardened sandbox image. Run the worker on a dedicated Docker host in
the same private network as the API. The Docker socket gives the worker host
level control, so keep the worker trusted, firewalled, and unavailable from the
public internet.

### Production deployment

The supported topology is a Vercel frontend, a FastAPI API service with
PostgreSQL, and a private HDL worker on a Docker enabled host. No deployment is
performed by these instructions; provision the services and secrets first.

1. Build the sandbox image on the worker host:

   ```bash
   docker build -f backend/sandbox.Dockerfile -t hdlforge-sandbox:latest backend
   ```

2. Build and start the worker on that host. Create a private environment file
   containing `HDL_WORKER_TOKEN` (a random secret with at least 32 characters),
   `HDL_SANDBOX_IMAGE=hdlforge-sandbox:latest`, `HDL_USE_DOCKER=true`, and the
   simulator/resource limits from `backend/.env.example`.

   ```bash
   docker build -f backend/worker.Dockerfile -t hdlforge-worker:latest backend
   docker run -d --restart unless-stopped --name hdlforge-worker \
     --env-file worker.env \
     -p 10.10.0.5:8001:8001 \
     -v /var/run/docker.sock:/var/run/docker.sock \
     hdlforge-worker:latest
   ```

   Replace `10.10.0.5` with the worker host's private address. Permit port 8001
   only from the API service's private network. Set the worker container's
   `HDL_WORKER_TOKEN` to the same secret configured on the API.

3. Build the API image and deploy it without mounting the Docker socket:

   ```bash
   docker build -f backend/Dockerfile -t hdlforge-api:latest backend
   ```

   Set `ENVIRONMENT=production`, `DEBUG=false`, a stable `JWT_SECRET` of at least 32
   characters, `DATABASE_URL`, `SUPABASE_URL`, `CORS_ORIGINS` to the exact
   frontend HTTPS origin, `HDL_WORKER_URL=http://10.10.0.5:8001`, and the same
   `HDL_WORKER_TOKEN`. Set `HDL_USE_DOCKER=true` and keep the simulator and
   resource-limit values consistent between the API and worker.

4. Apply database migrations using the API image before starting the API:

   ```bash
   docker run --rm --env-file backend/.env hdlforge-api:latest alembic upgrade head
   ```

   Seed the initial problem catalog and learning content once after the
   migration. These seed commands are idempotent:

   ```bash
   docker run --rm --env-file backend/.env hdlforge-api:latest python -m app.seed
   docker run --rm --env-file backend/.env hdlforge-api:latest python -m app.seed_expand
   docker run --rm --env-file backend/.env hdlforge-api:latest python -m app.seed_full_catalog
   docker run --rm --env-file backend/.env hdlforge-api:latest python -m app.seed_learning
   ```

5. Configure Vercel with `NEXT_PUBLIC_API_URL` pointing to the public API URL,
   `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Set `BACKEND_URL` to the public API URL for
   the Next.js `/api/*` rewrite. Then run the build and lint checks before
   promoting the deployment.

6. Check `GET /api/ready` on the API and `GET /ready` from the private worker
   network. Submit a known HDL solution and confirm it passes before opening
   the frontend to users.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/problems` | List problems (supports `difficulty`, `category`, `search` query params) |
| GET | `/api/problems/{slug}` | Get single problem by slug |
| POST | `/api/submissions/run` | Run code against problem testbench |
| POST | `/api/submissions/submit` | Submit solution for judging |

### Query Parameters for /api/problems

- `difficulty` - Filter by difficulty (EASY, MEDIUM, HARD)
- `category` - Filter by category
- `search` - Search in title and description

## Environment Variables

### Backend (.env)

```
POSTGRES_USER=hdlforge
POSTGRES_PASSWORD=hdlforge
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=hdlforge
DEBUG=true
CORS_ORIGINS=["http://localhost:3000"]

# HDL Execution
HDL_EXECUTION_TIMEOUT=5
HDL_MEMORY_LIMIT=256
HDL_CPU_LIMIT=5
HDL_PROCESS_LIMIT=64
HDL_MAX_SOURCE_SIZE=50000
HDL_MAX_OUTPUT_SIZE=100000
HDL_USE_DOCKER=false
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## HDL Execution Architecture

### How It Works

1. User writes SystemVerilog code in Monaco Editor
2. Frontend sends code to `POST /api/submissions/run`
3. Backend validates the submission
4. Execution Engine creates a temporary workspace
5. User code and problem testbench are written to workspace
6. Verilator compiles the code
7. Testbench simulation runs
8. Result Parser extracts structured test results
9. Response is sent back to frontend
10. Workspace is cleaned up

### Testbench Protocol

Testbenches emit structured markers for result parsing:

```systemverilog
$display("HDLFORGE_TEST_NAME:test name");
$display("HDLFORGE_TEST_PASS");  // or HDLFORGE_TEST_FAIL
$display("HDLFORGE_EXPECTED:expected value");
$display("HDLFORGE_RECEIVED:actual value");
$display("HDLFORGE_SCORE:100");
```

### Security

- User HDL is executed in an isolated environment
- Docker mode provides container isolation with:
  - No network access
  - Memory limits
  - CPU limits
  - Process limits
  - Read-only filesystem (except workspace)
- Direct mode uses subprocess isolation with timeout enforcement
- All temporary files are cleaned up after execution
- No user-controlled shell command execution

## Supported Problems

### Combinational Logic
- AND Gate
- OR Gate
- NOT Gate
- XOR Gate
- 2:1 Multiplexer

### Arithmetic
- Half Adder
- Full Adder

### Sequential Logic
- D Flip-Flop

### Medium Difficulty
- 4-bit Counter
- ALU (4-bit)

## Project Structure

```
HBL_Codemate/
+-- src/                    # Next.js frontend
|   +-- app/                # App Router pages
|   +-- components/         # React components
|   +-- lib/                # Utilities and API client
+-- backend/                # FastAPI backend
|   +-- app/
|   |   +-- api/routes/     # API route handlers
|   |   +-- core/           # Configuration
|   |   +-- db/             # Database models
|   |   +-- execution/      # HDL execution engine
|   |   +-- sandbox/        # Docker sandbox
|   |   +-- schemas/        # Pydantic schemas
|   |   +-- services/       # Business logic
|   |   +-- simulator/      # Verilator abstraction
|   |   +-- tests/          # Backend tests
|   +-- alembic/            # Database migrations
+-- docker/
    +-- hdl-sandbox/        # Docker image for HDL execution
```

## Testing

### Backend Tests

```bash
cd backend
pip install -r requirements.txt
pytest
```

### Frontend Build

```bash
npm run build
npm run lint
```

## Production notes

- Production auth uses Supabase. Local password routes are disabled when
  `ENVIRONMENT=production`; do not expose the development auth flow.
- Admin access comes from an explicitly configured `ADMIN_EMAILS` allowlist
  for verified addresses or trusted Supabase `app_metadata.is_admin` claims.
  User-editable metadata and usernames do not grant production admin access.
- Production execution requires a private worker and hardened sandbox image.
  `/api/ready` checks both PostgreSQL and the worker.
- HDL run and submit calls require sign-in in production and are rate limited.
- Run one API instance until a shared rate limiter is configured; the
  per-minute limiter also tracks stored submissions in PostgreSQL.
