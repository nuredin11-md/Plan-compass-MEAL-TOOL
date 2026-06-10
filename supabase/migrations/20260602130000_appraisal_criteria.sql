-- ============================================================
-- Migration: Recognition Board v2
-- Adds sub_metrics + data_source to appraisal_criteria
-- Creates appraisal_scores table for manual entries
-- Run this once in Supabase SQL Editor
-- ============================================================

-- 1. Extend appraisal_criteria table
ALTER TABLE public.appraisal_criteria
  ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (data_source IN ('auto', 'manual')),
  ADD COLUMN IF NOT EXISTS sub_metrics JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT 'activity',
  ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#4f46e5',
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';

-- 2. Create appraisal_scores table for manual sub-metric entries
CREATE TABLE IF NOT EXISTS public.appraisal_scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dept_name   TEXT NOT NULL,
  criterion_id UUID NOT NULL REFERENCES public.appraisal_criteria(id) ON DELETE CASCADE,
  sub_metric_id TEXT NOT NULL,
  score       INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  period_key  TEXT NOT NULL,   -- e.g. "2018 EFY__annual__Annual Summary"
  efy         TEXT NOT NULL,
  notes       TEXT,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),

  -- One score per dept+criterion+sub_metric+period
  UNIQUE (dept_name, criterion_id, sub_metric_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_appraisal_scores_period
  ON public.appraisal_scores USING btree (period_key);

CREATE INDEX IF NOT EXISTS idx_appraisal_scores_dept
  ON public.appraisal_scores USING btree (dept_name);

CREATE INDEX IF NOT EXISTS idx_appraisal_scores_criterion
  ON public.appraisal_scores USING btree (criterion_id);

-- 3. RLS for appraisal_scores
ALTER TABLE public.appraisal_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage appraisal scores"
  ON public.appraisal_scores
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Seed the 4 default criteria for 2018 EFY (run only if table is empty)
-- You can re-run safely; ON CONFLICT does nothing.
INSERT INTO public.appraisal_criteria
  (name, efy, weight, department_categories, linked_indicator_codes,
   data_source, sub_metrics, icon, color, description, is_active)
VALUES
(
  'Department Performance',
  '2018 EFY', 50,
  ARRAY['Maternal & Child Health','Child Health','EPI','Surgical Services',
        'Hospital Utilization','Quality & Safety','Pharmacy','Blood Bank',
        'Tuberculosis','HIV Prevention and Control',
        'Non-Communicable Diseases','Nutrition'],
  '{}',
  'auto', '[]', 'activity', '#4f46e5',
  'Auto-calculated from Master Plan indicator achievements for the selected period',
  true
),
(
  'Quality & Standards',
  '2018 EFY', 35,
  ARRAY['Maternal & Child Health','Child Health','EPI','Surgical Services',
        'Hospital Utilization','Quality & Safety','Pharmacy','Blood Bank',
        'Tuberculosis','HIV Prevention and Control',
        'Non-Communicable Diseases','Nutrition'],
  '{}',
  'manual',
  '[
    {"id":"ehsig",  "label":"EHSIG Reform Score",  "weight":40,
     "hint":"Ethiopian Hospital Services Improvement Guidelines score (0-100)"},
    {"id":"ipc",    "label":"IPC Compliance",       "weight":30,
     "hint":"Infection Prevention and Control audit score (0-100)"},
    {"id":"ebc",    "label":"EBC Utilization",      "weight":30,
     "hint":"Evidence-Based Clinical practice utilization score (0-100)"}
  ]'::jsonb,
  'shield', '#059669',
  'EHSIG reform, IPC compliance, EBC utilization, and clinical quality scores',
  true
),
(
  'Department Audit',
  '2018 EFY', 5,
  ARRAY['Maternal & Child Health','Child Health','EPI','Surgical Services',
        'Hospital Utilization','Quality & Safety','Pharmacy','Blood Bank',
        'Tuberculosis','HIV Prevention and Control',
        'Non-Communicable Diseases','Nutrition'],
  '{}',
  'manual',
  '[
    {"id":"reg_completeness", "label":"Registration & Chart Completeness", "weight":40,
     "hint":"% completeness of patient registration and chart documentation"},
    {"id":"ice_code",         "label":"ICE Code Utilization",              "weight":30,
     "hint":"International Classification of diseases coding accuracy (0-100)"},
    {"id":"ward_safety",      "label":"Ward Safety Score",                 "weight":30,
     "hint":"Ward safety inspection score (0-100)"}
  ]'::jsonb,
  'clipboard', '#7c3aed',
  'Registration & chart completeness, ICE code utilization, ward safety',
  true
),
(
  'PMT & Reporting',
  '2018 EFY', 10,
  ARRAY['Maternal & Child Health','Child Health','EPI','Surgical Services',
        'Hospital Utilization','Quality & Safety','Pharmacy','Blood Bank',
        'Tuberculosis','HIV Prevention and Control',
        'Non-Communicable Diseases','Nutrition'],
  '{}',
  'manual',
  '[
    {"id":"pmt",          "label":"PMT Meeting Performance", "weight":40,
     "hint":"Performance Management Team meeting quality score (0-100)"},
    {"id":"timeliness",   "label":"Report Timeliness",       "weight":30,
     "hint":"% of reports submitted on time"},
    {"id":"completeness", "label":"Report Completeness",     "weight":30,
     "hint":"% completeness of submitted reports"}
  ]'::jsonb,
  'file', '#d97706',
  'Department-level PMT performance, report timeliness and completeness',
  true
)
ON CONFLICT DO NOTHING;