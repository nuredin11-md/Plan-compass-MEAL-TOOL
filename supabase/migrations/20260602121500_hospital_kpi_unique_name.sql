-- Fix: add unique constraint on hospital_kpi_definitions.name so seed ON CONFLICT works
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'hospital_kpi_definitions_name_key'
      AND conrelid = 'public.hospital_kpi_definitions'::regclass
  ) THEN
    ALTER TABLE public.hospital_kpi_definitions
      ADD CONSTRAINT hospital_kpi_definitions_name_key UNIQUE (name);
  END IF;
END;
$$;
