import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  ShieldAlert, 
  FileText, 
  Sliders, 
  Sparkles, 
  LayoutDashboard,
  Save,
  Activity,
  UserCheck,
  CloudOff,
  Cloud
} from "lucide-react";
import HospitalInfoForm from "./HospitalInfoForm";
import AssessmentSection from "./AssessmentSection";
import ScoreDashboard from "./ScoreDashboard";
import { 
  sectionI, 
  sectionII, 
  initializeEmptyAssessmentData, 
  getInitialHospitalInfo,
  type AssessmentData,
  type HospitalInfo,
  criteriaLookup
} from "./ipcData";
import { useIPCAssessment } from "@/hooks/useIPCAssessment";

const STEPS = [
  { id: "profile", label: "Hospital Profile", component: "profile", desc: "Coordinates & administrative capacities" },
  { id: "section_i", label: "Section I", component: "section_i", desc: "Capacity & System checklists" },
  { id: "section_ii", label: "Section II", component: "section_ii", desc: "Practices & Compliance checklists" },
  { id: "results", label: "Results & Analytics", component: "results", desc: "Performance indicators & CSV export" }
];

const LOCAL_STORAGE_KEY_DATA = "ipc_flat_assessment_responses_v1";
const LOCAL_STORAGE_KEY_INFO = "ipc_flat_assessment_hospital_v1";

function calculateTotalScore(data: AssessmentData): number {
  return Object.values(data).reduce((sum, entry) => {
    if (!entry) return sum;
    const numeric =
      entry.answer === "yes"
        ? 1
        : entry.answer === "no"
          ? 0
          : entry.answer === "na"
            ? 0
            : 0;
    return sum + numeric;
  }, 0);
}

export default function IPCFlatScoreTool() {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const { saveIPCAssessment, fetchUserAssessments } = useIPCAssessment();
  const [saveStatus, setSaveStatus] = useState<{ mode: "idle" | "saving" | "saved" | "error"; message?: string }>({ mode: "idle" });

  // Initialize responsive state variables
  const [assessmentData, setAssessmentData] = useState<AssessmentData>(() => {
    try {
      const persisted = localStorage.getItem(LOCAL_STORAGE_KEY_DATA);
      if (persisted) {
        return JSON.parse(persisted);
      }
    } catch (e) {
      console.error("Local storage responses recovery failed", e);
    }
    return initializeEmptyAssessmentData();
  });

  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo>(() => {
    try {
      const persisted = localStorage.getItem(LOCAL_STORAGE_KEY_INFO);
      if (persisted) {
        return JSON.parse(persisted);
      }
    } catch (e) {
      console.error("Local storage demographics recovery failed", e);
    }
    return getInitialHospitalInfo();
  });

  // Automatically save state progress incrementally (local autorescue)
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_DATA, JSON.stringify(assessmentData));
    } catch (e) {
      console.error("Autorescue write failed for responses", e);
    }
  }, [assessmentData]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_INFO, JSON.stringify(hospitalInfo));
    } catch (e) {
      console.error("Autorescue write failed for demographics", e);
    }
  }, [hospitalInfo]);

  const handleSaveDraft = async () => {
    setSaveStatus({ mode: "saving" });
    try {
      const totalScore = calculateTotalScore(assessmentData);
      const scorePercentage = Math.round((totalScore / 205) * 100);

      const result = await saveIPCAssessment(
        hospitalInfo,
        assessmentData,
        totalScore,
        scorePercentage,
        "draft"
      );

      if (result.success) {
        setSaveStatus({ mode: "saved", message: "Draft saved to cloud" });
      } else {
        setSaveStatus({ mode: "error", message: result.error || "Save failed" });
      }
    } catch (err: any) {
      setSaveStatus({ mode: "error", message: err.message });
    }
  };

  const handleSubmitFinal = async () => {
    setSaveStatus({ mode: "saving" });
    try {
      const totalScore = calculateTotalScore(assessmentData);
      const scorePercentage = Math.round((totalScore / 205) * 100);

      const result = await saveIPCAssessment(
        hospitalInfo,
        assessmentData,
        totalScore,
        scorePercentage,
        "submitted"
      );

      if (result.success) {
        setSaveStatus({ mode: "saved", message: "Assessment submitted successfully" });
        toast.success("IPC FLAT Assessment committed to Supabase");
      } else {
        setSaveStatus({ mode: "error", message: result.error || "Submission failed" });
      }
    } catch (err: any) {
      setSaveStatus({ mode: "error", message: err.message });
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you absolutely sure you want to clear this entire assessment? This will permanently wipe all 200+ answers and hospital profiles. This action is irreversible.")) {
      setAssessmentData(initializeEmptyAssessmentData());
      setHospitalInfo(getInitialHospitalInfo());
      setCurrentStepIdx(0);
      toast.success("IPC assessment database cleared completely.");
    }
  };

  // Real-time answers stats tracker
  const globalCompletionStats = useMemo(() => {
    const total = 205; // 205 criteria
    let answeredNum = 0;
    Object.values(assessmentData).forEach(entry => {
      if (entry && entry.answer !== "") {
        answeredNum++;
      }
    });
    return {
      total,
      answeredNum,
      percent: Math.round((answeredNum / total) * 100)
    };
  }, [assessmentData]);

  const handleNext = () => {
    // Basic validation on step 1: Hospital profile
    if (currentStepIdx === 0) {
      if (!hospitalInfo.hospitalName.trim()) {
        toast.error("Please enter the Hospital Name to proceed.");
        return;
      }
    }
    setCurrentStepIdx(prev => Math.min(prev + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStepIdx(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      
      {/* Banner Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-5 text-left leading-normal relative overflow-hidden">
        {/* Absolute design aesthetic decoration */}
        <div className="absolute left-0 bottom-0 top-0 w-1.5 bg-gradient-to-b from-blue-400 to-indigo-600"></div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500 text-white font-extrabold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded border border-blue-405/20">
              IPC FLAT Audit Tool
            </Badge>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Auto-Save Enabled
            </div>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
            <Activity className="h-6 w-6 text-blue-400 shrink-0" /> Remix: IPC FLAT Score Tool
          </h1>
          <p className="text-slate-400 text-xs font-medium">
            Infection Prevention and Control (IPC) Flexible Assessment and Tracking score spreadsheet with 200+ detailed clinical parameters.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Button 
            type="button"
            variant="outline" 
            onClick={handleReset}
            className="h-9 px-3 text-xs font-bold gap-1.5 border-slate-700/80 hover:border-red-500/50 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-lg cursor-pointer transition-colors"
            title="Reset active assessment questions completely"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Audit
          </Button>
          
          <Button 
            type="button"
            variant="ghost"
            onClick={handleSaveDraft}
            disabled={saveStatus.mode === "saving"}
            className="h-9 px-3 text-xs font-bold gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            title="Save draft to cloud"
          >
            {saveStatus.mode === "saving" ? (
              <Cloud className="h-3.5 w-3.5 animate-pulse" />
            ) : saveStatus.mode === "saved" ? (
              <Cloud className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <CloudOff className="h-3.5 w-3.5 text-slate-500" />
            )}
            {saveStatus.mode === "saving" ? "Saving..." : saveStatus.mode === "saved" ? "Saved" : "Save Draft"}
          </Button>
        </div>
      </div>

      {/* Global tracker progress pipeline */}
      <Card className="border-slate-200/50 shadow-sm overflow-hidden bg-white/60 backdrop-blur-sm">
        <CardContent className="py-4 px-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            
            {/* Left side Completion Stats badge */}
            <div className="md:col-span-1 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Audit Coverage</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-extrabold text-slate-800">{globalCompletionStats.answeredNum}</span>
                <span className="text-xs text-slate-400">/ {globalCompletionStats.total} answered</span>
              </div>
              <Progress value={globalCompletionStats.percent} className="h-1.5 bg-slate-100 [&>div]:bg-blue-600 rounded-full mt-2" />
            </div>

            {/* Right side Steps tabs */}
            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STEPS.map((st, idx) => {
                const isActive = idx === currentStepIdx;
                const isPast = idx < currentStepIdx;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      if (st.id === "results" && !hospitalInfo.hospitalName.trim()) {
                        toast.error("Please fill hospital profile first to proceed.");
                        return;
                      }
                      setCurrentStepIdx(idx);
                    }}
                    className={`p-2 rounded-xl text-left border text-xs leading-normal select-none transition-all cursor-pointer ${
                      isActive 
                        ? "bg-blue-50/70 border-blue-200 text-blue-900 shadow-xs ring-1 ring-blue-105" 
                        : isPast 
                          ? "bg-slate-50/50 border-slate-200 text-slate-600" 
                          : "bg-white border-slate-150 hover:border-slate-300 text-slate-450"
                    }`}
                  >
                    <p className={`font-bold transition-all ${isActive ? "text-blue-700" : ""}`}>
                      Step {idx + 1}: {st.label}
                    </p>
                    <p className="text-[10px] text-slate-450 truncate font-semibold mt-0.5">{st.desc}</p>
                  </button>
                );
              })}
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Main step forms wrapper container */}
      <div className="min-h-[350px]">
        {currentStepIdx === 0 && (
          <HospitalInfoForm 
            info={hospitalInfo} 
            onChange={setHospitalInfo} 
          />
        )}

        {currentStepIdx === 1 && (
          <AssessmentSection 
            section={sectionI} 
            data={assessmentData} 
            onChange={setAssessmentData} 
          />
        )}

        {currentStepIdx === 2 && (
          <AssessmentSection 
            section={sectionII} 
            data={assessmentData} 
            onChange={setAssessmentData} 
          />
        )}

        {currentStepIdx === 3 && (
          <ScoreDashboard 
            data={assessmentData} 
            hospitalInfo={hospitalInfo} 
          />
        )}
      </div>

      {/* Wizard Footer Step Steering bar */}
      <div className="flex items-center justify-between pt-5 border-t border-slate-200/60 font-sans select-none">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIdx === 0}
          className="h-10 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 rounded-xl font-bold text-xs gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Previous Step
        </Button>

        <div className="flex items-center gap-2">
          {saveStatus.message && (
            <span className={`text-[11px] font-semibold ${
              saveStatus.mode === "saved" ? "text-emerald-600" : 
              saveStatus.mode === "error" ? "text-red-600" : 
              "text-slate-500"
            }`}>
              {saveStatus.message}
            </span>
          )}

          {currentStepIdx < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="h-10 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs rounded-xl font-bold text-xs gap-1.5 cursor-pointer transition-all hover:translate-y-[-1px]"
            >
              Proceed to {STEPS[currentStepIdx + 1].label} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleSubmitFinal}
                disabled={saveStatus.mode === "saving"}
                className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs rounded-xl font-bold text-xs gap-1.5 cursor-pointer transition-all hover:translate-y-[-1px] disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> Submit Final Assessment
              </Button>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                <UserCheck className="h-4 w-4" /> Assessment complete
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
