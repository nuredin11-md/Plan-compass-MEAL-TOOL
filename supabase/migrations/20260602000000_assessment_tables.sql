-- Facility Assessment workspace: missing tables

-- Static checklist reference items (A1, A2, B1...)
CREATE TABLE IF NOT EXISTS public.assessment_items (
  id TEXT PRIMARY KEY,
  section_name TEXT NOT NULL,
  item_description TEXT NOT NULL,
  weighting NUMERIC DEFAULT 0,
  max_score INTEGER NOT NULL,
  guide_notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Hospital / facility profiles
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  region TEXT,
  zone TEXT,
  woreda TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Assessment sessions (one record per checklist submission)
CREATE TABLE IF NOT EXISTS public.assessments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  facility_id UUID NOT NULL REFERENCES public.facilities(id),
  assessment_date DATE NOT NULL,
  quarter TEXT NOT NULL,
  total_score NUMERIC,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Individual item responses per assessment
CREATE TABLE IF NOT EXISTS public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id TEXT NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  score_achieved NUMERIC NOT NULL DEFAULT 0,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assessment_id, item_id)
);

-- IPC FLAT assessment records
CREATE TABLE IF NOT EXISTS public.ipc_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_name TEXT NOT NULL,
  hospital_location TEXT,
  assessment_date DATE NOT NULL,
  assessor_names TEXT,
  total_score INTEGER,
  score_percentage NUMERIC,
  section_i_score INTEGER,
  section_ii_score INTEGER,
  responses JSONB DEFAULT '{}',
  hospital_profile JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.assessment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipc_assessments ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Authenticated users can read assessment_items" ON public.assessment_items;
CREATE POLICY "Authenticated users can read assessment_items" ON public.assessment_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can read facilities" ON public.facilities;
CREATE POLICY "Authenticated users can read facilities" ON public.facilities FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert facilities" ON public.facilities;
CREATE POLICY "Authenticated users can insert facilities" ON public.facilities FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update facilities" ON public.facilities;
CREATE POLICY "Authenticated users can update facilities" ON public.facilities FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can read assessments" ON public.assessments;
CREATE POLICY "Authenticated users can read assessments" ON public.assessments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert assessments" ON public.assessments;
CREATE POLICY "Authenticated users can insert assessments" ON public.assessments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update assessments" ON public.assessments;
CREATE POLICY "Authenticated users can update assessments" ON public.assessments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can read responses" ON public.responses;
CREATE POLICY "Authenticated users can read responses" ON public.responses FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert responses" ON public.responses;
CREATE POLICY "Authenticated users can insert responses" ON public.responses FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update responses" ON public.responses;
CREATE POLICY "Authenticated users can update responses" ON public.responses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can read ipc_assessments" ON public.ipc_assessments;
CREATE POLICY "Authenticated users can read ipc_assessments" ON public.ipc_assessments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert ipc_assessments" ON public.ipc_assessments;
CREATE POLICY "Authenticated users can insert ipc_assessments" ON public.ipc_assessments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update ipc_assessments" ON public.ipc_assessments;
CREATE POLICY "Authenticated users can update ipc_assessments" ON public.ipc_assessments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
