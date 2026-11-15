-- Astronaut Health Monitor: paste this whole file in phpMyAdmin > SQL tab > Go
CREATE DATABASE IF NOT EXISTS astronaut_health CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE astronaut_health;

-- Astronaut Health Monitor - MySQL / MariaDB schema
-- phpMyAdmin: create a database (e.g. "astronaut_health", collation utf8mb4_unicode_ci),
-- select it in the left menu, open the "Import" tab and choose this file.
-- (The server also creates these tables by itself on first start if they are missing.)

CREATE TABLE IF NOT EXISTS astronauts (
  id                  VARCHAR(32)  NOT NULL,
  name                VARCHAR(80)  NOT NULL,
  email               VARCHAR(190) NOT NULL,
  role                VARCHAR(40)  NOT NULL,
  password_hash       VARCHAR(100) NOT NULL,
  mission_env         VARCHAR(20)  NOT NULL DEFAULT 'station',
  age                 SMALLINT     NULL,
  height_cm           SMALLINT     NULL,
  weight_kg           SMALLINT     NULL,
  emergency_name      VARCHAR(60)  NOT NULL DEFAULT '',
  emergency_phone     VARCHAR(30)  NOT NULL DEFAULT '',
  notes               VARCHAR(300) NOT NULL DEFAULT '',
  reset_code_hash     VARCHAR(64)  NULL,
  reset_expires_at    BIGINT       NULL,
  reset_attempts      INT          NOT NULL DEFAULT 0,
  last_alert_email_at BIGINT       NOT NULL DEFAULT 0,
  last_weekly_email_at BIGINT      NOT NULL DEFAULT 0,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_astronauts_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per saved set of readings. The newest row is the astronaut's current state.
-- groups_updated: which groups the astronaut really measured ("vitals,environment,wellbeing"),
--                 '' = starting values of a new account, 'scenario' = simulator button.
CREATE TABLE IF NOT EXISTS health_readings (
  id                        BIGINT      NOT NULL AUTO_INCREMENT,
  astronaut_id              VARCHAR(32) NOT NULL,
  recorded_at               DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  groups_updated            VARCHAR(60) NOT NULL DEFAULT '',
  heart_rate_bpm            DOUBLE NOT NULL,
  blood_pressure_sys        DOUBLE NOT NULL,
  blood_pressure_dia        DOUBLE NOT NULL,
  spo2_percent              DOUBLE NOT NULL,
  core_body_temp_c          DOUBLE NOT NULL,
  cabin_co2_ppm             DOUBLE NOT NULL,
  cabin_pressure_kpa        DOUBLE NOT NULL,
  daily_radiation_msv       DOUBLE NOT NULL,
  accumulated_radiation_msv DOUBLE NOT NULL,
  sleep_hours_last_24h      DOUBLE NOT NULL,
  sleep_quality_percent     DOUBLE NOT NULL,
  fatigue_level             VARCHAR(10) NOT NULL,
  isolation_stress_score    DOUBLE NOT NULL,
  health_score              SMALLINT    NOT NULL,
  overall_status            VARCHAR(10) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_readings_astronaut_time (astronaut_id, recorded_at),
  CONSTRAINT fk_readings_astronaut FOREIGN KEY (astronaut_id) REFERENCES astronauts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS symptoms (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  astronaut_id VARCHAR(32)  NOT NULL,
  logged_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  symptom      VARCHAR(40)  NOT NULL,
  label        VARCHAR(80)  NOT NULL,
  severity     TINYINT      NOT NULL,
  note         VARCHAR(300) NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  KEY idx_symptoms_astronaut_time (astronaut_id, logged_at),
  CONSTRAINT fk_symptoms_astronaut FOREIGN KEY (astronaut_id) REFERENCES astronauts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
