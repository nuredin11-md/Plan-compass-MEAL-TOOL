import { useState, useMemo, useCallback } from "react";
import { getStatus, getActualYTD, MONTHS, type MonthlyEntry } from "@/data/hospitalIndicators";
import { useIndicators } from "@/context/IndicatorsContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
  LineChart, Line,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pin, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  monthlyData: MonthlyEntry[];
  compareData?: MonthlyEntry[];
  currentYear: number;
  compareYear?: number;
}

const STATUS_COLORS_HEX = { green: "#22895a", yellow: "#cc8000", red: "#dc2626" };

export default function YearComparisonTab({ monthlyData, compareData, currentYear, compareYear }: Props) {
  const [selectedArea, setSelectedArea] = useState("all");
  const { indicators } = useIndicators();
  const areas = useMemo(() => [...new Set(indicators.map((i) => i.programArea))], [indicators]);

  const postWidgetToDashboard = useCallback((id: string, title: string, type: 'chart' | 'table', chartType: string, dataObj: unknown) => {
    const existingJson = localStorage.getItem("hospital_posted_dashboard_widgets");
    let existing: Array<{ id: string; title: string; type: string; chartType: string; data: unknown; addedAt: string }> = [];
    try {
      existing = existingJson ? JSON.parse(existingJson) : [];
    } catch(e) {
      console.warn("Error parsing dashboard widgets", e);
    }
    existing = existing.filter((item) => item.id !== id);
    existing.push({
      id,
      title,
      type,
      chartType,
      data: dataObj,
      addedAt: new Date().toISOString()
    });
    localStorage.setItem("hospital_posted_dashboard_widgets", JSON.stringify(existing));
    toast.success(`"${title}" pinned to Executive Dashboard!`);
  }, []);

  const getFilteredIndicators = () => {
    return selectedArea === "all" ? indicators : indicators.filter((i) => i.programArea === selectedArea);
  };

  // Side-by-side comparison
  const comparisonData = useMemo(() => {
    const filtered = getFilteredIndicators();
    return filtered.map((ind) => {
      const currentActual = getActualYTD(ind.code, monthlyData);
      const currentPercent = ind.target === 0 ? 0 : Math.round((currentActual / ind.target) * 100);
      const prevActual = compareData ? getActualYTD(ind.code, compareData) : 0;
      const prevPercent = ind.target === 0 ? 0 : Math.round((prevActual / ind.target) * 100);
      const change = currentPercent - prevPercent;
      return {
        code: ind.code,
        indicator: ind.indicator,
        programArea: ind.programArea,
        currentPercent,
        prevPercent,
        change,
        status: getStatus(currentPercent),
      };
    });
  }, [monthlyData, compareData, selectedArea]);

  // Area-level YoY comparison
  const areaYoY = useMemo(() => {
    return areas.map((area) => {
      const areaInds = indicators.filter((i) => i.programArea === area);
      let currentTotal = 0, prevTotal = 0;
      areaInds.forEach((ind) => {
        const cActual = getActualYTD(ind.code, monthlyData);
        currentTotal += ind.target === 0 ? 0 : Math.round((cActual / ind.target) * 100);
        if (compareData) {
          const pActual = getActualYTD(ind.code, compareData);
          prevTotal += ind.target === 0 ? 0 : Math.round((pActual / ind.target) * 100);
        }
      });
      const count = areaInds.length || 1;
      return {
        area: area.length > 15 ? area.substring(0, 15) + "…" : area,
        fullArea: area,
        current: Math.round(currentTotal / count),
        previous: compareData ? Math.round(prevTotal / count) : 0,
      };
    });
  }, [monthlyData, compareData]);

  // Monthly trend comparison
  const monthlyTrend = useMemo(() => {
    const filtered = getFilteredIndicators();
    return MONTHS.map((month, idx) => {
      let currentSum = 0, prevSum = 0;
      filtered.forEach((ind) => {
        const cEntry = monthlyData.find((e) => e.code === ind.code && e.month === month);
        currentSum += cEntry?.actual ?? 0;
        if (compareData) {
          const pEntry = compareData.find((e) => e.code === ind.code && e.month === month);
          prevSum += pEntry?.actual ?? 0;
        }
      });
      return {
        month: month.substring(0, 3),
        [String(currentYear)]: currentSum,
        ...(compareData ? { [String(compareYear)]: prevSum } : {}),
      };
    });
  }, [monthlyData, compareData, currentYear, compareYear, selectedArea]);

  if (!compareData) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="text-muted-foreground text-lg">Select a comparison year from the header to see year-over-year analysis.</p>
        <p className="text-sm text-muted-foreground mt-2">You need data from at least two different years to compare.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center">
        <Select value={selectedArea} onValueChange={setSelectedArea}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="All Program Areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Program Areas</SelectItem>
            {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          Comparing <strong>{currentYear}</strong> vs <strong>{compareYear}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area-level YoY bar chart */}
        <div className="rounded-lg border bg-card p-5 relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Program Area YoY Comparison (Avg %)</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => postWidgetToDashboard(
                "yoy-area-comparison",
                `YoY Area Comparison (${compareYear} vs ${currentYear})`,
                "chart",
                "yoy-bar",
                { data: areaYoY, prevYear: compareYear, currYear: currentYear }
              )}
              className="text-[10.5px] font-semibold flex items-center gap-1 h-7 px-2 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition"
            >
              <Pin className="w-3 h-3 text-indigo-500 fill-indigo-100" /> Pin to Dashboard
            </Button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaYoY} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="area" width={120} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="previous" name={String(compareYear)} fill="hsl(var(--muted))" radius={[0, 2, 2, 0]} />
                <Bar dataKey="current" name={String(currentYear)} fill="hsl(199, 89%, 38%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly trend line */}
        <div className="rounded-lg border bg-card p-5 relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Monthly Trend Comparison</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => postWidgetToDashboard(
                "yoy-monthly-trend",
                `YoY Monthly Trend (${compareYear} vs ${currentYear})`,
                "chart",
                "yoy-line",
                { data: monthlyTrend, prevYear: compareYear, currYear: currentYear }
              )}
              className="text-[10.5px] font-semibold flex items-center gap-1 h-7 px-2 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition"
            >
              <Pin className="w-3 h-3 text-indigo-500 fill-indigo-100" /> Pin to Dashboard
            </Button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={String(compareYear)} stroke="hsl(var(--muted))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                <Line type="monotone" dataKey={String(currentYear)} stroke="hsl(199, 89%, 38%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Indicator-level comparison table */}
      <div className="rounded-lg border bg-card p-5 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Indicator-Level Year-over-Year Change</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => postWidgetToDashboard(
              "yoy-indicator-table",
              `YoY Indicator Table (${compareYear} vs ${currentYear})`,
              "table",
              "yoy-table",
              { data: comparisonData, prevYear: compareYear, currYear: currentYear }
            )}
            className="text-[10.5px] font-semibold flex items-center gap-1 h-7 px-2 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition"
          >
            <Pin className="w-3 h-3 text-indigo-500 fill-indigo-100" /> Pin Table
          </Button>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0">
              <tr className="border-b bg-muted/50">
                <th className="table-header text-left p-2">Code</th>
                <th className="table-header text-left p-2 min-w-[200px]">Indicator</th>
                <th className="table-header text-right p-2">{compareYear} %</th>
                <th className="table-header text-right p-2">{currentYear} %</th>
                <th className="table-header text-right p-2">Change</th>
                <th className="table-header text-center p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((d, i) => (
                <tr key={d.code} className={`border-b last:border-0 ${i % 2 ? "bg-muted/10" : ""}`}>
                  <td className="p-2 font-mono text-xs text-primary">{d.code}</td>
                  <td className="p-2 text-xs">{d.indicator}</td>
                  <td className="p-2 text-right font-mono">{d.prevPercent}%</td>
                  <td className="p-2 text-right font-mono font-semibold">{d.currentPercent}%</td>
                  <td className="p-2 text-right font-mono font-semibold">
                    <span className={d.change > 0 ? "text-status-green" : d.change < 0 ? "text-status-red" : "text-muted-foreground"}>
                      {d.change > 0 ? "+" : ""}{d.change}%
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <span className={`status-badge-${d.status}`}>
                      {d.status === "green" ? "On Track" : d.status === "yellow" ? "At Risk" : "Off Track"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
