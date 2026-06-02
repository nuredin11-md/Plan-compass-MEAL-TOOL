import React, { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { 
  BarChart3, 
  ClipboardCheck, 
  FolderLock, 
  Activity,
  Award
} from "lucide-react";
import { calculateKPIScore } from "@/data";
import DashboardPanel from "../DashboardPanel";
import KPIRecordsPanel from "../KPIRecordsPanel";
import ActionPlansPanel from "../ActionPlansPanel";
import { useHospitalKpiTracker } from "@/hooks/useHospitalKpiTracker";

export default function HospitalKPITracker() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedKpiId, setSelectedKpiId] = useState<number | null>(null);

  const {
    loading,
    kpis,
    records,
    actionPlans,
    reload,
    saveRecord,
    saveActionPlan,
    deleteActionPlan,
  } = useHospitalKpiTracker();

  const handleNavigate = (tab: string, kpiId?: number) => {
    setActiveTab(tab);
    setSelectedKpiId(kpiId ?? null);
  };

  const handleUpdateActual = async (month: string, kpiId: number, actualValue: number) => {
    const kpi = kpis.find((k) => k.id === kpiId);
    if (!kpi) return;
    const { score, gap, status } = calculateKPIScore(kpi, actualValue);
    await saveRecord({
      id: `rec_${Date.now()}_${Math.random().toString(36).replace(/[^a-z0-9]+/g, "").slice(2, 11)}`,
      kpiId,
      month,
      actualValue,
      calculatedScore: score,
      gap,
      status,
    });
  };

  const handleAddMonth = (month: string) => {
    // handled by live DB records; no-op here to keep behavior from diverging
  };

  const handleResetToDefaults = () => {
    // live DB is now the source of truth; optional reset can rerun the seed migration
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
