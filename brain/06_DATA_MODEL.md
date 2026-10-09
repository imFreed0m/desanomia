# 06 Data Model

PostgreSQL 16, migrations with Alembic. Timestamps are timestamptz in UTC. [PROPOSED, align with SPEC.md data section if present]

## Tables

```sql
users(id uuid pk, username citext unique, password_hash text, role text check (role in ('admin','operator','viewer')),
      is_active bool default true, created_at, last_login_at)

sessions(id text pk, user_id uuid fk users, created_at, expires_at, ip inet, user_agent text)   -- id stored as hash

schedules(id uuid pk, name text, tank_id int default 1 check (tank_id between 1 and 5),
          recipe_id uuid null, target_tds_ppm int null,
          days_of_week int[], time_of_day time, timezone text, enabled bool,
          created_by uuid fk users, updated_at)

batches(id bigserial pk, trigger text check (trigger in ('schedule','ad_hoc_now')), started_by uuid fk users null,
        schedule_id uuid fk schedules null, tank_id int default 1 check (tank_id between 1 and 5),
        recipe_id uuid null, is_same_day_override bool default false,
        status text check (status in ('running','completed','faulted','aborted')),
        target_tds_ppm int, gate_min_ppm int, gate_max_ppm int,
        water_volume_l numeric, dose_ml numeric, base_tds_ppm numeric,
        measured_tds_ppm numeric, gate_result text check (gate_result in ('pass','fail')) null,
        started_at, ended_at)

batch_events(id bigserial pk, batch_id bigint fk batches, ts, state text, event_type text
             check (event_type in ('state_enter','state_exit','gate','fault','command','note')), payload jsonb)

telemetry(ts timestamptz, tds_ppm numeric, ec_ms_cm numeric null, drum2_level_pct numeric, drum2_volume_l numeric,
          batch_id bigint null)    -- index on (ts desc), partition by month if volume demands

telemetry_1m(bucket timestamptz pk, tds_avg, tds_min, tds_max, level_avg)    -- rollup after 90 days

actuator_log(id bigserial pk, ts, actuator text, state text, source text check (source in ('fsm','manual','interlock')),
             user_id uuid null)

faults(id bigserial pk, batch_id bigint null, code text, source text check (source in ('firmware','backend')),
       raised_at, cleared_at null, cleared_by uuid null, detail jsonb)

device_status(device_id text pk, online bool, last_seen, fw_version text, rssi int)

alerts(id bigserial pk, ts, severity text, code text, message text, telegram_sent bool default false)

audit_log(id bigserial pk, ts, user_id uuid null, action text, target text, detail jsonb, ip inet)

settings(key text pk, value jsonb, updated_by uuid, updated_at)    -- tds target and gate band mirror firmware config
```

## Rules

1. Gate band and target are copied into each batch row at start, so history stays correct if settings change later.
2. batch_events is append-only. No updates, no deletes outside retention jobs.
3. Telemetry is written by the backend subscriber only. Batch it (insert every 5 to 10 s) to limit SD or SSD wear.
4. Password hashes use argon2id. Session ids are random 256-bit values, only their hash is stored.
5. Retention: raw telemetry 90 days then rolled into telemetry_1m, batch rows and events kept indefinitely, audit_log kept 2 years.
6. Settings changes that affect process (target, gate band) must be pushed to firmware and acknowledged, the database is not the authority for safety limits.
7. Ad-hoc runs executed as 'Now' record trigger = 'ad_hoc_now' and establish a new baseline reference timestamp for subsequent recurrence cycles.
8. If a batch completed distribution on a calendar day, any subsequent batch on that calendar day must have is_same_day_override = true and require a corresponding SAME_DAY_FORCE_OVERRIDE audit_log record.
9. Schedules enforce the Zero-Conflict Hydraulic Invariant: a unique constraint and application validation prevent overlapping irrigation time slots across different tank_ids on the same day.
