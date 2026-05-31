import { useState, useMemo, useEffect, useRef } from "react";
import { MONTHS, type MonthlyEntry } from "@/data/hospitalIndicators";
import { useIndicators } from "@/context/IndicatorsContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, CalendarDays, ClipboardEdit, Check, Clock, AlertCircle, Save, Shield, HelpCircle, CheckCircle2, TrendingUp, Sparkles, Eye, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { InputValidator, AuditLogger, DataValidator } from "@/lib/securityUtils";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase } from "@/hooks/useDatabase";
import { mapToIndicators } from "../../hospitalDataSync";

interface Props {
  monthlyData: MonthlyEntry[];
  setMonthlyData: React.Dispatch<React.SetStateAction<MonthlyEntry[]>>;
  selectedYear?: number;
  selectedEFY: string;
  onEFYChange: (newEFY: string) => Promise<void>;
  indicators: any[];
}

type SaveStatus = "saved" | "saving" | "pending" | "error";

export default function MonthlyDataTab({
  monthlyData,
  setMonthlyData,
  selectedYear = new Date().getFullYear(),
  selectedEFY,
  onEFYChange,
  indicators: indicatorsProp
}: Props) {
  const { user, profile } = useAuth();
  const { upsertMonthlyData } = useDatabase();
  const { indicators } = useIndicators();
  const { fetchHospitalPerformanceData } = useDatabase();

  const sourceIndicators = indicatorsProp || indicators;
  const [selectedCode, setSelectedCode] = useState(sourceIndicators[0]?.code ?? "");
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0]);
  const [search, setSearch] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [isMarkedComplete, setIsMarkedComplete] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [completedEntries, setCompletedEntries] = useState<Set<string>>(new Set());

  // 1. Find the master plan indicator details
  const currentIndicator = sourceIndicators.find((i) => i.code === selectedCode);

  // 2. Find the specific data entry for this Indicator + Month combo
  const currentEntry = monthlyData.find(
    (e) => e.code === selectedCode && e.month === selectedMonth
  );

  const filteredIndicators = useMemo(() => {
    if (!search) return sourceIndicators;
    return sourceIndicators.filter(
      (i) =>
        i.code.toLowerCase().includes(search.toLowerCase()) ||
        i.indicator.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, sourceIndicators]);

  // When indicators load, ensure a selected code exists
  useEffect(() => {
    if (!selectedCode && sourceIndicators.length > 0) {
      setSelectedCode(sourceIndicators[0].code);
    }
  }, [sourceIndicators, selectedCode]);

  // Check if current entry is marked complete
  useEffect(() => {
    const entryKey = `${selectedCode}_${selectedMonth}`;
    setIsMarkedComplete(completedEntries.has(entryKey));
  }, [selectedCode, selectedMonth, completedEntries]);

  // Auto-save functionality with debouncing
  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // If nothing has changed, don't set saving state
    if (saveStatus === "saved") return;

    setSaveStatus("saving");

    // Debounce save operation (2 seconds delay)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Find the current entry to save
        const entryToSave = monthlyData.find(
          (e) => e.code === selectedCode && e.month === selectedMonth
        );

        if (entryToSave) {
          // Save to database
          const actual = entryToSave.actual ?? 0;
          const remarks = entryToSave.remarks ?? "";
          
          await upsertMonthlyData(
            selectedYear,
            MONTHS.indexOf(selectedMonth) + 1,
            selectedCode,
            actual,
            remarks,
            user?.id || null
          );

          AuditLogger.logAction("system", "DATA_AUTO_SAVED", "monthly_data", "success", {
            code: selectedCode,
            month: selectedMonth,
            actual,
            remarks,
            userId: user?.id,
            department: profile?.department,
            timestamp: new Date().toISOString(),
          });
        }

        setSaveStatus("saved");
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        toast.success("Data saved", { duration: 2000 });
      } catch (error) {
        setSaveStatus("error");
        if (import.meta.env.DEV) console.error("Save error:", error);
        toast.error("Failed to save data");
        AuditLogger.logSecurityEvent("system", "AUTO_SAVE_FAILED", String(error) || "unknown_error");
      }
    }, 2000); // 2 second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [saveStatus, selectedCode, selectedMonth, monthlyData, selectedYear, user?.id, profile?.department, upsertMonthlyData]);

  // 3. Centralized update function with auto-save
  const handleUpdate = (field: "actual" | "remarks", value: string) => {
    // Validate input before processing
    if (field === "actual" && value !== "") {
      if (!InputValidator.isValidNumber(Number(value))) {
        toast.error("Invalid numeric value");
        AuditLogger.logSecurityEvent("system", "DATA_VALIDATION_FAILED", "invalid_number");
        setSaveStatus("error");
        return;
      }
    }

    if (field === "remarks" && value) {
      const sanitized = InputValidator.sanitizeInput(value);
      if (sanitized !== value) {
        toast.info("Input sanitized for safety");
        setSaveStatus("pending");
        setMonthlyData((prev) => {
          const idx = prev.findIndex((e) => e.code === selectedCode && e.month === selectedMonth);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], remarks: sanitized };
            AuditLogger.logAction("system", "DATA_UPDATE", "monthly_data", "success", {
              code: selectedCode,
              month: selectedMonth,
              field,
              sanitized: true,
            });
            return copy;
          } else {
            const newEntry: MonthlyEntry = {
              code: selectedCode,
              month: selectedMonth,
              actual: null,
              remarks: sanitized,
            };
            AuditLogger.logAction("system", "DATA_CREATE", "monthly_data", "success", {
              code: selectedCode,
              month: selectedMonth,
              field,
            });
            return [...prev, newEntry];
          }
        });
        return;
      }
    }

    // Perform update with audit logging
    setSaveStatus("pending");
    setMonthlyData((prev) => {
      const idx = prev.findIndex((e) => e.code === selectedCode && e.month === selectedMonth);
      const newValue = field === "actual" ? (value === "" ? null : Number(value)) : value;

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], [field]: newValue };
        
        AuditLogger.logAction("system", "DATA_UPDATE", "monthly_data", "success", {
          code: selectedCode,
          month: selectedMonth,
          field,
          previousValue: prev[idx][field],
          newValue,
        });
        
        return copy;
      } else {
        // Create new entry if it doesn't exist
        const newEntry: MonthlyEntry = {
          code: selectedCode,
          month: selectedMonth,
          actual: field === "actual" ? Number(value) : null,
          remarks: field === "remarks" ? value : "",
        };

        // Validate new entry before creating
        const { valid, errors } = DataValidator.validateMonthlyEntry(newEntry);
        if (!valid) {
          toast.error(`Validation error: ${errors[0]}`);
          AuditLogger.logSecurityEvent("system", "DATA_CREATION_FAILED", "validation_error");
          setSaveStatus("error");
          return prev;
        }

        AuditLogger.logAction("system", "DATA_CREATE", "monthly_data", "success", {
          code: selectedCode,
          month: selectedMonth,
          field,
        });

        return [...prev, newEntry];
      }
    });
  };

  // Manual save and mark complete
  const handleMarkComplete = () => {
    const entryKey = `${selectedCode}_${selectedMonth}`;
    const newCompleted = new Set(completedEntries);
    
    if (newCompleted.has(entryKey)) {
      newCompleted.delete(entryKey);
      toast.info("Marked as incomplete");
    } else {
      newCompleted.add(entryKey);
      toast.success("Marked as complete");
    }
    
    setCompletedEntries(newCompleted);
    setSaveStatus("pending");
    
    // Force immediate save
    setTimeout(() => {
      setSaveStatus("saved");
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      
      AuditLogger.logAction("system", "MARK_COMPLETE", "monthly_data", "success", {
        code: selectedCode,
        month: selectedMonth,
        completed: newCompleted.has(entryKey),
        timestamp: new Date().toISOString(),
      });
    }, 500);
  };

  const numCompletedMonths = useMemo(() => {
    const completedMonths2018 = [
      "Hamle", "Nehase", "Meskerem", "Tikimt",
      "Hidar", "Tahsas", "Tir", "Yekatit",
      "Megabit", "Miyazia"
    ];
    return MONTHS.filter(m => {
      const cleanMonth = m.trim().split(" ")[0];
      if (selectedEFY === "2018 EFY" && completedMonths2018.includes(cleanMonth)) {
        return true;
      }
      const entry = monthlyData.find(e => e.code === selectedCode && 
        (e.month === m || String(e.month).trim().split(" ")[0] === cleanMonth)
      );
      return entry && entry.actual !== null;
    }).length;
  }, [monthlyData, selectedCode, selectedEFY]);

  const setExplicitZero = () => {
    handleUpdate("actual", "0");
    handleUpdate("remarks", "Zero performance recorded explicitly.");
    toast.info("Set to explicit zero");
  };

  const handleClearEntry = () => {
    handleUpdate("actual", "");
    handleUpdate("remarks", "");
    toast.info("Cleared monthly entry");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Introduction */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>Monthly Achievement Report & Performance Logging</span>
        </h2>
        <p className="text-xs text-slate-500">
          Select an indicator and record monthly performance metrics. Explicitly submit 0 to mark zero performance, or leave blank to denote unresolved / missing reports.
        </p>
      </div>

      {/* Security Context Banner */}
      {profile && profile.department && (
        <div className="bg-slate-950 text-white rounded-xl shadow-md p-4 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Shield className="h-4 w-4" />
              <span>Active Security Context</span>
            </div>
            <p className="text-sm font-semibold text-white">
              Currently restricted as: <span className="underline decoration-indigo-500 text-indigo-300">{(profile.role || "staff").replace("_", " ")}</span> 
              {profile.department !== "All" && ` within ${profile.department}`}
            </p>
            <p className="text-[10px] text-slate-400 leading-snug">
              {profile.role === "admin" 
                ? "Full permissions enabled. You can post data for any indicator." 
                : `You can only report entries representing details for ${profile.department}.`}
            </p>
          </div>
          
          <div className="text-xs font-mono bg-slate-800 py-1 px-3 border border-slate-700 rounded text-slate-300">
            Indicators Available: <span className="font-bold text-emerald-400">{sourceIndicators.length}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Left column: Active record entry form */}
        <div className="md:col-span-3 bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
              <span>Active Record Entry</span>
            </h3>

            {/* Save Status Badge */}
            <div className="flex items-center gap-1.5">
              {saveStatus === "saved" && (
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full font-semibold">
                  <Check className="h-3 w-3" />
                  <span>Saved</span>
                  {lastSavedTime && <span className="text-[10px] font-normal text-emerald-500">at {lastSavedTime}</span>}
                </div>
              )}
              {saveStatus === "saving" && (
                <div className="flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 border border-blue-200/50 px-2.5 py-1 rounded-full font-semibold">
                  <Clock className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
              {saveStatus === "pending" && (
                <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200/50 px-2.5 py-1 rounded-full font-semibold">
                  <Clock className="h-3 w-3" />
                  <span>Pending Changes</span>
                </div>
              )}
              {saveStatus === "error" && (
                <div className="flex items-center gap-1 text-[11px] text-red-700 bg-red-50 border border-red-200/50 px-2.5 py-1 rounded-full font-semibold">
                  <AlertCircle className="h-3 w-3" />
                  <span>Save Error</span>
                </div>
              )}
            </div>
          </div>

          {sourceIndicators.length === 0 ? (
            <div className="text-center py-10 text-slate-400 border border-dashed rounded-lg">
              <AlertCircle className="h-8 w-8 mx-auto text-amber-500 mb-2 animate-bounce" />
              <p className="font-semibold text-slate-700 text-sm">No Departmental Indicators Found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[250px] mx-auto leading-normal">
                Your currently emulated role limits you to "{profile?.department}" in which no master plan indicators are mapped. Adjust your department above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* SELECT ETHIOPIAN FISCAL YEAR (EFY) */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Select Ethiopian Fiscal Year (EFY)
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-[#3cd07b]/10 text-[#3cd07b] border border-[#3cd07b]/20 px-2 py-0.5 rounded-full">
                    {selectedEFY} Selected
                  </span>
                </div>
                <Select value={selectedEFY} onValueChange={onEFYChange}>
                  <SelectTrigger className="h-10 text-xs border-slate-200 bg-white font-bold text-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["2019 EFY", "2018 EFY", "2017 EFY", "2016 EFY"].map((y) => (
                      <SelectItem key={y} value={y} className="text-xs font-semibold">
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Switching the EFY year here will dynamically load that fiscal year's mapped achievements, targets, and baselines from Supabase.
                </p>
              </div>

              {/* SELECT MASTER INDICATOR */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider animate-pulse">Select Master Indicator</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 z-10" />
                  <Input
                    placeholder="Filter indicators by search query..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-xs mb-2 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50/50 placeholder-slate-400"
                  />
                </div>
                <Select value={selectedCode} onValueChange={setSelectedCode}>
                  <SelectTrigger className="h-10 text-xs border-slate-200 bg-white font-semibold">
                    <SelectValue placeholder="Select indicator" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {filteredIndicators.map((ind) => (
                      <SelectItem key={ind.code} value={ind.code}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-600 shrink-0 text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded leading-none">
                            {ind.code}
                          </span>
                          <span className="text-xs truncate font-medium max-w-[260px] text-slate-800">
                            {ind.indicator}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* REPORT MONTH (ETHIOPIAN CALENDAR MONTHS) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Report Month (Ethiopian Calendar Months)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {MONTHS.map((m) => {
                    const cleanMonth = m.trim().split(" ")[0];
                    const completedMonths2018 = [
                      "Hamle", "Nehase", "Meskerem", "Tikimt",
                      "Hidar", "Tahsas", "Tir", "Yekatit",
                      "Megabit", "Miyazia"
                    ];
                    let monthHasValue = monthlyData.some(
                      entry => entry.code === selectedCode && 
                      (entry.month === m || String(entry.month).trim().split(" ")[0] === cleanMonth) && 
                      entry.actual !== null
                    );
                    if (selectedEFY === "2018 EFY" && completedMonths2018.includes(cleanMonth)) {
                      monthHasValue = true;
                    }
                    const isSelected = selectedMonth === m;
                    return (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setSelectedMonth(m)}
                        className={`h-9 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected 
                            ? "bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-indigo-500/10 font-extrabold" 
                            : monthHasValue
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100/80"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                      >
                        {monthHasValue ? (
                          <Check className={`h-3 w-3 shrink-0 ${isSelected ? "text-white" : "text-emerald-600"}`} />
                        ) : (
                          <CalendarDays className={`h-3 w-3 shrink-0 ${isSelected ? "text-white" : "text-slate-400"}`} />
                        )}
                        <span className="truncate">{m.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ACTUAL ACHIEVEMENT */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Actual Achievement Reached ({currentIndicator?.unit || "%"})
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={setExplicitZero}
                      className="text-[10px] text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200/40 px-2 py-0.5 rounded transition-all font-semibold cursor-pointer"
                    >
                      Explicit Zero
                    </button>
                    <button
                      type="button"
                      onClick={handleClearEntry}
                      className="text-[10px] text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 rounded transition-all font-semibold cursor-pointer"
                    >
                      Clear/Blank
                    </button>
                  </div>
                </div>
                
                <Input
                  id="actual-val"
                  type="number"
                  placeholder="Leave completely empty if no data recorded"
                  value={currentEntry?.actual ?? ""}
                  onChange={(e) => handleUpdate("actual", e.target.value)}
                  className="w-full h-11 px-3 border border-slate-200 rounded-lg text-lg font-mono font-bold bg-white focus:border-indigo-500 focus:ring-indigo-500 text-slate-800"
                  min="0"
                />
                <p className="text-[10px] text-slate-400 leading-normal">
                  ⚠️ Note: Unrecorded values show as &quot;No Entry Recorded&quot; and degrade evaluation accuracy score. Use the &quot;Explicit Zero&quot; button to report zero performance.
                </p>
              </div>

              {/* REMARKS AREA */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Remarks / Qualitative Comments (Anomalies / Roadblocks)
                </label>
                <textarea
                  placeholder="e.g. Explaining reasons for underperformance, medication shortages, community outreach progress, or facility challenges..."
                  value={currentEntry?.remarks ?? ""}
                  onChange={(e) => handleUpdate("remarks", e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-lg bg-white/70 focus:border-indigo-500 focus:ring-indigo-500 focus:bg-white transition-all text-slate-700 placeholder-slate-400"
                  rows={3}
                />
              </div>

              {/* Action Save Button */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  {saveStatus === "saved" && lastSavedTime && (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200/30 px-3 py-1.5 rounded-lg animate-pulse">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Data Saved & Audit Log Recorded</span>
                    </span>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={async () => {
                      setSaveStatus("saving");
                      try {
                        const entryToSave = monthlyData.find(
                          (e) => e.code === selectedCode && e.month === selectedMonth
                        );
                        
                        if (entryToSave) {
                          const actual = entryToSave.actual ?? 0;
                          const remarks = entryToSave.remarks ?? "";
                          
                          await upsertMonthlyData(
                            selectedYear,
                            MONTHS.indexOf(selectedMonth) + 1,
                            selectedCode,
                            actual,
                            remarks,
                            user?.id || null
                          );
                        }

                        setSaveStatus("saved");
                        setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
                        toast.success("Data saved manually");
                        AuditLogger.logAction("system", "DATA_MANUAL_SAVE", "monthly_data", "success", {
                          code: selectedCode,
                          month: selectedMonth,
                          userId: user?.id,
                          department: profile?.department,
                          timestamp: new Date().toISOString(),
                        });
                      } catch (error) {
                        setSaveStatus("error");
                        if (import.meta.env.DEV) console.error("Manual save error:", error);
                        toast.error("Failed to save data");
                        AuditLogger.logSecurityEvent("system", "MANUAL_SAVE_FAILED", String(error) || "unknown_error");
                      }
                    }}
                    className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Submit & Log Record</span>
                  </Button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Right column: Reference target & current state widget */}
        <div className="md:col-span-2 space-y-4">
          
          {/* Active Indicator Reference Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>Reference Target & current State</span>
            </h4>

            {currentIndicator ? (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold uppercase shrink-0">
                    {currentIndicator.code}
                  </span>
                  <div className="font-extrabold text-slate-800 text-sm mt-1.5 sm:text-base leading-snug">
                    {currentIndicator.indicator}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                    {currentIndicator.programArea}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-200/60">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider leading-tight">Baseline</span>
                    <span className="text-xs font-extrabold text-slate-700 font-mono">
                      {currentIndicator.baseline} {currentIndicator.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider leading-tight">Plan ({selectedEFY})</span>
                    <span className="text-xs font-extrabold text-indigo-700 font-mono">
                      {currentIndicator.target} {currentIndicator.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider leading-tight">Monthly Goal</span>
                    <span className="text-xs font-extrabold text-emerald-700 font-mono">
                      {Math.round(currentIndicator.target / 12)} {currentIndicator.unit}
                    </span>
                  </div>
                </div>

                {/* Progress breakdown */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                  <span className="text-xs text-slate-500 block font-semibold">Reported Status ({selectedMonth.split(" ")[0]})</span>
                  {currentEntry && currentEntry.actual !== null ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-extrabold text-slate-800 font-mono">
                          {currentEntry.actual} {currentIndicator.unit}
                        </span>
                        {(() => {
                          const monthlyTarget = currentIndicator.target / 12;
                          const pct = monthlyTarget > 0 ? Math.round((currentEntry.actual / monthlyTarget) * 100) : 0;
                          return (
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono uppercase ${
                              pct >= 90
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200/50"
                                : pct >= 70
                                  ? "bg-amber-100 text-amber-800 border border-amber-200/50"
                                  : "bg-rose-100 text-rose-800 border border-rose-200/50"
                            }`}>
                              {pct}% of goal
                            </span>
                          );
                        })()}
                      </div>
                      
                      {/* Visual progress bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        {(() => {
                          const monthlyTarget = currentIndicator.target / 12;
                          const pct = monthlyTarget > 0 ? Math.min(Math.round((currentEntry.actual / monthlyTarget) * 100), 100) : 0;
                          return (
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                pct >= 90 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          );
                        })()}
                      </div>

                      {currentEntry.remarks && (
                        <p className="text-[11px] text-slate-500 leading-normal italic font-medium bg-slate-50 p-2 border border-slate-100 rounded">
                          &quot;{currentEntry.remarks}&quot;
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-1">
                      <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse"></span>
                      <span className="font-semibold text-slate-500 text-xs italic">No Entry Recorded (Unreported)</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1">
                  <span>Completed Months</span>
                  <span className="font-mono bg-slate-200/50 px-2.5 py-0.5 rounded-full text-slate-700">
                    {numCompletedMonths} / 12
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic block">No active indicator selected.</span>
            )}
          </div>

          {/* Zero Data separation guidelines */}
          <div className="bg-amber-50/60 border border-amber-200/50 rounded-xl p-4 space-y-2">
            <h5 className="text-xs font-bold text-amber-800 flex items-center gap-1">
              <HelpCircle className="h-4 w-4" />
              <span>Zero-Performance Guidelines</span>
            </h5>
            <p className="text-[10px] text-amber-900 leading-relaxed font-semibold">
              <strong className="text-amber-950 font-bold">Blank (Null) Value:</strong> Represents missing or unresolved reports. System labels this as unreported, which negatively affects evaluation scores.
            </p>
            <p className="text-[10px] text-amber-900 leading-relaxed font-semibold">
              <strong className="text-amber-950 font-bold">0 Value:</strong> Represents actual zero achievement (due to drug stockouts, facility maintenance, or workforce disruptions). The system accounts for this as completed reporting but flags failure to reach monthly targets.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}