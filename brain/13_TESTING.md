# 13 Testing Specification

> **Authority Notice:** Single Source of Truth (SOTT) for Desanomia's testing pyramid, test execution frameworks, safety interlocks verification, edge backend integration testing, frontend component testing, hardware simulation, and physical commissioning acceptance. Governed by [00_MASTER_RULES.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/00_MASTER_RULES.md), [04_TRD.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/04_TRD.md), [08_SECURITY.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/08_SECURITY.md), [09_ERROR_HANDLING.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/09_ERROR_HANDLING.md), [10_FIRMWARE_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/10_FIRMWARE_SPEC.md), [11_API_CONTRACT.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/11_API_CONTRACT.md), [12_UI_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/12_UI_SPEC.md), and [18_DECISIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md).

---

## 1. Testing Philosophy & Safety Priority Hierarchy

In Desanomia's cyber-physical greenhouse environment, testing priorities are governed by physical safety and data integrity. Software convenience and aesthetic features are subordinate to hardware damage prevention and crop survival.

```
       +-------------------------------------------------------+
       |   Priority 1: Process & Hardware Safety Invariance    |  <- 100% Branch Coverage
       |   (IL-01 to IL-07, 0ms Relay De-Energize, Dry-Run)    |     Strict CI Gate Block
       +---------------------------+---------------------------+
                                   |
       +---------------------------v---------------------------+
       |   Priority 2: Command Determinism & Replay Safety     |  <- Idempotency Cache,
       |   (UUID cmd_id, 32-Slot RAM Cache, NVS Recovery)      |     QoS 1 Handshake
       +---------------------------+---------------------------+
                                   |
       +---------------------------v---------------------------+
       |   Priority 3: Agronomic Integrity & Dosing Bounds     |  <- Dynamic Gate Bands,
       |   ([Target ± 50 ppm], Top-Up ≤ 300 mL, Same-Day Lock) |     Single-Pass Limit
       +---------------------------+---------------------------+
                                   |
       +---------------------------v---------------------------+
       |   Priority 4: Edge Persistence & Telemetry Streaming  |  <- 5s RAM Buffer,
       |   (PostgreSQL 16 Partitions, 1.0 Hz WebSocket Push)   |     SHA-256 Audit Chain
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
   - **Zero-Tolerance Invariant:** Every decision branch, boundary condition, and error path must be tested. Any PR introducing an uncovered branch in safety code is automatically rejected by CI.
2. **Edge Backend Services (85%+ Statement Coverage):**
   - Core files: `api/v1/routes/*.py`, `services/*.py`, `models/*.py`, `mqtt_bridge.py`.
   - All REST command handlers, Pydantic validation schemas, and database transactional commits must be covered with integration tests.
3. **Frontend Application Logic (80%+ Line Coverage):**
   - Core files: `stores/*.ts`, `hooks/*.ts`, `utils/*.ts`, and signature component containers.
   - All state mutations, selector isolation rules, and pessimistic mutation timeout fallbacks must be verified.

---

## 2. Multi-Tier Testing Pyramid Architecture

Testing is partitioned across five distinct execution layers:

| Layer | Execution Harness | Environment & Tooling | Scope & Invariants Tested |
| :--- | :--- | :--- | :--- |
| **Layer 1: Firmware Native Unit** | `firmware/test/` | PlatformIO Native (`pio test -e native`), GoogleTest / Unity | FSM state transitions, 7 safety interlocks (`IL-01` to `IL-07`), dosing duration math, DSP filtering, NVS idempotency. |
| **Layer 2: Backend Integration** | `backend/tests/` | Pytest, `pytest-asyncio`, `httpx.AsyncClient`, PostgreSQL 16, Mosquitto | REST CQS endpoints, RBAC permissions, MQTT QoS 1 command-ack handshake, 5s RAM buffer flush, SHA-256 audit chaining. |
| **Layer 3: Frontend Component** | `frontend/src/__tests__/` | Vitest, React Testing Library, jsdom, MSW (Mock Service Worker) | Zustand store selectors, pessimistic mutation hooks, dynamic TDS gauge thresholds, gated reset button locks, 100% offline bundle. |
| **Layer 4: System E2E & Sim** | `e2e/` | Playwright, Docker Compose, Python ESP32 Simulator (`simulator/`) | Complete fertigation lifecycle, multi-tier auth (Kiosk loopback vs Gazebo TV), socket disconnect recovery, fault injection. |
| **Layer 5: Hardware-in-the-Loop** | Bench Test Stand | Physical ESP32-S3 N16R8, W5500 SPI, 4-channel relay board, water tanks | Physical relay contact timing, radar distance-to-volume calibration, water-only commissioning run, supervised first nutrient run. |

---

## 3. Firmware Testing Specification (`firmware/test/`)

The firmware test suite compiles natively on the host workstation (`x86_64`) using PlatformIO's native environment. This enables lightning-fast test execution (< 2 seconds) and full integration with CI/CD without requiring physical microcontroller hardware.

### 3.1 Hardware Abstraction Layer (HAL) Mocks

All physical ESP32-S3 peripherals are abstracted behind C++ interfaces to permit deterministic test injection:

```cpp
// firmware/test/mocks/hal_mocks.hpp
class MockGPIO : public IGPIO {
public:
    MOCK_METHOD(void, SetPinState, (gpio_num_t pin, PinLevel level), (override));
    MOCK_METHOD(PinLevel, GetPinState, (gpio_num_t pin), (override));
};

class MockADC : public IADC {
public:
    MOCK_METHOD(uint32_t, ReadMilliVolts, (adc_channel_t channel), (override));
};

class MockRadarUART : public IRadarUART {
public:
    MOCK_METHOD(bool, ReadFrame, (RadarFrame& frame), (override));
    MOCK_METHOD(uint32_t, GetLastRxTimestampMs, (), (override));
};
```

### 3.2 The Seven Safety Interlocks Verification Matrix (`IL-01` to `IL-07`)

The test suite exhaustively verifies each interlock under nominal, boundary, and extreme fault conditions:

```cpp
// firmware/test/test_interlocks/test_safety_matrix.cpp
#include <gtest/gtest.h>
#include "safety_interlocks.hpp"

class SafetyInterlocksTest : public ::testing::Test {
protected:
    SafetyInterlockManager interlocks;
    MockGPIO gpio;
};

// IL-01: Dynamic Tolerance Gate Test [Target ± 50 ppm] (Default Generatif 1250 ppm)
TEST_F(SafetyInterlocksTest, IL01_RejectsDistributionWhenOutOfToleranceBand) {
    const float target_ppm = 1250.0f;
    
    // Boundary checks: 1199 ppm (Below band) -> LOCKED
    EXPECT_FALSE(interlocks.CanEnergizeDistributionPump(1199.0f, target_ppm));
    EXPECT_EQ(interlocks.GetLastFault(), FaultCode::FAULT_PPM_OUT_OF_RANGE);
    
    // Boundary checks: 1200 ppm (Lower bound) -> PERMITTED
    EXPECT_TRUE(interlocks.CanEnergizeDistributionPump(1200.0f, target_ppm));
    
    // Nominal check: 1250 ppm (Exact target) -> PERMITTED
    EXPECT_TRUE(interlocks.CanEnergizeDistributionPump(1250.0f, target_ppm));
    
    // Boundary checks: 1300 ppm (Upper bound) -> PERMITTED
    EXPECT_TRUE(interlocks.CanEnergizeDistributionPump(1300.0f, target_ppm));
    
    // Boundary checks: 1301 ppm (Above band) -> LOCKED
    EXPECT_FALSE(interlocks.CanEnergizeDistributionPump(1301.0f, target_ppm));
    EXPECT_EQ(interlocks.GetLastFault(), FaultCode::FAULT_PPM_OUT_OF_RANGE);
    
    // Sensor failure checks: NaN and Inf -> LOCKED
    EXPECT_FALSE(interlocks.CanEnergizeDistributionPump(NAN, target_ppm));
    EXPECT_FALSE(interlocks.CanEnergizeDistributionPump(INFINITY, target_ppm));
}

// IL-02: Dry-Run Cutoff Guard (<= 200 ms shutdown when Drum 2 < 6.0 L, D-048)
TEST_F(SafetyInterlocksTest, IL02_TripsDryRunCutoffWhenVolumeBelowSumpThreshold) {
    // Volume at 5.1 L -> Permitted
    EXPECT_TRUE(interlocks.EvaluateDryRun(6.1f));
    
    // Volume at 6.0 L (Dry-run boundary) -> Permitted
    EXPECT_TRUE(interlocks.EvaluateDryRun(6.0f));
    
    // Volume drops to 5.9 L -> Dry-Run Trip
    EXPECT_FALSE(interlocks.EvaluateDryRun(5.9f));
    EXPECT_EQ(interlocks.GetLastFault(), FaultCode::FAULT_DRY_RUN);
}

// IL-03: Batch Depletion Guard (Reject new batch if Drum 2 > 8.0 L, D-048)
TEST_F(SafetyInterlocksTest, IL03_RejectsBatchStartWhenResidualFluidRemains) {
    // Drum 2 has 5.1 L remaining -> Rejected
    EXPECT_FALSE(interlocks.CanStartNewBatch(/*drum2_volume_l=*/8.1f));
    EXPECT_EQ(interlocks.GetLastFault(), FaultCode::FAULT_BATCH_REJECTED);
    
    // Drum 2 fully emptied to 0.0 L -> Permitted
    EXPECT_TRUE(interlocks.CanStartNewBatch(/*drum2_volume_l=*/8.0f));
    EXPECT_TRUE(interlocks.CanStartNewBatch(/*drum2_volume_l=*/5.0f));
}

// IL-04: Dual-Stage Fill Guard (Early rise < 1.0 L in 90s OR Total > 20 min)
TEST_F(SafetyInterlocksTest, IL04_TripsDualStageFillFaults) {
    FillWatchdog watchdog;
    
    // Stage 1: Early rise timeout (90s elapsed, only 0.8 L rose)
    watchdog.RecordStart(140.0f);
    EXPECT_FALSE(watchdog.EvaluateEarlyRise(/*elapsed_s=*/91, /*volume_rise_l=*/0.8f));
    EXPECT_EQ(watchdog.GetFault(), FaultCode::FAULT_NO_WATER_SUPPLY);
    
    // Stage 2: Total fill timeout (> 1200s elapsed without reaching target)
    EXPECT_FALSE(watchdog.EvaluateTotalFillTime(/*elapsed_s=*/1201, /*current_volume_l=*/120.0f, /*target_l=*/140.0f));
    EXPECT_EQ(watchdog.GetFault(), FaultCode::FAULT_FILL_TIMEOUT);
}

// IL-05: Clean Water Baseline & Plausibility Guard
TEST_F(SafetyInterlocksTest, IL05_ValidatesRawWaterPlausibility) {
    // TDS < 50 ppm -> Unplausibly low (disconnected probe)
    EXPECT_FALSE(interlocks.EvaluateWaterPlausibility(45.0f));
    EXPECT_EQ(interlocks.GetLastFault(), FaultCode::FAULT_TDS_INVALID);
    
    // TDS > 2000 ppm -> Unplausibly high for clean water
    EXPECT_FALSE(interlocks.EvaluateWaterPlausibility(2100.0f));
    EXPECT_EQ(interlocks.GetLastFault(), FaultCode::FAULT_TDS_INVALID);
    
    // Baseline >= 350 ppm -> Highly mineralized source water
    EXPECT_FALSE(interlocks.EvaluateBaselineAcceptable(355.0f));
    EXPECT_EQ(interlocks.GetLastFault(), FaultCode::FAULT_BASE_TDS_HIGH);
}

// IL-06: Radar Watchdog Guard (UART silence > 3.0 s)
TEST_F(SafetyInterlocksTest, IL06_TripsWhenRadarUARTSilentOver3Seconds) {
    RadarWatchdog radar;
    radar.UpdateHeartbeat(/*current_time_ms=*/10000);
    
    // 2.9 seconds elapsed -> Normal
    EXPECT_TRUE(radar.CheckLiveness(/*current_time_ms=*/12900));
    
    // 3.1 seconds elapsed -> Fault tripped
    EXPECT_FALSE(radar.CheckLiveness(/*current_time_ms=*/13100));
    EXPECT_EQ(radar.GetFault(), FaultCode::FAULT_RADAR_OFFLINE);
}

// IL-07: Physical Emergency Stop Guard (0 ms de-energize + latch)
TEST_F(SafetyInterlocksTest, IL07_InstantaneouslyTripsAndLatchesOnMushroomSwitchOpen) {
    EStopController estop(gpio);
    
    // NC contact opens (GPIO 21 goes HIGH via pull-up)
    estop.HandleInterrupt();
    
    // Verify all active-LOW relay pins driven HIGH (De-energized OFF)
    EXPECT_EQ(gpio.GetPinState(GPIO_NUM_4), PinLevel::HIGH); // SV1 OFF
    EXPECT_EQ(gpio.GetPinState(GPIO_NUM_5), PinLevel::HIGH); // PP1 OFF
    EXPECT_EQ(gpio.GetPinState(GPIO_NUM_6), PinLevel::HIGH); // M1 OFF
    EXPECT_EQ(gpio.GetPinState(GPIO_NUM_7), PinLevel::HIGH); // SV2 OFF
    EXPECT_EQ(estop.GetFault(), FaultCode::FAULT_ESTOP);
}
```

### 3.3 Gated Fault Reset Verification Suite

Tests verify the dual hardware preconditions required before clearing a latched fault (`TR-10`, `D-012`, `D-019`):

```cpp
TEST_F(SafetyInterlocksTest, GatedReset_RequiresBothPhysicalSwitchAndDrainedDrum) {
    FaultManager fault_mgr;
    fault_mgr.LatchFault(FaultCode::FAULT_ESTOP);
    
    // Scenario 1: Physical E-stop switch still depressed (hw_estop_pressed == true)
    EXPECT_FALSE(fault_mgr.AttemptReset(/*hw_estop_pressed=*/true, /*drum2_volume_l=*/0.0f));
    EXPECT_TRUE(fault_mgr.IsLatched());
    
    // Scenario 2: Switch released, but Drum 2 still has fluid (drum2_volume_l > 8.0 L)
    EXPECT_FALSE(fault_mgr.AttemptReset(/*hw_estop_pressed=*/false, /*drum2_volume_l=*/15.0f));
    EXPECT_TRUE(fault_mgr.IsLatched());
    
    // Scenario 3: Both conditions satisfied -> Successful reset to IDLE
    EXPECT_TRUE(fault_mgr.AttemptReset(/*hw_estop_pressed=*/false, /*drum2_volume_l=*/3.2f));
    EXPECT_FALSE(fault_mgr.IsLatched());
}
```

### 3.4 12-State FSM Transition & Mid-Batch Recovery Suite

Tests verify deterministic state progression and cold-boot recovery from NVS:

```cpp
TEST(FSMSuite, TransitionProgression_NominalBatch) {
    FSMEngine fsm;
    fsm.Initialize();
    EXPECT_EQ(fsm.GetState(), FSMState::IDLE);
    
    fsm.TriggerStartBatch(/*target_volume_l=*/140.0f, /*target_ppm=*/1250.0f);
    EXPECT_EQ(fsm.GetState(), FSMState::FILLING_WATER);
    
    fsm.NotifyWaterFilled(140.0f);
    EXPECT_EQ(fsm.GetState(), FSMState::CHECK_BASE);
    
    fsm.NotifyBaseChecked(/*base_ppm=*/104.0f);
    EXPECT_EQ(fsm.GetState(), FSMState::DOSING);
    
    fsm.NotifyDosingCompleted(/*dosed_ml=*/380.0f);
    EXPECT_EQ(fsm.GetState(), FSMState::MIXING);
    
    fsm.NotifyMixingCompleted();
    EXPECT_EQ(fsm.GetState(), FSMState::STABILIZING);
    
    fsm.NotifyStabilized();
    EXPECT_EQ(fsm.GetState(), FSMState::MEASURING_TDS);
    
    fsm.NotifyMeasurementCompleted(/*measured_ppm=*/1248.0f);
    EXPECT_EQ(fsm.GetState(), FSMState::GATE_EVALUATE);
    
    // TDS 1248 is within [1200, 1300] -> Transitions directly to DISTRIBUTING
    fsm.EvaluateGate();
    EXPECT_EQ(fsm.GetState(), FSMState::DISTRIBUTING);
}

TEST(FSMSuite, MidBatchPowerOutage_RecoversIntoPausedInspection) {
    NVSJournalMock nvs;
    // Simulate power cut during MIXING with 140 L in Drum 2
    nvs.WriteJournalEntry(FSMState::MIXING, /*target_ppm=*/1250.0f, /*vol_l=*/140.0f, /*dosed_ml=*/380.0f);
    
    FSMEngine fsm;
    fsm.ColdBootInit(nvs);
    
    // Must cold boot into BATCH_PAUSED_INSPECTION per D-013
    EXPECT_EQ(fsm.GetState(), FSMState::BATCH_PAUSED_INSPECTION);
    
    // Verify dynamic deficit calculation: measured 1100 ppm, target 1250 ppm, volume 140 L
    float deficit_ml = fsm.CalculateDeficitDose(/*measured_ppm=*/1100.0f);
    // Formula: [(1250 - 1100) * 140] / 107.0 = 196.26 mL -> Must be <= 300 mL cap
    EXPECT_NEAR(deficit_ml, 196.26f, 0.5f);
    EXPECT_LE(deficit_ml, 300.0f);
}
```

### 3.5 Command Idempotency & Cache Deduplication Suite

Tests verify 32-slot circular RAM cache and NVS reboot recovery (`D-045`):

```cpp
TEST(IdempotencySuite, RejectsDuplicateCommandUUID) {
    IdempotencyManager idemp;
    const char* cmd_id = "550e8400-e29b-41d4-a716-446655440000";
    
    // First execution -> ACCEPTED
    EXPECT_EQ(idemp.CheckAndRecord(cmd_id), CommandStatus::NEW_COMMAND);
    
    // Immediate re-transmission -> ALREADY_EXECUTED (Relay NOT toggled)
    EXPECT_EQ(idemp.CheckAndRecord(cmd_id), CommandStatus::ALREADY_EXECUTED);
}
```

---

## 4. Edge Backend Testing Specification (`backend/tests/`)

The edge backend test suite is implemented in Python using `pytest`, `pytest-asyncio`, and `httpx.AsyncClient`. It tests the FastAPI service, PostgreSQL 16 range partitioning, Mosquitto MQTT bridge, and WebSocket broadcaster.

### 4.1 Pytest Fixture Architecture & Database Isolation

```python
# backend/tests/conftest.py
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from backend.app.main import app
from backend.app.core.database import get_db

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/desanomia_test"

@pytest_asyncio.fixture(scope="session")
async def db_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    yield engine
    await engine.dispose()

@pytest_asyncio.fixture
async def async_client(db_engine):
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client
```

### 4.2 REST API & CQS Handshake Suite

Tests verify asynchronous HTTP 202 Accepted command responses, UUID tracking, and WebSocket result correlation:

```python
# backend/tests/test_commands_api.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_start_batch_returns_202_accepted(async_client: AsyncClient, operator_token: str):
    headers = {"Authorization": f"Bearer {operator_token}"}
    payload = {
        "recipe_id": 1,
        "tank_pair_id": 1,
        "target_volume_l": 140.0,
        "timing": "now"
    }
    
    response = await async_client.post("/api/v1/batches", json=payload, headers=headers)
    assert response.status_code == 202
    data = response.json()
    assert "cmd_id" in data
    assert data["status"] == "PENDING"
```

### 4.3 RBAC & Session Security Verification Suite

Tests enforce the permission boundary across `Viewer`, `Operator`, and `Admin` roles:

```python
# backend/tests/test_rbac_matrix.py
import pytest

@pytest.mark.asyncio
async def test_viewer_cannot_dispatch_mutating_commands(async_client: AsyncClient, viewer_token: str):
    headers = {"Authorization": f"Bearer {viewer_token}"}
    
    # Viewer attempting to start batch -> 403 Forbidden
    resp = await async_client.post("/api/v1/batches", json={"recipe_id": 1}, headers=headers)
    assert resp.status_code == 403
    assert resp.json()["detail"]["code"] == "AUTH_INSUFFICIENT_ROLE"
    
    # Viewer attempting to reset fault -> 403 Forbidden
    resp = await async_client.post("/api/v1/faults/reset", json={"confirm": True}, headers=headers)
    assert resp.status_code == 403

@pytest.mark.asyncio
async def test_operator_requires_step_up_for_user_management(async_client: AsyncClient, operator_token: str):
    headers = {"Authorization": f"Bearer {operator_token}"}
    resp = await async_client.get("/api/v1/users", headers=headers)
    assert resp.status_code == 403
    assert resp.json()["detail"]["code"] == "ADMIN_ELEVATION_REQUIRED"
```

### 4.4 Agronomic Invariants & Same-Day Lockout Suite

Tests verify double-distribution protection (`UX-FR-17`, `D-039`) and offline rejection:

```python
# backend/tests/test_agronomic_invariants.py
import pytest

@pytest.mark.asyncio
async def test_rejects_batch_when_device_offline(async_client: AsyncClient, operator_token: str, mock_device_offline):
    headers = {"Authorization": f"Bearer {operator_token}"}
    resp = await async_client.post("/api/v1/batches", json={"recipe_id": 1}, headers=headers)
    assert resp.status_code == 409
    assert resp.json()["detail"]["code"] == "DEVICE_OFFLINE"

@pytest.mark.asyncio
async def test_same_day_distribution_lockout_requires_override(async_client: AsyncClient, operator_token: str, seed_today_completed_batch):
    headers = {"Authorization": f"Bearer {operator_token}"}
    payload = {"recipe_id": 1, "tank_pair_id": 1}
    
    # First attempt without override flag -> 409 Conflict with warning text
    resp = await async_client.post("/api/v1/batches", json=payload, headers=headers)
    assert resp.status_code == 409
    assert resp.json()["detail"]["code"] == "SAME_DAY_DOUBLE_DISTRIBUTION"
    
    # Second attempt with explicit override flag -> 202 Accepted
    payload["force_override"] = True
    resp = await async_client.post("/api/v1/batches", json=payload, headers=headers)
    assert resp.status_code == 202
```

### 4.5 Telemetry Persistence & SHA-256 Audit Chain Suite

Tests verify the 5-second RAM write buffer and tamper-evident audit logging (`D-039`, `D-044`):

```python
# backend/tests/test_persistence_and_audit.py
import pytest
from sqlalchemy import select, update, delete
from backend.app.models.audit import AuditLog

@pytest.mark.asyncio
async def test_audit_logs_sha256_hash_chain_integrity(db_session):
    # Retrieve consecutive audit log entries
    stmt = select(AuditLog).order_by(AuditLog.id.asc()).limit(2)
    result = await db_session.execute(stmt)
    rows = result.scalars().all()
    
    if len(rows) >= 2:
        entry1, entry2 = rows[0], rows[1]
        assert entry2.prev_hash == entry1.row_hash

@pytest.mark.asyncio
async def test_audit_logs_are_append_only(db_session):
    # Attempting to mutate an existing audit row must raise DB error via trigger
    stmt = update(AuditLog).where(AuditLog.id == 1).values(action="TAMPERED")
    with pytest.raises(Exception) as exc_info:
        await db_session.execute(stmt)
        await db_session.commit()
    assert "append-only" in str(exc_info.value).lower()
```

---

## 5. Frontend Testing Specification (`frontend/src/__tests__/`)

Frontend testing is executed via Vitest and React Testing Library within a headless jsdom environment.

### 5.1 Zustand Store Isolation & Selector Tests

Tests verify that atomic selectors prevent full dashboard re-renders during 1.0 Hz updates:

```typescript
// frontend/src/__tests__/stores/telemetryStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useTelemetryStore } from '../../stores/useTelemetryStore';

describe('useTelemetryStore Selector Discipline', () => {
  it('updates only targeted subscriber on TDS ppm change', () => {
    const { result: tdsHook } = renderHook(() => useTelemetryStore((s) => s.tds_ppm));
    const { result: volumeHook } = renderHook(() => useTelemetryStore((s) => s.drum2_volume_l));

    act(() => {
      useTelemetryStore.getState().updateTelemetry({ tds_ppm: 1250, drum2_volume_l: 140 });
    });

    expect(tdsHook.current).toBe(1250);
    expect(volumeHook.current).toBe(140);
  });
});
```

### 5.2 Pessimistic UI Mutation Discipline Tests (`usePessimisticMutation`)

Tests verify immediate button locking, ACK resolution, and 3.0s timeout reversion:

```typescript
// frontend/src/__tests__/hooks/usePessimisticMutation.test.ts
import { renderHook, act } from '@testing-library/react';
import { usePessimisticMutation } from '../../hooks/usePessimisticMutation';

describe('usePessimisticMutation', () => {
  it('disables button immediately on trigger and enters OUTCOME_UNKNOWN on timeout', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePessimisticMutation());

    act(() => {
      result.current.executeCommand({ endpoint: '/api/v1/commands/jog' });
    });

    // Immediately enters loading state
    expect(result.current.isLoading).toBe(true);

    // Fast-forward 3.0 seconds -> Times out and enters OUTCOME_UNKNOWN (remains locked, D-047, D-049, D-050)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLocked).toBe(true);
    expect(result.current.outcomeUnknown).toBe(true);
    expect(result.current.error).toBe('Hardware timeout: No ACK within 3.0s — Menunggu Rekonsiliasi Telemetri');
    vi.useRealTimers();
  });
});
```

### 5.3 Component Behavioral & Accessibility Tests (`UI-01` to `UI-18`)

```typescript
// frontend/src/__tests__/components/UI02_LiveTDSGauge.test.tsx
import { render, screen } from '@testing-library/react';
import { LiveTDSGauge } from '../../components/LiveTDSGauge';

describe('UI-02 Live TDS Gauge & Gate Card', () => {
  it('renders green in-tolerance badge at 1250 ppm', () => {
    render(<LiveTDSGauge tdsPpm={1250} targetPpm={1250} />);
    expect(screen.getByText('1250')).toHaveClass('tabular-nums');
    expect(screen.getByText('Dalam Toleransi')).toHaveClass('text-emerald-400');
  });

  it('renders amber deficit badge at 1150 ppm', () => {
    render(<LiveTDSGauge tdsPpm={1150} targetPpm={1250} />);
    expect(screen.getByText('Kurang Nutrisi (Defisit)')).toHaveClass('text-amber-400');
  });

  it('renders red out-of-band badge at 1350 ppm', () => {
    render(<LiveTDSGauge tdsPpm={1350} targetPpm={1250} />);
    expect(screen.getByText('Melebihi Batas Toleransi')).toHaveClass('text-red-500');
  });
});

// frontend/src/__tests__/components/UI09_ResetFaultButton.test.tsx
import { render, screen } from '@testing-library/react';
import { ResetFaultButton } from '../../components/ResetFaultButton';

describe('UI-09 Reset Fault Button Preconditions', () => {
  it('remains disabled when physical E-stop switch is depressed', () => {
    render(<ResetFaultButton hwEstopPressed={true} drum2Volume={0.0} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByText(/TOMBOL JAMUR MASIH TERTEKAN/i)).toBeInTheDocument();
  });

  it('remains disabled when Drum 2 volume > 8.0 L', () => {
    render(<ResetFaultButton hwEstopPressed={false} drum2Volume={12.0} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByText(/KURAS DRUM HINGGA ≤ 8.0 L/i)).toBeInTheDocument();
  });

  it('enables when both preconditions are satisfied', () => {
    render(<ResetFaultButton hwEstopPressed={false} drum2Volume={3.5} />);
    const btn = screen.getByRole('button');
    expect(btn).not.toBeDisabled();
  });
});
```

### 5.4 100% Offline Asset Bundling Build Verification

An automated node test validates that the production build output (`dist/`) contains zero references to remote CDNs, Google Fonts, or external scripts:

```typescript
// frontend/src/__tests__/build/offlineBundle.test.ts
import fs from 'fs';
import path from 'path';

describe('100% Offline Bundle Compliance', () => {
  it('contains zero external origin references in compiled assets', () => {
    const distDir = path.resolve(__dirname, '../../../dist');
    if (!fs.existsSync(distDir)) return; // Skipped if dist not built yet

    const files = fs.readdirSync(distDir, { recursive: true }) as string[];
    const externalRegex = /(https?:\/\/|fonts\.googleapis\.com|cdn\.)/i;

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

## 6. Hardware Simulation, E2E & HIL Acceptance Protocols

### 6.1 Python ESP32 Hardware Simulator (`simulator/`)

The Python simulator acts as a deterministic stand-in for the ESP32-S3 microcontroller on the isolated OT fieldbus (`ETH0`). It connects to Mosquitto (`192.168.10.1:1883`) using `aiomqtt`:

- **Wire-Level Fidelity:** Implements the complete `desanomia/gh1/#` topic contract defined in `11_API_CONTRACT.md`.
- **Deterministic FSM Engine:** Simulates 12 lifecycle states with accelerated or real-time state transitions.
- **Interactive Fault Injection API:** Exposes an HTTP control port (`localhost:9099`) allowing test runners to inject faults:
  - `POST /inject/radar-timeout` — Ceases radar telemetry frames to trigger `IL-06`.
  - `POST /inject/water-dry-run` — Forces simulated Drum 2 level to 2.0 L during distribution to trigger `IL-02`.
  - `POST /inject/estop-trip` — Simulates physical mushroom switch opening (`hw_estop_pressed = true`).
  - `POST /inject/tds-spike` — Forces TDS reading to 1450 ppm to trigger `IL-01` gate rejection.

### 6.2 Playwright End-to-End (E2E) Test Suite (`e2e/`)

Playwright tests run against the complete Docker Compose edge stack with the Python simulator active:

```typescript
// e2e/specs/batch_lifecycle.spec.ts
import { test, expect } from '@playwright/test';

test.describe('E2E Fertigation Lifecycle', () => {
  test('E2E-01: Full nominal batch execution from initiation to depletion', async ({ page }) => {
    // 1. Load Kiosk interface (Auto-authenticated Operator session)
    await page.goto('http://localhost:8080');
    await expect(page.locator('[data-testid="kiosk-fsm-pill"]')).toContainText('IDLE');

    // 2. Open Unified Setup Modal and click Mulai Sekarang
    await page.click('[data-testid="batch-start-btn"]');
    await page.selectOption('select#recipe', 'Generatif (1250 ppm)');
    await page.click('[data-testid="batch-modal-submit"]');

    // 3. Verify autonomous FSM progression (10_FIRMWARE_SPEC, 12_UI_SPEC)
    await expect(page.locator('[data-testid="kiosk-fsm-pill"]')).toContainText('FILLING_WATER', { timeout: 5000 });
    await expect(page.locator('[data-testid="kiosk-fsm-pill"]')).toContainText('CHECK_BASE', { timeout: 10000 });
    await expect(page.locator('[data-testid="kiosk-fsm-pill"]')).toContainText('DOSING', { timeout: 15000 });
    await expect(page.locator('[data-testid="kiosk-fsm-pill"]')).toContainText('DISTRIBUTING', { timeout: 30000 });

    // 4. Verify batch completes into DEPLETED
    await expect(page.locator('[data-testid="kiosk-fsm-pill"]')).toContainText('BATCH_DEPLETED', { timeout: 45000 });
  });

  test('E2E-02: Safety interlock trip, drainage, and gated reset', async ({ page, request }) => {
    await page.goto('http://localhost:8080');

    // Inject physical E-stop trip via simulator API
    await request.post('http://localhost:9099/inject/estop-trip');

    // Verify UI enters critical fault state
    await expect(page.locator('[data-testid="fsm-status-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="fault-reset-btn"]')).toBeDisabled();

    // Release switch and clear volume via simulator
    await request.post('http://localhost:9099/inject/estop-release');
    await request.post('http://localhost:9099/inject/drain-drum2', { data: { volume_l: 2.0 } });

    // Reset button unlocks
    await expect(page.locator('[data-testid="fault-reset-btn"]')).toBeEnabled();
    await page.click('[data-testid="fault-reset-btn"]');

    // Verify FSM returns to IDLE
    await expect(page.locator('[data-testid="kiosk-fsm-pill"]')).toContainText('IDLE');
  });
});
```

### 6.3 Hardware-in-the-Loop (HIL) Commissioning Acceptance Protocol

Before any live nutrient solution is loaded into the greenhouse drums, physical hardware acceptance proceeds through two gated commissioning stages:

#### Stage 1: Water-Only Commissioning Run (Zero Fertilizer)
1. **Hydraulic Integrity:** Fill Distribution Drum 2 with 140.0 L of municipal water. Verify no plumbing leaks across clamp collars, pump unions, or solenoid bodies.
2. **Sensor Calibration Verification:**
   - Radar millimeter-wave level reading matches physical dipstick depth within $\pm 1.0\text{ cm}$ across 0.0 L, 50.0 L, 100.0 L, and 140.0 L graduations.
   - Flow meter pulse calibration verifies 140.0 L fill volume within $\pm 1.5\%$.
3. **Dry-Run Trip Cutoff:** Drain Drum 2 using distribution pump P1. Verify that when water level drops below 6.0 L, distribution pump P1 de-energizes within $\le 200\text{ ms}$ (debounced over 2 frames, `D-048`) and firmware latches `FAULT_DRY_RUN`.

#### Stage 2: Supervised First Nutrient Run
1. **Concentrate Priming:** Load Concentrate Drum 1 with standard A+B stock solution. Manually jog peristaltic pump PP1 (+10 mL) to prime delivery tube.
2. **Automated Batch Execution:** Initiate automated batch with Generatif recipe (Target 1250 ppm).
3. **Tolerance Gate Verification:** Verify that initial dosing injection lands within $[ 1250 - 250, 1250 + 50 ]\text{ ppm}$, single-pass top-up dosing successfully trims TDS into $[ 1200, 1300 ]\text{ ppm}$, and distribution proceeds autonomously without operator intervention.
4. **Residue Drain:** Verify post-distribution flush and residual drainage cleans lines to $\le 8.0\text{ L}$ (`D-048`).

---

## 7. Quality Gates & Continuous Integration (CI) Pipeline

The automated CI workflow executes on every commit and pull request:

```
+---------------------------------------------------------------------------------------------------+
|                                  CI/CD AUTOMATED PIPELINE STAGES                                  |
+-------------------+-------------------+-------------------+-------------------+-------------------+
| Stage 1: Static   | Stage 2: Firmware | Stage 3: Backend  | Stage 4: Frontend | Stage 5: E2E Sim  |
| Analysis & Lint   | Native Tests      | Pytest Suite      | Vitest Suite      | Playwright Tests  |
+-------------------+-------------------+-------------------+-------------------+-------------------+
| • clang-tidy (C++)| • pio test native | • pytest-asyncio  | • vitest run      | • docker-compose  |
| • ruff / mypy (Py)| • 100% Branch Cov | • 85% Line Cov    | • 80% Line Cov    | • Python Sim      |
| • eslint / tsc    |   on Safety Code  | • DB Triggers     | • Offline Bundle  | • 4 Core Scenarios|
+-------------------+-------------------+-------------------+-------------------+-------------------+
          |                   |                   |                   |                   |
          v                   v                   v                   v                   v
+---------------------------------------------------------------------------------------------------+
|                         GATED MERGE DECISION: ALL 5 STAGES MUST PASS 100%                         |
+---------------------------------------------------------------------------------------------------+
```

1. **Gate 1:** Zero compiler warnings (`-Wall -Wextra -Werror` on C++, `strict: true` on TypeScript, `mypy --strict` on Python).
2. **Gate 2:** Firmware safety branch coverage is exactly **100%**.
3. **Gate 3:** All 7 safety interlock unit tests pass.
4. **Gate 4:** Backend and frontend test coverage thresholds met.
5. **Gate 5:** Offline bundle audit confirms zero external origins in `dist/`.
