# 16 Production Checklist

Do not go live until every box is checked. Tick in this file and commit.

## Spec and docs

- [ ] All [VERIFY] tags in brain/ resolved against SPEC.md
- [ ] 5 interlock definitions copied into 10 and matched by firmware tests
- [ ] FSM states, timings, dose formula, and gate inclusivity confirmed against SPEC.md
- [ ] Open questions in 18_DECISIONS closed or accepted

## Firmware and hardware

- [ ] Firmware tests green in CI, safety module coverage 100%
- [ ] Each sensor calibrated (TDS against a reference solution, radar level against known volumes), values recorded
- [ ] Each actuator tested with water, wiring labeled
- [ ] Each of the 5 interlocks triggered on the bench and observed to force outputs safe
- [ ] Power-loss mid-batch tested, boots IDLE with latched fault
- [ ] OTA tested including rollback, signed images in use
- [ ] Hard limits for target and gate band compiled in

## Network and security

- [ ] No internet-facing ports, verified with an external port scan
- [ ] Tailscale ACLs restrict access to the Beelink EQ12 Mini PC
- [ ] MQTT anonymous access off, ACLs tested
- [ ] Default passwords changed, admin account created, kiosk viewer account created
- [ ] Secrets only in `.env` and GitHub secrets, none in git history
- [ ] Login rate limit and session expiry tested

## Backend and UI

- [ ] E2E suite green against simulator
- [ ] Viewer, Operator, Admin permissions verified manually
- [ ] Primary HMI touchscreen kiosk loads with internet disconnected, no external requests in the browser network tab
- [ ] Stale and offline banners verified by unplugging the ESP32
- [ ] Telegram alerts received for fault, gate failure, offline
- [ ] Clock consistent between ESP32, Beelink EQ12, and UI after a reboot with no internet

## Operations

- [ ] Compose stack auto-starts after Beelink EQ12 reboot, Primary HMI kiosk auto-starts
- [ ] Nightly backup running, restore tested on another machine
- [ ] Disk usage alert configured, telemetry retention job verified
- [ ] Rollback procedure rehearsed
- [ ] Operators trained: start batch, read faults, reset fault, manual mode limits

## First runs

- [ ] Full batch with water only, TDS gate behavior observed
- [ ] Supervised first fertilizer batch with an independent handheld TDS meter comparison, deviation recorded
- [ ] 7 days of supervised operation reviewed before unattended schedules are enabled
