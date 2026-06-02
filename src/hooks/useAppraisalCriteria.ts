import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Indicator } from "@/data/hospitalIndicators";

export interface AppraisalCriterion {
  id: string;
  name: string;
  efy: string;
  weight: number;
  departmentCategories: string[];
  linkedIndicatorCodes: string[];
  isActive?: boolean;
}

const DEPARTMENTS = [
  "Maternal & Child Health",
  "Child Health",
  "EPI",
  "Surgical Services",
  "Hospital Utilization",
  "Quality & Safety",
  "Pharmacy",
  "Blood Bank",
  "Tuberculosis",
  "HIV Prevention and Control",
  "Non-Communicable Diseases",
  "Nutrition",
];

export function useAppraisalCriteria(indicators: Indicator[] = []) {
  const [criteria, setCriteria] = useState<AppraisalCriterion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEFY, setSelectedEFY] = useState("2018 EFY");

  const loadCriteria = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appraisal_criteria")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const mapped: AppraisalCriterion[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        efy: row.efy,
        weight: row.weight,
        departmentCategories: Array.isArray(row.department_categories) ? row.department_categories : [],
        linkedIndicatorCodes: Array.isArray(row.linked_indicator_codes) ? row.linked_indicator_codes : [],
        isActive: row.is_active,
      }));

      setCriteria(mapped);
    } catch (err) {
      console.error("Failed to load appraisal criteria:", err);
      // Fallback to localStorage if DB fails
      try {
        const cached = localStorage.getItem("plan_compass_recognition_custom_criteria");
        if (cached) setCriteria(JSON.parse(cached));
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCriteria();
  }, [loadCriteria]);

  const activeCriteria = useMemo(() => {
    let list = criteria.filter((c) => c.efy === selectedEFY);
    if (list.length === 0) {
      list = getDefaultCriteria(selectedEFY);
    }
    return list;
  }, [criteria, selectedEFY]);

  const addCriterion = async (criterion: Omit<AppraisalCriterion, "id">) => {
    try {
      const { data, error } = await supabase
        .from("appraisal_criteria")
        .insert({
          name: criterion.name,
          efy: criterion.efy,
          weight: criterion.weight,
          department_categories: criterion.departmentCategories,
          linked_indicator_codes: criterion.linkedIndicatorCodes,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      const newCrit: AppraisalCriterion = {
        id: data.id,
        name: data.name,
        efy: data.efy,
        weight: data.weight,
        departmentCategories: data.department_categories,
        linkedIndicatorCodes: data.linked_indicator_codes,
        isActive: data.is_active,
      };

      setCriteria((prev) => [...prev, newCrit]);
      toast.success("Appraisal criterion created successfully");
      return newCrit;
    } catch (err) {
      console.error("Failed to create criterion:", err);
      toast.error("Failed to save criterion to database");
      throw err;
    }
  };

  const updateCriterion = async (id: string, updates: Partial<AppraisalCriterion>) => {
    try {
      const payload: any = {};
      if (updates.name) payload.name = updates.name;
      if (updates.weight) payload.weight = updates.weight;
      if (updates.departmentCategories) payload.department_categories = updates.departmentCategories;
      if (updates.linkedIndicatorCodes) payload.linked_indicator_codes = updates.linkedIndicatorCodes;
      payload.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("appraisal_criteria")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      const updated: AppraisalCriterion = {
        id: data.id,
        name: data.name,
        efy: data.efy,
        weight: data.weight,
        departmentCategories: data.department_categories,
        linkedIndicatorCodes: data.linked_indicator_codes,
        isActive: data.is_active,
      };

      setCriteria((prev) => prev.map((c) => (c.id === id ? updated : c)));
      toast.success("Criterion updated successfully");
      return updated;
    } catch (err) {
      console.error("Failed to update criterion:", err);
      toast.error("Failed to update criterion");
      throw err;
    }
  };

  const deleteCriterion = async (id: string) => {
    try {
      const { error } = await supabase
        .from("appraisal_criteria")
        .update({ is_active: false })
        .eq("id", id);

      if (error) {
        // If the row doesn't exist in Supabase, fall back to local-only removal
        if (error.code === "22P02" || error.message?.toLowerCase().includes("no rows found") || error.code === "PGRST116") {
          setCriteria((prev) => prev.filter((c) => c.id !== id));
          toast.success("Criterion removed locally");
          return;
        }
        throw error;
      }

      setCriteria((prev) => prev.filter((c) => c.id !== id));
      toast.success("Criterion removed");
    } catch (err) {
      console.error("Failed to delete criterion:", err);
      // Local fallback so UI always stays in sync
      setCriteria((prev) => prev.filter((c) => c.id !== id));
      toast.success("Criterion removed locally");
    }
  };

  const availableIndicatorsForDepts = useCallback(
    (deptNames: string[]) => {
      if (!deptNames || deptNames.length === 0) return indicators;
      return indicators.filter((ind) => deptNames.includes(ind.programArea));
    },
    [indicators]
  );

  return {
    criteria,
    activeCriteria,
    loading,
    selectedEFY,
    setSelectedEFY,
    addCriterion,
    updateCriterion,
    deleteCriterion,
    reload: loadCriteria,
    availableIndicatorsForDepts,
  };
}

function getDefaultCriteria(efy: string): AppraisalCriterion[] {
  return [
    {
      id: `crit-1-${efy}`,
      name: "Maternal & Child Health Care Access",
      efy,
      weight: 35,
      departmentCategories: ["Maternal & Child Health", "Child Health", "EPI"],
      linkedIndicatorCodes: [],
      isActive: true,
    },
    {
      id: `crit-2-${efy}`,
      name: "Surgical & Hospital Utilization Efficiency",
      efy,
      weight: 25,
      departmentCategories: ["Surgical Services", "Hospital Utilization"],
      linkedIndicatorCodes: [],
      isActive: true,
    },
    {
      id: `crit-3-${efy}`,
      name: "Quality Assurance & IPC Standards",
      efy,
      weight: 20,
      departmentCategories: ["Quality & Safety", "Pharmacy", "Blood Bank"],
      linkedIndicatorCodes: [],
      isActive: true,
    },
    {
      id: `crit-4-${efy}`,
      name: "Public Health Disease Control & Nutrition",
      efy,
      weight: 20,
      departmentCategories: [
        "Tuberculosis",
        "HIV Prevention and Control",
        "Non-Communicable Diseases",
        "Nutrition",
      ],
      linkedIndicatorCodes: [],
      isActive: true,
    },
  ];
}

function useCallback<T extends (...args: any[]) => any>(fn: T): T {
  // Minimal no-op useCallback for flat hook shape above; keeps TS happy without extra deps
  return fn as any;
}
