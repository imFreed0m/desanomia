# 19 Changelog

Format: Keep a Changelog. Versions follow SemVer for the software, firmware has its own version reported on boot. Add an entry per merged microtask.

## Unreleased

### Added
- brain/ documentation set 00 to 19 drafted from SPEC.md v1.0.0, with [PROPOSED] and [VERIFY] items to reconcile.
- 02_APPFLOW (screen map, click behavior, user journeys) and 03_UI_UX_BRIEF (tokens, typography, components, layouts).

### Changed
- Files renumbered to follow the development flow (D-033), cross references updated.
- `brain/01_PRD.md` fully aligned with empirical constants and master invariants: target TDS 1250 ppm (1200–1300 ppm gate band), semi-closed loop dosing with single-pass top-up recovery, 12 FSM states, Gated Fault Reset, Dual E-Stop UX, FR-01 through FR-22, realistic dry-run cutoff (< 500 ms) and offline event resilience success metrics, and settled operational policies (unattended scheduling, inferential concentrate starvation detection).
- `brain/18_DECISIONS.md` updated with accepted decisions D-022 (Concentrate Stock Level & Starvation Detection) and D-024 (Batch Scheduling Execution).
- `GLOSSARY.md` updated with Concentrate Starvation Detection canonical domain definition.

## Spec

- SPEC.md v1.0.0 approved.
