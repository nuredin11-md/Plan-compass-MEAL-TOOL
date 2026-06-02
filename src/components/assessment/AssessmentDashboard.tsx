/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { 
  Building2, 
  Calendar, 
  Filter, 
  Settings, 
  AlertTriangle, 
  RotateCcw, 
  Plus, 
  Trash2, 
  HelpCircle, 
  Info, 
  Sparkles, 
  SlidersHorizontal,
  TrendingUp,
  Table,
  Sliders,
  CheckCircle,
  XCircle,
  Activity,
  Edit,
  Save,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  LineChart, 
  Line, 
  BarChart as RechartsBarChart,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from "recharts";

// Default seed database of quarterly historical trends (2025 Q1 to 2026 Q2)
const DEFAULT_TREND_RECORDS = [
  // HIS Governance
  { id: "rec1", year: "2025", quarter: "Q1", section: "HIS Governance", category: "Committee JDs", value: 62, target: 80 },
  { id: "rec2", year: "2025", quarter: "Q2", section: "HIS Governance", category: "Committee JDs", value: 65, target: 80 },
  { id: "rec3", year: "2025", quarter: "Q3", section: "HIS Governance", category: "Annual Plans Alignment", value: 72, target: 85 },
  { id: "rec4", year: "2025", quarter: "Q4", section: "HIS Governance", category: "Annual Plans Alignment", value: 78, target: 85 },
  { id: "rec5", year: "2026", quarter: "Q1", section: "HIS Governance", category: "SOP Availability", value: 83, target: 90 },
  { id: "rec6", year: "2026", quarter: "Q2", section: "HIS Governance", category: "SOP Availability", value: 85, target: 90 },

  // Data Quality
  { id: "rec7", year: "2025", quarter: "Q1", section: "Data Quality", category: "Monthly DQAs", value: 54, target: 80 },
  { id: "rec8", year: "2025", quarter: "Q2", section: "Data Quality", category: "Monthly DQAs", value: 60, target: 80 },
  { id: "rec9", year: "2025", quarter: "Q3", section: "Data Quality", category: "Timely Reports GC", value: 68, target: 80 },
  { id: "rec10", year: "2025", quarter: "Q4", section: "Data Quality", category: "Timely Reports GC", value: 76, target: 85 },
  { id: "rec11", year: "2026", quarter: "Q1", section: "Data Quality", category: "Validation Rules", value: 80, target: 85 },
  { id: "rec12", year: "2026", quarter: "Q2", section: "Data Quality", category: "Validation Rules", value: 82, target: 90 },

  // Information Use
  { id: "rec13", year: "2025", quarter: "Q1", section: "Information Use", category: "EMR entry standard", value: 45, target: 75 },
  { id: "rec14", year: "2025", quarter: "Q2", section: "Information Use", category: "EMR entry standard", value: 52, target: 75 },
  { id: "rec15", year: "2025", quarter: "Q3", section: "Information Use", category: "Automated backups", value: 58, target: 80 },
  { id: "rec16", year: "2025", quarter: "Q4", section: "Information Use", category: "Automated backups", value: 68, target: 80 },
  { id: "rec17", year: "2026", quarter: "Q1", section: "Information Use", category: "Staff certified M&E", value: 74, target: 85 },
  { id: "rec18", year: "2026", quarter: "Q2", section: "Information Use", category: "Staff certified M&E", value: 79, target: 85 },

  // IPC Capacity
  { id: "rec19", year: "2025", quarter: "Q1", section: "IPC Capacity", category: "Demographic profile", value: 70, target: 85 },
  { id: "rec20", year: "2025", quarter: "Q2", section: "IPC Capacity", category: "Demographic profile", value: 74, target: 85 },
  { id: "rec21", year: "2025", quarter: "Q3", section: "IPC Capacity", category: "Clinical Support staff", value: 78, target: 85 },
  { id: "rec22", year: "2025", quarter: "Q4", section: "IPC Capacity", category: "Clinical Support staff", value: 81, target: 85 },
  { id: "rec23", year: "2026", quarter: "Q1", section: "IPC Capacity", category: "Assessor checklists", value: 84, target: 90 },
  { id: "rec24", year: "2026", quarter: "Q2", section: "IPC Capacity", category: "Assessor checklists", value: 88, target: 90 },

  // IPC Practices
  { id: "rec25", year: "2025", quarter: "Q1", section: "IPC Practices", category: "Domain Score compliance", value: 50, target: 80 },
  { id: "rec26", year: "2025", quarter: "Q2", section: "IPC Practices", category: "Domain Score compliance", value: 58, target: 80 },
  { id: "rec27", year: "2025", quarter: "Q3", section: "IPC Practices", category: "System safeguards", value: 64, target: 80 },
  { id: "rec28", year: "2025", quarter: "Q4", section: "IPC Practices", category: "System safeguards", value: 70, target: 85 },
  { id: "rec29", year: "2026", quarter: "Q1", section: "IPC Practices", category: "Observed Ward metrics", value: 75, target: 85 },
  { id: "rec30", year: "2026", quarter: "Q2", section: "IPC Practices", category: "Observed Ward metrics", value: 79, target: 90 }
];

export default function AssessmentDashboard() {
  // Overrides list stored in localStorage
  const [overrides, setOverrides] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("assessment_dashboard_overrides");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Target and threshold overrides state
  const [globalTarget, setGlobalTarget] = useState<number>(() => {
    const saved = localStorage.getItem("assessment_dashboard_target");
    return saved ? parseInt(saved, 10) : 85;
  });

  const [thresholdHigh, setThresholdHigh] = useState<number>(() => {
    const saved = localStorage.getItem("assessment_dashboard_thresh_high");
    return saved ? parseInt(saved, 10) : 80;
  });

  const [thresholdMed, setThresholdMed] = useState<number>(() => {
    const saved = localStorage.getItem("assessment_dashboard_thresh_med");
    return saved ? parseInt(saved, 10) : 60;
  });

  // UI Filter states
  const [filterPeriod, setFilterPeriod] = useState<"Quarterly" | "Annual">("Quarterly");
  const [filterQuarter, setFilterQuarter] = useState<string>("All"); // "All", "Q1", "Q2", "Q3", "Q4"
  const [filterYear, setFilterYear] = useState<string>("All"); // "All", "2025", "2026"
  const [filterSection, setFilterSection] = useState<string>("All"); // "All", "HIS Governance", "Data Quality", "Information Use", "IPC Capacity", "IPC Practices"
  const [filterCategory, setFilterCategory] = useState<string>("All");

  // Form states for adding custom overrides/records
  const [formYear, setFormYear] = useState("2026");
  const [formQuarter, setFormQuarter] = useState("Q2");
  const [formSection, setFormSection] = useState("HIS Governance");
  const [formCategory, setFormCategory] = useState("SOP Availability");
  const [formValue, setFormValue] = useState("");
  const [formTarget, setFormTarget] = useState("");

  // In-memory helper calculated stats
  const activeIPCScore = useMemo(() => {
    try {
      const persisted = localStorage.getItem("ipc_flat_assessment_responses_v1");
      if (persisted) {
        const parsed = JSON.parse(persisted);
        let yes = 0, no = 0, na = 0;
        Object.values(parsed).forEach((entry: any) => {
          if (entry && entry.answer === "yes") yes++;
          else if (entry && entry.answer === "no") no++;
          else if (entry && entry.answer === "na") na++;
        });
        const applicable = yes + no;
        return applicable > 0 ? Math.round((yes / applicable) * 100) : null;
      }
    } catch {
      // Ignored
    }
    return null;
  }, []);

  // Sync state parameters to local storage on changes
  useEffect(() => {
    localStorage.setItem("assessment_dashboard_overrides", JSON.stringify(overrides));
  }, [overrides]);

  useEffect(() => {
    localStorage.setItem("assessment_dashboard_target", String(globalTarget));
  }, [globalTarget]);

  useEffect(() => {
    localStorage.setItem("assessment_dashboard_thresh_high", String(thresholdHigh));
    localStorage.setItem("assessment_dashboard_thresh_med", String(thresholdMed));
  }, [thresholdHigh, thresholdMed]);

  // Combined metrics mapper
  const combinedRecords = useMemo(() => {
    // Start with history from Supabase (real data) when available
    const historyRecords = (assessmentHistory || []).map((row: any, idx: number) => {
      const facility = row.facilities || {};
      const section = facility.name ? `Facility: ${facility.name}` : "Facility Audit";
      const category = row.quarter ? `Assessment ${row.quarter}` : "Assessment Session";
      return {
        id: row.id || `hist_${idx}`,
        year: String(new Date(row.assessment_date || Date.now()).getFullYear()),
        quarter: row.quarter || "Q?",
        section,
        category,
        value: typeof row.total_score === "number" ? row.total_score : 0,
        target: globalTarget,
      };
    });

    const liveList = [...DEFAULT_TREND_RECORDS];

    // Merge in any manual overrides or additions
    overrides.forEach((ov: any) => {
      const matchIndex = liveList.findIndex(
        (item) =>
          item.year === ov.year &&
          item.quarter === ov.quarter &&
          item.section === ov.section &&
          item.category === ov.category
      );
      if (matchIndex > -1) {
        liveList[matchIndex] = {
          ...liveList[matchIndex],
          value: ov.value !== undefined ? ov.value : liveList[matchIndex].value,
          target: ov.target !== undefined ? ov.target : liveList[matchIndex].target,
        };
      } else {
        liveList.push({
          id: `ov_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          year: ov.year,
          quarter: ov.quarter,
          section: ov.section,
          category: ov.category,
          value: ov.value,
          target: ov.target || globalTarget,
        });
      }
    });

    const merged = [...historyRecords, ...liveList];

    // If there is an active Live IPC score entered in step 2/3, integrate as "2026 Live" values
    if (activeIPCScore !== null) {
      const matchIPC = merged.findIndex(
        (item: any) =>
          item.year === "2026" &&
          item.quarter === "Q2" &&
          item.section === "IPC Practices" &&
          item.category === "Domain Score compliance"
      );
      if (matchIPC > -1) {
        merged[matchIPC].value = activeIPCScore;
      }
    }

    return merged;
  }, [overrides, activeIPCScore, globalTarget, assessmentHistory]);

  // Create list of unique categories based on selected section filter for UI selectivity
  const categoriesList = useMemo(() => {
    const listSet = new Set<string>();
    combinedRecords.forEach(item => {
      if (filterSection === "All" || item.section === filterSection) {
        listSet.add(item.category);
      }
    });
    return Array.from(listSet);
  }, [combinedRecords, filterSection]);

  // Reset category selection if selected section changed and active filterCategory is no longer available
  useEffect(() => {
    if (filterCategory !== "All" && !categoriesList.includes(filterCategory)) {
      setFilterCategory("All");
    }
  }, [categoriesList, filterCategory]);

  // Process core filtered data
  const processedData = useMemo(() => {
    return combinedRecords.filter(item => {
      // 1. Section FILTER
      if (filterSection !== "All" && item.section !== filterSection) return false;

      // 2. Category FILTER
      if (filterCategory !== "All" && item.category !== filterCategory) return false;

      // 3. Year FILTER
      if (filterYear !== "All" && item.year !== filterYear) return false;

      // 4. Quarter FILTER
      if (filterPeriod === "Quarterly" && filterQuarter !== "All" && item.quarter !== filterQuarter) return false;

      return true;
    });
  }, [combinedRecords, filterSection, filterCategory, filterYear, filterQuarter, filterPeriod]);

  // Create aggregate trend points for line chart consumption
  const chartTrendPoints = useMemo(() => {
    // Group records by Year & Quarter or just Year depending on Period
    const points: Record<string, { label: string; count: number; totalVal: number; totalTar: number; sortKey: string }> = {};

    processedData.forEach(item => {
      const key = filterPeriod === "Quarterly" ? `${item.year} ${item.quarter}` : `${item.year}`;
      const label = filterPeriod === "Quarterly" ? `${item.year} ${item.quarter}` : `${item.year}`;
      const sortKey = filterPeriod === "Quarterly" ? `${item.year}_${item.quarter}` : `${item.year}`;

      if (!points[key]) {
        points[key] = { label, count: 0, totalVal: 0, totalTar: 0, sortKey };
      }
      points[key].count++;
      points[key].totalVal += item.value;
      points[key].totalTar += item.target;
    });

    return Object.values(points)
      .sort((a,b) => a.sortKey.localeCompare(b.sortKey))
      .map(p => ({
        name: p.label,
        Actual: p.count > 0 ? Math.round(p.totalVal / p.count) : 0,
        Target: p.count > 0 ? Math.round(p.totalTar / p.count) : globalTarget,
      }));
  }, [processedData, filterPeriod, globalTarget]);

  // General KPIs based on current filtered view context
  const filteredKPIs = useMemo(() => {
    if (processedData.length === 0) {
      return { avgScore: 0, avgTarget: globalTarget, count: 0, compliantCount: 0 };
    }
    let totalScore = 0;
    let totalTarget = 0;
    let compliantCount = 0;

    processedData.forEach(item => {
      totalScore += item.value;
      totalTarget += item.target;
      if (item.value >= item.target) {
        compliantCount++;
      }
    });

    return {
      avgScore: Math.round(totalScore / processedData.length),
      avgTarget: Math.round(totalTarget / processedData.length),
      count: processedData.length,
      compliantCount
    };
  }, [processedData, globalTarget]);

  const handleAddOverride = () => {
    if (!formValue || isNaN(Number(formValue))) {
      toast.error("Please provide a valid actual performance score numeric value");
      return;
    }

    const val = Math.min(100, Math.max(0, Number(formValue)));
    const tar = formTarget && !isNaN(Number(formTarget)) ? Math.min(100, Math.max(0, Number(formTarget))) : globalTarget;

    const newOverride = {
      year: formYear,
      quarter: formQuarter,
      section: formSection,
      category: formCategory,
      value: val,
      target: tar
    };

    // Filter out existing exact same match and push new one
    const filtered = overrides.filter(
      item => !(item.year === formYear && 
                item.quarter === formQuarter && 
                item.section === formSection && 
                item.category === formCategory)
    );

    setOverrides([...filtered, newOverride]);
    setFormValue("");
    setFormTarget("");
    toast.success("Manual performance override committed securely to dashboard feed.");
  };

  const handleClearOverride = (year: string, quarter: string, section: string, category: string) => {
    setOverrides(prev => prev.filter(
      item => !(item.year === year && 
                item.quarter === quarter && 
                item.section === section && 
                item.category === category)
    ));
    toast.info("Performance parameter restored to live calculations baseline.");
  };

  const handleResetToBaseline = () => {
    if (window.confirm("Are you sure you want to discard all dashboard overrides and return to the baseline data-entry calculations?")) {
      setOverrides([]);
      setGlobalTarget(85);
      setThresholdHigh(80);
      setThresholdMed(60);
      toast.success("All analytical configurations reverted to standard institutional defaults.");
    }
  };

  const complianceStatus = (pct: number) => {
    if (pct >= thresholdHigh) return { label: "High Compliance", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (pct >= thresholdMed) return { label: "Medium Compliance", color: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "Deficit Alert", color: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" };
  };

  return (
    <div className="space-y-6">
      {/* Top overview title block */}
      <div className="text-left max-w-3xl">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-500" /> Analytical Trend & Performance Dashboard
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Step 4: Interactive cross-sectional analysis and visualization. Filter, adjust targets, adjust parameters, and override operational discrepancies dynamically.
        </p>
      </div>

      {/* FILTER PANEL SECTION */}
      <Card className="border-slate-200 shadow-sm bg-white/65 backdrop-blur-sm">
        <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center gap-2">
          <Filter className="h-4 w-4 text-indigo-500" />
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Dynamic Assessment Parameters filter</span>
        </CardHeader>
        <CardContent className="py-4 px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            
            {/* Period selector */}
            <div className="space-y-1.5 text-left">
              <Label className="text-[11px] font-bold text-slate-600">Period Interval</Label>
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setFilterPeriod("Quarterly")}
                  className={`flex-1 py-1 rounded-md text-[10px] font-bold ${
                    filterPeriod === "Quarterly" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-550 hover:text-slate-850"
                  }`}
                >
                  Quarterly
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPeriod("Annual")}
                  className={`flex-1 py-1 rounded-md text-[10px] font-bold ${
                    filterPeriod === "Annual" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-550 hover:text-slate-850"
                  }`}
                >
                  Annual
                </button>
              </div>
            </div>

            {/* Quarter Selector (only if Quarterly period is chosen) */}
            <div className="space-y-1.5 text-left">
              <Label className="text-[11px] font-bold text-slate-600">Quarter Cycle</Label>
              <select
                disabled={filterPeriod === "Annual"}
                value={filterQuarter}
                onChange={e => setFilterQuarter(e.target.value)}
                className="w-full text-xs h-8 border border-slate-200 rounded-lg bg-white p-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40"
              >
                <option value="All">All Quarters</option>
                <option value="Q1">1st Quarter (Q1)</option>
                <option value="Q2">2nd Quarter (Q2)</option>
                <option value="Q3">3rd Quarter (Q3)</option>
                <option value="Q4">4th Quarter (Q4)</option>
              </select>
            </div>

            {/* Year selector */}
            <div className="space-y-1.5 text-left">
              <Label className="text-[11px] font-bold text-slate-600">Calendar Year</Label>
              <select
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="w-full text-xs h-8 border border-slate-200 rounded-lg bg-white p-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Years</option>
                <option value="2025">2025 Calendar</option>
                <option value="2026">2026 Calendar</option>
              </select>
            </div>

            {/* Section selector */}
            <div className="space-y-1.5 text-left">
              <Label className="text-[11px] font-bold text-slate-600">Facility Section</Label>
              <select
                value={filterSection}
                onChange={e => setFilterSection(e.target.value)}
                className="w-full text-xs h-8 border border-slate-200 rounded-lg bg-white p-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Sections</option>
                <option value="HIS Governance">HIS Structure & Governance</option>
                <option value="Data Quality">Data Quality & Management</option>
                <option value="Information Use">Information Use for Decision</option>
                <option value="IPC Capacity">IPC Capacity & Profile</option>
                <option value="IPC Practices">IPC Practices & Compliance</option>
              </select>
            </div>

            {/* Category / Area focus selector */}
            <div className="space-y-1.5 text-left">
              <Label className="text-[11px] font-bold text-slate-600">Focus Focus Area</Label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full text-xs h-8 border border-slate-200 rounded-lg bg-white p-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Focus Areas</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* CORE PERFORMANCE METRIC CARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* KPI 1: Selected average score */}
        <Card className="border-slate-200 shadow-xs bg-white/70 overflow-hidden relative leading-normal">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <CardContent className="p-4 flex flex-col justify-between h-full text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filtered Average Score</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-800">{filteredKPIs.avgScore}%</span>
              <span className="text-xs text-slate-500">Actual average</span>
            </div>
            <div className="mt-2 w-full">
              <Progress value={filteredKPIs.avgScore} className="h-1 bg-slate-100 [&>div]:bg-indigo-550" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Global vs Filtered target ratio */}
        <Card className="border-slate-200 shadow-xs bg-white/70 overflow-hidden relative leading-normal">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <CardContent className="p-4 flex flex-col justify-between h-full text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Compliance Target Line</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-800">{filteredKPIs.avgTarget}%</span>
              <span className="text-xs text-slate-500">of parameters</span>
            </div>
            <div className="mt-2 text-[10px] font-bold text-slate-400">
              Variance context: <span className={filteredKPIs.avgScore >= filteredKPIs.avgTarget ? "text-emerald-600" : "text-rose-600"}>
                {filteredKPIs.avgScore - filteredKPIs.avgTarget >= 0 ? "+" : ""}{filteredKPIs.avgScore - filteredKPIs.avgTarget}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Compliance volume counts */}
        <Card className="border-slate-200 shadow-xs bg-white/70 overflow-hidden relative leading-normal">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <CardContent className="p-4 flex flex-col justify-between h-full text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Compliance Volume Card</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-800">{filteredKPIs.compliantCount}</span>
              <span className="text-xs text-slate-500">/ {filteredKPIs.count} components</span>
            </div>
            <div className="mt-2 text-[10px] font-semibold text-slate-500">
              Meeting standard: {filteredKPIs.count > 0 ? Math.round((filteredKPIs.compliantCount / filteredKPIs.count) * 100) : 0}% compliance rate
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Active check active flags */}
        <Card className="border-slate-200 shadow-xs bg-white/70 overflow-hidden relative leading-normal">
          <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
          <CardContent className="p-4 flex flex-col justify-between h-full text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active State integration</span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Badge className="bg-emerald-550 border-transparent text-white font-bold text-[9px]">
                {activeIPCScore !== null ? `Active State Score: ${activeIPCScore}%` : "No active assessment"}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-450 font-semibold mt-2.5">
              Reads dynamically from user input in assessment steps.
            </p>
          </CardContent>
        </Card>

      </div>

      {/* TREND TREND PLOTS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Longitudinal progress line chart */}
        <Card className="md:col-span-2 border-slate-200 shadow-sm overflow-hidden bg-white/75 relative">
          <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 text-left">
              <TrendingUp className="h-4 w-4 text-indigo-500 animate-pulse" /> Longitudinal Performance Trend Analysis
            </CardTitle>
            <Badge variant="outline" className="border-indigo-200/50 text-indigo-700 font-bold text-[9px] bg-indigo-50/50">
              Time Series
            </Badge>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-72 text-xs font-bold w-full">
              {chartTrendPoints.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Select parameters or adjust filters to plot comparative data points.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartTrendPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                    <YAxis domain={[0, 105]} stroke="#64748b" fontSize={9} />
                    <RechartsTooltip formatter={(v: number) => [`${v}%`]} />
                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: "bold" }} />
                    <Line 
                      type="monotone" 
                      dataKey="Actual" 
                      stroke="#818cf8" 
                      strokeWidth={2.5} 
                      activeDot={{ r: 6 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Target" 
                      stroke="#ef4444" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.5} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section Score breakdown Bar Chart */}
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white/75">
          <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 text-left">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" /> Section Variance Ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-72 text-xs font-bold w-full">
              {processedData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  No variables plotted.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={processedData.slice(-6)} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                    <XAxis dataKey="quarter" stroke="#64748b" fontSize={9} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={9} />
                    <RechartsTooltip formatter={(v: number) => [`${v}%`]} />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {processedData.slice(-6).map((item, index) => {
                        const statusColor = item.value >= item.target ? "#10b981" : "#f59e0b";
                        return <Cell key={index} fill={statusColor} />;
                      })}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* CORE TABULAR VIEW: SUMMARY PERFORMANCE TABLE */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white/70">
        <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
          <CardTitle className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 text-left">
            <Table className="h-4 w-4 text-slate-500" /> Performance Metric Ledger & Compliance Alerts
          </CardTitle>
          <Badge variant="outline" className="border-slate-300 font-mono text-[9px] font-bold text-slate-500 bg-white">
            {processedData.length} records matching parameters
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs text-slate-650 font-medium">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-100/30 text-[10px] uppercase font-bold text-slate-400 select-none">
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Structural Section</th>
                  <th className="py-2.5 px-3">Evaluation Focus Category</th>
                  <th className="py-2.5 px-3 text-center">Score Target</th>
                  <th className="py-2.5 px-3 text-center">Actual Score</th>
                  <th className="py-2.5 px-3 text-center">Variance Gap</th>
                  <th className="py-2.5 px-3 text-center">Alert Classification</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-450 font-medium bg-white">
                      <HelpCircle className="h-8 w-8 mx-auto text-slate-350 stroke-1 block mb-2" />
                      No data points found matching active dashboard filter criteria. Try extending the filters.
                    </td>
                  </tr>
                ) : (
                  processedData.map((item) => {
                    const status = complianceStatus(item.value);
                    const variance = item.value - item.target;
                    const isOverridden = overrides.some(
                      ov => ov.year === item.year && 
                            ov.quarter === item.quarter && 
                            ov.section === item.section && 
                            ov.category === item.category
                    );

                    return (
                      <tr key={item.id} className={`border-b border-slate-100/60 hover:bg-slate-50/40 transition-colors h-10 ${
                        isOverridden ? "bg-amber-500/[0.015]" : ""
                      }`}>
                        <td className="py-2 px-3 font-semibold font-mono text-slate-500 text-[11px]">
                          {item.year} {item.quarter}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-extrabold text-slate-800 block text-[11px]">{item.section}</span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 block truncate max-w-[200px] mt-2" title={item.category}>
                          {item.category}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-600 font-mono">
                          {item.target}%
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          <span className="font-extrabold text-slate-900">{item.value}%</span>
                          {isOverridden && (
                            <Badge className="ml-1 px-1 py-0 bg-amber-500/10 border-amber-200/50 text-amber-800 text-[8px] font-bold">
                              Overridden
                            </Badge>
                          )}
                        </td>
                        <td className={`py-2 px-3 text-center font-bold font-mono ${variance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {variance >= 0 ? `+${variance}%` : `${variance}%`}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Badge className={`text-[9px] font-bold border rounded-md shadow-2xs ${status.color}`}>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {isOverridden ? (
                            <Button
                              type="button"
                              onClick={() => handleClearOverride(item.year, item.quarter, item.section, item.category)}
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg"
                              title="Discard discrepancy manual override and restore live calculations"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => {
                                setFormYear(item.year);
                                setFormQuarter(item.quarter);
                                setFormSection(item.section);
                                setFormCategory(item.category);
                                setFormValue(String(item.value));
                                setFormTarget(String(item.target));
                                document.getElementById("management-override-hub")?.scrollIntoView({ behavior: "smooth" });
                                toast.info(`Selected ${item.category} for override adjustment.`);
                              }}
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg"
                              title="Tweak metric parameters"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DETAILED MANUAL SETTINGS & OVERRIDE CONTROL HUB */}
      <div id="management-override-hub" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core Settings Override Box */}
        <Card className="border-slate-200 shadow-sm bg-white/75 md:col-span-1 text-left leading-normal relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
          <CardHeader className="py-3.5 px-4 border-b border-slate-100">
            <CardTitle className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
              <Settings className="h-4.5 w-4.5 text-indigo-500" /> Target & Alarm Overrides
            </CardTitle>
            <CardDescription className="text-[10px] text-slate-450 font-medium">Configure global threshold categories for performance tracking.</CardDescription>
          </CardHeader>
          <CardContent className="py-4 px-4 space-y-4">
            
            <div className="space-y-1">
              <Label htmlFor="input-global-target" className="text-xs font-bold text-slate-700">Global Metric Target (%)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="input-global-target"
                  type="number"
                  min="50"
                  max="100"
                  value={globalTarget}
                  onChange={e => setGlobalTarget(Number(e.target.value))}
                  className="h-8 text-xs font-bold font-mono text-center w-20 border-slate-200"
                />
                <span className="text-[11px] text-slate-500">Benchmark target set on longitudinal progress sheets.</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="input-threshold-high" className="text-xs font-bold text-slate-700">High Compliance Threshold (%)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="input-threshold-high"
                  type="number"
                  min="70"
                  max="95"
                  value={thresholdHigh}
                  onChange={e => setThresholdHigh(Number(e.target.value))}
                  className="h-8 text-xs font-bold font-mono text-center w-20 border-slate-200"
                />
                <span className="text-[11px] text-slate-500 text-emerald-700">Minimum points for high classification.</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="input-threshold-med" className="text-xs font-bold text-slate-700">Medium Compliance Threshold (%)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="input-threshold-med"
                  type="number"
                  min="40"
                  max="69"
                  value={thresholdMed}
                  onChange={e => setThresholdMed(Number(e.target.value))}
                  className="h-8 text-xs font-bold font-mono text-center w-20 border-slate-200"
                />
                <span className="text-[11px] text-slate-500 text-amber-700">Minimum points to avoid alert triggers.</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={handleResetToBaseline}
                className="w-full h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center gap-1.5 rounded-lg border border-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Revert all Parameters
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Dynamic Override Form Builder */}
        <Card className="border-slate-200 shadow-sm bg-white/75 md:col-span-2 text-left leading-normal relative">
          <CardHeader className="py-3.5 px-4 border-b border-slate-100">
            <CardTitle className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
              <Plus className="h-5 w-5 text-indigo-500" /> Register Metric Override
            </CardTitle>
            <CardDescription className="text-[10px] text-slate-450 font-medium">Overwrite active checklist outputs / inject historical records in real-time.</CardDescription>
          </CardHeader>
          <CardContent className="py-4 px-4 space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Calendar Year</Label>
                <select
                  value={formYear}
                  onChange={e => setFormYear(e.target.value)}
                  className="w-full text-xs h-8 border border-slate-200 rounded-lg bg-white p-1 text-slate-750 focus:outline-none"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Quarter Cycle</Label>
                <select
                  value={formQuarter}
                  onChange={e => setFormQuarter(e.target.value)}
                  className="w-full text-xs h-8 border border-slate-200 rounded-lg bg-white p-1 text-slate-755 focus:outline-none"
                >
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Structural Section</Label>
                <select
                  value={formSection}
                  onChange={e => {
                    setFormSection(e.target.value);
                    // Match a default first category for ease of form submission
                    const subList = DEFAULT_TREND_RECORDS.filter(r => r.section === e.target.value);
                    if (subList.length > 0) {
                      setFormCategory(subList[0].category);
                    }
                  }}
                  className="w-full text-xs h-8 border border-slate-200 rounded-lg bg-white p-1 text-slate-755 focus:outline-none"
                >
                  <option value="HIS Governance">HIS Governance</option>
                  <option value="Data Quality">Data Quality</option>
                  <option value="Information Use">Information Use</option>
                  <option value="IPC Capacity">IPC Capacity</option>
                  <option value="IPC Practices">IPC Practices</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Focus Focus Area</Label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full text-xs h-8 border border-slate-200 rounded-lg bg-white p-1 text-slate-755 focus:outline-none"
                >
                  {DEFAULT_TREND_RECORDS.filter(r => r.section === formSection)
                    .map(r => r.category)
                    .filter((value, idx, self) => self.indexOf(value) === idx)
                    .map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1 text-left">
                <Label htmlFor="input-actual-score" className="text-xs font-bold text-slate-700">Actual Score override (%)</Label>
                <Input
                  id="input-actual-score"
                  value={formValue}
                  onChange={e => setFormValue(e.target.value)}
                  type="number"
                  placeholder="e.g. 84"
                  className="h-8 text-xs border-slate-200"
                />
              </div>

              <div className="space-y-1 text-left">
                <Label htmlFor="input-target-override" className="text-xs font-bold text-slate-700">Configure custom target (%) (Optional)</Label>
                <Input
                  id="input-target-override"
                  value={formTarget}
                  onChange={e => setFormTarget(e.target.value)}
                  type="number"
                  placeholder={`Optional default is ${globalTarget}%`}
                  className="h-8 text-xs border-slate-200"
                />
              </div>

            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={handleAddOverride}
                className="bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-xs h-9 px-6 rounded-lg shadow-xs flex items-center gap-1.5 transition-all hover:translate-y-[-1px] cursor-pointer"
              >
                <Check className="h-4 w-4" /> Save manual performance parameter
              </Button>
            </div>

          </CardContent>
        </Card>

      </div>

    </div>
  );
}
