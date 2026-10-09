# Issue tracker: Local Markdown & Microtasks

Issues, feature explorations, and specs for Desanomia live locally in markdown files.

## Project Task Sources

1. **Canonical Milestone Microtasks (`brain/17_MICROTASKS.md`)**:
   - The primary roadmap and task sequence for core development (Milestones M0 through M5: T-001 through T-082).
   - Work strictly on one microtask at a time selected from `brain/17_MICROTASKS.md`.
   - Update `brain/19_CHANGELOG.md` upon completion.

2. **Feature Explorations & Dynamic Issues (`.scratch/`)**:
   - Ad-hoc investigations, prototypes, deep feature designs, and dynamic agent issues live under `.scratch/<feature-slug>/`.

## Conventions for `.scratch/`

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (see [.agents/triage-labels.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/.agents/triage-labels.md) for role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/issues/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path or inspect the corresponding task ID in `brain/17_MICROTASKS.md`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket:

- **Map**: `.scratch/<effort>/map.md` (Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
