-- Seed data: 10 sample devices for the QA team
USE device_tracker;

INSERT INTO devices (model, manufacturer, os, os_version, serial_no, asset_tag, purchase_date, status, notes) VALUES
('iPhone 15 Pro', 'Apple', 'iOS', '17.4', 'SN-IP15P-001', 'QA-001', '2024-03-15', 'available', 'Primary iOS test device'),
('iPhone 13', 'Apple', 'iOS', '16.6', 'SN-IP13-002', 'QA-002', '2023-01-10', 'available', 'Older iOS baseline'),
('iPhone SE 3rd Gen', 'Apple', 'iOS', '17.2', 'SN-IPSE3-003', 'QA-003', '2023-05-20', 'available', 'Small screen iOS'),
('Galaxy S24 Ultra', 'Samsung', 'Android', '14', 'SN-GS24U-004', 'QA-004', '2024-02-01', 'available', 'Flagship Android'),
('Galaxy S21', 'Samsung', 'Android', '13', 'SN-GS21-005', 'QA-005', '2022-04-15', 'available', NULL),
('Pixel 8', 'Google', 'Android', '14', 'SN-PX8-006', 'QA-006', '2023-11-10', 'available', 'Clean Android reference'),
('Redmi Note 12', 'Xiaomi', 'Android', '13', 'SN-RMN12-007', 'QA-007', '2023-08-05', 'available', 'Low-end Android'),
('iPad Pro 12.9" M2', 'Apple', 'iOS', '17.3', 'SN-IPADP-008', 'QA-008', '2023-09-01', 'available', 'iPad for tablet testing'),
('Galaxy Tab S9', 'Samsung', 'Android', '14', 'SN-GTS9-009', 'QA-009', '2023-12-20', 'available', 'Android tablet'),
('iPhone 12 Mini', 'Apple', 'iOS', '16.5', 'SN-IP12M-010', 'QA-010', '2022-02-14', 'under_repair', 'Cracked screen — awaiting repair');
