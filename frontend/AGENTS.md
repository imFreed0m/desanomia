# Frontend

Applies only to `frontend/**`.

## Rules

- Preserve dashboard architecture and existing component boundaries.
- Hardware actions use pessimistic UI and must prevent double-dispatch.
- Emergency Stop: minimum 48×48 px target and `aria-modal="true"` with focus trapping.
- Sensor data must represent: Normal, Stale (>30s), Offline (>60s), Saturation (2000 ppm).
- Do not restyle atomic UI components at call sites. Add component variants in `src/components/ui/` when needed.
- Prefer standard Tailwind tokens over arbitrary values.
- Use existing components, utilities, and installed dependencies before adding new ones.
- Load UI/design skills only for UI/design work; verify external library APIs before relying on them.

## Verification

After UI changes:

`npm --prefix frontend run lint`

Also run the relevant typecheck/tests/build when the change affects them.
