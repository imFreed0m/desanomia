# Triage Labels

The engineering skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in Desanomia's local issue tracker and microtask workflows (`.scratch/<feature>/issues/` and `brain/17_MICROTASKS.md`).

| Label in skills     | Label in Desanomia  | Meaning                                              |
| ------------------- | ------------------- | ---------------------------------------------------- |
| `needs-triage`      | `needs-triage`      | Maintainer needs to evaluate this issue or task      |
| `needs-info`        | `needs-info`        | Waiting on operator/reporter for more information    |
| `ready-for-agent`   | `ready-for-agent`   | Fully specified, ready for an autonomous agent to run|
| `ready-for-human`   | `ready-for-human`   | Requires physical bench work, wiring, or human steps |
| `wontfix`           | `wontfix`           | Rejected decision or out-of-scope feature            |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), record the corresponding label string from this table in the issue's `Status:` field.

See [.agents/issue-tracker.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/.agents/issue-tracker.md) for tracker layout details.
