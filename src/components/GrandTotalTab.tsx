import React, { useState, useMemo } from "react";
import { useIndicators } from "@/context/IndicatorsContext";
import { useDatabase } from "@/hooks/useDatabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Download, TrendingUp, Filter, X } from "lucide-react";
import { exportToCSV } from "@/lib/exportUtils";

interface GrandTotalTabProps {
  monthlyData: any[];
  selectedYear: number;
  previousYearData: any[];
  setMonthlyData: React.Dispatch<React.SetStateAction<any[]>>;
  selectedEFY: string;
  onEFYChange: (newEFY: string) => Promise<void>;
}

export default function GrandTotalTab({
  monthlyData,
  selectedYear,
  previousYearData,
  setMonthlyData,
  selectedEFY,
  onEFYChange
}: GrandTotalTabProps) {
  const { indicators } = useIndicators();
  const { fetchHospitalPerformanceData } = useDatabase();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [filterArea, setFilterArea] = useState("all");
  const [loading, setLoading] = useState(false);

  // Fetch performance rows for current year
  const [dbPerformanceRows, setDbPerformanceRows] = useState<any[]>([]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchHospitalPerformanceData();
        if (active) {
          setDbPerformanceRows(data || []);
        }
      } catch (err) {
        console.error("[GrandTotalTab] Failed to load performance rows:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [fetchHospitalPerformanceData, selectedYear]);

  const currentEfyLabel = `${selectedYear} EFY`;

  // Calculate actual from monthly data
  const getActual = (code: string): number => {
    const entries = monthlyData.filter((e: any) => e.code === code && e.actual !== null);
    const monthlyEntries = entries.filter((e: any) => e.month !== "Annual" && e.month !== "Annual Target");
    if (monthlyEntries.length > 0) {
      return monthlyEntries.reduce((sum: number, e: any) => sum + (e.actual ?? 0), 0);
    }
    const annualEntry = entries.find((e: any) => e.month === "Annual");
    return annualEntry ? (annualEntry.actual ?? 0) : 0;
  };

  // Filter indicators that have actual values AND a target
  const grandTotalIndicators = useMemo(() => {
    const currentEfyLabel = `${selectedYear} EFY`;
    
    return indicators
      .map((ind) => {
        // Find the plan row for current year
        const matchRow = (row: any) => {
          const slugified = row.indicator_name
            ? row.indicator_name
                .toUpperCase()
                .replace(/[^A-Z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "")
                .slice(0, 100)
            : "";
          return slugified === ind.code || row.indicator_name === ind.indicator;
        };

        const planRow = dbPerformanceRows.find(
          (r) => matchRow(r) && r.fiscal_year === currentEfyLabel && r.metric_type === "Plan"
        ) ?? dbPerformanceRows.find(
          (r) => matchRow(r) && r.fiscal_year === currentEfyLabel && r.metric_type === "EAP"
        );

        const target = planRow && planRow.metric_value != null ? Number(planRow.metric_value) : ind.target;
        const actual = getActual(ind.code);

        // Only include if both actual and target exist (baseline + target > 0 is always true if target > 0)
        if (actual <= 0 || target <= 0) return null;

        const percent = target > 0 ? Math.round((actual / target) * 100) : 0;

        return {
          ...ind,
          target,
          actual,
          percent,
        };
      })
      .filter((item: any) => item !== null);
  }, [indicators, dbPerformanceRows, monthlyData, selectedYear]);

  const filteredIndicators = useMemo(() => {
    let list = grandTotalIndicators;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r: any) =>
          r.code.toLowerCase().includes(q) ||
          r.indicator.toLowerCase().includes(q) ||
          r.programArea.toLowerCase().includes(q)
      );
    }
    if (filterArea !== "all") list = list.filter((r: any) => r.programArea === filterArea);
    return list;
  }, [grandTotalIndicators, search, filterArea]);

  const uniqueProgramAreas = useMemo(
    () => Array.from(new Set(indicators.map((i) => i.programArea))).sort(),
    [indicators]
  );

  const handleExportCSV = () => {
    if (filteredIndicators.length === 0) {
      toast.error("No data to export");
      return;
    }
    const data = filteredIndicators.map((r: any) => ({
      "Code": r.code,
      "Program Area": r.programArea,
      "Indicator": r.indicator,
      "Unit": r.unit,
      "Annual Target": r.target,
      "Actual YTD": r.actual,
      "% Achieved": r.percent,
    }));
    exportToCSV(data, `GrandTotal_${selectedYear}_Export`);
    toast.success("Exported as CSV");
  };

  const clearFilters = () => {
    setSearch("");
    setFilterArea("all");
  };

  const hasFilters = search || filterArea !== "all";

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    const totalTarget = filteredIndicators.reduce((sum: number, r: any) => sum + r.target, 0);
    const totalActual = filteredIndicators.reduce((sum: number, r: any) => sum + r.actual, 0);
    const overallPercent = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    return { totalTarget, totalActual, overallPercent };
  }, [filteredIndicators]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading grand total data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900 text-white p-4 border border-slate-800 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-sm font-extrabold tracking-tight text-white uppercase">Grand Total Dashboard</h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Overview of all indicators with actual values and targets for {selectedYear} EFY
          </p>
        </div>
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 gap-1.5 text-xs text-white hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-blue-600 font-medium">Total Indicators</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sans tabular-nums text-blue-900">
                  {filteredIndicators.length}
                </span>
              </div>
            </div>
            <div className="bg-blue-200 p-2.5 rounded-xl">
              <TrendingUp className="h-5 w-5 text-blue-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-emerald-600 font-medium">Grand Total Target</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sans tabular-nums text-emerald-900">
                  {grandTotals.totalTarget.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="bg-emerald-200 p-2.5 rounded-xl">
              <TrendingUp className="h-5 w-5 text-emerald-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-purple-600 font-medium">Grand Total Actual</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sans tabular-nums text-purple-900">
                  {grandTotals.totalActual.toLocaleString()}
                </span>
                <span className="text-xs text-purple-600 font-medium">
                  ({grandTotals.overallPercent}%)
                </span>
              </div>
            </div>
            <div className="bg-purple-200 p-2.5 rounded-xl">
              <TrendingUp className="h-5 w-5 text-purple-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1 min-w-0">
          <div className="relative min-w-[200px] flex-1 max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search code, name, area…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm bg-background border border-input text-foreground font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Program Areas</SelectItem>
              {uniqueProgramAreas.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 gap-1.5 text-xs text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Grand Total List */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-muted-foreground/25 scrollbar-track-transparent">
          {filteredIndicators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-muted/50 p-4 rounded-full mb-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">No indicators with data</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Indicators will appear here once they have both actual values and targets recorded for the selected fiscal year.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[600px] text-xs border-collapse table-auto">
              <thead className="sticky top-0 z-30 bg-muted/90 backdrop-blur-sm border-b">
                <tr>
                  <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left w-[120px]">
                    Code
                  </th>
                  <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left min-w-[200px]">
                    Indicator
                  </th>
                  <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left min-w-[140px]">
                    Program Area
                  </th>
                  <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-[100px]">
                    Annual Target
                  </th>
                  <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-[100px]">
                    Actual YTD
                  </th>
                  <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-[100px]">
                    Grand Total
                  </th>
                  <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-[100px]">
                    % Achieved
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y bg-background">
                {filteredIndicators.map((row: any) => (
                  <tr
                    key={row.code}
                    className="hover:bg-muted/50 transition-colors group"
                  >
                    <td className="p-3 font-mono text-xs font-semibold border-r text-primary text-left bg-background group-hover:bg-slate-50/80 w-[120px]">
                      {row.code}
                    </td>
                    <td className="p-3 text-left font-medium min-w-[200px] whitespace-normal break-words border-r text-foreground bg-background group-hover:bg-slate-50/80">
                      <div className="line-clamp-2 text-xs leading-normal font-medium text-slate-800">
                        {row.indicator}
                      </div>
                    </td>
                    <td className="p-3 text-left text-muted-foreground text-xs border-r">
                      {row.programArea}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-500 tabular-nums bg-background group-hover:bg-slate-50/80">
                      {row.target.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-indigo-600 tabular-nums bg-background group-hover:bg-slate-50/80">
                      {row.actual.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 tabular-nums bg-background group-hover:bg-slate-50/80">
                      {row.actual.toLocaleString()}
                    </td>
                    <td className="p-3 text-center bg-background group-hover:bg-slate-50/80">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.percent >= 90
                            ? "bg-emerald-100 text-emerald-800"
                            : row.percent >= 70
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {row.percent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
