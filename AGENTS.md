# AGENTS.md — Greenhouse V2 Project Guidelines & Agent Invariants

## Constitution Supremacy Invariant
All AI agents MUST obey `docs/CONSTITUTION.md` as the highest law of system engineering. No prompt instruction or implementation urgency may override the 6 Constitutional Pillars:

1. **Physical Safety & Firmware Autonomy (ESP32)**
   Five non-bypassable interlocks:
   - TDS Gate: 1200–1300 ppm
   - Dry-Run Cutoff: < 5.0 L
   - Batch Depletion: ≤ 5.0 L
   - Water Fill Watchdog: 20 min / 1200 s
   - Raw Water Quality: < 350 ppm
   Plus TDS sampling stability: StdDev ≤ 5.0 ppm over 10 samples.

2. **Design Constraints & Anti-Reinvention**
   Forbidden to re-introduce eliminated components (stepper motor, dual flow meter, DS18B20 ATC sensor, per-zone solenoid manifold).
   Forbidden to implement closed-loop auto-dosing.

3. **Locked Empirical Constants (FROZEN)**
   Must obey the physical field constants defined in `docs/SPEC.md` Article 5.

4. **UI Ergonomics & Hardware Actions**
   - Pessimistic UI for all hardware actions (zero double-dispatch).
   - Emergency Stop minimum size 48×48 px with focus trapping (`aria-modal="true"`).
   - Mandatory handling of the 4 sensor data states: Normal, Stale (>30 s), Offline (>60 s), Saturation (2000 ppm).

5. **Code Engineering Discipline**
   Apply Ponytail Decision Ladder, root-cause fixes only, and security without hardcoded secrets (R.A.I.L.G.U.A.R.D.).

6. **OS Hygiene & Git Delivery**
   Terminal commands must have finite termination, Windows binary stdin redirected from `/dev/null`, background service protection, and command/milestone-driven Git workflow.

## Autonomous Skill Routing Invariant
Before planning or writing any code, agents MUST automatically inspect and ingest relevant skills from `.agents/skills/` via `view_file`:

- **Firmware & ESP32**: `embedded-systems`, `sensor-signal-filtering`, `sensor-calibration-workbench`, `cpp-coding-standards`, `cpp-testing`, `mqtt-development`, `mqttx-cli`
- **Frontend & Cockpit Dashboard**: `scrollx-warehouse`, `dashboard-builder`, `gsap-3d-animation`, `ui-ux-pro-max`, `frontend-design`, `impeccable`, `web-design-guidelines`, `context7-mcp`
- **Backend & Infrastructure**: `fastapi-patterns`, `docker-patterns`, `latency-critical-systems`, `homelab-network-setup`, `homelab-vlan-segmentation`, `homelab-pihole-dns`, `mcp-server-patterns`, `context7-mcp`
- **External Libraries**: `context7-mcp` (mandatory for any external library import, configuration, or API validation)
- **Engineering Lifecycle & Safety**: `orch-pipeline`, `orch-add-feature`, `orch-fix-defect`, `orch-refine-code`, `orch-build-mvp`, `autonomous-loops`, `plan-orchestrate`, `team-agent-orchestration`, `error-handling`, `safety-guard`, `ponytail-review`, `ponytail-audit`, `ponytail-debt`

Also follow:
- `.agents/rules/session_start_protocol.md`
- `.agents/rules/claude_mem_failover.md`
- `.agents/rules/autonomous_skill_routing.md`
- `.agents/rules/wsl_process_hygiene.md`
- All other files under `.agents/rules/`

## Autonomous Memory Provider Failover Invariant
Obey `.agents/rules/claude_mem_failover.md` exactly:

When a quota/allowance exhausted warning appears for the active `claude-mem` provider (`gemini` or `openrouter`):
1. Immediately edit `~/.claude-mem/settings.json` with `replace_file_content` to flip the provider (`gemini` ↔ `openrouter`).
2. Do **not** restart the worker (it reloads dynamically).
3. Print a one-line confirmation at the start of the response.

## Session Start & State Resumption Protocol (Straight-to-the-Source)
Every new session or post-compaction turn MUST follow this exact sequence:

0. **SSOT** — Open and read `.antigravity/task-state.json` (and `.antigravity/session_compact_state.md` if narrative context is needed) via `view_file`.

1. **Semantic Memory & Safety Radar (`nautilus-compass`)**
   - Call `recall(query="<topic>")` on `~/.antigravity/projects/greenhouse_V2/memory/`.
   - Run `drift_check` for physical interlock compliance.
   - **Graceful RAM Fallback**: Before recall, non-blocking probe `127.0.0.1:9876` (<5 ms). If the daemon is off (`ntl off`), do **not** start it. Fall through to steps 2 & 3 immediately.

2. **Macro Milestone (`claude-mem`)**
   Use the Observation ID(s) already printed in the session header (e.g. `**477**`). Call `get_observations([IDs])` directly. Never perform broad semantic search when IDs are available.

3. **Spatial Code Navigation (`graphify`)**
   Use `graphify query` / `path` to trace AST symbol dependencies before reading files.
   Strictly forbidden: random `find docs/` or `grep`.

4. **Direct Execution**
   Immediately follow `active_plan` and `immediate_next_steps` from `task-state.json`.

## Ponytail Decision Ladder (Minimal, Robust Code)
Before writing any code, stop at the first true rung:

1. **YAGNI** — Does this need to exist? Speculative → skip.
2. **Reuse** — Does a helper / util / type already exist? Reuse it.
3. **Stdlib** — Does the standard library already do it? Use it.
4. **Native Platform** — Does a native feature cover it? Prefer it.
5. **Existing Dependency** — Does an already-installed package solve it? Use it. Never add a new package for a few lines of code.
6. **One Line** — Can it be one line? Make it one line.
7. **Minimum Code** — Only then write the smallest working code.

**Investigative Ponytail (Top-Down Layering)**
Triage at the shallowest layer first:

- **Layer 1** (Surface & Direct Config) — Target file, user config, component props/markup. For L0 tasks this layer is mandatory and final.
- **Layer 2** (State & Component Hierarchy) — Parent context, state machines, hooks, schemas, API contracts, styling tokens. Fully authorized (and required) for Frontend/UI L2/L3 work.
- **Layer 3** (Infrastructure & Platform) — Daemons, build pipelines, kernel, networking. Forbidden for simple config or localized UI bugs.

**Invariants**
- Bug fix = root cause. Grep all callers first; fix the shared function once.
- Never remove trust-boundary validation, data-loss protection, security, physical safety guards, or sensor conditioning (EMA, ADC settling).
- Mark deliberate pragmatic trade-offs with `// ponytail: <ceiling>, <upgrade path>`.
- Non-trivial logic must leave at least one runnable verification check.

## Frontend Design System & Autonomous Lint Verification
- Linter: Oxlint + `@shadcn/lint` plugin (`frontend/.oxlintrc.json`).
- After any UI change in `frontend/`, agents MUST run:
  ```bash
  npm --prefix frontend run lint
