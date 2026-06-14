import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Supabase types don't include ward_setups yet; use generic Row type
type WardSetupRow = {
  id: string;
  ward_name: string;
  period_key: string;
  efy: string;
  indicator_codes: string[] | null;
  created_at: string | null;
  updated_at: string | null;
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WardSetup {
  id?: string;
  wardName: string;
  periodKey: string;
  efy: string;
  indicatorCodes: string[];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWardSetups() {
  const [setups, setSetups] = useState<WardSetup[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Load all setups ──────────────────────────────────────────────────────
  const loadSetups = useCallback(async (efy: string) => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("ward_setups")
        .select("*")
        .eq("efy", efy)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setSetups(
        (data ?? []).map((row: WardSetupRow) => ({
          id: row.id,
          wardName: row.ward_name,
          periodKey: row.period_key,
          efy: row.efy,
          indicatorCodes: Array.isArray(row.indicator_codes) ? row.indicator_codes : [],
        }))
      );
    } catch (err) {
      console.error("Failed to load ward setups:", err);
      // Fallback: localStorage
      try {
        const cached = localStorage.getItem(`plancompass_ward_setups_${efy}`);
        if (cached) setSetups(JSON.parse(cached));
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Upsert a ward setup ──────────────────────────────────────────────────
  const upsertSetup = useCallback(async (setup: WardSetup) => {
    // Optimistic local update
    setSetups(prev => {
      const idx = prev.findIndex(
        s => s.wardName === setup.wardName && s.periodKey === setup.periodKey
      );
      const next = [...prev];
      if (idx >= 0) next[idx] = { ...next[idx], ...setup };
      else next.push({ ...setup, id: `local-${Date.now()}` });
      // Persist to localStorage
      try {
        localStorage.setItem(
          `plancompass_ward_setups_${setup.efy}`,
          JSON.stringify(next)
        );
      } catch {}
      return next;
    });

    // Supabase upsert (best-effort)
    try {
      const { error } = await (supabase as any)
        .from("ward_setups")
        .upsert(
          {
            ward_name: setup.wardName,
            period_key: setup.periodKey,
            efy: setup.efy,
            indicator_codes: setup.indicatorCodes,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "ward_name,period_key" }
        );
      if (error) console.warn("Ward setup sync warning:", error.message);
    } catch (err) {
      console.warn("Ward setup Supabase sync failed (saved locally):", err);
    }
  }, []);

  // ── Remove a ward setup ──────────────────────────────────────────────────
  const removeSetup = useCallback(async (wardName: string, periodKey: string, efy: string) => {
    setSetups(prev => {
      const next = prev.filter(
        s => !(s.wardName === wardName && s.periodKey === periodKey)
      );
      try {
        localStorage.setItem(`plancompass_ward_setups_${efy}`, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      await (supabase as any)
        .from("ward_setups")
        .delete()
        .eq("ward_name", wardName)
        .eq("period_key", periodKey);
    } catch (err) {
      console.warn("Ward setup delete sync failed:", err);
    }
  }, []);

  // ── Get setup for a specific ward + period ───────────────────────────────
  const getSetup = useCallback(
    (wardName: string, periodKey: string): WardSetup | undefined =>
      setups.find(s => s.wardName === wardName && s.periodKey === periodKey),
    [setups]
  );

  // ── Get all configured wards for a period ───────────────────────────────
  const getWardsForPeriod = useCallback(
    (periodKey: string): WardSetup[] =>
      setups.filter(s => s.periodKey === periodKey),
    [setups]
  );

  return {
    setups,
    loading,
    loadSetups,
    upsertSetup,
    removeSetup,
    getSetup,
    getWardsForPeriod,
  };
}