import { useState, useMemo, useEffect } from "react";
import {
  Trophy, Medal, Star, Award, TrendingUp, TrendingDown, Minus,
  CheckCircle2, Settings2, ChevronRight, BarChart3, CalendarDays,
  Plus, Trash2, Edit2, X, Save, ClipboardList, Shield, FileText,
  Activity, ChevronDown, Info, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Indicator, MonthlyEntry } from "@/data/hospitalIndicators";
import { useIndicators } from "@/context/IndicatorsContext";
import {
  useAppraisalCriteria,
  AppraisalCriterion,
  SubMetric,
} from "@/hooks/useAppraisalCriteria";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeptScore {
  name: string;
  totalScore: number;
  rank: number;
  criterionScores: { id: string; name: string; weight: number; score: number; color: string }[];
  trend: "up" | "down" | "stable";
  badge: "gold" | "silver" | "bronze" | "none";
  indicatorCount: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Maternal & Child Health", "Child Health", "EPI",
  "Surgical Services", "Hospital Utilization", "Quality & Safety",
  "Pharmacy", "Blood Bank", "Tuberculosis",
  "HIV Prevention and Control", "Non-Communicable Diseases", "Nutrition",
];

const PERIOD_MAP: Record<string, Record<string, string[]>> = {
  annual: {
    "Annual Summary": [
      "Hamle (Nov)", "Nehase (Dec)", "Meskerem (Jan)", "Tikimt (Feb)",
      "Hidar (Mar)", "Tahsas (Apr)", "Tir (May)", "Yekatit (Jun)",
      "Megabit (Jul)", "Miyazia (Aug)", "Ginbot (Sep)", "Sene (Oct)",
    ],
  },
  "six-month": {
    "1st Half-Year (H1)": ["Hamle (Nov)", "Nehase (Dec)", "Meskerem (Jan)", "Tikimt (Feb)", "Hidar (Mar)", "Tahsas (Apr)"],
    "2nd Half-Year (H2)": ["Tir (May)", "Yekatit (Jun)", "Megabit (Jul)", "Miyazia (Aug)", "Ginbot (Sep)", "Sene (Oct)"],
  },
  quarterly: {
    "1st Quarter (Q1)": ["Hamle (Nov)", "Nehase (Dec)", "Meskerem (Jan)"],
    "2nd Quarter (Q2)": ["Tikimt (Feb)", "Hidar (Mar)", "Tahsas (Apr)"],
    "3rd Quarter (Q3)": ["Tir (May)", "Yekatit (Jun)", "Megabit (Jul)"],
    "4th Quarter (Q4)": ["Miyazia (Aug)", "Ginbot (Sep)", "Sene (Oct)"],
  },
};

const EFY_OPTIONS = [
  { value: "2016 EFY", label: "2016 EFY (Baseline)" },
  { value: "2017 EFY", label: "2017 EFY (Intermediate)" },
  { value: "2018 EFY", label: "2018 EFY (Active)" },
  { value: "2019 EFY", label: "2019 EFY (Plan)" },
];

const MEDAL_CFG = {
  gold:   { Icon: Trophy, label: "Gold Winner",  bg: "from-yellow-50 to-amber-50",  border: "border-yellow-300", text: "text-yellow-700", accent: "#d97706", podiumH: "h-20", podiumBg: "bg-amber-200/60",  podiumNum: "text-3xl text-amber-600" },
  silver: { Icon: Medal,  label: "Silver Award", bg: "from-slate-50 to-gray-100",   border: "border-slate-300",  text: "text-slate-600",  accent: "#64748b", podiumH: "h-12", podiumBg: "bg-slate-200/80",  podiumNum: "text-2xl text-slate-400" },
  bronze: { Icon: Star,   label: "Bronze Award", bg: "from-orange-50 to-amber-50",  border: "border-orange-300", text: "text-orange-600", accent: "#c2410c", podiumH: "h-8",  podiumBg: "bg-amber-100/40",  podiumNum: "text-xl text-orange-600" },
  none:   { Icon: Award,  label: "Recognized",   bg: "from-blue-50 to-indigo-50",   border: "border-blue-200",   text: "text-blue-600",   accent: "#3b82f6", podiumH: "h-8",  podiumBg: "bg-blue-100/40",   podiumNum: "text-xl text-blue-600"  },
};

const CRIT_ICONS: Record<string, React.ElementType> = {
  activity: Activity, shield: Shield, clipboard: ClipboardList, file: FileText,
};

const COLOR_SWATCHES = ["#4f46e5", "#059669", "#7c3aed", "#d97706", "#dc2626", "#0891b2", "#c026d3", "#65a30d"];

// ── Small helpers ─────────────────────────────────────────────────────────────

const makePeriodKey = (efy: string, interval: string, period: string) =>
  `${efy}__${interval}__${period}`;

const ScoreBar = ({ score, color, h = "h-1.5" }: { score: number; color: string; h?: string }) => (
  <div className={`w-full ${h} rounded-full bg-slate-100 overflow-hidden`}>
    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, score))}%`, background: color }} />
  </div>
);

const TrendBadge = ({ trend }: { trend: "up" | "down" | "stable" }) =>
  trend === "up"   ? <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600"><TrendingUp className="h-3 w-3" /></span> :
  trend === "down" ? <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-500"><TrendingDown className="h-3 w-3" /></span> :
                     <span className="flex items-center gap-0.5 text-[10px] text-slate-400"><Minus className="h-3 w-3" /></span>;

// ── Criterion Editor Modal ────────────────────────────────────────────────────
 
type DraftCriterion = Omit<AppraisalCriterion, "id"> & { id?: string };
 
const CriterionModal = ({
   initial, efy, onSave, onClose, allIndicators,
 }: {
   initial: DraftCriterion | null;
   efy: string;
   onSave: (c: DraftCriterion) => void;
   onClose: () => void;
   allIndicators: Indicator[];
 }) => {
   const isNew = !initial?.id;
   const [d, setD] = useState<DraftCriterion>(
     initial ?? {
       name: "", efy, weight: 10, departmentCategories: DEPARTMENTS,
       linkedIndicatorCodes: [], dataSource: "manual", subMetrics: [],
       icon: "activity", color: "#4f46e4", description: "", isActive: true,
     }
   );
 
   const addSM = () =>
     setD(p => ({ ...p, subMetrics: [...p.subMetrics, { id: `sm_${Date.now()}`, label: "", weight: 33, hint: "" }] }));
 
   const removeSM = (id: string) =>
     setD(p => ({ ...p, subMetrics: p.subMetrics.filter(s => s.id !== id) }));
 
   const updateSM = (id: string, field: keyof SubMetric, value: string | number) =>
     setD(p => ({ ...p, subMetrics: p.subMetrics.map(s => s.id === id ? { ...s, [field]: value } : s) }));
 
   // Indicator selection for auto data source
   const [indicatorSearch, setIndicatorSearch] = useState("");
   const [showIndicatorPicker, setShowIndicatorPicker] = useState(false);
 
   const availableIndicators = allIndicators.filter(ind =>
     ind.indicator.toLowerCase().includes(indicatorSearch.toLowerCase()) ||
     ind.code.toLowerCase().includes(indicatorSearch.toLowerCase()) ||
     ind.programArea.toLowerCase().includes(indicatorSearch.toLowerCase())
   );
 
   const toggleIndicator = (code: string) => {
     setD(prev => {
       const codes = prev.linkedIndicatorCodes;
       return {
         ...prev,
         linkedIndicatorCodes: codes.includes(code)
           ? codes.filter(c => c !== code)
           : [...codes, code]
       };
     });
   };
 
   const handleSave = () => {
     if (!d.name.trim()) { toast.error("Name is required"); return; }
     if (d.weight < 1 || d.weight > 100) { toast.error("Weight must be 1–100"); return; }
     if (d.dataSource === "manual" && d.subMetrics.length === 0) { toast.error("Add at least one sub-metric"); return; }
     onSave(d);
   };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <h3 className="text-sm font-bold text-slate-900">{isNew ? "Add New Criterion" : `Edit: ${d.name}`}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Criterion Name *</label>
            <input value={d.name} onChange={e => setD(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Safe Motherhood Score"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={d.description} onChange={e => setD(p => ({ ...p, description: e.target.value }))}
              rows={2} placeholder="Describe what this criterion evaluates..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          </div>

          {/* Weight + Source */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Weight (%)</label>
              <input type="number" min={1} max={100} value={d.weight}
                onChange={e => setD(p => ({ ...p, weight: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data Source</label>
              <select value={d.dataSource} onChange={e => setD(p => ({ ...p, dataSource: e.target.value as "auto" | "manual" }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="auto">🔄 Auto (Master Plan)</option>
                <option value="manual">✍️ Manual Entry</option>
              </select>
            </div>
          </div>

{/* Color */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_SWATCHES.map(c => (
                <button key={c} onClick={() => setD(p => ({ ...p, color: c }))}
                  className={cn("w-7 h-7 rounded-lg border-2 transition-all", d.color === c ? "border-slate-900 scale-110" : "border-transparent")}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
 
          {/* Indicator Picker for Auto data source */}
          {d.dataSource === "auto" && (
            <div className="border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Linked Indicators ({d.linkedIndicatorCodes.length})
                </label>
                <button onClick={() => setShowIndicatorPicker(true)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800">
                  Edit Selection
                </button>
              </div>
              {d.linkedIndicatorCodes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {d.linkedIndicatorCodes.slice(0, 3).map(code => {
                    const ind = allIndicators.find(i => i.code === code);
                    return (
                      <span key={code} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 rounded-md text-indigo-700">
                        {ind?.indicator ?? code}
                      </span>
                    );
                  })}
                  {d.linkedIndicatorCodes.length > 3 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded-md">
                      +{d.linkedIndicatorCodes.length - 3} more
                    </span>
                  )}
                </div>
              )}
              {!d.linkedIndicatorCodes.length && (
                <p className="text-[10px] text-slate-400 italic">No indicators selected. Click "Edit Selection".</p>
              )}
              {showIndicatorPicker && (
                <div className="mt-3 p-3 border rounded-xl max-h-64 overflow-y-auto">
                  <input type="text" placeholder="Search indicators..." value={indicatorSearch}
                    onChange={e => setIndicatorSearch(e.target.value)}
                    className="w-full px-2 py-1 mb-2 border rounded text-xs" />
                  <div className="space-y-1">
                    {availableIndicators.map(ind => (
                      <label key={ind.code} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={d.linkedIndicatorCodes.includes(ind.code)}
                          onChange={() => toggleIndicator(ind.code)} />
                        <span className="truncate">{ind.programArea} – {ind.indicator}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <button onClick={() => setShowIndicatorPicker(false)}
                      className="text-xs text-indigo-600 font-bold">Done</button>
                  </div>
                </div>
              )}
            </div>
          )}
 
          {/* Sub-metrics */}
          {d.dataSource === "manual" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sub-Metrics</label>
                <button onClick={addSM}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors">
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {d.subMetrics.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4 border border-dashed rounded-xl">
                    Add at least one sub-metric
                  </p>
                )}
                {d.subMetrics.map((sm, idx) => (
                  <div key={sm.id} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 w-4 shrink-0">{idx + 1}.</span>
                      <input value={sm.label} onChange={e => updateSM(sm.id, "label", e.target.value)}
                        placeholder="Sub-metric label"
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                      <div className="flex items-center gap-1 shrink-0">
                        <input type="number" value={sm.weight} onChange={e => updateSM(sm.id, "weight", parseInt(e.target.value) || 0)}
                          className="w-14 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                        <span className="text-[10px] text-slate-400">%</span>
                      </div>
                      <button onClick={() => removeSM(sm.id)} className="p-1 text-red-400 hover:text-red-600 rounded shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <input value={sm.hint ?? ""} onChange={e => updateSM(sm.id, "hint", e.target.value)}
                      placeholder="Hint / description (optional)"
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-5 border-t bg-slate-50/50 shrink-0">
          <Button onClick={handleSave} className="flex-1 text-sm font-bold gap-2">
            <Save className="h-4 w-4" />
            {isNew ? "Add Criterion" : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={onClose} className="text-sm">Cancel</Button>
        </div>
      </div>
    </div>
  );
};

// ── Manual Entry Panel ────────────────────────────────────────────────────────

const ManualEntryPanel = ({
  criteria,
  periodKey,
  getScore,
  onScoreChange,
}: {
  criteria: AppraisalCriterion[];
  periodKey: string;
  getScore: (dept: string, critId: string, smId: string, pKey: string) => number;
  onScoreChange: (dept: string, critId: string, smId: string, score: number) => void;
}) => {
  const manualCriteria = criteria.filter(c => c.dataSource === "manual");
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]);
  const [activeCritId, setActiveCritId] = useState(manualCriteria[0]?.id ?? "");

  // Keep activeCritId valid when criteria list changes
  useEffect(() => {
    if (manualCriteria.length > 0 && !manualCriteria.find(c => c.id === activeCritId)) {
      setActiveCritId(manualCriteria[0].id);
    }
  }, [manualCriteria, activeCritId]);

  const activeCrit = manualCriteria.find(c => c.id === activeCritId);

  if (manualCriteria.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-400 italic">
        No manual criteria defined. All criteria use auto-calculation.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Department selector */}
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Department</p>
        <div className="flex flex-wrap gap-1.5">
          {DEPARTMENTS.map(d => (
            <button key={d} onClick={() => setSelectedDept(d)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all",
                selectedDept === d
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-700"
              )}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Criterion tabs */}
      <div className="border rounded-2xl overflow-hidden bg-white">
        <div className="flex border-b bg-slate-50/50 overflow-x-auto">
          {manualCriteria.map(c => {
            const CIcon = CRIT_ICONS[c.icon] ?? Activity;
            const isActive = activeCritId === c.id;
            return (
              <button key={c.id} onClick={() => setActiveCritId(c.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all whitespace-nowrap border-b-2",
                  isActive ? "border-b-2" : "border-transparent text-slate-500 hover:bg-slate-100"
                )}
                style={isActive ? { borderBottomColor: c.color, background: c.color + "15", color: c.color } : {}}>
                <CIcon className="h-3.5 w-3.5" />
                {c.name}
                <span className="opacity-60 font-mono ml-0.5">{c.weight}%</span>
              </button>
            );
          })}
        </div>

        {activeCrit && (
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <Info className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-500">{activeCrit.description}</p>
            </div>

            <div className="space-y-3">
              {activeCrit.subMetrics.map(sm => {
                const score = getScore(selectedDept, activeCrit.id, sm.id, periodKey);
                return (
                  <div key={sm.id} className="border border-slate-100 rounded-xl p-3 hover:border-slate-200 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800">{sm.label}</p>
                        {sm.hint && <p className="text-[10px] text-slate-400 mt-0.5">{sm.hint}</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">Weight: <span className="font-bold">{sm.weight}%</span> within criterion</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input type="number" min={0} max={100} value={score}
                          onChange={e => onScoreChange(selectedDept, activeCrit.id, sm.id, parseInt(e.target.value) || 0)}
                          className="w-20 px-3 py-2 border rounded-xl text-sm font-mono font-bold text-center focus:outline-none focus:ring-2 focus:border-transparent"
                          style={{ borderColor: activeCrit.color + "60", color: activeCrit.color } as React.CSSProperties} />
                        <span className="text-xs text-slate-400 font-bold">/ 100</span>
                      </div>
                    </div>
                    <ScoreBar score={score} color={activeCrit.color} h="h-2" />
                  </div>
                );
              })}
            </div>

            {/* Composite score for this dept × criterion */}
            {(() => {
              const subWeightSum = activeCrit.subMetrics.reduce((s, sm) => s + sm.weight, 0);
              const composite = subWeightSum > 0
                ? Math.round(
                    activeCrit.subMetrics.reduce((sum, sm) => {
                      return sum + getScore(selectedDept, activeCrit.id, sm.id, periodKey) * sm.weight;
                    }, 0) / subWeightSum
                  )
                : 0;
              return (
                <div className="flex items-center justify-between p-3 rounded-xl border-2"
                  style={{ borderColor: activeCrit.color + "40", background: activeCrit.color + "08" }}>
                  <span className="text-xs font-bold text-slate-600">
                    Composite — {selectedDept}
                  </span>
                  <span className="text-lg font-black tabular-nums" style={{ color: activeCrit.color }}>
                    {composite}%
                  </span>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Podium Card ───────────────────────────────────────────────────────────────

const PodiumCard = ({
  dept, rank, expanded, onToggle,
}: {
  dept: DeptScore; rank: 1 | 2 | 3;
  expanded: boolean; onToggle: () => void;
}) => {
  const badge = (["gold", "silver", "bronze"] as const)[rank - 1];
  const cfg = MEDAL_CFG[badge];
  const { Icon } = cfg;

  return (
    <button onClick={onToggle} className={cn("relative flex flex-col items-center w-full text-left transition-all duration-300", rank === 1 ? "scale-105 z-10" : "")}>
      <div className="relative z-10 p-2.5 rounded-full shadow-sm border" style={{ background: cfg.accent + "15", borderColor: cfg.accent + "40" }}>
        <Icon className="w-7 h-7" style={{ color: cfg.accent }} />
      </div>
      <div className={cn("w-full mt-2 rounded-xl border-2 p-4 transition-all", `bg-gradient-to-b ${cfg.bg}`, cfg.border, rank === 1 ? "pb-6" : "")}
        style={expanded ? { outline: `2px solid ${cfg.accent}`, outlineOffset: "2px" } : {}}>
        <div className="text-center">
          <span className="text-2xl font-black tabular-nums" style={{ color: cfg.accent }}>{dept.totalScore}%</span>
          <div className="flex items-center justify-center mt-1"><TrendBadge trend={dept.trend} /></div>
          <p className="text-xs font-semibold text-slate-900 mt-2 leading-snug">{dept.name}</p>
        </div>
        {expanded && (
          <div className="mt-3 space-y-2 border-t border-black/10 pt-3">
            {dept.criterionScores.map(cs => (
              <div key={cs.id} className="space-y-0.5">
                <div className="flex justify-between items-center text-[10px] gap-1">
                  <span className="text-slate-500 font-medium truncate max-w-[110px]">{cs.name}</span>
                  <span className="font-mono font-bold text-slate-800">{cs.score}%</span>
                </div>
                <ScoreBar score={cs.score} color={cs.color} />
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 flex justify-center">
          <span className={cn("text-[10px] font-bold uppercase tracking-widest", cfg.text)}>{cfg.label}</span>
        </div>
      </div>
    </button>
  );
};

// ── Leaderboard Row ───────────────────────────────────────────────────────────

const LeaderboardRow = ({ dept }: { dept: DeptScore }) => {
  const [open, setOpen] = useState(false);
  const badge = dept.rank <= 3 ? (["gold", "silver", "bronze"] as const)[dept.rank - 1] : "none";
  const cfg = MEDAL_CFG[badge];
  const { Icon } = cfg;

  return (
    <>
      <tr className={cn("border-b transition-colors cursor-pointer hover:bg-slate-50", open && "bg-indigo-50/20")}
        onClick={() => setOpen(o => !o)}>
        <td className="p-3">
          <span className="font-bold text-sm tabular-nums text-slate-400">{dept.rank}</span>
        </td>
        <td className="p-3">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 shrink-0" style={{ color: cfg.accent }} />
            <span className="font-medium text-sm text-slate-800">{dept.name}</span>
          </div>
        </td>
        <td className="p-3 text-center">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono"
            style={{ background: cfg.accent + "18", color: cfg.accent }}>
            {dept.totalScore}%
          </span>
        </td>
        {dept.criterionScores.map(cs => (
          <td key={cs.id} className="p-3 text-center hidden md:table-cell">
            <div className="flex flex-col items-center gap-1 max-w-[90px] mx-auto">
              <span className="font-mono text-xs font-semibold" style={{ color: cs.color }}>{cs.score}%</span>
              <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${cs.score}%`, background: cs.color }} />
              </div>
            </div>
          </td>
        ))}
        <td className="p-3 text-center"><TrendBadge trend={dept.trend} /></td>
        <td className="p-3 text-center">
          <ChevronRight className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-90")} />
        </td>
      </tr>

      {open && (
        <tr className="bg-slate-50/30 border-b">
          <td colSpan={20} className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dept.criterionScores.map(cs => {
                const weighted = Math.round((cs.score * cs.weight) / 100);
                return (
                  <div key={cs.id} className="border rounded-xl p-3 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: cs.color }} />
                        <span className="text-xs font-bold text-slate-800">{cs.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">×{cs.weight}%</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-700">{cs.score}% → {weighted} pts</span>
                    </div>
                    <ScoreBar score={cs.score} color={cs.color} h="h-2" />
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function RecognitionBoard({
  indicators: propIndicators = [],
  monthlyData = [],
}: {
  indicators?: Indicator[];
  monthlyData?: MonthlyEntry[];
}) {
  const { indicators: ctxIndicators } = useIndicators();
  const indicators = propIndicators.length > 0 ? propIndicators : ctxIndicators;

  // ── Period filters ──────────────────────────────────────────────────────
  const [selectedInterval, setSelectedInterval] = useState<"annual" | "six-month" | "quarterly">("annual");
  const [selectedPeriod, setSelectedPeriod] = useState("Annual Summary");

  useEffect(() => {
    if (selectedInterval === "annual") setSelectedPeriod("Annual Summary");
    else if (selectedInterval === "six-month") setSelectedPeriod("1st Half-Year (H1)");
    else setSelectedPeriod("1st Quarter (Q1)");
  }, [selectedInterval]);

  // ── Hook ────────────────────────────────────────────────────────────────
  const {
    activeCriteria,
    loadingCriteria,
    selectedEFY,
    setSelectedEFY,
    addCriterion,
    updateCriterion,
    deleteCriterion,
    getScore,
    upsertScore,
  } = useAppraisalCriteria(indicators);

  const pKey = makePeriodKey(selectedEFY, selectedInterval, selectedPeriod);

  // ── UI state ────────────────────────────────────────────────────────────
  const [viewTab, setViewTab] = useState("podium");
  const [activePanel, setActivePanel] = useState<"criteria" | "entry" | null>(null);
  const [expandedPodium, setExpandedPodium] = useState<number | null>(null);
  const [modalCrit, setModalCrit] = useState<"new" | AppraisalCriterion | null>(null);

  // ── Score change handler ────────────────────────────────────────────────
  const handleScoreChange = (deptName: string, criterionId: string, subMetricId: string, score: number) => {
    upsertScore({ deptName, criterionId, subMetricId, score: Math.max(0, Math.min(100, score)), periodKey: pKey, efy: selectedEFY });
  };

  // ── Criterion CRUD handlers ─────────────────────────────────────────────
  const handleSaveCrit = async (draft: DraftCriterion & { id?: string }) => {
    const totalOthers = activeCriteria
      .filter(c => c.id !== draft.id)
      .reduce((s, c) => s + c.weight, 0);
    if (totalOthers + draft.weight > 100) {
      toast.warning(`Total weights would reach ${totalOthers + draft.weight}%. Please adjust to sum to 100%.`);
    }

    if (draft.id) {
      await updateCriterion(draft.id, {
        name: draft.name, weight: draft.weight,
        departmentCategories: draft.departmentCategories,
        linkedIndicatorCodes: draft.linkedIndicatorCodes,
        dataSource: draft.dataSource, subMetrics: draft.subMetrics,
        icon: draft.icon, color: draft.color, description: draft.description,
      });
    } else {
      await addCriterion({ ...draft, efy: selectedEFY });
    }
    setModalCrit(null);
  };

  // ── Score computation ───────────────────────────────────────────────────
  const rankedDepts = useMemo<DeptScore[]>(() => {
    const months = PERIOD_MAP[selectedInterval]?.[selectedPeriod] ?? PERIOD_MAP.annual["Annual Summary"];
    const totalWeight = activeCriteria.reduce((s, c) => s + c.weight, 0);
    const trends: DeptScore["trend"][] = ["up", "stable", "down", "stable", "up", "stable", "up", "down", "stable", "up", "stable", "down"];

    return DEPARTMENTS.map((deptName, idx) => {
      let totalWeightedScore = 0;

const criterionScores = activeCriteria.map(crit => {
         let score = 0;
 
         if (crit.dataSource === "auto") {
           // Use linked indicators if specified, otherwise fallback to department filter
           const linkedInds = crit.linkedIndicatorCodes.length > 0
             ? indicators.filter(ind => crit.linkedIndicatorCodes.includes(ind.code))
             : indicators.filter(ind => crit.departmentCategories.includes(ind.programArea));
           let totalAch = 0, count = 0;
           linkedInds.forEach(ind => {
             const periodData = monthlyData.filter(e => e.code === ind.code && months.includes(e.month));
             const actual = periodData.reduce((s, e) => s + (e.actual ?? 0), 0);
             const targetScaled = (ind.target / 12) * months.length;
             const ratio = targetScaled > 0 ? actual / targetScaled : 0;
             totalAch += Math.min(1, ratio) * 100;
             count++;
           });
           score = count > 0 ? Math.round(totalAch / count) : 0;
         } else {
          const subWeightSum = crit.subMetrics.reduce((s, sm) => s + sm.weight, 0);
          if (subWeightSum > 0) {
            const weighted = crit.subMetrics.reduce((sum, sm) => {
              return sum + getScore(deptName, crit.id, sm.id, pKey) * sm.weight;
            }, 0);
            score = Math.round(weighted / subWeightSum);
          }
        }

        totalWeightedScore += score * crit.weight;
        return { id: crit.id, name: crit.name, weight: crit.weight, score, color: crit.color };
      });

      const totalScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

      return {
        name: deptName,
        totalScore,
        rank: 0,
        criterionScores,
        trend: trends[idx % trends.length],
        badge: "none" as const,
        indicatorCount: indicators.filter(i => i.programArea === deptName).length,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((d, i) => ({
      ...d,
      rank: i + 1,
      badge: (i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "none") as DeptScore["badge"],
    }));
  }, [indicators, monthlyData, activeCriteria, getScore, pKey, selectedInterval, selectedPeriod]);

  const topThree = rankedDepts.slice(0, 3);
  const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean) as DeptScore[];
  const avgScore = rankedDepts.length > 0
    ? Math.round(rankedDepts.reduce((s, d) => s + d.totalScore, 0) / rankedDepts.length)
    : 0;
  const totalW = activeCriteria.reduce((s, c) => s + c.weight, 0);

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/Plan compass.png" alt="Plan Compass" className="h-10 w-10 object-contain rounded-lg shadow-sm" />
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Hospital Recognition Board</h2>
            <p className="text-xs text-slate-500">
              Active Block: <strong className="text-amber-600 uppercase">{selectedEFY}</strong>
              <span className="mx-1.5 text-slate-300">·</span>
              {selectedPeriod}
            </p>
          </div>
        </div>
        {/* Criteria weight chips */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {activeCriteria.map(c => {
            const CIcon = CRIT_ICONS[c.icon] ?? Activity;
            return (
              <div key={c.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white shadow-sm text-xs">
                <CIcon className="h-3 w-3 shrink-0" style={{ color: c.color }} />
                <span className="text-slate-500 truncate max-w-[90px]">{c.name}</span>
                <span className="font-bold tabular-nums" style={{ color: c.color }}>{c.weight}%</span>
              </div>
            );
          })}
          <div className={cn(
            "flex items-center px-2.5 py-1.5 rounded-lg border text-xs font-bold tabular-nums",
            totalW === 100 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
          )}>
            {totalW === 100 ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : <AlertCircle className="h-3.5 w-3.5 mr-1" />}
            Σ {totalW}%
          </div>
        </div>
      </div>

      {/* ── Period Filter ────────────────────────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-indigo-500" />
          <div>
            <h4 className="text-xs font-bold text-slate-800">Dynamic Appraisal Matrix Controls</h4>
            <p className="text-[10px] text-slate-400">Toggle EFY, reporting interval, and specific period.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select value={selectedEFY} onChange={e => setSelectedEFY(e.target.value)}
            className="h-9 px-3 border border-indigo-200 rounded-xl text-xs bg-indigo-50/45 text-indigo-900 font-bold focus:outline-none cursor-pointer">
            {EFY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={selectedInterval} onChange={e => setSelectedInterval(e.target.value as any)}
            className="h-9 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 font-bold focus:outline-none cursor-pointer">
            <option value="annual">Annual YTD</option>
            <option value="six-month">Six-Month</option>
            <option value="quarterly">Quarterly</option>
          </select>
          {selectedInterval !== "annual" && (
            <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}
              className="h-9 px-3 border border-indigo-200 rounded-xl text-xs bg-white text-indigo-900 font-bold focus:outline-none cursor-pointer">
              {Object.keys(PERIOD_MAP[selectedInterval] ?? {}).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Panel Toggles ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Criteria Manager toggle */}
        <button onClick={() => setActivePanel(activePanel === "criteria" ? null : "criteria")}
          className={cn(
            "flex items-center gap-3 p-4 rounded-2xl border text-left transition-all",
            activePanel === "criteria"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
              : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30"
          )}>
          <Settings2 className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold">Criteria Manager</p>
            <p className={cn("text-[11px] truncate", activePanel === "criteria" ? "text-indigo-200" : "text-slate-400")}>
              {activeCriteria.length} criteria · Σ {totalW}%
            </p>
          </div>
          <ChevronDown className={cn("h-4 w-4 ml-auto shrink-0 transition-transform", activePanel === "criteria" && "rotate-180")} />
        </button>

        {/* Manual Entry toggle */}
        <button onClick={() => setActivePanel(activePanel === "entry" ? null : "entry")}
          className={cn(
            "flex items-center gap-3 p-4 rounded-2xl border text-left transition-all",
            activePanel === "entry"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
              : "bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30"
          )}>
          <ClipboardList className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold">Manual Data Entry</p>
            <p className={cn("text-[11px] truncate", activePanel === "entry" ? "text-emerald-200" : "text-slate-400")}>
              Quality, Audit & Reporting scores
            </p>
          </div>
          <ChevronDown className={cn("h-4 w-4 ml-auto shrink-0 transition-transform", activePanel === "entry" && "rotate-180")} />
        </button>
      </div>

      {/* ── Criteria Manager Panel ────────────────────────────────────── */}
      {activePanel === "criteria" && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-50 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Appraisal Criteria Manager ({selectedEFY})</h3>
              <p className="text-[11px] text-slate-500">Define, weight, and manage evaluation criteria for department appraisal.</p>
            </div>
            <Button size="sm" onClick={() => setModalCrit("new")} className="text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Criterion
            </Button>
          </div>

          <div className="space-y-2">
            {loadingCriteria && <p className="text-xs text-slate-400 italic text-center py-4">Loading criteria…</p>}
            {!loadingCriteria && activeCriteria.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded-2xl">
                <Settings2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">No criteria defined</p>
                <p className="text-xs text-slate-300 mt-1">Click "Add Criterion" to get started</p>
              </div>
            )}
            {activeCriteria.map(c => {
              const CIcon = CRIT_ICONS[c.icon] ?? Activity;
              return (
                <div key={c.id} className="flex items-start gap-4 p-4 rounded-xl border hover:border-slate-300 transition-colors bg-slate-50/30">
                  <div className="p-2 rounded-xl shrink-0" style={{ background: c.color + "15" }}>
                    <CIcon className="h-4 w-4" style={{ color: c.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-800">{c.name}</span>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border"
                        style={{ color: c.color, borderColor: c.color + "40", background: c.color + "10" }}>
                        {c.weight}% weight
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
                        {c.dataSource === "auto" ? "🔄 Auto" : "✍️ Manual"}
                      </span>
                    </div>
                    {c.description && <p className="text-[11px] text-slate-500 mt-0.5">{c.description}</p>}
                    {c.dataSource === "manual" && c.subMetrics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.subMetrics.map(sm => (
                          <span key={sm.id} className="text-[10px] px-1.5 py-0.5 bg-white border rounded-md text-slate-500">
                            {sm.label} <span className="text-slate-400">{sm.weight}%</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setModalCrit(c)}
                      className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteCriterion(c.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={cn(
            "p-3 rounded-xl border text-center text-xs font-bold",
            totalW === 100 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
          )}>
            {totalW === 100 ? "✅ Weights sum to 100% — properly balanced" : `⚠️ Weights sum to ${totalW}% — adjust to reach 100%`}
          </div>
        </div>
      )}

      {/* ── Manual Entry Panel ────────────────────────────────────────── */}
      {activePanel === "entry" && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-emerald-50 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Manual Score Entry</h3>
            <p className="text-[11px] text-slate-500">
              Scores for <strong>{selectedPeriod}</strong> · <strong>{selectedEFY}</strong> — saved per department automatically.
            </p>
          </div>
          <ManualEntryPanel
            criteria={activeCriteria}
            periodKey={pKey}
            getScore={getScore}
            onScoreChange={handleScoreChange}
          />
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center border bg-slate-50/20">
          <p className="text-xl font-extrabold text-slate-900">{rankedDepts.length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departments</p>
        </Card>
        <Card className="p-3 text-center border bg-slate-50/20">
          <p className="text-xl font-extrabold text-amber-600">{rankedDepts[0]?.totalScore ?? 0}%</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Score</p>
        </Card>
        <Card className="p-3 text-center border bg-slate-50/20">
          <p className="text-xl font-extrabold text-indigo-600">{avgScore}%</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital Average</p>
        </Card>
      </div>

      {/* ── Main Tabs ─────────────────────────────────────────────────── */}
      <Tabs value={viewTab} onValueChange={setViewTab} className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-fit flex gap-1 border">
          <TabsTrigger value="podium" className="text-xs px-3 py-1.5 font-bold flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />Podium View
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="text-xs px-3 py-1.5 font-bold flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />Full Rankings
          </TabsTrigger>
        </TabsList>

        {/* Podium */}
        <TabsContent value="podium" className="mt-4">
          <div className="flex flex-col md:flex-row justify-center items-center md:items-end gap-6 pb-6 pt-4 max-w-3xl mx-auto">
            {([
              { dept: podiumOrder[0], rank: 2 as const },
              { dept: podiumOrder[1], rank: 1 as const },
              { dept: podiumOrder[2], rank: 3 as const },
            ]).filter(x => x.dept).map(({ dept, rank }) => {
              const badge = (["gold", "silver", "bronze"] as const)[rank - 1];
              const cfg = MEDAL_CFG[badge];
              const podiumIdx = rank - 1;
              return (
                <div key={dept.name} className={cn("shrink-0", rank === 1 ? "w-[200px]" : "w-[180px]")}>
                  <PodiumCard dept={dept} rank={rank}
                    expanded={expandedPodium === podiumIdx}
                    onToggle={() => setExpandedPodium(expandedPodium === podiumIdx ? null : podiumIdx)} />
                  <div className={cn(`mt-2 rounded-t-sm ${cfg.podiumH} ${cfg.podiumBg} flex items-center justify-center border-t`)}>
                    <span className={cn("font-black", cfg.podiumNum)}>{rank}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {rankedDepts.length > 3 && (
            <Card className="rounded-2xl border bg-white p-5 shadow-sm">
              <CardHeader className="pb-3 border-b p-0 mb-4">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">All Other Departments</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100 p-0">
                {rankedDepts.slice(3).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-3 py-2.5">
                    <span className="text-sm font-bold text-slate-400 w-5 tabular-nums">{i + 4}</span>
                    <Award className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="flex-1 text-sm font-semibold text-slate-800">{d.name}</span>
                    <TrendBadge trend={d.trend} />
                    <div className="flex gap-1.5">
                      {d.criterionScores.map(cs => (
                        <span key={cs.id} className="text-[10px] font-mono px-1.5 py-0.5 rounded-md hidden sm:inline-block"
                          style={{ color: cs.color, background: cs.color + "12" }}>
                          {cs.score}%
                        </span>
                      ))}
                    </div>
                    <span className="font-mono text-sm font-bold text-indigo-600 w-12 text-right tabular-nums">{d.totalScore}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="mt-4">
          <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b bg-slate-50/50">
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-400 w-14">Rank</th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-400">Department</th>
                    <th className="p-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 w-24">Total</th>
                    {activeCriteria.map(c => (
                      <th key={c.id} className="p-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: c.color }} />
                          <span className="max-w-[80px] truncate">{c.name.split(" ")[0]}</span>
                          <span className="opacity-50 font-mono">{c.weight}%</span>
                        </div>
                      </th>
                    ))}
                    <th className="p-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 w-16">Trend</th>
                    <th className="p-3 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {rankedDepts.map(d => <LeaderboardRow key={d.name} dept={d} />)}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

{/* ── Criterion Modal ───────────────────────────────────────────── */}
       {modalCrit !== null && (
         <CriterionModal
           initial={modalCrit === "new" ? null : { ...modalCrit }}
           efy={selectedEFY}
           allIndicators={indicators}
           onSave={handleSaveCrit}
           onClose={() => setModalCrit(null)}
         />
       )}
    </div>
  );
}