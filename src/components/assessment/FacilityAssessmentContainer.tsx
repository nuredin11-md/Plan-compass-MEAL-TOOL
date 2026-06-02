import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import AssessmentWizard from "@/components/assessment/AssessmentWizard";
import IPCFlatScoreTool from "@/components/ipc/IPCFlatScoreTool";
import AssessmentDashboard from "@/components/assessment/AssessmentDashboard";
import { useAssessmentData } from "@/hooks/useAssessmentData";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Shield, TrendingUp, LayoutGrid, Loader2 } from "lucide-react";

type TabId = "dashboard" | "hospital-data" | "ipc-flat";

interface TabOption {
  id: TabId;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const tabs: TabOption[] = [
  {
    id: "dashboard",
    label: "Trend & Performance Dashboard",
    description: "Analytics, filters, and trend charts",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-indigo-500",
  },
  {
    id: "hospital-data",
    label: "HIS Assessment Tool",
    description: "HIS governance, data quality and M&E infrastructure audit",
    icon: <ClipboardList className="h-4 w-4" />,
    color: "text-slate-400",
  },
  {
    id: "ipc-flat",
    label: "IPC FLAT Assessment",
    description: "Infection prevention clinical audit",
    icon: <Shield className="h-4 w-4" />,
    color: "text-emerald-500",
  },
];

export default function FacilityAssessmentContainer() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);
  const { submitAssessment } = useAssessmentData();

  const activeOption = tabs.find((t) => t.id === activeTab)!;

  // Fetch past assessment sessions from Supabase (for future history view)
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("id, assessment_date, quarter, total_score, facility_id, facilities(code, name)")
        .order("assessment_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      setAssessmentHistory(data || []);
    } catch (err) {
      console.error("Failed to load assessment history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSaveChecklist = useCallback(
    async (data: any) => {
      const result = await submitAssessment(
        data.profile,
        data.responses,
        data.totalScore
      );
      if (result.success) {
        await loadHistory();
      }
      return result;
    },
    [submitAssessment, loadHistory]
  );

  return (
    <div className="space-y-4 flex flex-col h-full w-full">
      {/* Modern header with sidebar + dropdown */}
      <div className="flex items-center justify-between gap-3 bg-slate-900 text-white p-3 border border-slate-800 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="text-white hover:bg-white/10 transition-colors rounded-lg shrink-0" />
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-white uppercase">Facility Assessment Workspace</h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              IPC audits, HIS checklists, and performance analytics
            </p>
          </div>
        </div>

        {/* Dropdown tab selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-9 gap-2 border-slate-700 bg-slate-950/60 text-white hover:bg-slate-800 hover:text-white text-xs font-semibold"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-indigo-400" />
              {activeOption.label}
              <span className="ml-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                {tabs.length}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {tabs.map((tab) => (
              <DropdownMenuItem
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-start gap-3 p-3 cursor-pointer ${
                  activeTab === tab.id ? "bg-indigo-50/80" : ""
                }`}
              >
                <div className={`mt-0.5 ${tab.color}`}>{tab.icon}</div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {tab.label}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {tab.description}
                  </p>
                </div>
                {activeTab === tab.id && (
                  <span className="ml-auto text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Render selected tab */}
      <div className="flex-grow w-full select-none">
        {activeTab === "dashboard" ? (
          <AssessmentDashboard
            assessmentHistory={assessmentHistory}
            loadingHistory={loadingHistory}
            onRefresh={loadHistory}
          />
        ) : activeTab === "hospital-data" ? (
          <AssessmentWizard
            onSave={handleSaveChecklist}
            isLiveConnected
          />
        ) : (
          <IPCFlatScoreTool />
        )}
      </div>
    </div>
  );
}
