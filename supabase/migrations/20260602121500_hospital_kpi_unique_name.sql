-- Fix: add unique constraint on hospital_kpi_definitions.name so seed ON CONFLICT works
ALTER TABLE public.hospital_kpi_definitions
  ADD CONSTRAINT IF NOT EXISTS hospital_kpi_definitions_name_key UNIQUE (name);
