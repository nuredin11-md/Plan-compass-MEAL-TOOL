import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Indicator } from "@/data/hospitalIndicators";
import type { Database } from "@/integrations/supabase/types";

// ── Public types ──────────────────────────────────────────────────────────────

export interface SubMetric {
  id: string;
  label: string;
  weight: number; // within criterion, should sum to 100
  hint?: string;
}

export interface AppraisalCriterion {
  id: string;
  name: string;
  efy: string;
  weight: number;          // overall weight 0-100
  departmentCategories: string[];
  linkedIndicatorCodes: string[];
  dataSource: "auto" | "manual";
  subMetrics: SubMetric[];
  icon: "activity" | "shield" | "clipboard" | "file";
  color: string;
  description: string;
  isActive?: boolean;
}

export interface AppraisalScore {
  id?: string;
  deptName: string;
  criterionId: string;
  subMetricId: string;
  score: number;           // 0-100
  periodKey: string;       // e.g. "2018 EFY__annual__Annual Summary"
  efy: string;
  notes?: string;
}

// ── Default seed (used as client-side fallback only) ─────────────────────────

const DEFAULT_CRITERIA: Omit<AppraisalCriterion, "id">[] = [
  {
    name: "Department Performance",
    efy: "2018 EFY",
    weight: 50,
    departmentCategories: ALL_DEPARTMENTS(),
    linkedIndicatorCodes: [],
    dataSource: "auto",
    subMetrics: [],
    icon: "activity",
    color: "#4f46e5",
    description: "Auto-calculated from Master Plan indicator achievements for the selected period",
    isActive: true,
  },
  {
    name: "Quality & Standards",
    efy: "2018 EFY",
    weight: 35,
    departmentCategories: ALL_DEPARTMENTS(),
    linkedIndicatorCodes: [],
    dataSource: "manual",
    subMetrics: [
      { id: "ehsig", label: "EHSIG Reform Score", weight: 40, hint: "Ethiopian Hospital Services Improvement Guidelines score (0-100)" },
      { id: "ipc",   label: "IPC Compliance",     weight: 30, hint: "Infection Prevention and Control audit score (0-100)" },
      { id: "ebc",   label: "EBC Utilization",    weight: 30, hint: "Evidence-Based Clinical practice utilization score (0-100)" },
    ],
    icon: "shield",
    color: "#059669",
    description: "EHSIG reform, IPC compliance, EBC utilization, and clinical quality scores",
    isActive: true,
  },
  {
    name: "Department Audit",
    efy: "2018 EFY",
    weight: 5,
    departmentCategories: ALL_DEPARTMENTS(),
    linkedIndicatorCodes: [],
    dataSource: "manual",
    subMetrics: [
      { id: "reg_completeness", label: "Registration & Chart Completeness", weight: 40, hint: "% completeness of patient registration and chart documentation" },
      { id: "ice_code",         label: "ICE Code Utilization",              weight: 30, hint: "International Classification of diseases coding accuracy (0-100)" },
      { id: "ward_safety",      label: "Ward Safety Score",                 weight: 30, hint: "Ward safety inspection score (0-100)" },
    ],
    icon: "clipboard",
    color: "#7c3aed",
    description: "Registration & chart completeness, ICE code utilization, ward safety",
    isActive: true,
  },
  {
    name: "PMT & Reporting",
    efy: "2018 EFY",
    weight: 10,
    departmentCategories: ALL_DEPARTMENTS(),
    linkedIndicatorCodes: [],
    dataSource: "manual",
    subMetrics: [
      { id: "pmt",          label: "PMT Meeting Performance", weight: 40, hint: "Performance Management Team meeting quality score (0-100)" },
      { id: "timeliness",   label: "Report Timeliness",       weight: 30, hint: "% of reports submitted on time" },
      { id: "completeness", label: "Report Completeness",     weight: 30, hint: "% completeness of submitted reports" },
    ],
    icon: "file",
    color: "#d97706",
    description: "Department-level PMT performance, report timeliness and completeness",
    isActive: true,
  },
];

function ALL_DEPARTMENTS(): string[] {
  return [
    "Maternal & Child Health", "Child Health", "EPI",
    "Surgical Services", "Hospital Utilization", "Quality & Safety",
    "Pharmacy", "Blood Bank", "Tuberculosis",
    "HIV Prevention and Control", "Non-Communicable Diseases", "Nutrition",
  ];
}

// ── Row mapper helpers ────────────────────────────────────────────────────────

function rowToCriterion(row: Database["public"]["Tables"]["appraisal_criteria"]["Row"]): AppraisalCriterion {
  return {
    id: row.id,
    name: row.name,
    efy: row.efy,
    weight: row.weight,
    departmentCategories: Array.isArray(row.department_categories) ? row.department_categories : [],
    linkedIndicatorCodes: Array.isArray(row.linked_indicator_codes) ? row.linked_indicator_codes : [],
    dataSource: (row.data_source ?? "manual") as "auto" | "manual",
    subMetrics: Array.isArray(row.sub_metrics) ? row.sub_metrics as SubMetric[] : [],
    icon: (row.icon ?? "activity") as AppraisalCriterion["icon"],
    color: row.color ?? "#4f46e5",
    description: row.description ?? "",
    isActive: row.is_active,
  };
}

function criterionToRow(c: Omit<AppraisalCriterion, "id">) {
  return {
    name: c.name,
    efy: c.efy,
    weight: c.weight,
    department_categories: c.departmentCategories,
    linked_indicator_codes: c.linkedIndicatorCodes,
    data_source: c.dataSource,
    sub_metrics: c.subMetrics,
    icon: c.icon,
    color: c.color,
    description: c.description,
    is_active: c.isActive ?? true,
  };
}

function rowToScore(row: Database["public"]["Tables"]["appraisal_scores"]["Row"]): AppraisalScore {
  return {
    id: row.id,
    deptName: row.dept_name,
    criterionId: row.criterion_id,
    subMetricId: row.sub_metric_id,
    score: row.score,
    periodKey: row.period_key,
    efy: row.efy,
    notes: row.notes ?? undefined,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAppraisalCriteria(indicators: Indicator[] = []) {
  const [criteria, setCriteria] = useState<AppraisalCriterion[]>([]);
  const [scores, setScores] = useState<AppraisalScore[]>([]);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const [loadingScores, setLoadingScores] = useState(false);
  const [selectedEFY, setSelectedEFY] = useState("2018 EFY");

  // ── Load criteria ────────────────────────────────────────────────────────

  const loadCriteria = useCallback(async () => {
    setLoadingCriteria(true);
    try {
      const { data, error } = await supabase
        .from("appraisal_criteria")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCriteria((data ?? []).map(rowToCriterion));
    } catch (err) {
      console.error("Failed to load appraisal criteria:", err);
      // Fallback: try localStorage, then seed defaults
      try {
        const cached = localStorage.getItem("plancompass_criteria_v3");
        if (cached) {
          setCriteria(JSON.parse(cached));
        } else {
          // Seed defaults client-side with generated IDs
          const seeded = DEFAULT_CRITERIA.map((c, i) => ({
            ...c,
            id: `default-${i}-${Date.now()}`,
          }));
          setCriteria(seeded);
        }
      } catch { /* Ignore parse errors */ }
    } finally {
      setLoadingCriteria(false);
    }
  }, []);

  // ── Load scores for active EFY ───────────────────────────────────────────

  const loadScores = useCallback(async (efy: string) => {
    setLoadingScores(true);
    try {
      const { data, error } = await supabase
        .from("appraisal_scores")
        .select("*")
        .eq("efy", efy);

      if (error) throw error;
      setScores((data ?? []).map(rowToScore));
    } catch (err) {
      console.error("Failed to load appraisal scores:", err);
      // Fallback localStorage
      try {
        const cached = localStorage.getItem(`plancompass_scores_${efy}`);
        if (cached) setScores(JSON.parse(cached));
      } catch { /* Ignore parse errors */ }
    } finally {
      setLoadingScores(false);
    }
  }, []);

  useEffect(() => { loadCriteria(); }, [loadCriteria]);
  useEffect(() => { loadScores(selectedEFY); }, [loadScores, selectedEFY]);

  // ── Active criteria (filtered by EFY, seeded if empty) ──────────────────

  const activeCriteria = useMemo<AppraisalCriterion[]>(() => {
    const list = criteria.filter(c => c.efy === selectedEFY && c.isActive !== false);
    if (list.length > 0) return list;
    // Seed defaults for this EFY if nothing exists
    return DEFAULT_CRITERIA.map((c, i) => ({
      ...c,
      efy: selectedEFY,
      id: `default-${i}-${selectedEFY}`,
    }));
  }, [criteria, selectedEFY]);

  // ── Scores accessors ─────────────────────────────────────────────────────

  const getScore = useCallback(
    (deptName: string, criterionId: string, subMetricId: string, periodKey: string): number => {
      const found = scores.find(
        s => s.deptName === deptName &&
             s.criterionId === criterionId &&
             s.subMetricId === subMetricId &&
             s.periodKey === periodKey
      );
      return found?.score ?? 0;
    },
    [scores]
  );

  // ── Upsert a manual score ────────────────────────────────────────────────

  const upsertScore = useCallback(async (score: Omit<AppraisalScore, "id">) => {
    // Optimistic update
    setScores(prev => {
      const idx = prev.findIndex(
        s => s.deptName === score.deptName &&
             s.criterionId === score.criterionId &&
             s.subMetricId === score.subMetricId &&
             s.periodKey === score.periodKey
      );
      if (idx >= 0) { const next = [...prev]; next[idx] = { ...prev[idx], ...score }; return next; }
      return [...prev, { ...score, id: `local-${Date.now()}` }];
    });

    // Persist localStorage as instant backup
    const efy = score.efy;
    try {
      const cached = localStorage.getItem(`plancompass_scores_${efy}`);
      const arr: AppraisalScore[] = cached ? JSON.parse(cached) : [];
      const idx = arr.findIndex(
        s => s.deptName === score.deptName &&
             s.criterionId === score.criterionId &&
             s.subMetricId === score.subMetricId &&
             s.periodKey === score.periodKey
      );
      if (idx >= 0) arr[idx] = { ...arr[idx], ...score };
      else arr.push(score);
      localStorage.setItem(`plancompass_scores_${efy}`, JSON.stringify(arr));
    } catch { /* Ignore parse errors */ }

    // Persist Supabase (best-effort, non-blocking)
    try {
      const { error } = await supabase
        .from("appraisal_scores")
        .upsert(
          {
            dept_name: score.deptName,
            criterion_id: score.criterionId,
            sub_metric_id: score.subMetricId,
            score: score.score,
            period_key: score.periodKey,
            efy: score.efy,
            notes: score.notes ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "dept_name,criterion_id,sub_metric_id,period_key" }
        );
      if (error) console.warn("Score sync warning:", error.message);
    } catch (err) {
      console.warn("Score Supabase sync failed (saved locally):", err);
    }
  }, []);

  // ── Criterion CRUD ───────────────────────────────────────────────────────

  const addCriterion = useCallback(async (criterion: Omit<AppraisalCriterion, "id">) => {
    try {
      const payload = criterionToRow(criterion);
      const { data, error } = await supabase
        .from("appraisal_criteria")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      const newCrit = rowToCriterion(data);
      setCriteria(prev => [...prev, newCrit]);
      toast.success("Criterion added");
      return newCrit;
    } catch (err) {
      console.error("addCriterion failed:", err);
      // Local fallback
      const localCrit: AppraisalCriterion = {
        ...criterion,
        id: `local-${Date.now()}`,
      };
      setCriteria(prev => [...prev, localCrit]);
      try {
        const cached = localStorage.getItem("plancompass_criteria_v3");
        const arr = cached ? JSON.parse(cached) : [];
        arr.push(localCrit);
        localStorage.setItem("plancompass_criteria_v3", JSON.stringify(arr));
      } catch { /* Ignore parse errors */ }
      toast.success("Criterion added (saved locally)");
      return localCrit;
    }
  }, []);

  const updateCriterion = useCallback(async (id: string, updates: Partial<Omit<AppraisalCriterion, "id">>) => {
    // Optimistic
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

    try {
      const payload: Database["public"]["Tables"]["appraisal_criteria"]["Update"] & { updated_at: string } = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.weight !== undefined) payload.weight = updates.weight;
      if (updates.departmentCategories !== undefined) payload.department_categories = updates.departmentCategories;
      if (updates.linkedIndicatorCodes !== undefined) payload.linked_indicator_codes = updates.linkedIndicatorCodes;
      if (updates.dataSource !== undefined) payload.data_source = updates.dataSource;
      if (updates.subMetrics !== undefined) payload.sub_metrics = updates.subMetrics as unknown[];
      if (updates.icon !== undefined) payload.icon = updates.icon;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.description !== undefined) payload.description = updates.description;

      const { error } = await supabase
        .from("appraisal_criteria")
        .update(payload)
        .eq("id", id);

      if (error) throw error;
      toast.success("Criterion updated");
    } catch (err) {
      console.warn("updateCriterion sync failed (kept local):", err);
      // Save local state to localStorage as backup
      setCriteria(prev => {
        localStorage.setItem("plancompass_criteria_v3", JSON.stringify(prev));
        return prev;
      });
      toast.success("Criterion updated (saved locally)");
    }
  }, []);

  const deleteCriterion = useCallback(async (id: string) => {
    setCriteria(prev => prev.filter(c => c.id !== id));
    try {
      const { error } = await supabase
        .from("appraisal_criteria")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success("Criterion removed");
    } catch (err) {
      console.warn("deleteCriterion sync failed (removed locally):", err);
      toast.success("Criterion removed (locally)");
    }
  }, []);

  // ── Available indicators helper ──────────────────────────────────────────

  const availableIndicatorsForDepts = useCallback(
    (deptNames: string[]) =>
      !deptNames || deptNames.length === 0
        ? indicators
        : indicators.filter(ind => deptNames.includes(ind.programArea)),
    [indicators]
  );

  return {
    // criteria
    criteria,
    activeCriteria,
    loadingCriteria,
    loadingScores,
    selectedEFY,
    setSelectedEFY,
    addCriterion,
    updateCriterion,
    deleteCriterion,
    reloadCriteria: loadCriteria,
    availableIndicatorsForDepts,
    // scores
    scores,
    getScore,
    upsertScore,
    reloadScores: () => loadScores(selectedEFY),
  };
}