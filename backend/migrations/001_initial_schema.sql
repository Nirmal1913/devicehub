-- QA Device Tracker — Initial Schema (MySQL 8+)
-- Run this in MySQL Workbench against a fresh database.

CREATE DATABASE IF NOT EXISTS device_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE device_tracker;

-- ---------- devices ----------
CREATE TABLE IF NOT EXISTS devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model VARCHAR(120) NOT NULL,
  manufacturer VARCHAR(80) NOT NULL,
  os ENUM('iOS', 'Android', 'Other') NOT NULL,
  os_version VARCHAR(40),
  serial_no VARCHAR(120) NOT NULL UNIQUE,
  asset_tag VARCHAR(60) NOT NULL UNIQUE,
  photo_url TEXT,
  purchase_date DATE,
  status ENUM('available', 'checked_out', 'reserved', 'under_repair', 'retired')
    NOT NULL DEFAULT 'available',
  current_holder_name VARCHAR(120),
  current_holder_email VARCHAR(160),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_devices_status (status),
  INDEX idx_devices_os (os)
) ENGINE=InnoDB;

-- ---------- checkout_requests ----------
CREATE TABLE IF NOT EXISTS checkout_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  requester_name VARCHAR(120) NOT NULL,
  requester_email VARCHAR(160) NOT NULL,
  purpose TEXT NOT NULL,
  expected_return_date DATE NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'return_pending', 'returned', 'cancelled')
    NOT NULL DEFAULT 'pending',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  approved_by VARCHAR(120),
  rejection_reason TEXT,
  return_requested_at DATETIME,
  return_approved_at DATETIME,
  actual_return_at DATETIME,
  CONSTRAINT fk_checkout_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_checkout_status (status),
  INDEX idx_checkout_device (device_id),
  INDEX idx_checkout_email (requester_email)
) ENGINE=InnoDB;

-- ---------- reservations ----------
CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  requester_name VARCHAR(120) NOT NULL,
  requester_email VARCHAR(160) NOT NULL,
  purpose TEXT NOT NULL,
  reserve_from DATE NOT NULL,
  reserve_to DATE NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')
    NOT NULL DEFAULT 'pending',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  rejection_reason TEXT,
  CONSTRAINT fk_reservation_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_reservation_status (status),
  INDEX idx_reservation_dates (device_id, reserve_from, reserve_to)
) ENGINE=InnoDB;

-- ---------- waitlist ----------
CREATE TABLE IF NOT EXISTS waitlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  requester_name VARCHAR(120) NOT NULL,
  requester_email VARCHAR(160) NOT NULL,
  purpose TEXT NOT NULL,
  position INT NOT NULL,
  status ENUM('waiting', 'notified', 'fulfilled', 'cancelled')
    NOT NULL DEFAULT 'waiting',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_waitlist_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_waitlist_device_status (device_id, status),
  INDEX idx_waitlist_email (requester_email)
) ENGINE=InnoDB;

-- ---------- health_logs ----------
CREATE TABLE IF NOT EXISTS health_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  issue_type ENUM('screen', 'battery', 'charging_port', 'buttons', 'software', 'other') NOT NULL,
  severity ENUM('minor', 'major', 'blocking') NOT NULL,
  description TEXT NOT NULL,
  reported_by_name VARCHAR(120) NOT NULL,
  reported_by_email VARCHAR(160) NOT NULL,
  reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved TINYINT(1) NOT NULL DEFAULT 0,
  resolved_at DATETIME,
  resolution_notes TEXT,
  CONSTRAINT fk_health_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_health_device (device_id),
  INDEX idx_health_unresolved (device_id, resolved, severity)
) ENGINE=InnoDB;

-- ---------- audit_log ----------
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(60) NOT NULL,
  device_id INT,
  actor_name VARCHAR(120),
  actor_email VARCHAR(160),
  details JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_device (device_id),
  INDEX idx_audit_event (event_type),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;
