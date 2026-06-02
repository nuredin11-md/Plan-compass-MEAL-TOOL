CREATE TABLE IF NOT EXISTS public.appraisal_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  efy TEXT NOT NULL,
  weight INTEGER NOT NULL CHECK (weight > 0 AND weight <= 100),
  department_categories TEXT[] NOT NULL DEFAULT '{}',
  linked_indicator_codes TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appraisal_criteria_efy ON public.appraisal_criteria USING btree (efy);
CREATE INDEX IF NOT EXISTS idx_appraisal_criteria_active ON public.appraisal_criteria USING btree (is_active);

ALTER TABLE public.appraisal_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage appraisal criteria"
  ON public.appraisal_criteria
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
