# 15 Deployment Specification & Operational Runbooks

> **Authority Notice:** Single Source of Truth (SOTT) for Desanomia's physical edge host deployment, container orchestration, host OS & Wayland kiosk provisioning, dual-NIC network topology, local time synchronization, NVMe database retention, and zero-downtime operational runbooks. Governed by [00_MASTER_RULES.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/00_MASTER_RULES.md), [04_TRD.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/04_TRD.md), [05_ARCHITECTURE.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/05_ARCHITECTURE.md), [06_DATA_MODEL.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/06_DATA_MODEL.md), [08_SECURITY.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/08_SECURITY.md), [09_ERROR_HANDLING.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/09_ERROR_HANDLING.md), [10_FIRMWARE_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/10_FIRMWARE_SPEC.md), [11_API_CONTRACT.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/11_API_CONTRACT.md), [12_UI_SPEC.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/12_UI_SPEC.md), [13_TESTING.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/13_TESTING.md), [14_GITHUB_ACTIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/14_GITHUB_ACTIONS.md), and [18_DECISIONS.md](file:///home/maria_zahra/Documents/projects/greenhouse/desanomia/brain/18_DECISIONS.md).

---

## 1. Physical Edge Host Architecture (Beelink EQ12 Mini PC)

The on-site edge computing node is anchored by the **Beelink EQ12 Mini PC**, purpose-engineered for high-reliability 24/7 continuous operation within the humid, temperature-variable greenhouse panel control room.

```
+---------------------------------------------------------------------------------------------------+
|                            BEELINK EQ12 MINI PC ON-SITE EDGE GATEWAY                              |
+---------------------------------------------------------------------------------------------------+
| • CPU: Intel Processor N100 (Alder Lake-N, 4C/4T @ 0.8–3.4 GHz, 6W TDP, 6MB Smart Cache)          |
| • GPU: Intel UHD Graphics 24 EUs (Hardware GPU Acceleration for Wayland/Chromium Kiosk)           |
| • RAM: 16GB Crucial DDR5 4800 MHz SODIMM                                                          |
| • Storage: 500GB M.2 2280 PCIe 3.0 x4 NVMe SSD (High Endurance, Tuned for PostgreSQL 16)          |
| • RTC Master: Motherboard CR2032 Battery-Backed CMOS Real-Time Clock (/dev/rtc0)                  |
| • Power Input: 12V / 3A DC via 1200VA Online Double-Conversion UPS (APC Smart-UPS / Prolink)      |
+---------------------------------+---------------------------------+-------------------------------+
                                  |                                 |
                                  v                                 v
                 +--------------------------------+ +--------------------------------+
                 | ETH0 (enp1s0): Intel i225-V    | | ETH1 (enp2s0): Intel i225-V    |
                 | 192.168.10.1/24 (OT Fieldbus)  | | 192.168.1.10/24 (IT / Uplink)  |
                 | Dedicated Isolated Sensor Bus  | | Orbit Star H2, Gazebo, Tailscale|
                 +--------------------------------+ +--------------------------------+
```

### 1.1 Hardware Specifications & Power Autostart

1. **Processor & Thermal Envelope:** Intel N100 4-core processor running at 6W typical TDP. Equipped with active copper heatpipe and blower fan. Runs stably under high ambient greenhouse conditions ($\le 45^\circ\text{C}$).
2. **Memory:** 16GB DDR5 4800MHz SODIMM single-channel memory, providing massive headroom for in-memory PostgreSQL write buffering and zero-swap operation.
3. **Storage Endurance:** 500GB PCIe 3.0 x4 NVMe SSD with high TBW rating. Partitioned with ext4 filesystem (`noatime` mount option) to protect flash cells from wear during high-frequency telemetry streaming.
4. **BIOS AMI Configuration Standards:**
   - `Restore on AC Power Loss` $\to$ **`Always On`** (Mandatory: Beelink automatically powers up as soon as electrical grid or generator power is restored without operator button presses).
   - `Intel Virtualization Technology (VT-x)` $\to$ **`Enabled`**.
   - `Fast Boot` $\to$ **`Disabled`** (Guarantees clean hardware re-initialization).
   - `Quiet Boot` $\to$ **`Disabled`** (Ensures serial/POST diagnostic logs are visible via HDMI if troubleshooting).

---

## 2. Dual-NIC Network Topology & Linux Kernel Firewalling (D-043)

Physical air-gap network isolation is enforced by the Beelink EQ12's dual 2.5 GbE Ethernet interfaces:

```
+--------------------------------------+                 +--------------------------------------+
|     OT LAN: 192.168.10.0/24 (ETH0)   |                 |    IT / WAN LAN: 192.168.1.0/24 (ETH1)|
+--------------------------------------+                 +--------------------------------------+
| • Beelink ETH0: 192.168.10.1         |                 | • Beelink ETH1: 192.168.1.10         |
| • ESP32-S3 W5500: 192.168.10.20      |                 | • Orbit Star H2 Gateway: 192.168.1.1 |
| • Mosquitto Broker: 192.168.10.1:1883|                 | • Tenda O1 Gazebo PTP Bridge AP      |
| • Chrony NTP Master: 192.168.10.1:123|                 | • Xiaomi TV A (Gazebo): 192.168.1.50 |
|                                      |                 | • Tailscale Mesh VPN: 100.x.y.z/32   |
+--------------------------------------+                 +--------------------------------------+
                  \                                                     /
                   \                                                   /
                    +-------------------------------------------------+
                    |       LINUX KERNEL AIR-GAP HARDENING (Debian 12)|
                    |       • net.ipv4.ip_forward = 0                 |
                    |       • nftables: STRICT FORWARD DROP           |
                    |       • Cross-subnet routing strictly forbidden |
                    +-------------------------------------------------+
```

### 2.1 Interface Configuration (`/etc/network/interfaces` or systemd-networkd)

```ini
# /etc/systemd/network/10-eth0-ot.network
[Match]
Name=enp1s0

[Network]
Address=192.168.10.1/24
LinkLocalAddressing=no
# Strictly no default gateway on OT bus!

# /etc/systemd/network/20-eth1-it.network
[Match]
Name=enp2s0

[Network]
Address=192.168.1.10/24
Gateway=192.168.1.1
DNS=192.168.1.1
DNS=1.1.1.1
```

### 2.2 Linux Kernel Isolation & nftables Rules (`/etc/nftables.conf`)

Kernel forwarding is unconditionally disabled:
```bash
# /etc/sysctl.d/99-desanomia-networking.conf
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0
```

The host firewall configuration locks down all attack vectors and enforces strict service isolation:
```nftables
#!/usr/sbin/nft -f
flush ruleset

table inet filter {
    chain input {
        type filter hook input priority filter; policy drop;

        # Allow loopback traffic (Kiosk and internal IPC)
        iif "lo" accept

        # Allow established and related connections
        ct state established,related accept

        # OT Fieldbus Interface (ETH0 / enp1s0)
        # Strictly accept MQTT (1883) and Chrony NTP (123) from ESP32-S3 (192.168.10.20)
        iif "enp1s0" ip saddr 192.168.10.20 tcp dport 1883 accept
        iif "enp1s0" ip saddr 192.168.10.20 udp dport 123 accept

        # IT / WAN Interface (ETH1 / enp2s0)
        # Allow HTTP (80) for redirect, HTTPS (443) for Web Dashboard, and SSH (2222)
        iif "enp2s0" tcp dport { 80, 443 } accept
        iif "enp2s0" tcp dport 2222 accept

        # Tailscale Mesh VPN (tailscale0)
        # Allow secure remote administration and API access
        iif "tailscale0" tcp dport { 80, 443, 2222 } accept

        # ICMP echo requests (Ping) on LANs for diagnostic health
        ip protocol icmp icmp type echo-request accept
    }

    chain forward {
        type filter hook forward priority filter; policy drop;
        # Zero packet forwarding between OT Fieldbus and IT WAN!
    }

    chain output {
        type filter hook output priority filter; policy accept;
    }
}
```

---

## 3. Hardened Docker Compose Production Stack (`deploy/docker-compose.yml`)

The complete edge software stack runs as non-root containerized services orchestrating Mosquitto, PostgreSQL 16, FastAPI backend, and Nginx:

```yaml
version: "3.8"

services:
  # ----------------------------------------------------------------------------
  # 1. Eclipse Mosquitto 2.0 MQTT Broker (Strictly Isolated to OT LAN)
  # ----------------------------------------------------------------------------
  mosquitto:
    image: eclipse-mosquitto:2.0.18-alpine
    container_name: desanomia_mosquitto
    restart: unless-stopped
    ports:
      # Bound strictly to OT fieldbus IP; zero IT/WAN exposure
      - "192.168.10.1:1883:1883"
    volumes:
      - ./infra/mosquitto/config/mosquitto.conf:/mosquitto/config/mosquitto.conf:ro
      - ./infra/mosquitto/config/passwd:/mosquitto/config/passwd:ro
      - ./infra/mosquitto/config/acl:/mosquitto/config/acl:ro
      - mosquitto_data:/mosquitto/data
    healthcheck:
      test: ["CMD", "mosquitto_sub", "-t", "$$SYS/broker/version", "-C", "1", "-u", "healthcheck", "-P", "${HEALTH_PASS}"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - ot_bridge

  # ----------------------------------------------------------------------------
  # 2. PostgreSQL 16 Database with Native Range Partitioning
  # ----------------------------------------------------------------------------
  postgres:
    image: postgres:16-alpine
    container_name: desanomia_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: desanomia
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
      PGDATA: /var/lib/postgresql/data/pgdata
      TZ: Asia/Jakarta
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/postgres/init:/docker-entrypoint-initdb.d:ro
    ports:
      # Localhost only; external access via SSH tunnel or Tailscale
      - "127.0.0.1:5432:5432"
    command: >
      postgres
        -c shared_buffers=4GB
        -c effective_cache_size=12GB
        -c work_mem=64MB
        -c maintenance_work_mem=512MB
        -c wal_compression=on
        -c checkpoint_completion_target=0.9
        -c synchronous_commit=off
        -c wal_writer_delay=5000ms
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d desanomia"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - internal_bridge

  # ----------------------------------------------------------------------------
  # 3. FastAPI Edge Backend & MQTT Ingestion Engine
  # ----------------------------------------------------------------------------
  backend:
    image: ghcr.io/yourorg/desanomia-backend:${APP_VERSION:-latest}
    container_name: desanomia_backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      mosquitto:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql+asyncpg://${DB_USER}:${DB_PASS}@postgres:5432/desanomia
      MQTT_HOST: 192.168.10.1
      MQTT_PORT: 1883
      MQTT_CLIENT_USER: backend_service
      MQTT_CLIENT_PASS: ${MQTT_BACKEND_PASS}
      SECRET_KEY: ${JWT_SECRET_KEY}
      APP_ENV: production
      TZ: Asia/Jakarta
    ports:
      - "127.0.0.1:8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://127.0.0.1:8000/api/v1/health"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - ot_bridge
      - internal_bridge

  # ----------------------------------------------------------------------------
  # 4. Nginx Reverse Proxy & Offline SPA Web Server
  # ----------------------------------------------------------------------------
  nginx:
    image: nginx:alpine
    container_name: desanomia_nginx
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "127.0.0.1:8080:80"        # Kiosk Loopback (Plain HTTP, Zero TLS Overhead)
      - "192.168.1.10:80:80"       # IT LAN HTTP (301 Redirect to HTTPS)
      - "192.168.1.10:443:443"     # IT LAN HTTPS (Gazebo TV & Mobile PWA)
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./infra/nginx/certs:/etc/nginx/certs:ro
      - ../frontend/dist:/usr/share/nginx/html:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://127.0.0.1:80/health"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - internal_bridge

networks:
  ot_bridge:
    driver: bridge
  internal_bridge:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  mosquitto_data:
    driver: local
```

### 3.1 Nginx Tri-Listener Reverse Proxy Configuration

```nginx
# infra/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;

    # Upstream Backend
    upstream backend_api {
        server 127.0.0.1:8000;
        keepalive 32;
    }

    # --------------------------------------------------------------------------
    # Listener A: Dedicated Local Kiosk Loopback (127.0.0.1:8080)
    # --------------------------------------------------------------------------
    server {
        listen 80;
        server_name 127.0.0.1 localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Healthcheck endpoint
        location /health {
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }

        # Static React SPA routing
        location / {
            try_files $uri $uri/ /index.html;
            add_header Cache-Control "no-cache";
        }

        # REST API Proxy
        location /api/ {
            proxy_pass http://backend_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Real-time WebSocket Proxy (/api/v1/ws/telemetry and legacy /ws/)
        location ~ ^/(api/v1/ws/|ws/) {
            proxy_pass http://backend_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 86400s;
        }
    }

    # --------------------------------------------------------------------------
    # Listener B: IT LAN HTTP Redirect (192.168.1.10:80)
    # --------------------------------------------------------------------------
    server {
        listen 192.168.1.10:80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # --------------------------------------------------------------------------
    # Listener C: IT LAN & Tailscale HTTPS (192.168.1.10:443)
    # --------------------------------------------------------------------------
    server {
        listen 192.168.1.10:443 ssl http2;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        ssl_certificate /etc/nginx/certs/desanomia_edge.crt;
        ssl_certificate_key /etc/nginx/certs/desanomia_edge.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        location / {
            try_files $uri $uri/ /index.html;
            add_header Cache-Control "no-cache";
        }

        location /api/ {
            proxy_pass http://backend_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }

        location ~ ^/(api/v1/ws/|ws/) {
            proxy_pass http://backend_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 86400s;
        }
    }
}
```

---

## 4. Control-Room HMI Kiosk Provisioning (Cage Wayland + Chromium)

The Primary HMI Kiosk operates on a UPERFECT BE156PF 15.6" IPS FHD (1920×1080) capacitive touchscreen connected via HDMI 2.0 and USB-C touch input directly to the Beelink EQ12.

### 4.1 Systemd Kiosk Unit (`/etc/systemd/system/kiosk.service`)

The kiosk is managed as an unprivileged system service running under user `kiosk`, auto-launching upon system boot without desktop environment bloat:

```ini
[Unit]
Description=Desanomia Industrial Cockpit Cage Wayland Kiosk
After=docker.service network-online.target
Wants=docker.service
Conflicts=getty@tty1.service

[Service]
Type=simple
User=kiosk
PAMName=login
Environment=XDG_RUNTIME_DIR=/run/user/1001
Environment=WLR_RENDERER=vulkan
Environment=WLR_LIBINPUT_NO_DEVICES=0
ExecStartPre=/usr/bin/timeout 60 /bin/bash -c 'until curl -s http://127.0.0.1:8080/health | grep -q "OK"; do sleep 2; done'
ExecStart=/usr/bin/cage -- /usr/bin/chromium \
    --kiosk \
    --app=http://127.0.0.1:8080 \
    --touch-events=enabled \
    --disable-pinch \
    --disable-features=TranslateUI \
    --noerrdialogs \
    --disable-infobars \
    --check-for-update-interval=31536000 \
    --enable-gpu-rasterization \
    --enable-zero-copy \
    --ignore-gpu-blocklist \
    --autoplay-policy=no-user-gesture-required
Restart=always
RestartSec=5
TTYPath=/dev/tty1

[Install]
WantedBy=graphical.target
```

### 4.2 Touch Screen Calibration & Display Preservation

- **udev Touch Rules (`/etc/udev/rules.d/99-uperfect-touch.rules`):**
  ```udev
  KERNEL=="event*", ATTRS{name}=="ILITEK ILITEK-TP", ENV{LIBINPUT_CALIBRATION_MATRIX}="1 0 0 0 1 0"
  ```
- **Display Power Management (DPMS):** The screen is configured to stay permanently awake during daytime operational hours ($05:00\text{ to }21:00\text{ WIB}$) via `/etc/systemd/logind.conf` (`IdleAction=ignore`).

---

## 5. Local Time Synchronization Authority (D-020)

Because the greenhouse facility operates autonomously without internet access during 4G disruptions, the Beelink motherboard CR2032 battery-backed CMOS Real-Time Clock (`/dev/rtc0`) serves as the root hardware time authority.

```
+---------------------------------------------------------------------------------------------------+
|                        OFFLINE TIME SYNCHRONIZATION TOPOLOGY (D-020)                              |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|   +--------------------------+                                                                    |
|   | Beelink CMOS RTC /dev/rtc0|                                                                    |
|   | (CR2032 Lithium Battery) |                                                                    |
|   +------------+-------------+                                                                    |
|                | Cold Boot Sync: hwclock --hctosys                                                |
|                v                                                                                  |
|   +--------------------------+                       Periodic Sync (When 4G Uplink Active)        |
|   | Chrony Local NTP Master  |<---------------------------------------------------------------+    |
|   | (Stratum-10 Local Server)|                                                                |   |
|   +------------+-------------+                                                  +-------------+---+
|                |                                                                | pool.ntp.org (WAN)|
|                | Disciplines OT LAN                                             +-----------------+
|                v                                                                                  |
|   +--------------------------+                                                                    |
|   | ESP32-S3 Microcontroller |                                                                    |
|   | 192.168.10.20:123        |                                                                    |
|   | (Syncs Clock Every 60m)  |                                                                    |
|   +--------------------------+                                                                    |
+---------------------------------------------------------------------------------------------------+
```

### 5.1 Chrony Configuration (`/etc/chrony/chrony.conf`)

```ini
# /etc/chrony/chrony.conf
# WAN Upstream Servers (Used only when 4G internet is active)
pool pool.ntp.org iburst maxsources 4

# Fallback to Local CMOS RTC when internet is offline
local stratum 10 orphan

# Serve NTP time exclusively on OT fieldbus to ESP32-S3
allow 192.168.10.0/24
bindaddress 192.168.10.1

# Synchronize host hardware RTC when system time is stepped
rtcsync
makestep 1.0 3
```

---

## 6. Database Partitioning, NVMe Endurance & Retention (D-044)

High-frequency 1.0 Hz telemetry generates $\approx 86,400\text{ rows/day}$. Direct unbuffered writes to disk degrade consumer SSD endurance. The architecture enforces a **5-second asynchronous RAM write buffer** and monthly native table partitioning in PostgreSQL 16.

### 6.1 Monthly Range Partitioning DDL

```sql
-- Partition master table
CREATE TABLE telemetry (
    id BIGSERIAL,
    ts TIMESTAMPTZ NOT NULL,
    tank_pair_id SMALLINT NOT NULL,
    tds_ppm REAL NOT NULL,
    water_temp_c REAL NOT NULL,
    drum2_volume_l REAL NOT NULL,
    drum1_volume_l REAL NOT NULL,
    flow_rate_lpm REAL NOT NULL,
    fsm_state VARCHAR(32) NOT NULL,
    hw_estop_pressed BOOLEAN NOT NULL,
    actuators JSONB NOT NULL,
    CONSTRAINT pk_telemetry PRIMARY KEY (ts, id)
) PARTITION BY RANGE (ts);

-- Sample Monthly Partitions
CREATE TABLE telemetry_2026_10 PARTITION OF telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+07') TO ('2026-11-01 00:00:00+07');

CREATE TABLE telemetry_2026_11 PARTITION OF telemetry
    FOR VALUES FROM ('2026-11-01 00:00:00+07') TO ('2026-12-01 00:00:00+07');
```

### 6.2 Automated Partition Maintenance & Retention Cron

Raw telemetry is preserved for **90–120 days**. Once 1-minute historical rollups in `telemetry_1m` (retained for 2 years) are computed, obsolete monthly partitions are dropped cleanly without table fragmentation:

```bash
#!/bin/bash
# /usr/local/bin/desanomia-partition-maintenance.sh
set -euo pipefail

# 1. Compute 1-minute historical rollups for yesterday
docker compose -f /opt/desanomia/deploy/docker-compose.yml exec -T postgres psql -U desanomia -d desanomia -c "
INSERT INTO telemetry_1m (bucket_ts, tank_pair_id, mean_tds_ppm, min_tds_ppm, max_tds_ppm, mean_drum2_volume_l, mean_temp_c)
SELECT
    date_trunc('minute', ts) AS bucket_ts,
    tank_pair_id,
    ROUND(AVG(tds_ppm)::numeric, 1) AS mean_tds_ppm,
    MIN(tds_ppm) AS min_tds_ppm,
    MAX(tds_ppm) AS max_tds_ppm,
    ROUND(AVG(drum2_volume_l)::numeric, 1) AS mean_drum2_volume_l,
    ROUND(AVG(water_temp_c)::numeric, 1) AS mean_temp_c
FROM telemetry
WHERE ts >= NOW() - INTERVAL '2 days' AND ts < NOW() - INTERVAL '1 day'
GROUP BY 1, 2
ON CONFLICT (bucket_ts, tank_pair_id) DO NOTHING;
"

# 2. Drop partitions older than 120 days
CUTOFF_DATE=$(date -d "120 days ago" +"%Y_%m")
OLD_PARTITION="telemetry_${CUTOFF_DATE}"

docker compose -f /opt/desanomia/deploy/docker-compose.yml exec -T postgres psql -U desanomia -d desanomia -c "
DROP TABLE IF EXISTS ${OLD_PARTITION};
"
```

### 6.3 Dual-Target Zstandard Backup Protocol

```bash
#!/bin/bash
# /usr/local/bin/desanomia-backup.sh
set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/postgres"
FILENAME="desanomia_backup_${TIMESTAMP}.sql.zst"

mkdir -p "${BACKUP_DIR}"

# 1. Dump database with zstd compression (Level 3 - Fast & Compact)
docker compose -f /opt/desanomia/deploy/docker-compose.yml exec -T postgres pg_dump -U desanomia desanomia | zstd -3 > "${BACKUP_DIR}/${FILENAME}"

# 2. Target A: Retain last 30 daily snapshots on local NVMe
find "${BACKUP_DIR}" -name "desanomia_backup_*.sql.zst" -mtime +30 -delete

# 3. Target B1: Mirror to physical external USB drive (if mounted)
if mountpoint -q /mnt/usb_backup; then
    rsync -av "${BACKUP_DIR}/${FILENAME}" /mnt/usb_backup/
fi

# 4. Target B2: Mirror over Tailscale to remote Host 2 (lenovo-latop: 100.125.131.95)
if ping -c 1 -W 2 100.125.131.95 > /dev/null 2>&1; then
    rsync -av "${BACKUP_DIR}/${FILENAME}" backup_user@100.125.131.95:/var/backups/desanomia_remote/
fi
```

---

## 7. Operational Runbooks & Emergency Procedures

### 7.1 Runbook 1: Zero-Downtime Application Update

1. **Pre-Flight Invariant Check:**
   - Verify that the FSM state is strictly **`IDLE`**. Upgrades are forbidden during an active batch.
   ```bash
   curl -s http://127.0.0.1:8000/api/v1/system/status | grep '"fsm_state":"IDLE"' || { echo "ERROR: Active batch in progress!"; exit 1; }
   ```
2. **Pull Release Containers:**
   ```bash
   cd /opt/desanomia/deploy
   docker compose pull
   ```
3. **Execute Database Migrations:**
   ```bash
   docker compose exec backend alembic upgrade head
   ```
4. **Recreate Containers:**
   ```bash
   docker compose up -d --remove-orphans
   ```
5. **Post-Deployment Smoke Verification:**
   - Verify backend health: `curl -f http://127.0.0.1:8000/api/v1/health`
   - Verify Kiosk loopback: `curl -f http://127.0.0.1:8080/health`
   - Check Mosquitto bridge: `docker compose logs --tail=20 mosquitto`

### 7.2 Runbook 2: Instant Rollback Procedure

If a deployed version exhibits anomalies, revert to the previous container image tag within $< 30\text{ seconds}$:
1. Edit `/opt/desanomia/deploy/.env` and update `APP_VERSION` to previous release tag:
   ```bash
   sed -i 's/APP_VERSION=v1.4.2/APP_VERSION=v1.4.1/g' .env
   ```
2. Re-apply compose configuration:
   ```bash
   docker compose up -d
   ```

### 7.3 Runbook 3: Cold-Boot Grid Power Loss Recovery

When the electrical grid fails and UPS batteries exhaust:
1. When mains power restores, the Beelink BIOS triggers automatic hardware boot.
2. The host initializes, sets time from `/dev/rtc0`, and launches Docker containers.
3. The ESP32-S3 powers up, recovers its `fsm_journal` from NVS, and enters **`BATCH_PAUSED_INSPECTION`** if a batch was interrupted (`D-013`).
4. The Kiosk display powers on and presents the full-screen Pause Mode recovery overlay showing real-time water volume, current TDS, and calculated nutrient deficit.
5. Operator inspects the greenhouse physical beds and taps **`[Lanjutkan Distribusi]`** to dose the deficit and resume fertigation.

### 7.4 Runbook 4: Emergency Secret & Credential Rotation

If credentials or JWT secret keys are suspected of compromise:
1. Generate new 32-byte cryptographically secure tokens:
   ```bash
   openssl rand -hex 32
   ```
2. Update `.env` with new `JWT_SECRET_KEY`, `DB_PASS`, and `MQTT_BACKEND_PASS`.
3. Update Mosquitto password file:
   ```bash
   docker compose exec mosquitto mosquitto_passwd -b /mosquitto/config/passwd backend_service <NEW_PASS>
   ```
4. Restart the backend service:
   ```bash
   docker compose restart backend
   ```
5. All active user sessions are invalidated immediately, forcing re-authentication.
