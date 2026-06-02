import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface KpiDefinition {
  id?: number;
  name: string;
  category?: string | null;
  target: number;
  weight: number;
  type: "prop" | "cat";
  measure?: string | null;
  rules?: any | null;
}

export interface KpiRecord {
  id?: string;
  kpiId: number;
  month: string;
  actualValue: number;
  calculatedScore?: number | null;
  gap?: number | null;
  status?: "OK" | "GAP";
}

export interface ActionPlan {
  id?: string;
  kpiId: number;
  month: string;
  gapDescription: string;
  rootCause?: string | null;
  correctiveAction?: string | null;
  responsiblePerson?: string | null;
  deadline?: string | null;
  progress?: "Not started" | "In progress" | "Completed";
  priority?: "High" | "Medium" | "Low" | null;
}

export function useHospitalKpiTracker() {
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState<KpiDefinition[]>([]);
  const [records, setRecords] = useState<KpiRecord[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiRes, recRes, planRes] = await Promise.all([
        supabase.from("hospital_kpi_definitions").select("*").order("id", { ascending: true }),
        supabase.from("hospital_kpi_records").select("*").order("month", { ascending: false }),
        supabase.from("hospital_action_plans").select("*").order("created_at", { ascending: false }),
      ]);

      if (kpiRes.error) throw kpiRes.error;
      if (recRes.error) throw recRes.error;
      if (planRes.error) throw planRes.error;

      setKpis(kpiRes.data || []);
      setRecords(
        (recRes.data || []).map((r: any) => ({
          id: r.id,
          kpiId: r.kpi_id,
          month: r.month,
          actualValue: Number(r.actual_value),
          calculatedScore: r.calculated_score != null ? Number(r.calculated_score) : null,
          gap: r.gap != null ? Number(r.gap) : null,
          status: r.status === "OK" ? "OK" : "GAP",
        }))
      );
      setActionPlans(
        (planRes.data || []).map((p: any) => ({
          id: p.id,
          kpiId: p.kpi_id,
          month: p.month,
          gapDescription: p.gap_description,
          rootCause: p.root_cause,
          correctiveAction: p.corrective_action,
          responsiblePerson: p.responsible_person,
          deadline: p.deadline,
          progress: p.progress,
          priority: p.priority,
        }))
      );
    } catch (err) {
      console.error("Failed to load hospital KPI tracker data:", err);
      toast.error("Failed to load KPI data from database");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const saveRecord = useCallback(async (record: KpiRecord) => {
    setLoading(true);
    try {
      const payload = {
        kpi_id: record.kpiId,
        month: record.month,
        actual_value: record.actualValue,
        calculated_score: record.calculatedScore,
        gap: record.gap,
        status: record.status,
      };

      const { data, error } = await supabase
        .from("hospital_kpi_records")
        .upsert(payload, { onConflict: "kpi_id,month" })
        .select()
        .single();

      if (error) throw error;

      setRecords((prev) => {
        const next = [...prev];
        const idx = next.findIndex((r) => r.kpiId === record.kpiId && r.month === record.month);
        const mapped = {
          id: data.id,
          kpiId: data.kpi_id,
          month: data.month,
          actualValue: Number(data.actual_value),
          calculatedScore: data.calculated_score != null ? Number(data.calculated_score) : null,
          gap: data.gap != null ? Number(data.gap) : null,
          status: data.status === "OK" ? "OK" : "GAP",
        };
        if (idx > -1) next[idx] = mapped;
        else next.unshift(mapped);
        return next;
      });

      return mapped;
    } catch (err) {
      console.error("Failed to save KPI record:", err);
      toast.error("Failed to save KPI record");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveActionPlan = useCallback(async (plan: ActionPlan) => {
    setLoading(true);
    try {
      const payload = {
        kpi_id: plan.kpiId,
        month: plan.month,
        gap_description: plan.gapDescription,
        root_cause: plan.rootCause,
        corrective_action: plan.correctiveAction,
        responsible_person: plan.responsiblePerson,
        deadline: plan.deadline,
        progress: plan.progress,
        priority: plan.priority,
      };

      const { data, error } = await supabase
        .from("hospital_action_plans")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;

      setActionPlans((prev) => {
        const next = [...prev];
        const idx = next.findIndex((p) => p.id === plan.id);
        const mapped = {
          id: data.id,
          kpiId: data.kpi_id,
          month: data.month,
          gapDescription: data.gap_description,
          rootCause: data.root_cause,
          correctiveAction: data.corrective_action,
          responsiblePerson: data.responsible_person,
          deadline: data.deadline,
          progress: data.progress,
          priority: data.priority,
        };
        if (idx > -1) next[idx] = mapped;
        else next.unshift(mapped);
        return next;
      });

      toast.success("Action plan saved");
    } catch (err) {
      console.error("Failed to save action plan:", err);
      toast.error("Failed to save action plan");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteActionPlan = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("hospital_action_plans").delete().eq("id", id);
      if (error) throw error;
      setActionPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete action plan:", err);
      toast.error("Failed to delete action plan");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    kpis,
    records,
    actionPlans,
    reload: loadAll,
    saveRecord,
    saveActionPlan,
    deleteActionPlan,
  };
}
