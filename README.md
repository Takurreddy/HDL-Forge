# HDLForge

HDLForge is a browser-based platform for learning and practicing hardware design with SystemVerilog. It combines a Next.js frontend with a FastAPI backend to provide interactive HDL exercises, automated grading, and a sandboxed execution environment for simulation-based validation.

## Overview

This project is designed for teaching digital logic and hardware design through small, hands-on coding challenges. Users write HDL solutions in the browser, run them against testbenches, and receive instant feedback on correctness.

Key goals:
- Practice real HDL coding in a browser-based editor
- Run simulation tests automatically against user-submitted logic
- Support a progression from simple gates to sequential circuits
- Isolate execution safely in a constrained sandbox
- Provide a clean API for frontend-driven learning workflows

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: FastAPI, Python, Pydantic
- Database: PostgreSQL
- Authentication: Supabase
- HDL execution: Verilator, Docker-based sandboxing
- Deployment target: Vercel frontend + private API/worker infrastructure

## Features

- Interactive HDL editor with Monaco
- Problem catalog for combinational and sequential logic exercises
- Run-time validation against per-problem testbenches
- Submission and grading workflow
- Search and filtering for problem discovery
- Isolated execution environment for safety and reliability
- API-first architecture for frontend integration

## Architecture

```text
Browser (Next.js frontend)
        |
        | HTTPS
        v
FastAPI API
        |
        +--> PostgreSQL
        |
        +--> HDL execution worker / simulator
                    |
                    +--> Verilator or Docker sandbox
```
<<<<<<< HEAD

The frontend communicates with the API for problem retrieval, execution, and submission. In production, the execution layer is kept isolated behind a private worker so user code does not run directly in the public-facing service.

## Requirements

Before running the project locally, install:

- Node.js 20.9+
- Python 3.11+
- PostgreSQL 14+
- Verilator for direct local simulation
- Docker (recommended for sandboxed execution)
=======
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
>>>>>>> e70e200aebeb6d63640b8c70100d6206027970c9

## Quick Start

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd HDL-Forge
npm install
```

### 2. Set up the database

Create a PostgreSQL database and user, for example:

```sql
CREATE DATABASE hdlforge;
CREATE USER hdlforge WITH PASSWORD 'hdlforge';
GRANT ALL PRIVILEGES ON DATABASE hdlforge TO hdlforge;
```

### 3. Configure the backend

```bash
cd backend
python -m venv .venv
# Linux/macOS
source .venv/bin/activate
# Windows
# .venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env
```

Then apply migrations and seed the initial data:

```bash
alembic upgrade head
python -m app.seed
```

Start the API:

```bash
uvicorn app.main:app --reload
```

The backend runs on http://localhost:8000 and exposes Swagger docs at:
- http://localhost:8000/docs
- http://localhost:8000/redoc

### 4. Start the frontend

From the project root:

```bash
npm run dev
```

<<<<<<< HEAD
The app runs at http://localhost:3000.
=======
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
>>>>>>> e70e200aebeb6d63640b8c70100d6206027970c9

## Environment Variables

### Backend

Example values for `backend/.env`:

```env
POSTGRES_USER=hdlforge
POSTGRES_PASSWORD=hdlforge
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=hdlforge
DEBUG=true
CORS_ORIGINS=["http://localhost:3000"]

# HDL execution settings
HDL_EXECUTION_TIMEOUT=5
HDL_MEMORY_LIMIT=256
HDL_CPU_LIMIT=5
HDL_PROCESS_LIMIT=64
HDL_MAX_SOURCE_SIZE=50000
HDL_MAX_OUTPUT_SIZE=100000
HDL_USE_DOCKER=false
```

### Frontend

Example values for `.env.local` at the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/problems` | List available problems |
| GET | `/api/problems/{slug}` | Fetch a specific problem |
| POST | `/api/submissions/run` | Run a submission against a testbench |
| POST | `/api/submissions/submit` | Submit and judge a solution |

Query parameters on `/api/problems`:
- `difficulty`
- `category`
- `search`

## Execution Model

When a user submits HDL:

1. The frontend sends code to the backend execution API.
2. The backend validates the submission.
3. A temporary workspace is created for the problem.
4. User code and the testbench are written to the workspace.
5. Verilator compiles the design.
6. The testbench is executed.
7. Structured output is parsed and returned to the client.
8. Temporary files are cleaned up.

The execution layer supports a direct local mode and a Dockerized sandbox mode for safer production execution. The sandbox enforces runtime restrictions such as CPU, memory, process, and network isolation.

## Supported Problem Types

- Combinational logic: AND, OR, NOT, XOR, muxes
- Arithmetic: half adder, full adder
- Sequential logic: D flip-flops
- Intermediate logic: counters, small ALUs

## Project Structure

```text
HDL-Forge/
├── src/                    # Next.js frontend
│   ├── app/                # App Router pages
│   ├── components/         # Reusable UI components
│   └── lib/                # Utility/services logic
├── backend/                # FastAPI application
│   ├── app/                # API, services, database, execution code
│   ├── alembic/            # Database migrations
│   ├── Dockerfile
│   ├── sandbox.Dockerfile
│   ├── worker.Dockerfile
│   └── requirements.txt
├── public/                 # Static frontend assets
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── .env.example
├── vercel.json
└── README.md
```

## Development and Validation

Frontend checks:

```bash
npm run lint
npm run build
```

Backend checks:

```bash
cd backend
pytest
```

## Production Notes

- Production auth uses Supabase.
- Public services should not expose Docker sockets directly.
- HDL execution should run behind a private worker and sandbox container.
- Use secure environment variables and restricted network access for execution workers.
- Health checks should validate both the API and the worker before exposing the platform publicly.

<<<<<<< HEAD
## License

This project does not currently declare a specific license in the repository. If you plan to distribute or reuse it publicly, add an explicit license file and choose an appropriate open-source license.
=======
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
>>>>>>> e70e200aebeb6d63640b8c70100d6206027970c9
