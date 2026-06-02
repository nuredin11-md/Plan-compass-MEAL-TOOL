import React, { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { 
  BarChart3, 
  ClipboardCheck, 
  FolderLock, 
  ArrowLeft,
  Activity,
  Award,
  Inbox
} from "lucide-react";
import { 
  INITIAL_KPIS, 
  calculateKPIScore 
} from "../../data";
import { KPIDefinition, KPIRecord, ActionPlan } from "../../types";

import DashboardPanel from "../DashboardPanel";
import KPIRecordsPanel from "../KPIRecordsPanel";
import ActionPlansPanel from "../ActionPlansPanel";

export default function HospitalKPITracker() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedKpiId, setSelectedKpiId] = useState<number | null>(null);

  const [kpis, setKpis] = useState<KPIDefinition[]>([]);
  const [records, setRecords] = useState<KPIRecord[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("hospital_kpi_records");
    if (saved) {
      try { setRecords(JSON.parse(saved)); } catch {}
    }

    const savedPlans = localStorage.getItem("hospital_action_plans");
    if (savedPlans) {
      try { setActionPlans(JSON.parse(savedPlans)); } catch {}
    }
  }, []);

  // Handlers
  const handleNavigate = (tab: string, kpiId?: number) => {
    setActiveTab(tab);
    if (kpiId !== undefined) {
      setSelectedKpiId(kpiId);
    } else {
      setSelectedKpiId(null);
    }
  };

  const handleUpdateActual = async (record: KPIRecord) => {
    const kpi = kpis.find((k) => k.id === record.kpiId);
    if (!kpi) return;
    const { score, gap, status } = calculateKPIScore(kpi, record.actualValue);
    const updated: KPIRecord = {
      ...record,
      calculatedScore: score,
      gap,
      status,
    };
    setRecords((prev) => {
      const next = [...prev];
      const idx = next.findIndex((r) => r.kpiId === updated.kpiId && updated.month && r.month === updated.month);
      if (idx > -1) next[idx] = updated;
      else next.unshift(updated);
      localStorage.setItem("hospital_kpi_records", JSON.stringify(next));
      return next;
    });
  };

  const handleAddMonth = (month: string) => {
    setRecords(prev => {
      const exists = prev.some(r => r.month === month);
      if (exists) return prev;

      const newRecords: KPIRecord[] = kpis.map(kpi => {
        const actual = 0;
        const { score, gap, status } = calculateKPIScore(kpi, actual);
        return {
          id: `rec_${Date.now()}_${kpi.id}`,
          kpiId: kpi.id,
          month,
          actualValue: actual,
          calculatedScore: score,
          gap,
          status
        };
      });

      const next = [...prev, ...newRecords];
      localStorage.setItem("hospital_kpi_records", JSON.stringify(next));
      return next;
    });
  };

  const handleResetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all data back to the default hospital figures? This deletes your changes.")) {
      setRecords([]);
      setActionPlans([]);
      localStorage.removeItem("hospital_kpi_records");
      localStorage.removeItem("hospital_action_plans");
    }
  };

  const handleSaveActionPlan = (plan: ActionPlan) => {
    setActionPlans(prev => {
      const existsIdx = prev.findIndex(p => p.id === plan.id || (p.kpiId === plan.kpiId && p.month === plan.month));
      if (existsIdx > -1) {
        const updated = [...prev];
        updated[existsIdx] = plan;
        localStorage.setItem("hospital_action_plans", JSON.stringify(updated));
        return updated;
      } else {
        const next = [...prev, plan];
        localStorage.setItem("hospital_action_plans", JSON.stringify(next));
        return next;
      }
    });
  };

  const handleDeleteActionPlan = (id: string) => {
    setActionPlans(prev => {
      const next = prev.filter(p => p.id !== id);
      localStorage.setItem("hospital_action_plans", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <header className="sticky top-0 z-40 w-full border-b bg-[#2aa13c] px-6 py-4 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-slate-800 hover:bg-slate-100 transition-colors rounded-lg mr-1" />
            <div className="bg-emerald-500 text-white p-2 rounded-lg">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hospital KPI & Quality Tracker</h1>
              <p className="text-xs text-muted-foreground">National Clinical Performance M&E Tool</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => handleNavigate("dashboard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "dashboard"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Dashboard
            </button>
            <button
              onClick={() => handleNavigate("records")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "records"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              KPI Records
            </button>
            <button
              onClick={() => handleNavigate("actions")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "actions"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              Action Plans
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden">
        {activeTab === "dashboard" && (
          <DashboardPanel
            kpis={kpis}
            records={records}
            actionPlans={actionPlans}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === "records" && (
          <KPIRecordsPanel
            kpis={kpis}
            records={records}
            onUpdateActual={saveRecord}
            onReload={reload}
            loading={loading}
          />
        )}

        {activeTab === "actions" && (
          <ActionPlansPanel
            kpis={kpis}
            records={records}
            actionPlans={actionPlans}
            initialSelectedKpiId={selectedKpiId}
            onSaveActionPlan={saveActionPlan}
            onDeleteActionPlan={deleteActionPlan}
            onReload={reload}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
}
