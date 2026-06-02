-- Fix assessment numeric columns so decimal scores can be saved
ALTER TABLE public.responses
  ALTER COLUMN score_achieved TYPE NUMERIC USING score_achieved::numeric;

ALTER TABLE public.ipc_assessments
  ALTER COLUMN total_score TYPE NUMERIC USING total_score::numeric,
  ALTER COLUMN section_i_score TYPE NUMERIC USING section_i_score::numeric,
  ALTER COLUMN section_ii_score TYPE NUMERIC USING section_ii_score::numeric;
