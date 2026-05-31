import React, { useState } from "react";
import { ClipboardList, Shield, TrendingUp } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import AssessmentWizard from "@/components/assessment/AssessmentWizard";
import IPCFlatScoreTool from "@/components/ipc/IPCFlatScoreTool";
import AssessmentDashboard from "@/components/assessment/AssessmentDashboard";

export default function FacilityAssessmentContainer() {
  const [activeSubTab, setActiveSubTab] = useState<"hospital-data" | "ipc-flat" | "trend-dashboard">("trend-dashboard");

  return (
    <div className="space-y-6 flex flex-col h-full w-full">
      {/* Unified sub-tab top selection bar with sidebar controller */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-slate-900 text-white p-4 border border-slate-800 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="text-white hover:bg-white/10 transition-colors rounded-lg shrink-0" />
          <div className="h-8 w-px bg-slate-800 hidden md:block"></div>
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-white uppercase">Facility Assessment Workspace</h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Toggle between audit checklists, clinical IPC tracking, and visual trend analytics</p>
          </div>
        </div>

        {/* Sub-tab togglers list */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 gap-1 w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("trend-dashboard")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeSubTab === "trend-dashboard"
                ? "bg-indigo-600 text-white shadow-md ring-1 ring-white/10 font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-900/40"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Trend & Performance Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("hospital-data")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeSubTab === "hospital-data"
                ? "bg-slate-850 border border-slate-700 text-white shadow-md font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-900/40"
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Hospital Data Checklist</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveSubTab("ipc-flat")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeSubTab === "ipc-flat"
                ? "bg-emerald-600 text-white shadow-md ring-1 ring-white/10 font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-900/40"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>IPC FLAT Assessment</span>
          </button>
        </div>
      </div>

      {/* Display Render View area */}
      <div className="flex-grow w-full select-none">
        {activeSubTab === "trend-dashboard" ? (
          <AssessmentDashboard />
        ) : activeSubTab === "hospital-data" ? (
          <AssessmentWizard />
        ) : (
          <IPCFlatScoreTool />
        )}
      </div>
    </div>
  );
}
