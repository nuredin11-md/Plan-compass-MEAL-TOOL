-- Hospital KPI Tracker data layer
CREATE TABLE IF NOT EXISTS public.hospital_kpi_definitions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  target NUMERIC NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1,
  type TEXT NOT NULL CHECK (type IN ('prop','cat')),
  measure TEXT,
  rules JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hospital_kpi_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id INTEGER NOT NULL REFERENCES public.hospital_kpi_definitions(id),
  month TEXT NOT NULL,
  actual_value NUMERIC NOT NULL,
  calculated_score NUMERIC,
  gap NUMERIC,
  status TEXT NOT NULL CHECK (status IN ('OK','GAP')),
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kpi_id, month)
);

CREATE TABLE IF NOT EXISTS public.hospital_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id INTEGER NOT NULL REFERENCES public.hospital_kpi_definitions(id),
  month TEXT NOT NULL,
  gap_description TEXT NOT NULL,
  root_cause TEXT,
  corrective_action TEXT,
  responsible_person TEXT,
  deadline DATE,
  progress TEXT NOT NULL DEFAULT 'Not started' CHECK (progress IN ('Not started','In progress','Completed')),
  priority TEXT CHECK (priority IN ('High','Medium','Low')),
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hospital_kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_kpi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_action_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read kpi definitions"
  ON public.hospital_kpi_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert kpi definitions"
  ON public.hospital_kpi_definitions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update kpi definitions"
  ON public.hospital_kpi_definitions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete kpi definitions"
  ON public.hospital_kpi_definitions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read kpi records"
  ON public.hospital_kpi_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert kpi records"
  ON public.hospital_kpi_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update kpi records"
  ON public.hospital_kpi_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete kpi records"
  ON public.hospital_kpi_records FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read action plans"
  ON public.hospital_action_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert action plans"
  ON public.hospital_action_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update action plans"
  ON public.hospital_action_plans FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete action plans"
  ON public.hospital_action_plans FOR DELETE TO authenticated USING (true);
