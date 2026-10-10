# 13 Testing Specification

> **Authority Notice:** Single Source of Truth (SOTT) for Desanomia's testing pyramid, test execution frameworks, safety interlocks verification, edge backend integration testing, frontend component testing, hardware simulation, and physical commissioning acceptance. Governed by [00_MASTER_RULES.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/00_MASTER_RULES.md), [04_TRD.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/04_TRD.md), [08_SECURITY.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/08_SECURITY.md), [09_ERROR_HANDLING.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/09_ERROR_HANDLING.md), [10_FIRMWARE_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/10_FIRMWARE_SPEC.md), [11_API_CONTRACT.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/11_API_CONTRACT.md), [12_UI_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/12_UI_SPEC.md), and [18_DECISIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md) (D-001 through D-051). [SPEC]

---

## 1. Testing Philosophy, Safety Priority Hierarchy & Quality Gates

In Desanomia's cyber-physical greenhouse environment, testing priorities are governed strictly by physical equipment protection, electrical safety, and crop survival. Software convenience and aesthetic features are subordinate to hardware damage prevention.

```
       +-------------------------------------------------------+
       |   Priority 1: Process & Hardware Safety Invariance    |  <- 100% Branch Coverage
       |   (IL-01 to IL-07, 0ms Relay Cutoff, Dry-Run, E-Stop) |     Strict CI Gate Block
       +---------------------------+---------------------------+
                                   |
       +---------------------------v---------------------------+
       |   Priority 2: Command Determinism & Replay Safety     |  <- Idempotency Cache,
       |   (UUID cmd_id, 32-Slot RAM Cache, 30s TTL, NVS Boot) |     QoS 1 Handshake
       +---------------------------+---------------------------+
                                   |
       +---------------------------v---------------------------+
       |   Priority 3: Agronomic Integrity & Dosing Bounds     |  <- Dynamic Gate Bands,
       |   (Dynamic Band, Single-Pass Top-Up, Starvation Trip) |     Dual Dosing Constants
       +---------------------------+---------------------------+
                                   |
       +---------------------------v---------------------------+
       |   Priority 4: Edge Persistence & Telemetry Streaming  |  <- 5s RAM Buffer,
       |   (PostgreSQL Partitions, 1.0 Hz WS, Role Append-Only)|     Telegram Queue
       +---------------------------+---------------------------+
                                   |
       +---------------------------v---------------------------+
       |   Priority 5: User Interface Ergonomics & Visuals     |  <- 56px Touch Targets,
       |   (100% Offline Bundle, Tabular Figures, WCAG 2.2 AA) |     Zustand Selectors
       +-------------------------------------------------------+
```

### 1.1 Strict Coverage Gates & CI Merge Blockers

1. **Firmware Safety Modules (100% Branch Coverage Mandate):**
   - Core files: `safety_interlocks.cpp`, `fsm_engine.cpp`, `dosing_calculator.cpp`, `sensor_dsp.cpp`.
   - **Zero-Tolerance Invariant:** Every decision branch, boundary condition, and error path must be tested. Any PR introducing an uncovered branch in safety code is automatically rejected by CI. Enforced via `lcov --rc branch_coverage=1`.
   - Unreachable compiler exception branches are excluded via an explicit, code-reviewed `LCOV_EXCL_BR_LINE` policy.
   - Host native unit tests run under `-Wl,--wrap=malloc` to assert zero dynamic memory allocations post-initialization.
2. **Edge Backend Services (95% Branch Coverage on Safety/Commands, 85% Overall):**
   - Core files: `api/v1/routes/*.py`, `services/commands.py`, `services/scheduler.py`, `services/mqtt_bridge.py`, `models/*.py`.
   - Strict 95% branch coverage required on CQS command handlers, scheduler conflict arbitration, and MQTT ingestion bridge.
   - All REST command handlers, Pydantic validation schemas, and database transactional commits must be verified.
3. **Frontend Application Logic (80%+ Line Coverage & Zero Unmapped Components):**
   - Core files: `stores/*.ts`, `hooks/*.ts`, `utils/*.ts`, and signature component containers.
   - Exhaustive Component Registry: All 26 components (`UI-01` to `UI-26`) must have corresponding unit/component test files. CI fails if any component is unmapped.
   - 100% Offline Bundle Gate: Automated Playwright network interception asserts that 0 external network requests occur during runtime, paired with an asset scanner ensuring zero CDN references.

### 1.2 Traceability Matrix: Requirements to Test Suites

| Requirement ID | Domain Area | Target Specification | Primary Automated Test Suite | Verification Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `IL-01` | TDS Safety Gate | `10_FIRMWARE_SPEC` §4 | `firmware/test/test_interlocks/test_il01_tds.cpp` | Native GTest: Parameterized target & band; starvation trip |
| `IL-02` | Dry-Run Guard | `10_FIRMWARE_SPEC` §4 | `firmware/test/test_interlocks/test_il02_dry_run.cpp` | Native GTest: Depletion vs dry-run race; pump-active check |
| `IL-03` | Depletion Guard | `10_FIRMWARE_SPEC` §4 | `firmware/test/test_interlocks/test_il03_depletion.cpp` | Native GTest: Tier 1B rejection; $\le 8.0\text{ L}$ boundary |
| `IL-04` | Dual-Stage Fill | `10_FIRMWARE_SPEC` §4 | `firmware/test/test_interlocks/test_il04_fill.cpp` | Native GTest: Tier 1C pause; 3-resume cap; cumulative 20m |
| `IL-05` | Baseline Plausibility | `10_FIRMWARE_SPEC` §4 | `firmware/test/test_interlocks/test_il05_baseline.cpp` | Native GTest: Boundaries (50, 350, 2000 ppm) |
| `IL-06` | Radar Watchdog | `10_FIRMWARE_SPEC` §4 | `firmware/test/test_interlocks/test_il06_radar.cpp` | Native GTest: 3.0s timeout, uint32 rollover, stable reset |
| `IL-07` | Emergency Stop | `10_FIRMWARE_SPEC` §4 | `firmware/test/test_interlocks/test_il07_estop.cpp` | Native GTest: 0ms coil cut, 12-state trip, wire-break |
| `TR-05` | Relay Dead-Band | `04_TRD` §2 | `firmware/test/test_actuators/test_mutual_exclusion.cpp` | Native GTest: Hardware register lockout; 500 ms dead-band |
| `TR-08` | Power Recovery | `04_TRD` §2, `D-013` | `firmware/test/test_fsm/test_outage_recovery.cpp` | Native GTest: `BATCH_PAUSED_INSPECTION`, deficit math, 30m auto |
| `TR-10` | Gated Fault Reset | `04_TRD` §2, `D-048` | `firmware/test/test_safety/test_gated_reset.cpp` | Native GTest: 3 preconditions (E-stop, $\le 8.0\text{ L}$, radar) |
| `TR-13` | Session Security | `04_TRD` §3, `08_SECURITY` | `backend/tests/test_rbac_matrix.py` | Pytest: Route $\times$ Role $\times$ Tier matrix; cookie auth |
| `TR-14` | Step-Up PIN | `04_TRD` §3, `D-050` | `backend/tests/test_auth_elevation.py` | Pytest: 6-digit Argon2id PIN, loopback enforcement |
| `TR-16` | Audit Immutability | `04_TRD` §3, `D-051` | `backend/tests/test_persistence_and_audit.py` | Pytest: `desanomia_app` lacks UPDATE/DELETE/TRUNCATE grants |
| `TR-22` | Offline Telegram | `04_TRD` §4, `09_ERROR` | `backend/tests/test_alert_queue.py` | Pytest: 10m dedup, FIFO order, 5 retries, 20 msg/min cap |
| `UX-FR-02`| Mutation Lock | `02_APPFLOW` §3, `D-047` | `frontend/src/__tests__/hooks/usePessimisticMutation.test.ts` | Vitest: 3.0s timeout enters `OUTCOME_UNKNOWN`, cmd_id reuse |
| `UX-FR-17`| Same-Day Barrier | `02_APPFLOW` §3, `D-050` | `frontend/src/__tests__/components/UI16_SameDayModal.test.tsx`| Vitest: Dual friction barrier (risk checkbox + 3s hold) |

---

## 2. Multi-Tier Testing Pyramid Architecture

Testing is partitioned across five distinct execution layers:

| Layer | Execution Harness | Environment & Tooling | Scope & Invariants Tested |
| :--- | :--- | :--- | :--- |
| **Layer 1: Firmware Native Unit** | `firmware/test/` | PlatformIO Native (`pio test -e native`), GoogleTest | FSM state transitions (20 Hz virtual clock), 7 safety interlocks, mutual exclusion, zero-heap wrap, 30s TTL, dual constants. |
| **Layer 2: Backend Integration** | `backend/tests/` | Pytest, `pytest-asyncio`, `httpx.ASGITransport`, PostgreSQL 16, Mosquitto | REST CQS endpoints, RBAC matrix, MQTT QoS 1 handshake, 5s RAM buffer flush, scheduler conflict arbitration, append-only DB role. |
| **Layer 3: Frontend Component** | `frontend/src/__tests__/` | Vitest, React Testing Library, jsdom, MSW, axe-core | Zustand selector render counts, pessimistic mutation reconciliation, UI-01 to UI-26 registry, WCAG 2.2 accessibility, offline bundle. |
| **Layer 4: System E2E & Sim** | `frontend/e2e/` | Playwright, Docker Compose, Python ESP32 Simulator (`simulator/`) | 7 core scenarios, WebSocket frame stream recording, 10x acceleration env var, standardized injection endpoints, shared JSON schemas. |
| **Layer 5: Hardware-in-the-Loop** | Bench Test Stand | Physical ESP32-S3 N16R8, W5500, 4 relays, oscilloscope, logic analyzer | Oscilloscope timing (< 50ms dry-run, < 5ms ISR, 0ms coil cut, 20 Hz $\pm 1\text{ ms}$ jitter), 72h water-only soak, TWDT panic, N100 boot. |

---

## 3. Layer 1: Firmware Testing Specification (`firmware/test/`)

The firmware test suite compiles natively on the host workstation (`x86_64`) using PlatformIO's native environment (`[env:native]` with `--coverage -O0`). This enables rapid test execution (< 2 seconds) and full CI integration without physical hardware.

### 3.1 Hardware Abstraction Layer (HAL) Mocks & Virtual Clock

Peripherals and system time are abstracted behind clean C++ interfaces:

```cpp
// firmware/test/mocks/hal_mocks.hpp
#pragma once
#include <gmock/gmock.h>
#include <cstdint>
#include "esp_err.h"
#include "driver/gpio.h"

enum class PinLevel : uint8_t { LOW = 0, HIGH = 1 };

class MockGPIO {
public:
    MOCK_METHOD(void, SetPinState, (gpio_num_t pin, PinLevel level));
    MOCK_METHOD(PinLevel, GetPinState, (gpio_num_t pin));
    MOCK_METHOD(void, DirectRegisterWriteHigh, (uint32_t pin_mask));
};

class MockVirtualClock {
public:
    uint64_t current_time_ms{1000000};
    uint64_t current_sntp_epoch_s{1775878800}; // 2026-04-11 03:40:00 UTC

    void AdvanceMs(uint32_t ms) {
        current_time_ms += ms;
        current_sntp_epoch_s += (ms / 1000);
    }
    uint64_t NowMs() const { return current_time_ms; }
    uint64_t SntpNowS() const { return current_sntp_epoch_s; }
};
```

### 3.2 The Seven Safety Interlocks Verification Matrix (`IL-01` to `IL-07`)

```cpp
// firmware/test/test_interlocks/test_safety_matrix.cpp
#include <gtest/gtest.h>
#include "safety_interlocks.hpp"
#include "hal_mocks.hpp"

class SafetyInterlocksTest : public ::testing::Test {
protected:
    SafetyInterlockManager interlocks;
    MockGPIO gpio;
    MockVirtualClock clock;
};

// IL-01: Dynamic Tolerance Gate & Starvation Trip (D-051)
TEST_F(SafetyInterlocksTest, IL01_DynamicToleranceBandAndStarvationTrip) {
    // 1. Parameterized over Recipe Targets (1050, 1100, 1250) and Bands (+/- 25, +/- 50, +/- 75)
    struct TestCase { float target; uint16_t band; float pass_low; float pass_high; };
    std::vector<TestCase> cases = {
        {1050.0f, 25, 1025.0f, 1075.0f},
        {1100.0f, 50, 1050.0f, 1150.0f},
        {1250.0f, 75, 1175.0f, 1325.0f}
    };

    for (const auto& c : cases) {
        interlocks.SetTargetAndBand(c.target, c.band);
        EXPECT_TRUE(interlocks.CanEnergizeDistributionPump(c.pass_low));
        EXPECT_TRUE(interlocks.CanEnergizeDistributionPump(c.pass_high));
        EXPECT_FALSE(interlocks.CanEnergizeDistributionPump(c.pass_low - 0.1f));
        EXPECT_FALSE(interlocks.CanEnergizeDistributionPump(c.pass_high + 0.1f));
        EXPECT_EQ(interlocks.GetLastFault(), FaultCode::FAULT_PPM_OUT_OF_RANGE);
    }

    // 2. Starvation Trip: Deficit > 229.3 ppm (> 300 mL cap) trips STARVATION_SUSPECTED immediately
    interlocks.SetTargetAndBand(1250.0f, 50);
    // Measured 1020 ppm -> Deficit = 230 ppm -> Calculated dose = (230 * 140) / 107.0 = 300.93 mL > 300 mL
    EXPECT_FALSE(interlocks.CanEnergizeDosingPump(/*measured_ppm=*/1020.0f));
    EXPECT_EQ(interlocks.GetLastFault(), FaultCode::STARVATION_SUSPECTED);
}

// IL-02: Dry-Run Cutoff Guard vs Batch Depletion Race (D-048, D-051)
TEST_F(SafetyInterlocksTest, IL02_DryRunCutoffRequiresActivePumpAndDebounce) {
    // Scenario A: Normal batch depletion (pump commanded OFF at <= 8.0 L) -> No fault
    EXPECT_TRUE(interlocks.EvaluateDryRun(/*drum2_volume_l=*/7.9f, /*pump_active=*/false));
    EXPECT_EQ(interlocks.GetLastFault(), FaultCode::NONE);

    // Scenario B: Distribution pump active, volume drops below 6.0 L -> Trips on 2nd frame (<= 200 ms)
    EXPECT_TRUE(interlocks.EvaluateDryRun(/*drum2_volume_l=*/5.9f, /*pump_active=*/true)); // Frame 1: Debouncing
    EXPECT_FALSE(interlocks.EvaluateDryRun(/*drum2_volume_l=*/5.9f, /*pump_active=*/true)); // Frame 2: Tripped!
    EXPECT_EQ(interlocks.GetLastFault(), FaultCode::FAULT_DRY_RUN);
}

// IL-03: Batch Depletion Guard (Tier 1B Precondition Rejection)
TEST_F(SafetyInterlocksTest, IL03_BatchStartPreconditionRejection) {
    // Drum 2 has 8.1 L -> Precondition rejected (FSM stays IDLE, 0 NVS latch, 0 buzzer)
    EXPECT_FALSE(interlocks.CanStartNewBatch(/*drum2_volume_l=*/8.1f));
    EXPECT_EQ(interlocks.GetLastPreconditionRejection(), RejectionCode::REJECT_DRUM_NOT_EMPTY);
    EXPECT_FALSE(interlocks.IsNvsLatched());
    EXPECT_FALSE(interlocks.IsBuzzerActive());

    // Drum 2 drained to exactly 8.0 L -> Permitted
    EXPECT_TRUE(interlocks.CanStartNewBatch(/*drum2_volume_l=*/8.0f));
    EXPECT_TRUE(interlocks.CanStartNewBatch(/*drum2_volume_l=*/5.0f));
}

// IL-04: Dual-Stage Fill Guard (Tier 1C Resumable Hydraulic Pause)
TEST_F(SafetyInterlocksTest, IL04_ResumablePauseWithWatchdogAndCap) {
    FillWatchdog fill(clock);
    fill.StartFill();

    // 1. Early rise timeout: 90s elapsed, only 0.8 L rose -> Enters PAUSED_FILL_NO_WATER (No latch, buzzer OFF)
    clock.AdvanceMs(91000);
    EXPECT_EQ(fill.Evaluate(/*current_volume_l=*/0.8f), FillStatus::PAUSED_FILL_NO_WATER);
    EXPECT_FALSE(fill.IsNvsLatched());
    EXPECT_FALSE(fill.IsBuzzerActive());

    // 2. Operator sends RESUME_FILL -> Permitted (Attempt 1 of 3)
    EXPECT_TRUE(fill.ResumeFill());
    EXPECT_EQ(fill.GetResumeAttempts(), 1);

    // 3. Exceeding 3 resume attempts latches hard fault
    fill.ResumeFill(); // Attempt 2
    fill.ResumeFill(); // Attempt 3
    EXPECT_FALSE(fill.ResumeFill()); // Attempt 4 rejected!
    EXPECT_EQ(fill.GetHardFault(), FaultCode::FAULT_FILL_TIMEOUT);

    // 4. Cumulative 20-minute (1200s) watchdog enforced across resumes
    FillWatchdog cumulative_fill(clock);
    cumulative_fill.StartFill();
    clock.AdvanceMs(600000); // 10 min
    cumulative_fill.ResumeFill();
    clock.AdvanceMs(601000); // Exceeds 1200s total
    EXPECT_EQ(cumulative_fill.Evaluate(/*current_volume_l=*/110.0f), FillStatus::PAUSED_FILL_TIMEOUT);
}

// IL-05: Clean Water Baseline Plausibility Boundaries
TEST_F(SafetyInterlocksTest, IL05_CleanWaterBoundaries) {
    EXPECT_FALSE(interlocks.EvaluateBaseline(/*tds=*/49.9f));
    EXPECT_EQ(interlocks.GetLastFault(), FaultCode::FAULT_TDS_INVALID);

    EXPECT_TRUE(interlocks.EvaluateBaseline(/*tds=*/50.0f));
    EXPECT_TRUE(interlocks.EvaluateBaseline(/*tds=*/349.9f));

    EXPECT_FALSE(interlocks.EvaluateBaseline(/*tds=*/350.0f));
    EXPECT_EQ(interlocks.GetLastFault(), FaultCode::FAULT_BASE_TDS_HIGH);

    EXPECT_FALSE(interlocks.EvaluateBaseline(/*tds=*/2000.1f));
    EXPECT_EQ(interlocks.GetLastFault(), FaultCode::FAULT_TDS_INVALID);
}

// IL-06: Radar Watchdog Liveness, Rollover & Stable Gated Reset (D-051)
TEST_F(SafetyInterlocksTest, IL06_RadarSilenceRolloverAndStableGatedReset) {
    RadarWatchdog radar(clock);
    radar.FeedHeartbeat();

    // 1. Timeout at exactly 3001 ms
    clock.AdvanceMs(3000);
    EXPECT_TRUE(radar.IsAlive());
    clock.AdvanceMs(1);
    EXPECT_FALSE(radar.IsAlive());
    EXPECT_EQ(radar.GetFault(), FaultCode::FAULT_RADAR_OFFLINE);
    EXPECT_TRUE(radar.IsNvsLatched());

    // 2. Reset command rejected while radar frames are still silent/offline
    EXPECT_FALSE(radar.AttemptFaultReset());

    // 3. Frames resume, but must remain stable for >= 3.0 s before reset is permitted
    radar.FeedHeartbeat();
    clock.AdvanceMs(2900);
    radar.FeedHeartbeat();
    EXPECT_FALSE(radar.AttemptFaultReset()); // Only 2.9s stable -> Rejected

    clock.AdvanceMs(200);
    radar.FeedHeartbeat(); // Now 3.1s stable
    EXPECT_TRUE(radar.AttemptFaultReset()); // Cleared without requiring tank drain!
    EXPECT_FALSE(radar.IsNvsLatched());

    // 4. Uint32 millisecond rollover test (49.7 days uptime)
    clock.current_time_ms = 0xFFFFFFF0ULL; // 16 ms before 32-bit rollover
    radar.FeedHeartbeat();
    clock.AdvanceMs(32); // Wraps past 0
    EXPECT_TRUE(radar.IsAlive()); // Handles unsigned delta correctly
}

// IL-07: Physical Emergency Stop Guard & Direct Register Cutoff
TEST_F(SafetyInterlocksTest, IL07_EmergencyStopDirectCutoffAndWireBreak) {
    EStopController estop(gpio);

    // 1. NC mushroom switch contact opens (or wire breaks): GPIO 21 goes HIGH
    estop.HandleInterrupt();

    // Direct register write forces all active-LOW relay pins HIGH (< 1 us)
    EXPECT_EQ(gpio.GetPinState(GPIO_NUM_4), PinLevel::HIGH); // Fill Solenoid OFF
    EXPECT_EQ(gpio.GetPinState(GPIO_NUM_5), PinLevel::HIGH); // Dosing Pump OFF
    EXPECT_EQ(gpio.GetPinState(GPIO_NUM_6), PinLevel::HIGH); // Mixing Pump OFF
    EXPECT_EQ(gpio.GetPinState(GPIO_NUM_7), PinLevel::HIGH); // Distribution Pump OFF
    EXPECT_EQ(estop.GetFault(), FaultCode::FAULT_ESTOP);
}
```

### 3.3 Hardware Mutual Exclusion & Relay Dead-Band (`TR-05`)

```cpp
// firmware/test/test_actuators/test_mutual_exclusion.cpp
#include <gtest/gtest.h>
#include "actuator_manager.hpp"

TEST(ActuatorTest, HardwareRegisterMutualExclusionAndDeadBand) {
    ActuatorManager actuators;

    // Invariant 1: Fill Solenoid and Distribution Pump CANNOT be energized simultaneously
    uint8_t illegal_mask_1 = RELAY_FILL | RELAY_DIST;
    uint8_t safe_mask_1 = actuators.ApplySafetyMask(illegal_mask_1);
    EXPECT_EQ(safe_mask_1 & RELAY_DIST, 0); // Distribution pump stripped

    // Invariant 2: Dosing Pump and Distribution Pump CANNOT be energized simultaneously
    uint8_t illegal_mask_2 = RELAY_DOSE | RELAY_DIST;
    uint8_t safe_mask_2 = actuators.ApplySafetyMask(illegal_mask_2);
    EXPECT_EQ(safe_mask_2 & RELAY_DIST, 0); // Distribution pump stripped

    // Invariant 3: 500 ms dead-band required between relay switches
    actuators.CommandRelays(RELAY_MIX);
    EXPECT_FALSE(actuators.CanSwitchWithinDeadBand(/*elapsed_ms=*/490));
    EXPECT_TRUE(actuators.CanSwitchWithinDeadBand(/*elapsed_ms=*/501));
}
```

### 3.4 Gated Fault Reset Verification Suite (3 Preconditions)

```cpp
// firmware/test/test_safety/test_gated_reset.cpp
#include <gtest/gtest.h>
#include "fault_manager.hpp"

TEST(FaultResetTest, RequiresAllThreePreconditions) {
    FaultManager mgr;
    mgr.LatchFault(FaultCode::FAULT_ESTOP);

    // Precondition failure 1: Switch still depressed
    EXPECT_FALSE(mgr.AttemptReset(/*estop_pressed=*/true, /*vol=*/4.0f, /*radar_online=*/true));

    // Precondition failure 2: Liquid remains in Drum 2 (> 8.0 L)
    EXPECT_FALSE(mgr.AttemptReset(/*estop_pressed=*/false, /*vol=*/8.5f, /*radar_online=*/true));

    // Precondition failure 3: Radar UART is offline
    EXPECT_FALSE(mgr.AttemptReset(/*estop_pressed=*/false, /*vol=*/4.0f, /*radar_online=*/false));

    // All 3 preconditions satisfied -> Success
    EXPECT_TRUE(mgr.AttemptReset(/*estop_pressed=*/false, /*vol=*/7.8f, /*radar_online=*/true));
    EXPECT_FALSE(mgr.IsLatched());
}
```

### 3.5 FSM State Engine & Clock Injection Suite

```cpp
// firmware/test/test_fsm/test_fsm_engine.cpp
#include <gtest/gtest.h>
#include "fsm_engine.hpp"

TEST(FSMSuite, FullLifecycleWithInjectableClockAndGoldenVectors) {
    MockVirtualClock clock;
    FSMEngine fsm(clock);
    fsm.Initialize();
    EXPECT_EQ(fsm.GetState(), FSMState::IDLE);

    // 1. START_BATCH (Nominal Recipe: Base 104 ppm, Target 1250 ppm, Vol 140 L)
    fsm.StartBatch(/*vol_l=*/140.0f, /*target_ppm=*/1250.0f, /*band_ppm=*/50);
    EXPECT_EQ(fsm.GetState(), FSMState::FILLING_WATER);

    // 2. FILLING_WATER -> CHECK_BASE
    fsm.UpdateWaterLevel(140.0f);
    EXPECT_EQ(fsm.GetState(), FSMState::CHECK_BASE);

    // 3. CHECK_BASE (10s baseline timer) -> DOSING
    clock.AdvanceMs(10000);
    fsm.Tick20Hz();
    EXPECT_EQ(fsm.GetState(), FSMState::DOSING);

    // Golden Vector: V_fert = (1250 - 104) * 140 / 94.68 = 1694.55 mL (~1695 mL)
    // Dosing duration = 1694.55 * 0.107 s/mL = 181.3 seconds
    EXPECT_NEAR(fsm.GetCalculatedDoseMl(), 1694.55f, 0.5f);
    clock.AdvanceMs(181500);
    fsm.Tick20Hz();
    EXPECT_EQ(fsm.GetState(), FSMState::MIXING);

    // 4. MIXING (120s timer) -> STABILIZING
    clock.AdvanceMs(120000);
    fsm.Tick20Hz();
    EXPECT_EQ(fsm.GetState(), FSMState::STABILIZING);

    // 5. STABILIZING (15s timer) -> MEASURING_TDS
    clock.AdvanceMs(15000);
    fsm.Tick20Hz();
    EXPECT_EQ(fsm.GetState(), FSMState::MEASURING_TDS);

    // 6. MEASURING_TDS (10s DSP timer) -> GATE_EVALUATE
    clock.AdvanceMs(10000);
    fsm.Tick20Hz();
    EXPECT_EQ(fsm.GetState(), FSMState::GATE_EVALUATE);

    // 7. GATE_EVALUATE: TDS = 1245 ppm (Pass in [1200, 1300]) -> DISTRIBUTING
    fsm.ProvideTdsMeasurement(1245.0f);
    fsm.Tick20Hz();
    EXPECT_EQ(fsm.GetState(), FSMState::DISTRIBUTING);

    // 8. DISTRIBUTING -> BATCH_DEPLETED (Normal exit at <= 8.0 L) -> IDLE
    fsm.UpdateWaterLevel(7.5f);
    fsm.Tick20Hz();
    EXPECT_EQ(fsm.GetState(), FSMState::BATCH_DEPLETED);
    clock.AdvanceMs(5000);
    fsm.Tick20Hz();
    EXPECT_EQ(fsm.GetState(), FSMState::IDLE);
}

TEST(FSMSuite, DeficitTopUpSinglePassEnforcement) {
    MockVirtualClock clock;
    FSMEngine fsm(clock);
    fsm.StartBatch(140.0f, 1250.0f, 50);
    fsm.ForceState(FSMState::GATE_EVALUATE);

    // Measured TDS = 1100 ppm -> Deficit = 150 ppm
    // Golden Vector: V_topup = (150 * 140) / 107.0 = 196.26 mL (<= 300 mL cap)
    fsm.ProvideTdsMeasurement(1100.0f);
    fsm.Tick20Hz();
    EXPECT_EQ(fsm.GetState(), FSMState::TOPUP_DOSING);
    EXPECT_NEAR(fsm.GetCalculatedTopUpMl(), 196.26f, 0.5f);

    // Top-up duration = 196.26 * 0.107 = 21.0s -> Transitions to RECOVERY_MIX_EVALUATE
    clock.AdvanceMs(21500);
    fsm.Tick20Hz();
    EXPECT_EQ(fsm.GetState(), FSMState::RECOVERY_MIX_EVALUATE);

    // If re-measured TDS still fails (e.g. 1180 ppm), NO second top-up allowed -> FAULT
    clock.AdvanceMs(85000); // 60s mix + 15s settle + 10s measure
    fsm.ProvideTdsMeasurement(1180.0f);
    fsm.Tick20Hz();
    EXPECT_EQ(fsm.GetState(), FSMState::FAULT);
    EXPECT_EQ(fsm.GetLastFault(), FaultCode::FAULT_PPM_OUT_OF_RANGE);
}
```

### 3.6 Command Idempotency, 30s TTL & Zero-Heap Wrap (`D-045`, `D-051`)

```cpp
// firmware/test/test_idempotency/test_command_handling.cpp
#include <gtest/gtest.h>
#include "idempotency_manager.hpp"

TEST(IdempotencyTest, EvictionReplayAnd30SecondTTL) {
    MockVirtualClock clock;
    IdempotencyManager idemp(clock);

    // 1. 30-Second TTL Rejection
    CommandPayload stale_cmd{.cmd_id = "uuid-1", .timestamp_s = clock.SntpNowS() - 31};
    EXPECT_EQ(idemp.ValidateAndRecord(stale_cmd), CommandStatus::COMMAND_EXPIRED);

    // 2. Fresh Command -> ACCEPTED
    CommandPayload fresh_cmd{.cmd_id = "uuid-2", .timestamp_s = clock.SntpNowS() - 5};
    EXPECT_EQ(idemp.ValidateAndRecord(fresh_cmd), CommandStatus::NEW_COMMAND);

    // 3. Exact Replay -> ALREADY_EXECUTED (Returns cached ACK)
    EXPECT_EQ(idemp.ValidateAndRecord(fresh_cmd), CommandStatus::ALREADY_EXECUTED);

    // 4. Same UUID with different payload -> IDEMPOTENCY_CONFLICT
    CommandPayload conflict_cmd{.cmd_id = "uuid-2", .timestamp_s = clock.SntpNowS() - 5, .payload_hash = 0x9999};
    EXPECT_EQ(idemp.ValidateAndRecord(conflict_cmd), CommandStatus::IDEMPOTENCY_CONFLICT);

    // 5. 32-Slot Cache Eviction: 33rd unique command evicts oldest
    for (int i = 3; i <= 35; ++i) {
        CommandPayload c{.cmd_id = std::string("uuid-") + std::to_string(i), .timestamp_s = clock.SntpNowS()};
        idemp.ValidateAndRecord(c);
    }
    // uuid-2 was evicted -> Accepted again if retransmitted
    EXPECT_EQ(idemp.ValidateAndRecord(fresh_cmd), CommandStatus::NEW_COMMAND);
}
```

---

## 4. Layer 2: Edge Backend Testing Specification (`backend/tests/`)

The edge backend test suite is implemented in Python using `pytest`, `pytest-asyncio`, and `httpx.ASGITransport`. It verifies REST CQS handlers, PostgreSQL 16 monthly range partitioning, Mosquitto MQTT bridge, and scheduler conflict arbitration.

### 4.1 Pytest Conftest & Transactional Isolation

```python
# backend/tests/conftest.py
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from backend.app.main import app
from backend.app.core.database import get_db

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:testpassword@localhost:5432/desanomia_test"
)

@pytest_asyncio.fixture(scope="session")
async def db_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    yield engine
    await engine.dispose()

@pytest_asyncio.fixture
async def db_session(db_engine):
    connection = await db_engine.connect()
    trans = await connection.begin()
    session_factory = async_sessionmaker(bind=connection, expire_on_commit=False, class_=AsyncSession)
    session = session_factory()

    yield session

    await session.close()
    await trans.rollback()
    await connection.close()

@pytest_asyncio.fixture
async def async_client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
    app.dependency_overrides.clear()
```

### 4.2 REST API & CQS Handshake Suite

```python
# backend/tests/test_commands_api.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_start_batch_returns_202_queued(async_client: AsyncClient, operator_cookies: dict):
    headers = {"X-Requested-With": "XMLHttpRequest"}
    payload = {
        "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
        "tank_pair_id": 1,
        "timing": "now"
    }

    response = await async_client.post("/api/v1/batches", json=payload, headers=headers, cookies=operator_cookies)
    assert response.status_code == 202
    data = response.json()
    assert "cmd_id" in data
    assert data["status"] == "QUEUED"
```

### 4.3 Standardized Error Envelopes & RBAC Matrix

```python
# backend/tests/test_rbac_matrix.py
import pytest

@pytest.mark.asyncio
async def test_viewer_cannot_dispatch_mutating_commands(async_client: AsyncClient, viewer_cookies: dict):
    headers = {"X-Requested-With": "XMLHttpRequest"}

    # Viewer attempting to start batch -> 403 Forbidden with standardized error envelope
    resp = await async_client.post("/api/v1/batches", json={"recipe_id": "550e8400-e29b-41d4-a716-446655440000"}, headers=headers, cookies=viewer_cookies)
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"

@pytest.mark.asyncio
async def test_same_day_distribution_dual_friction(async_client: AsyncClient, operator_cookies: dict, seed_today_completed_batch):
    headers = {"X-Requested-With": "XMLHttpRequest"}
    payload = {"recipe_id": "550e8400-e29b-41d4-a716-446655440000", "tank_pair_id": 1}

    # Attempt 1 without override flag -> 409 Conflict
    resp = await async_client.post("/api/v1/batches", json=payload, headers=headers, cookies=operator_cookies)
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "SAME_DAY_DOUBLE_DISTRIBUTION"

    # Attempt 2 with explicit override flag -> 202 Queued
    payload["force_same_day_override"] = True
    resp = await async_client.post("/api/v1/batches", json=payload, headers=headers, cookies=operator_cookies)
    assert resp.status_code == 202
    assert resp.json()["status"] == "QUEUED"
```

### 4.4 PostgreSQL Role Privileges & Append-Only Audit Integrity (`D-051`)

```python
# backend/tests/test_persistence_and_audit.py
import pytest
from sqlalchemy import text
from backend.app.models.audit import AuditLog

@pytest.mark.asyncio
async def test_audit_logs_role_denies_update_delete_truncate(db_session):
    # Seed an authoritative audit row
    log_entry = AuditLog(user_id=1, action_type="SYSTEM_BOOT", details={"status": "OK"})
    db_session.add(log_entry)
    await db_session.flush()

    # Test 1: Direct SQL UPDATE is blocked by row trigger / permissions
    with pytest.raises(Exception) as exc_update:
        await db_session.execute(text(f"UPDATE audit_logs SET action_type = 'TAMPERED' WHERE id = {log_entry.id}"))
    assert "append-only" in str(exc_update.value).lower() or "permission denied" in str(exc_update.value).lower()

    # Test 2: Direct SQL DELETE is blocked
    with pytest.raises(Exception) as exc_delete:
        await db_session.execute(text(f"DELETE FROM audit_logs WHERE id = {log_entry.id}"))
    assert "append-only" in str(exc_delete.value).lower() or "permission denied" in str(exc_delete.value).lower()
```

---

## 5. Layer 3: Frontend Testing Specification (`frontend/src/__tests__/`)

Frontend testing is executed via Vitest and React Testing Library within a headless jsdom environment, augmented by `axe-core` accessibility checks.

### 5.1 Zustand Store Isolation & Selector Tests

```typescript
// frontend/src/__tests__/stores/telemetryStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useTelemetryStore } from '../../stores/useTelemetryStore';

describe('useTelemetryStore Selector Render Isolation', () => {
  it('updates only targeted subscriber on TDS ppm change without re-rendering volume subscriber', () => {
    let volumeRenderCount = 0;
    const { result: tdsHook } = renderHook(() => useTelemetryStore((s) => s.tds_ppm));
    renderHook(() => {
      volumeRenderCount++;
      return useTelemetryStore((s) => s.drum2_volume_l);
    });

    const initialVolumeRenders = volumeRenderCount;

    act(() => {
      useTelemetryStore.getState().updateTelemetry({ tds_ppm: 1250 });
    });

    expect(tdsHook.current).toBe(1250);
    expect(volumeRenderCount).toBe(initialVolumeRenders); // Volume subscriber NOT re-rendered!
  });
});
```

### 5.2 Pessimistic Mutation & Outcome Reconciliation (`usePessimisticMutation`)

```typescript
// frontend/src/__tests__/hooks/usePessimisticMutation.test.ts
import { renderHook, act } from '@testing-library/react';
import { usePessimisticMutation } from '../../hooks/usePessimisticMutation';

describe('usePessimisticMutation', () => {
  it('locks control immediately, transitions to OUTCOME_UNKNOWN on 3s timeout, and reuses cmd_id on retry', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePessimisticMutation());

    act(() => {
      result.current.executeCommand({ endpoint: '/api/v1/batches', payload: { recipe_id: 'rec-1' } });
    });

    const initialCmdId = result.current.cmdId;
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isLocked).toBe(true);

    // Fast-forward 3.0s without MQTT ACK frame
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLocked).toBe(true); // Remains locked!
    expect(result.current.outcomeUnknown).toBe(true);
    expect(result.current.statusText).toBe('Menunggu Rekonsiliasi Telemetri...');

    // On manual retry, identical cmd_id must be reused to prevent double dosing
    act(() => {
      result.current.retryCommand();
    });
    expect(result.current.cmdId).toBe(initialCmdId);
    vi.useRealTimers();
  });
});
```

### 5.3 Signature Component Testing (`UI-01` to `UI-26` Registry)

```typescript
// frontend/src/__tests__/components/UI09_ResetFaultButton.test.tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ResetFaultButton } from '../../components/ResetFaultButton';

describe('UI-09 Reset Fault Button Preconditions & A11y', () => {
  it('remains disabled and displays specific warning when switch is depressed', () => {
    render(<ResetFaultButton hwEstopPressed={true} drum2Volume={2.0} radarOnline={true} />);
    const btn = screen.getByRole('button', { name: /reset fault/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/Tombol Jamur Masih Tertekan/i)).toBeInTheDocument();
  });

  it('remains disabled when radar is offline', () => {
    render(<ResetFaultButton hwEstopPressed={false} drum2Volume={2.0} radarOnline={false} />);
    const btn = screen.getByRole('button', { name: /reset fault/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/Sensor Radar Offline/i)).toBeInTheDocument();
  });

  it('enables when all 3 preconditions are satisfied and passes WCAG accessibility audit', async () => {
    const { container } = render(<ResetFaultButton hwEstopPressed={false} drum2Volume={6.0} radarOnline={true} />);
    const btn = screen.getByRole('button', { name: /reset fault/i });
    expect(btn).toBeEnabled();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 5.4 Hardened 100% Offline Asset Bundling Gate

```typescript
// frontend/src/__tests__/build/offlineBundle.test.ts
import fs from 'fs';
import path from 'path';

describe('100% Offline Bundle Compliance Gate', () => {
  it('contains zero external origin references in compiled assets', () => {
    const distDir = path.resolve(__dirname, '../../../dist');
    if (!fs.existsSync(distDir)) return;

    const files = fs.readdirSync(distDir, { recursive: true }) as string[];
    const externalRegex = /(https?:\/\/(?!localhost|127\.0\.0\.1|192\.168\.)[^\s"'>]+|fonts\.googleapis\.com|cdn\.)/i;

    for (const file of files) {
      const fullPath = path.join(distDir, file);
      if (fs.statSync(fullPath).isFile() && (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content).not.toMatch(externalRegex);
      }
    }
  });
});
```

---

## 6. Layer 4: System E2E & Hardware Simulation Suite (`frontend/e2e/`)

### 6.1 Python ESP32 Hardware Simulator (`simulator/`)

The simulator connects to Mosquitto on `192.168.10.1:1883` using `aiomqtt` and exposes control endpoints on `http://localhost:9099`:
- `POST /inject/estop` — Simulates mushroom switch depress (`hw_estop_pressed = true`).
- `POST /inject/estop-release` — Simulates mushroom switch twist release.
- `POST /inject/dry-run` — Forces simulated Drum 2 level to 2.0 L during distribution.
- `POST /inject/tds-spike` — Forces TDS reading to 1450 ppm to trigger gate failure.
- `POST /inject/drain-drum2` — Sets simulated Drum 2 liquid volume (e.g. 2.0 L).
- `POST /inject/radar-offline` — Stops binary radar frames to trigger `IL-06`.

### 6.2 Playwright End-to-End Scenarios

```typescript
// frontend/e2e/specs/batch_lifecycle.spec.ts
import { test, expect } from '@playwright/test';

test.describe('E2E Fertigation Lifecycle & Safety Gates', () => {
  test('E2E-01: Full nominal batch execution with recorded WebSocket state stream', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await expect(page.locator('[data-testid="kiosk-fsm-pill"]')).toContainText('IDLE');

    // Start batch via Unified Setup Modal
    await page.click('[data-testid="batch-start-btn"]');
    await page.selectOption('select#recipe', 'Generatif (1250 ppm)');
    await page.click('[data-testid="batch-modal-submit"]');

    // Assert exact sequential FSM state progression
    const states = ['FILLING_WATER', 'CHECK_BASE', 'DOSING', 'MIXING', 'STABILIZING', 'MEASURING_TDS', 'GATE_EVALUATE', 'DISTRIBUTING', 'BATCH_DEPLETED', 'IDLE'];
    for (const state of states) {
      await expect(page.locator('[data-testid="kiosk-fsm-pill"]')).toContainText(state, { timeout: 15000 });
    }
  });

  test('E2E-02: Emergency Stop interrupt, intermediate locked drain, and 3-precondition gated reset', async ({ page, request }) => {
    await page.goto('http://localhost:8080');

    // 1. Inject E-stop trip via simulator API
    await request.post('http://localhost:9099/inject/estop');
    await expect(page.locator('[data-testid="fsm-status-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="fault-reset-btn"]')).toBeDisabled();

    // 2. Release physical switch while tank remains full (> 8.0 L) -> Button remains disabled
    await request.post('http://localhost:9099/inject/estop-release');
    await expect(page.locator('[data-testid="fault-reset-btn"]')).toBeDisabled();

    // 3. Drain Drum 2 below 8.0 L -> Button unlocks
    await request.post('http://localhost:9099/inject/drain-drum2', { data: { volume_l: 3.5 } });
    await expect(page.locator('[data-testid="fault-reset-btn"]')).toBeEnabled();

    // 4. Reset returns FSM to IDLE
    await page.click('[data-testid="fault-reset-btn"]');
    await expect(page.locator('[data-testid="kiosk-fsm-pill"]')).toContainText('IDLE');
  });
});
```

---

## 7. Layer 5: Hardware-in-the-Loop (HIL) & Physical Commissioning

### 7.1 Instrumented Physical Measurement Matrix

| Parameter / Safety Invariant | Physical Measurement Point | Required Instrument | Acceptance Tolerance | Reference Spec |
| :--- | :--- | :--- | :--- | :--- |
| **Emergency Stop Cutoff** | GPIO 21 contact break $\to$ Relay AC power bus | 2-Channel Digital Oscilloscope | $0\text{ ms}$ mechanical bus cutoff; $< 1\text{ }\mu\text{s}$ register write | `TR-03`, `IL-07` |
| **Dry-Run Pump Cutoff** | Float switch contact break $\to$ Relay 4 coil voltage | Storage Oscilloscope | $< 50\text{ ms}$ electrical cutoff | `TR-03`, `IL-02` |
| **Radar UART Timeout** | UART1 RX line disconnect $\to$ Relay coils de-energized | Logic Analyzer / Oscilloscope | $3000 \pm 50\text{ ms}$ | `TR-03`, `IL-06` |
| **FSM Core 1 Loop Jitter** | GPIO debug toggle on Core 1 FreeRTOS tick | Logic Analyzer (100k samples) | 20 Hz $\pm 1\text{ ms}$ ($50 \pm 1\text{ ms}$) | `10_FIRMWARE_SPEC` §1 |
| **Relay Dead-Band** | Relay 1 (Fill) OFF $\to$ Relay 4 (Dist) ON | Logic Analyzer | $\ge 500\text{ ms}$ delay | `TR-05` |
| **Kiosk Host Performance** | Beelink EQ12 cold boot $\to$ Interactive Chromium UI | Physical Stopwatch & `htop` | Cold boot $< 45\text{ s}$; Idle CPU $< 5\%$ | `TR-01` |

### 7.2 Commissioning Protocols & 72-Hour Soak Test

1. **72-Hour Water-Only Soak Test:**
   - 140.0 L water cycling continuously across fill, mix, and simulated distribution.
   - Zero heap degradation on ESP32-S3 (free internal SRAM constant $\ge 40\text{ KB}$).
   - Zero database write backlog or NVMe write throttling.
   - Zero physical plumbing leaks across unions, clamp collars, and ball valves.
2. **Hardware Watchdog Panic & Brown-Out Recovery:**
   - Induce 3-second CPU lock on Core 1; verify FreeRTOS Task Watchdog Timer (TWDT) panics and reboots safely within 3.0s.
   - Simulate AC mains sag; verify brown-out detector de-energizes relays safely without high-Z glitches.
3. **W5500 Ethernet Cable Severance Test:**
   - Disconnect Ethernet cable mid-batch during active mixing.
   - Verify ESP32 Core 1 continues execution autonomously, events spool to PSRAM ring buffer, and batch completes distribution safely.

---

## 8. Advanced Testing Categories & Verification Traceability

1. **Property-Based Testing (Hypothesis):**
   - Property tests for `dosing_calculator.py`: verify monotonicity ($V_{\text{fert}}$ increases monotonically with target TDS) and strict adherence to 300 mL cap.
   - Property tests for trimmed median filter: verify immunity against single-sample noise spikes up to 3.3V.
2. **Fuzzing (libFuzzer / ASan / UBSan):**
   - Fuzz MQTT JSON command parser against 100,000 malformed, truncated, and oversized payloads.
   - Fuzz radar UART binary frame parser against random byte streams and bit flips.
3. **Performance & Resource Budgets:**
   - Command round-trip ACK latency: p95 $< 300\text{ ms}$.
   - Emergency Stop trigger to relay cut: $< 100\text{ ms}$ end-to-end.
   - Database telemetry NVMe write volume: $< 5.0\text{ GB}/\text{day}$.
