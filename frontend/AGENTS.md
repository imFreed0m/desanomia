# Frontend — AGENTS.md

> Read this file every time you generate, refactor, or review code.
> If the user's instruction conflicts with this file, DO NOT ASSUME, ASK first before proceeding.

Applies only to `frontend/**`.

---

## 1. Project Stack (DO NOT change without permission)

- **Framework:** React 18 (functional components + hooks ONLY)
- **Language:** TypeScript (strict mode, NO `any`)
- **Build tool:** Vite 5
- **Styling:** Tailwind CSS v3 (config in `tailwind.config.ts`)
- **UI Components:** shadcn/ui (base: Radix UI, preset: Nova)
- **Icon:** lucide-react
- **Chart:** recharts
- **Toast:** sonner
- **Testing:** Storybook 8

### ⛔ FORBIDDEN to install other UI libraries:
`@arco-design/web-react`, `antd`, `@mui/material`, `@chakra-ui/react`,
`@mantine/core`, `styled-components`, `@emotion/react`, or any other UI library.

If a new component is needed → run `bunx --bun shadcn@latest add <name>`.

---

## 2. UI Component Standard

### ALWAYS use shadcn/ui for:

| Need | Component | Import |
|---|---|---|
| Modal/Dialog | `Dialog` | `@/components/ui/dialog` |
| Text input | `Input` | `@/components/ui/input` |
| Number input | `Input` + `type="number"` | `@/components/ui/input` |
| Select | `Select` + `SelectTrigger` + `SelectValue` + `SelectContent` + `SelectItem` | `@/components/ui/select` |
| Radio | `RadioGroup` + `RadioGroupItem` | `@/components/ui/radio-group` |
| Checkbox | `Checkbox` (`onCheckedChange`) | `@/components/ui/checkbox` |
| Alert | `Alert` + `AlertTitle` + `AlertDescription` | `@/components/ui/alert` |
| Toast | `toast` | `sonner` |
| Button | `Button` | `@/components/ui/button` |

### NEVER:
- ❌ Build custom modals — use `<Dialog>`
- ❌ Use `window.alert()` / `window.confirm()` — use `toast` or `<Dialog>`
- ❌ Restyle atomic components at call sites — add variants in `src/components/ui/`
- ❌ Edit files in `src/components/ui/` — they are generated, leave them alone

### CORRECT example:
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
```

### WRONG example:
```tsx
import { Modal } from "@arco-design/web-react"; // ❌
import { Button } from "antd";                   // ❌
```

---

## 3. Kiosk Display & E-Stop UX (CRITICAL)

- Target viewport: **UPERFECT 15.6" IPS FHD (1920×1080)**
- **Zero vertical scroll** on main dashboard: `h-[1080px] overflow-hidden`
- `html, body` are already fixed at 1920×1080 in `src/index.css` — do not change
- `user-select: none` — kiosk mode, text selection is disabled
- **Dual E-Stop UX Policy (`D-019`, `D-050`):**
  - **Tier 1 Kiosk (Local Panel Room):** Instant 1-tap pill ($64 \times 64\text{ px}$, `z-[100]`) **without** confirmation modal.
  - **Remote / Mobile PWA:** Mandatory 2-step gated confirmation modal (`aria-modal="true"`) to prevent accidental remote dispatch.

---

## 4. Hardware Safety Rules, Gated Resets & Sensor States

- Hardware actions use **pessimistic UI** — do not update state before backend confirmation.
- **Prevent double-dispatch** — disable buttons while pending.
- **Sensor Liveness & Limits (`D-003`, `D-010`):**
  - Radar Liveness Watchdog: offline after **>3.0 seconds** of silence (`FAULT_RADAR_OFFLINE`).
  - TDS Plausibility: clean water baseline must be within `[50, 2000] ppm` (baseline $<350\text{ ppm}$).
- **Gated Fault Reset (`D-012`):**
  - The UI `Reset Fault` button **MUST** be disabled/locked if Distribution Drum (Drum 2) level $>8.0\text{ L}$ during chemical/TDS out-of-range faults.
  - Mandatory drainage instruction: off-spec batches must be drained manually via bottom gravity drain valve to the waste ditch before fault de-latching is permitted.
- **Mid-Outage Pause & Top-Up Constraints (`D-013`, `D-051`):**
  - When recovering from power loss with Drum 2 level $>5.0\text{ L}$, display `BATCH_PAUSED_INSPECTION` modal showing volume, measured PPM, and calculated deficit concentrate ($V_{\text{deficit}} \le 300\text{ mL}$).
  - Single-pass top-up recovery cap: maximum **300 mL** concentrate addition. If deficit exceeds $300\text{ mL}$ ($<\text{Target} - 229.3\text{ ppm}$), raise `STARVATION_SUSPECTED` instead of blind dosing.

---

## 5. Component Rules

### ALWAYS:
- ✅ Functional component + hooks
- ✅ One component = one `.tsx` file
- ✅ File & component names: `PascalCase`
- ✅ Props use TypeScript `interface`
- ✅ Every component in `src/components/` has a Storybook story

### NEVER:
- ❌ Class components
- ❌ `any` — use `unknown` + type guard
- ❌ `useEffect` for data fetching
- ❌ Index as `key` in lists
- ❌ `React.FC` (use function declaration)

---

## 6. Styling & Design Tokens

- ✅ Use **Tailwind** for all styling
- ✅ Use existing **design tokens**:
  - `canvas-bg` (#F8FAFC), `surface-card` (#FFFFFF)
  - `text-primary`, `text-secondary`, `text-muted`
  - `primary-container` (#2563EB)
  - `border-hairline` (#E2E8F0)
  - `status-ok-bg/fg`, `status-warn-bg/fg`, `status-danger-bg/fg`
- ✅ Rounded corners: `rounded-2xl` (16px) or `rounded-3xl` (28px)
- ✅ Use `cn()` from `@/lib/utils` for conditional classes
- ❌ Do NOT use arbitrary values (`w-[672px]`, `text-[13.5px]`) unless truly necessary
- ❌ Do NOT use inline `style={{}}` unless values are dynamic

---

## 7. Storybook Companion Rule

Every component in `src/components/` **MUST** have a story in `src/stories/*.stories.tsx`.

Stories must cover at minimum:
- **Standard** — normal condition
- **Empty/Idle** — no data
- **Active/Warning** — active or warning state
- **Edge cases** — extreme data

---

## 8. Onlook WYSIWYG Compatibility

- Use semantic tags: `div`, `button`, `section`, `header`, `h1-h6`, `p`
- **Avoid:**
  - Dynamic class constructors that break AST-level selector targeting
  - Overly nested inline macros
- JSX structure must be clean and targetable by selectors

---

## 9. Import Rules

Import order (MANDATORY):
```tsx
// 1. React & external libraries
import { useState } from "react";
import { toast } from "sonner";

// 2. Internal absolute (@/)
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// 3. Relative (files nearby)
import { UserAvatar } from "./UserAvatar";

// 4. Types
import type { Recipe } from "../types";
```

---

## 10. TypeScript Rules

- ✅ Strict mode is enabled
- ✅ `type` for unions/primitives, `interface` for objects
- ✅ Explicit return types for complex functions
- ❌ NO `any` — use `unknown`
- ❌ NO `@ts-ignore` — use `@ts-expect-error` + comment
- ❌ NO `as` casts unless forced

---

## 11. Verification (MANDATORY before saying "done")

After UI changes, run:

```bash
bun --cwd frontend run lint
```

Also run when relevant:

- `bun --cwd frontend run check` — typecheck + knip
- `bun --cwd frontend run build` — production Vite build
- `bun --cwd frontend run build-storybook` — Storybook static build

**If any error appears — FIX it first, do not say done.**

---

## 12. Hard Prohibitions for AI

1. ❌ DO NOT install new UI libraries (Arco, MUI, Ant Design, Chakra, Mantine)
2. ❌ DO NOT install new libraries without user confirmation
3. ❌ DO NOT change folder structure without permission
4. ❌ DO NOT delete files without confirmation
5. ❌ DO NOT refactor extensively without being asked
6. ❌ DO NOT use `any` or `@ts-ignore`
7. ❌ DO NOT use class components
8. ❌ DO NOT use `useEffect` for data fetching
9. ❌ DO NOT mix styling approaches (Tailwind + shadcn only)
10. ❌ DO NOT create files > 300 lines — split them

---

## 13. When in Doubt

If the user's instruction is ambiguous or conflicts with this file:
- **ASK first**, DO NOT ASSUME and proceed blindly
- **Mention** which rule would be violated
- **Offer an alternative** that follows the rules
