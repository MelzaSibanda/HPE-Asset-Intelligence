-- ============================================================
-- HPE Asset Intelligence — PostgreSQL Schema + Seed Data
-- Run via: psql $DATABASE_URL < hpe_schema_pg.sql
-- ============================================================

-- ── Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  initials      VARCHAR(5)   NOT NULL,
  role          VARCHAR(10)  DEFAULT 'viewer' CHECK (role IN ('admin','viewer')),
  created_at    TIMESTAMP    DEFAULT NOW()
);

-- ── Sites ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sites (
  id     SERIAL PRIMARY KEY,
  name   VARCHAR(100) NOT NULL,
  code   VARCHAR(20)  UNIQUE NOT NULL,
  is_hq  SMALLINT     DEFAULT 0,
  lat    DECIMAL(9,6),
  lng    DECIMAL(9,6)
);

-- ── Asset types ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asset_types (
  id     SERIAL PRIMARY KEY,
  name   VARCHAR(50) NOT NULL,
  prefix VARCHAR(5)  NOT NULL
);

-- ── Assets ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
  id               SERIAL PRIMARY KEY,
  asset_id         VARCHAR(20)  UNIQUE NOT NULL,
  type_id          INT          NOT NULL,
  model            VARCHAR(50)  NOT NULL,
  serial_number    VARCHAR(100),
  epc_tag          VARCHAR(60)  UNIQUE,
  current_site_id  INT,
  status           VARCHAR(15)  DEFAULT 'active'
                   CHECK (status IN ('active','alarm','warning','maintenance','transit')),
  location_detail  VARCHAR(100) DEFAULT 'Workshop',
  commissioned_at  DATE,
  tagged_at        DATE,
  last_service_at  DATE,
  next_service_due DATE,
  lifetime_hours   DECIMAL(10,2) DEFAULT 0,
  monthly_hours    DECIMAL(8,2)  DEFAULT 0,
  battery_pct      SMALLINT,
  vibration_rms    DECIMAL(6,3),
  temperature      DECIMAL(5,2),
  last_seen_at     TIMESTAMP NULL,
  created_at       TIMESTAMP    DEFAULT NOW(),
  FOREIGN KEY (type_id)         REFERENCES asset_types(id),
  FOREIGN KEY (current_site_id) REFERENCES sites(id)
);

-- ── Sensor readings ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sensor_readings (
  id            SERIAL PRIMARY KEY,
  asset_id      VARCHAR(20)   NOT NULL,
  vibration_rms DECIMAL(6,3),
  temperature   DECIMAL(5,2),
  battery_pct   SMALLINT,
  recorded_at   TIMESTAMP     DEFAULT NOW(),
  FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
);
CREATE INDEX IF NOT EXISTS idx_asset_time ON sensor_readings (asset_id, recorded_at);

-- ── Movement events ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS movement_events (
  id           SERIAL PRIMARY KEY,
  asset_id     VARCHAR(20) NOT NULL,
  event_type   VARCHAR(30) NOT NULL
               CHECK (event_type IN (
                 'dispatched_hq','in_transit','received_mine',
                 'dispatched_ug','returned_ug','dispatched_hq_return','received_hq'
               )),
  from_site_id INT,
  to_site_id   INT,
  notes        VARCHAR(255),
  occurred_at  TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (asset_id)     REFERENCES assets(asset_id),
  FOREIGN KEY (from_site_id) REFERENCES sites(id),
  FOREIGN KEY (to_site_id)   REFERENCES sites(id)
);

-- ── Alarms ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alarms (
  id              SERIAL PRIMARY KEY,
  asset_id        VARCHAR(20)  NOT NULL,
  severity        VARCHAR(10)  NOT NULL CHECK (severity IN ('critical','warning','info')),
  description     VARCHAR(255) NOT NULL,
  status          VARCHAR(15)  DEFAULT 'active'
                  CHECK (status IN ('active','acknowledged','resolved')),
  raised_at       TIMESTAMP    DEFAULT NOW(),
  acknowledged_at TIMESTAMP    NULL,
  acknowledged_by INT          NULL,
  resolved_at     TIMESTAMP    NULL,
  FOREIGN KEY (asset_id)        REFERENCES assets(asset_id),
  FOREIGN KEY (acknowledged_by) REFERENCES users(id)
);

-- ── Work orders ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS work_orders (
  id               SERIAL PRIMARY KEY,
  wo_number        VARCHAR(20)  UNIQUE NOT NULL,
  asset_id         VARCHAR(20)  NOT NULL,
  site_id          INT          NOT NULL,
  reason           VARCHAR(255) NOT NULL,
  replacement_unit VARCHAR(100),
  estimated_hours  DECIMAL(4,2) DEFAULT 2.00,
  priority         VARCHAR(10)  DEFAULT 'normal'
                   CHECK (priority IN ('critical','high','normal','low')),
  status           VARCHAR(15)  DEFAULT 'open'
                   CHECK (status IN ('open','in_progress','completed','cancelled')),
  created_by       INT,
  created_at       TIMESTAMP    DEFAULT NOW(),
  completed_at     TIMESTAMP    NULL,
  FOREIGN KEY (asset_id)   REFERENCES assets(asset_id),
  FOREIGN KEY (site_id)    REFERENCES sites(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO users (email, password_hash, name, initials, role) VALUES
('werner.nienaber@hpesa.com',
 '$2y$10$gAbsVydGLj4D6S6wWCLwb.SkyzqhUza2MN07eCDqVDcvEYOZahewS',
 'Werner Nienaber', 'WN', 'admin'),
('admin@hpesa.com',
 '$2y$10$gAbsVydGLj4D6S6wWCLwb.SkyzqhUza2MN07eCDqVDcvEYOZahewS',
 'System Admin', 'SA', 'admin');

INSERT INTO sites (name, code, is_hq, lat, lng) VALUES
('HQ Randburg','HQ',1,-26.0935,27.9946),
('Mponeng','MPN',0,-26.4833,27.3167),
('Tau Tona','TT',0,-26.5167,27.3667),
('Driefontein','DRF',0,-26.4000,27.3833),
('Kusasalethu','KUS',0,-26.4833,27.2833),
('Kloof','KLF',0,-26.3167,27.4667),
('South Deep','SD',0,-26.5000,27.5000);

INSERT INTO asset_types (name, prefix) VALUES
('Hydro rock drill','DRL'),
('Hydraulic pump','PMP'),
('Thrust leg','THL');

INSERT INTO assets
  (asset_id,type_id,model,serial_number,epc_tag,current_site_id,status,location_detail,
   commissioned_at,tagged_at,last_service_at,next_service_due,
   lifetime_hours,monthly_hours,battery_pct,vibration_rms,temperature,last_seen_at)
VALUES
('DRL-04217',1,'RD-9000','RD9-2024-04217','E280689400005014217',3,'alarm','Underground','2024-03-14','2024-03-22','2026-04-08','2026-05-08',2847,112,62,4.2,87,'2026-05-11 09:31:00'),
('PMP-00184',2,'HP-5000','HP5-2023-00184','E280689400005000184',2,'warning','Workshop','2023-06-10','2023-06-15','2026-03-01','2026-06-01',4231,88,78,1.8,89,'2026-05-11 09:37:00'),
('DRL-08812',1,'RD-9000','RD9-2024-08812','E280689400005008812',4,'alarm','Underground','2024-01-20','2024-01-25','2026-02-14','2026-05-14',1892,74,0,3.6,82,NULL),
('THL-00341',3,'TL-3000','TL3-2023-00341','E280689400005000341',7,'active','Workshop','2023-09-01','2023-09-08','2026-04-20','2026-07-20',3421,96,91,0.9,71,'2026-05-11 09:41:00'),
('DRL-02156',1,'RD-8500','RD8-2022-02156','E280689400005002156',6,'active','Underground','2022-11-15','2022-11-20','2026-04-01','2026-07-01',5632,103,45,1.4,76,'2026-05-11 09:39:00'),
('PMP-00521',2,'HP-6000','HP6-2024-00521','E280689400005000521',5,'active','Underground','2024-02-28','2024-03-05','2026-03-22','2026-06-22',2109,118,83,2.1,68,'2026-05-11 09:41:00'),
('DRL-07821',1,'RD-9000','RD9-2023-07821','E280689400005007821',1,'maintenance','Workshop','2023-04-11','2023-04-18','2026-01-15','2026-04-15',4567,0,67,0.3,42,'2026-05-11 09:30:00'),
('THL-00892',3,'TL-3500','TL3-2024-00892','E280689400005000892',2,'active','Underground','2024-05-03','2024-05-10','2026-04-25','2026-07-25',2834,91,72,1.1,65,'2026-05-11 09:40:00'),
('DRL-05234',1,'RD-9000','RD9-2025-05234','E280689400005005234',3,'active','Workshop','2025-01-07','2025-01-14','2026-04-30','2026-07-30',1256,44,88,0.8,58,'2026-05-11 09:34:00'),
('PMP-00732',2,'HP-5000','HP5-2023-00732','E280689400005000732',4,'active','Workshop','2023-08-19','2023-08-26','2026-03-10','2026-06-10',3892,66,54,1.6,72,'2026-05-11 09:38:00'),
('DRL-09456',1,'RD-8500','RD8-2024-09456','E280689400005009456',7,'active','Underground','2024-06-22','2024-06-28','2026-04-05','2026-07-05',4123,101,76,1.9,79,'2026-05-11 09:41:00'),
('THL-00123',3,'TL-3000','TL3-2023-00123','E280689400005000123',6,'active','Underground','2023-03-14','2023-03-20','2026-04-12','2026-07-12',2945,88,81,1.0,67,'2026-05-11 09:37:00'),
('PMP-00097',2,'HP-5000','HP5-2022-00097','E280689400005000097',6,'warning','Underground','2022-07-30','2022-08-06','2026-01-20','2026-04-20',6102,77,34,2.8,74,'2026-05-11 09:35:00'),
('DRL-04590',1,'RD-9000','RD9-2024-04590','E280689400005004590',7,'warning','Underground','2024-02-01','2024-02-08','2026-03-05','2026-06-05',2233,89,8,1.7,72,'2026-05-11 09:36:00'),
('DRL-09123',1,'RD-9000','RD9-2024-09123','E280689400005009123',7,'alarm','Underground','2024-07-14','2024-07-20','2026-04-18','2026-07-18',1654,92,47,5.1,84,'2026-05-11 09:40:00'),
('DRL-03456',1,'RD-9000','RD9-2023-03456','E280689400005003456',4,'active','Underground','2023-05-10','2023-05-17','2026-04-01','2026-07-01',3812,82,11,1.6,71,'2026-05-10 11:00:00'),
('DRL-06754',1,'RD-8500','RD8-2023-06754','E280689400005006754',3,'warning','Underground','2023-11-28','2023-12-04','2026-03-14','2026-06-14',3241,97,61,2.9,77,'2026-05-11 09:38:00');

INSERT INTO alarms (asset_id,severity,description,status,raised_at) VALUES
('DRL-04217','critical','Vibration threshold exceeded — chuck bearing wear (4.2 g)','active','2026-05-11 09:33:00'),
('DRL-08812','critical','Missing heartbeat — tag not seen for 110 minutes','active','2026-05-11 07:52:00'),
('DRL-09123','critical','Critical vibration — 5.1 g, alarm threshold 3.5 g','active','2026-05-11 01:05:00'),
('PMP-00097','critical','Signature drift — vibration pattern shifted 12% from baseline','active','2026-05-11 05:21:00'),
('PMP-00184','warning','Temperature trending high — 89 °C, threshold 90 °C','active','2026-05-11 08:14:00'),
('DRL-04590','warning','Low battery — 8% remaining, estimated 14 days life','active','2026-05-11 06:33:00'),
('DRL-06754','warning','Elevated vibration — 2.9 g, trending upward last 6 hours','active','2026-05-11 03:42:00'),
('PMP-00521','warning','Temperature spike — brief 97 °C excursion, currently cooling','active','2026-05-11 02:18:00'),
('DRL-03456','warning','Battery approaching end-of-life — 11% remaining','active','2026-05-10 12:00:00'),
('THL-00892','warning','Sensor timeout — no reading for 2 consecutive hours','active','2026-05-10 16:00:00'),
('DRL-07821','warning','Overdue service — 560 hours past scheduled interval','active','2026-05-10 18:00:00'),
('PMP-00732','warning','Pressure high — 198 bar vs. rated 200 bar max','active','2026-05-10 20:00:00'),
('DRL-05234','warning','Elevated temperature — 83 °C, warning threshold at 85 °C','active','2026-05-10 22:00:00'),
('THL-00341','warning','Vibration RMS increasing — 2.1 g, deviation from baseline','active','2026-05-11 00:00:00'),
('DRL-02156','warning','Low battery — 15% remaining, recommend surface recall','active','2026-05-11 00:30:00'),
('DRL-09456','warning','Elevated temperature trend — 79 °C, warming over 4 hours','active','2026-05-11 01:00:00'),
('PMP-00097','warning','Signature drift — 8% deviation from commissioning baseline','active','2026-05-11 02:00:00');

INSERT INTO movement_events (asset_id,event_type,from_site_id,to_site_id,notes,occurred_at) VALUES
('DRL-04217','dispatched_hq',1,3,'Dispatched to Tau Tona','2026-04-28 14:20:00'),
('DRL-04217','received_mine',1,3,'Received at Tau Tona workshop','2026-05-02 11:34:00'),
('DRL-04217','dispatched_ug',3,3,'Dispatched to Tau Tona main decline','2026-05-04 06:08:00'),
('DRL-04217','returned_ug',3,3,'Returned from UG to workshop','2026-05-04 18:42:00'),
('DRL-04217','dispatched_ug',3,3,'Dispatched to Tau Tona main decline','2026-05-05 06:15:00');

INSERT INTO sensor_readings (asset_id,vibration_rms,temperature,battery_pct,recorded_at) VALUES
('DRL-04217',1.40,72,68,'2026-04-11 08:00:00'),('DRL-04217',1.50,73,68,'2026-04-12 08:00:00'),
('DRL-04217',1.30,71,67,'2026-04-13 08:00:00'),('DRL-04217',1.60,74,67,'2026-04-14 08:00:00'),
('DRL-04217',1.40,72,66,'2026-04-15 08:00:00'),('DRL-04217',1.70,75,66,'2026-04-16 08:00:00'),
('DRL-04217',1.50,73,66,'2026-04-17 08:00:00'),('DRL-04217',1.80,76,65,'2026-04-18 08:00:00'),
('DRL-04217',1.60,74,65,'2026-04-19 08:00:00'),('DRL-04217',1.70,75,65,'2026-04-20 08:00:00'),
('DRL-04217',1.90,77,64,'2026-04-21 08:00:00'),('DRL-04217',1.80,76,64,'2026-04-22 08:00:00'),
('DRL-04217',2.00,78,64,'2026-04-23 08:00:00'),('DRL-04217',2.10,79,64,'2026-04-24 08:00:00'),
('DRL-04217',1.90,77,63,'2026-04-25 08:00:00'),('DRL-04217',2.20,80,63,'2026-04-26 08:00:00'),
('DRL-04217',2.30,81,63,'2026-04-27 08:00:00'),('DRL-04217',2.10,79,63,'2026-04-28 08:00:00'),
('DRL-04217',2.40,82,63,'2026-04-29 08:00:00'),('DRL-04217',2.30,81,62,'2026-04-30 08:00:00'),
('DRL-04217',2.50,83,62,'2026-05-01 08:00:00'),('DRL-04217',2.60,84,62,'2026-05-02 08:00:00'),
('DRL-04217',2.80,85,62,'2026-05-03 08:00:00'),('DRL-04217',2.70,84,62,'2026-05-04 08:00:00'),
('DRL-04217',2.90,86,62,'2026-05-05 08:00:00'),('DRL-04217',3.00,86,62,'2026-05-06 08:00:00'),
('DRL-04217',3.20,87,62,'2026-05-07 08:00:00'),('DRL-04217',3.50,87,62,'2026-05-08 08:00:00'),
('DRL-04217',3.70,87,62,'2026-05-09 08:00:00'),('DRL-04217',3.90,87,62,'2026-05-10 08:00:00'),
('DRL-04217',4.20,87,62,'2026-05-11 08:00:00');
