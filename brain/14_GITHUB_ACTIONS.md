# 14 GitHub Actions

> **Authority Notice:** Single Source of Truth (SOTT) for Desanomia's Continuous Integration, Verification, and Automated Release Pipelines across all monorepo domains (`firmware/`, `backend/`, `frontend/`, `simulator/`, `deploy/`). Governed by [00_MASTER_RULES.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/00_MASTER_RULES.md), [04_TRD.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/04_TRD.md), [08_SECURITY.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/08_SECURITY.md), [09_ERROR_HANDLING.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/09_ERROR_HANDLING.md), [10_FIRMWARE_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/10_FIRMWARE_SPEC.md), [11_API_CONTRACT.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/11_API_CONTRACT.md), [12_UI_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/12_UI_SPEC.md), [13_TESTING.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/13_TESTING.md), [15_DEPLOYMENT.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/15_DEPLOYMENT.md), and [18_DECISIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md).

---

## 1. Monorepo CI/CD Architecture & Path Filtering Matrix

Desanomia is structured as a tightly coordinated cyber-physical monorepo spanning embedded microcontroller firmware, FastAPI edge backend, React 18/19 SPA frontend, hardware simulator, and deployment manifests.

```
                                      +------------------------------------+
                                      | GitHub Actions Event (Push / PR)   |
                                      +-----------------+------------------+
                                                        |
                +-----------------------+---------------+-----------------------+-----------------------+
                |                       |                                       |                       |
                v                       v                                       v                       v
     [firmware/** paths]       [backend/** paths]                      [frontend/** paths]         [PR to main / Nightly]
                |                       |                                       |                       |
                v                       v                                       v                       v
     +---------------------+ +---------------------+                 +---------------------+ +---------------------+
     |    firmware.yml     | |     backend.yml     |                 |    frontend.yml     | |       e2e.yml       |
     | • PlatformIO Native | | • Python 3.12       |                 | • Node 20 LTS       | | • Docker Compose    |
     | • 100% Branch Cov   | | • Ruff / Mypy       |                 | • TSC / ESLint      | | • Python ESP32 Sim  |
     | • IL-01 to IL-07    | | • Pytest + Postgres |                 | • Vitest (80% Cov)  | | • Playwright E2E    |
     | • ESP32-S3 Binary   | | • 85% Line Cov Gate |                 | • 100% Offline Gate | | • Multi-Tier Scenarios
     +---------------------+ +---------------------+                 +---------------------+ +---------------------+
                |                       |                                       |                       |
                +-----------------------+---------------+-----------------------+-----------------------+
                                                        |
                                                        v
                                      +------------------------------------+
                                      | GATED MERGE DECISION TO `main`     |
                                      | All Status Checks Must Be GREEN    |
                                      +-----------------+------------------+
                                                        |
                                                        v Tag Push (`v*`)
                                      +------------------------------------+
                                      |            release.yml             |
                                      | • Docker Buildx linux/amd64 (N100) |
                                      | • Publish GHCR Container Images    |
                                      | • Firmware Binary Release Bundle   |
                                      +------------------------------------+
```

### 1.1 Workflow Catalog & Trigger Triggers

| Workflow File | Trigger Conditions | Path Filtering Scope | Primary Quality Gates & Deliverables |
| :--- | :--- | :--- | :--- |
| `.github/workflows/firmware.yml` | Push & PR to any branch | `firmware/**`, `.github/workflows/firmware.yml` | `clang-tidy`, `pio test -e native` (**100% branch coverage on safety**), ESP32-S3 build, `firmware.bin` artifact. |
| `.github/workflows/backend.yml` | Push & PR to any branch | `backend/**`, `.github/workflows/backend.yml` | `ruff`, `mypy --strict`, `pip-audit`, `pytest` with live PostgreSQL 16 & Mosquitto (**85% coverage gate**). |
| `.github/workflows/frontend.yml` | Push & PR to any branch | `frontend/**`, `.github/workflows/frontend.yml` | `tsc`, `eslint`, `vitest` (**80% coverage gate**), `vite build`, **100% Offline Asset Integrity Gate**. |
| `.github/workflows/e2e.yml` | PR to `main`, Daily `02:00 UTC` | Full repository | Docker Compose full-stack runner, Python ESP32 simulator, Playwright E2E lifecycle and fault recovery suite. |
| `.github/workflows/release.yml` | Git tag push `v*` | N/A (Tag push) | `linux/amd64` Docker images pushed to GHCR (`backend`, `frontend`), GitHub Release with `firmware.bin` and SHA-256. |
| `.github/workflows/security.yml` | Weekly Sunday `00:00 UTC` | Full repository | CodeQL static analysis (Python, C++, TypeScript), secret scanning, Dependabot alert triage. |

### 1.2 Strict Branch Protection Policies (`main`)

The `main` branch represents deployable production code for the greenhouse facility:
1. **Linear History:** Rebase or Squash-and-merge enforced. No merge commits.
2. **Required Status Checks:** `firmware`, `backend`, `frontend`, and `e2e` must all report passing.
3. **Safety Branch Coverage Gate:** Any pull request modifying `firmware/src/safety_interlocks.cpp`, `firmware/src/fsm_engine.cpp`, or `firmware/src/dosing_calculator.cpp` that results in $< 100\%$ branch coverage is **vetoed and blocked from merging**.
4. **Signed Commits:** GPG/SSH commit signature verification enabled.

---

## 2. Embedded Firmware CI Workflow (`firmware.yml`)

The firmware pipeline executes host-native testing and target compilation for the ESP32-S3 N16R8 microcontroller:

```yaml
name: firmware

on:
  push:
    paths:
      - "firmware/**"
      - ".github/workflows/firmware.yml"
  pull_request:
    paths:
      - "firmware/**"
      - ".github/workflows/firmware.yml"

jobs:
  lint-and-analyze:
    name: Firmware Static Analysis
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: firmware
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Install Clang-Tidy and Cppcheck
        run: |
          sudo apt-get update
          sudo apt-get install -y clang-tidy cppcheck lcov

      - name: Run Cppcheck
        run: |
          cppcheck --enable=warning,style,performance,portability \
                   --error-exitcode=1 \
                   --inline-suppr \
                   src/ include/

  native-test-and-coverage:
    name: Native Unit Tests & 100% Safety Coverage Gate
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: firmware
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"

      - name: Install PlatformIO and LCOV
        run: |
          pip install -U platformio
          sudo apt-get update && sudo apt-get install -y lcov

      - name: Run Host-Native Tests with Coverage
        run: |
          pio test -e native --verbose

      - name: Calculate Branch Coverage for Safety Modules
        run: |
          lcov --capture --directory .pio/build/native --output-file coverage.info
          lcov --extract coverage.info "*/src/safety_interlocks.cpp" "*/src/fsm_engine.cpp" "*/src/dosing_calculator.cpp" --output-file safety_coverage.info
          
          # Enforce 100% branch coverage on safety-critical files
          BRANCH_COV=$(lcov --summary safety_coverage.info | grep "branches" | awk '{print $2}' | tr -d '%')
          echo "Safety Code Branch Coverage: ${BRANCH_COV}%"
          
          if [ "$BRANCH_COV" != "100.0" ] && [ "$BRANCH_COV" != "100" ]; then
            echo "ERROR: Firmware safety code branch coverage must be exactly 100%. Current: ${BRANCH_COV}%"
            exit 1
          fi

      - name: Upload Coverage Report
        uses: actions/upload-artifact@v4
        with:
          name: firmware-coverage-report
          path: firmware/safety_coverage.info

  compile-target:
    name: Build ESP32-S3 Target Binary
    needs: [lint-and-analyze, native-test-and-coverage]
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: firmware
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"

      - name: Install PlatformIO
        run: pip install -U platformio

      - name: Build Firmware for ESP32-S3 N16R8
        run: pio run -e esp32s3_n16r8

      - name: Generate Binary SHA-256 Checksums
        run: |
          cd .pio/build/esp32s3_n16r8
          sha256sum firmware.bin > firmware.bin.sha256
          sha256sum bootloader.bin > bootloader.bin.sha256
          sha256sum partitions.bin > partitions.bin.sha256

      - name: Upload Firmware Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: esp32s3-firmware-binaries
          path: |
            firmware/.pio/build/esp32s3_n16r8/firmware.bin
            firmware/.pio/build/esp32s3_n16r8/firmware.bin.sha256
            firmware/.pio/build/esp32s3_n16r8/bootloader.bin
            firmware/.pio/build/esp32s3_n16r8/partitions.bin
```

---

## 3. Edge Backend CI Workflow (`backend.yml`)

The backend pipeline executes linting, typechecking, security auditing, and asynchronous integration testing against live PostgreSQL 16 and Mosquitto service containers:

```yaml
name: backend

on:
  push:
    paths:
      - "backend/**"
      - ".github/workflows/backend.yml"
  pull_request:
    paths:
      - "backend/**"
      - ".github/workflows/backend.yml"

jobs:
  test:
    name: Backend Test & Lint Pipeline
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: desanomia_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 10

      mosquitto:
        image: eclipse-mosquitto:2
        ports:
          - 1883:1883

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Python 3.12
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"
          cache-dependency-path: "backend/requirements*.txt"

      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt -r requirements-dev.txt

      - name: Code Formatting & Linting (Ruff)
        run: |
          ruff check .
          ruff format --check .

      - name: Static Type Checking (Mypy)
        run: mypy --strict app

      - name: Dependency Security Audit
        run: pip-audit --strict

      - name: Run Database Migrations (Alembic)
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:testpassword@localhost:5432/desanomia_test
        run: alembic upgrade head

      - name: Execute Pytest Suite with Coverage Gate (>= 85%)
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:testpassword@localhost:5432/desanomia_test
          MQTT_HOST: localhost
          MQTT_PORT: 1883
          SECRET_KEY: test_secret_key_for_ci_pipeline_only_32_bytes
        run: |
          pytest -v \
                 --cov=app \
                 --cov-report=term-missing \
                 --cov-report=xml \
                 --cov-fail-under=85

      - name: Upload Backend Coverage Report
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage-report
          path: backend/coverage.xml
```

---

## 4. Frontend CI Workflow (`frontend.yml`)

The frontend pipeline validates static TypeScript typing, ESLint compliance, Vitest component test coverage, Vite production bundling, and executes the **100% Offline Asset Integrity Gate**:

```yaml
name: frontend

on:
  push:
    paths:
      - "frontend/**"
      - ".github/workflows/frontend.yml"
  pull_request:
    paths:
      - "frontend/**"
      - ".github/workflows/frontend.yml"

jobs:
  build-and-test:
    name: Frontend Test, Build & Offline Gate
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Node.js 20 LTS
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
          cache-dependency-path: "frontend/package-lock.json"

      - name: Clean Install Dependencies
        run: npm ci

      - name: Dependency Security Audit
        run: npm audit --audit-level=high

      - name: TypeScript Type Checking
        run: npm run typecheck

      - name: ESLint Code Quality
        run: npm run lint

      - name: Vitest Component Tests with Coverage (>= 80%)
        run: npm test -- --coverage --coverage.lines=80

      - name: Build Static SPA Distribution (Vite)
        run: npm run build

      - name: 100% Offline Asset Integrity Gate (CI Veto Check)
        run: |
          echo "Auditing dist/ directory for forbidden external network dependencies..."
          
          # Search for any remote http://, https://, or common CDN domains
          FORBIDDEN_REFS=$(grep -riE "(https?:\/\/|fonts\.googleapis\.com|cdn\.jsdelivr|unpkg\.com)" dist/ || true)
          
          if [ -n "$FORBIDDEN_REFS" ]; then
            echo "CRITICAL FAILURE: 100% Offline rule violated! External network reference detected in dist/:"
            echo "$FORBIDDEN_REFS"
            exit 1
          fi
          
          echo "SUCCESS: 100% Offline bundle verified. Zero external origins found."

      - name: Upload Production Frontend Bundle
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist-bundle
          path: frontend/dist/
```

---

## 5. End-to-End Simulation Workflow (`e2e.yml`)

The E2E pipeline spins up the complete edge container stack via Docker Compose, launches the Python ESP32 hardware simulator on OT fieldbus topic channels, and runs Playwright browser tests:

```yaml
name: e2e

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 2 * * *" # Run nightly at 02:00 UTC

jobs:
  playwright-e2e:
    name: Full-Stack E2E Playwright Suite
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Set up Node.js 20 LTS
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
          cache-dependency-path: "frontend/package-lock.json"

      - name: Install Playwright Browsers
        run: |
          cd e2e
          npm ci
          npx playwright install --with-deps chromium

      - name: Build and Start Full Docker Compose Edge Stack
        run: |
          docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.sim.yml up -d --build
          
          # Wait for backend healthcheck
          timeout 60 bash -c 'until curl -s http://localhost:8000/api/v1/health | grep "\"status\":\"healthy\""; do sleep 2; done'
          
          # Wait for frontend static web server
          timeout 30 bash -c 'until curl -s http://localhost:8080 | grep "desanomia"; do sleep 1; done'

      - name: Execute Playwright E2E Tests
        run: |
          cd e2e
          npx playwright test

      - name: Collect Container Logs on Failure
        if: failure()
        run: |
          docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.sim.yml logs > container_logs.txt

      - name: Upload Playwright Report & Failure Artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: |
            e2e/playwright-report/
            container_logs.txt
          retention-days: 14

      - name: Teardown Docker Compose Stack
        if: always()
        run: docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.sim.yml down -v
```

---

## 6. Production Release Workflow (`release.yml`)

When a git tag matching `v*` (SemVer) is pushed, `release.yml` compiles production containers targeting `linux/amd64` (Beelink EQ12 Intel N100), pushes signed images to GitHub Packages (GHCR), and attaches release artifacts:

```yaml
name: release

on:
  push:
    tags:
      - "v*.*.*"

jobs:
  publish-containers:
    name: Build & Push GHCR Containers (linux/amd64)
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry (GHCR)
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract Release Version
        id: meta
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Build & Push Backend Container (amd64 for Beelink N100)
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          platforms: linux/amd64
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/desanomia-backend:${{ steps.meta.outputs.VERSION }}
            ghcr.io/${{ github.repository_owner }}/desanomia-backend:latest

      - name: Build & Push Frontend Container (Nginx amd64)
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          platforms: linux/amd64
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/desanomia-frontend:${{ steps.meta.outputs.VERSION }}
            ghcr.io/${{ github.repository_owner }}/desanomia-frontend:latest

  publish-firmware-and-release:
    name: Build Firmware & Create GitHub Release
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install PlatformIO
        run: pip install -U platformio

      - name: Compile ESP32-S3 Firmware
        run: |
          cd firmware
          pio run -e esp32s3_n16r8
          cp .pio/build/esp32s3_n16r8/firmware.bin ../firmware.bin
          sha256sum ../firmware.bin > ../firmware.bin.sha256

      - name: Package Deployment Manifests
        run: |
          tar -czvf deploy-bundle.tar.gz deploy/

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          name: "Desanomia Release ${{ github.ref_name }}"
          draft: false
          prerelease: false
          generate_release_notes: true
          files: |
            firmware.bin
            firmware.bin.sha256
            deploy-bundle.tar.gz
```

---

## 7. Security Scanning & Dependabot Configuration

### 7.1 CodeQL Analysis (`security.yml`)

Executes weekly deep semantic static security analysis across Python, C++, and TypeScript:

```yaml
name: codeql

on:
  schedule:
    - cron: "0 0 * * 0" # Weekly Sunday midnight
  workflow_dispatch:

jobs:
  analyze:
    name: CodeQL Static Security Analysis
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: [c-cpp, python, javascript-typescript]

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}

      - name: Autobuild CodeQL
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
```

### 7.2 Dependabot Automation (`.github/dependabot.yml`)

```yaml
version: 2
updates:
  - package-ecosystem: "pip"
    directory: "/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

---

## 8. Compliance & Quality Verification Checklist

| Pipeline Requirement | Master Standard Source | Automated Enforcement Standard |
| :--- | :--- | :--- |
| **Safety Branch Coverage** | `00_MASTER_RULES.md`, `13_TESTING.md` | LCOV branch coverage extraction verifies **100.0%** on `safety_interlocks.cpp`, `fsm_engine.cpp`, and `dosing_calculator.cpp`. Build fails otherwise. |
| **Backend Coverage Gate** | `13_TESTING.md` | `pytest --cov-fail-under=85` enforces $\ge 85\%$ statement coverage. |
| **Frontend Coverage Gate** | `13_TESTING.md` | `vitest --coverage.lines=80` enforces $\ge 80\%$ line coverage. |
| **100% Offline Bundle** | `04_TRD:TR-01`, `12_UI_SPEC.md` | Automated grep script verifies zero occurrences of `http://`, `https://`, or CDN URLs in compiled `dist/`. |
| **Target Architecture** | `04_TRD:TR-01`, `D-005` | Docker Buildx compiles strictly for `linux/amd64` (Beelink EQ12 Intel N100). |
| **CQS & Idempotency** | `11_API_CONTRACT.md`, `D-045` | Pytest verifies UUID `cmd_id` tracking, HTTP 202 Accepted, and duplicate deduplication. |
| **Audit Log Immutability** | `08_SECURITY.md`, `D-039` | Pytest executes database mutation attempts on `audit_logs` confirming trigger rejection. |
| **Linear Main History** | GitHub Repository Policy | Rebase/Squash merge enforced with mandatory signed commits. |
