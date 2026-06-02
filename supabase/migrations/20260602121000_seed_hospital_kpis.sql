-- Seed KPI definitions for Hospital KPI Tracker
-- Run this after applying hospital_kpi_tracker migration

INSERT INTO public.hospital_kpi_definitions (name, category, target, weight, type, measure, rules)
VALUES
  ('Clinical Audit score', 'Quality', 90, 5, 'prop', 'percent', NULL),
  ('QI graduated', 'Quality', 100, 4, 'prop', 'percent', NULL),
  ('IPC FLAT score', 'Infection Prevention', 100, 4, 'cat', 'num_qi_ph', '[{"min":2,"max":999,"score":4},{"min":0,"max":1.9,"score":0}]'),
  ('Patient satisfaction', 'Quality', 88, 4, 'prop', 'percent', NULL),
  ('HAQ - 5th cycle', 'Quality', 88, 7, 'prop', 'percent', NULL),
  ('EHSIG', 'Environment', 100, 10, 'prop', 'percent', NULL),
  ('Essential laboratory tests', 'Laboratory', 100, 7, 'prop', 'percent', NULL),
  ('Imaging service interruption days', 'Imaging', 0, 3, 'cat', 'days', '[{"min":0,"max":1,"score":3},{"min":1.0001,"max":3,"score":2},{"min":3.0001,"max":9999,"score":0}]'),
  ('Major OR table efficiency/table', 'Surgery', 3, 4, 'cat', 'efficiency', '[{"min":3,"max":9999,"score":4},{"min":1.8,"max":2.9999,"score":3},{"min":1,"max":1.7999,"score":2},{"min":0,"max":0.9999,"score":1}]'),
  ('Bed occupancy rate', 'Clinical Services', 85, 5, 'cat', 'percent', '[{"min":0,"max":50,"score":0},{"min":50.0001,"max":65,"score":2},{"min":65.0001,"max":79.9,"score":3},{"min":80,"max":999,"score":5}]'),
  ('Inpatient mortality rate', 'Clinical Services', 1.8, 5, 'cat', 'percent', '[{"min":0,"max":1.8,"score":5},{"min":1.8001,"max":2.5,"score":3},{"min":2.5001,"max":999,"score":0}]'),
  ('Medical record completeness', 'Medical Records', 100, 3, 'prop', 'percent', NULL),
  ('OPD waiting time (minutes)', 'Clinical Services', 45, 2, 'cat', 'minutes', '[{"min":0,"max":45,"score":2},{"min":46,"max":50,"score":1},{"min":50.0001,"max":9999,"score":0}]'),
  ('Clients with 100% prescribed drugs filled', 'Pharmacy', 100, 4, 'prop', 'percent', NULL),
  ('GGI', 'Quality', 85, 2, 'cat', 'percent', '[{"min":85,"max":999,"score":2},{"min":80,"max":84.9999,"score":1},{"min":0,"max":79.9999,"score":0}]'),
  ('Emergency stay >24 hrs', 'Emergency', 0, 3, 'cat', 'count_zero', '[{"min":0,"max":0,"score":3},{"min":0.0001,"max":9999,"score":0}]'),
  ('Emergency mortality', 'Emergency', 0.2, 3, 'cat', 'percent', '[{"min":0,"max":0.2,"score":5},{"min":0.2001,"max":1,"score":3},{"min":1.0001,"max":999,"score":0}]'),
  ('Oxygen stockout', 'Critical Care', 0, 2, 'cat', 'days', '[{"min":0,"max":0,"score":2},{"min":0.0001,"max":999,"score":0}]'),
  ('Report completeness & timeliness', 'M&E', 100, 5, 'prop', 'percent', NULL),
  ('Average length of stay', 'Clinical Services', 5, 3, 'cat', 'days', '[{"min":0,"max":5,"score":3},{"min":5.0001,"max":7,"score":2},{"min":7.0001,"max":9999,"score":0}]')
ON CONFLICT (name) DO NOTHING;
