# 14 GitHub Actions

Monorepo with firmware/, backend/, frontend/, deploy/. Path filters keep each pipeline fast. [PROPOSED, firmware assumes PlatformIO, change if the project uses ESP-IDF directly]

## Workflows

| File | Trigger | Jobs |
| --- | --- | --- |
| backend.yml | push and PR touching backend/** | ruff, mypy, pytest with postgres and mosquitto services, pip-audit |
| frontend.yml | push and PR touching frontend/** | tsc, eslint, vitest, build, offline-origin check, npm audit |
| firmware.yml | push and PR touching firmware/** | pio test -e native (FSM, gate, interlocks), pio run for the ESP32 target |
| e2e.yml | PR to main | compose stack with simulator, Playwright against the UI |
| release.yml | tag `v*` | build linux/arm64 images, push to GHCR, attach firmware .bin and checksum |

## backend.yml skeleton

```yaml
name: backend
on:
  push: { paths: ["backend/**", ".github/workflows/backend.yml"] }
  pull_request: { paths: ["backend/**"] }
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test, POSTGRES_DB: desanomia_test }
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U postgres" --health-interval 5s --health-retries 10
      mosquitto:
        image: eclipse-mosquitto:2
        ports: ["1883:1883"]
    defaults: { run: { working-directory: backend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12", cache: pip }
      - run: pip install -r requirements.txt -r requirements-dev.txt
      - run: ruff check . && ruff format --check .
      - run: mypy app
      - run: pytest -q
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:test@localhost:5432/desanomia_test
          MQTT_HOST: localhost
      - run: pip-audit
```

## frontend.yml checks

Node LTS, `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, then a script that greps dist/ for `https://` origins other than the app itself and fails if found (offline rule, see 12).

## firmware.yml checks

`pio test -e native` must pass with the FSM, gate boundary, and all 5 interlock tests before the ESP32 build runs. Upload the .bin as an artifact.

## release.yml

Use docker/setup-qemu-action and buildx for linux/arm64, push `ghcr.io/<owner>/desanomia-backend` and `-frontend` tagged with the version. No automatic deploy to the Pi in Phase 1, deployment is manual per 15.

## Rules

Required status checks on main: backend, frontend, firmware. Secrets only in GitHub Actions secrets (GHCR uses GITHUB_TOKEN). Dependabot for pip, npm, GitHub Actions. Pin third-party actions to major versions at minimum.
