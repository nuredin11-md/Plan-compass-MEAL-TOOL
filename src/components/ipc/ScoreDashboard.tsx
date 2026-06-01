import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useIPCAssessment } from "@/hooks/useIPCAssessment";
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { 
  Trophy, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  SlidersHorizontal,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  BookmarkAlert,
  ChevronRight,
  Sparkles
} from "lucide-react";
import type { AssessmentData, HospitalInfo } from "./ipcData";
import { 
  sectionI, 
  sectionII, 
  calculateDomainScore, 
  calculateSectionScore, 
  getScoreLevel 
} from "./ipcData";

interface Props {
  data: AssessmentData;
  hospitalInfo: HospitalInfo;
}

function ScoreGauge({ percentage, label, size = "lg" }: { percentage: number; label: string; size?: "lg" | "sm" }) {
  const level = getScoreLevel(percentage);
  const circumference = 2 * Math.PI * 45;
  const filled = (percentage / 100) * circumference;
  const dim = size === "lg" ? 130 : 95;
  const strokeColor = percentage >= 80 
    ? "#10b981" 
    : percentage >= 60 
      ? "#3b82f6" 
      : percentage >= 40 
        ? "#f59e0b" 
        : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/40 border border-slate-100/50 shadow-xs">
      <svg width={dim} height={dim} viewBox="0 0 100 100" className="drop-shadow-sm select-none">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle 
          cx="50" 
          cy="50" 
          r="45" 
          fill="none" 
          stroke={strokeColor} 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeDasharray={`${filled} ${circumference - filled}`} 
          strokeDashoffset={circumference / 4} 
          className="transition-all duration-1000 ease-out" 
        />
        <text x="50" y="46" textAnchor="middle" className="fill-slate-800 font-sans" fontSize={size === "lg" ? "20" : "18"} fontWeight="800">
          {Math.round(percentage)}%
        </text>
        <text x="50" y="62" textAnchor="middle" fill={strokeColor} fontSize="8" fontWeight="700" className="uppercase tracking-wider">
          {level.label.split(" ")[0]}
        </text>
      </svg>
      <p className={`font-semibold text-center leading-normal ${size === "lg" ? "text-xs text-slate-700" : "text-[11px] text-slate-550"} max-w-[120px]`}>
        {label}
      </p>
    </div>
  );
}

export default function ScoreDashboard({ data, hospitalInfo }: Props) {
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmittingState] = useState(false);
  const { saveIPCAssessment } = useIPCAssessment();
  
  const s1Score = useMemo(() => calculateSectionScore(sectionI, data), [data]);
  const s2Score = useMemo(() => calculateSectionScore(sectionII, data), [data]);

  const overallPct = useMemo(() => {
    const totalApplicable = s1Score.applicable + s2Score.applicable;
    return totalApplicable > 0 ? ((s1Score.totalYes + s2Score.totalYes) / totalApplicable) * 100 : 0;
  }, [s1Score, s2Score]);

  // Handle saving draft to Supabase
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const result = await saveIPCAssessment(
        hospitalInfo,
        data,
        s1Score.totalYes + s2Score.totalYes,
        overallPct,
        'draft',
        s1Score.percentage,
        s2Score.percentage
      );
      if (result.success) {
        console.log("Draft saved with ID:", result.id);
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle submitting final assessment to Supabase
  const handleSubmitAssessment = async () => {
    setIsSubmittingState(true);
    try {
      const result = await saveIPCAssessment(
        hospitalInfo,
        data,
        s1Score.totalYes + s2Score.totalYes,
        overallPct,
        'submitted',
        s1Score.percentage,
        s2Score.percentage
      );
      if (result.success) {
        console.log("Assessment submitted with ID:", result.id);
      }
    } finally {
      setIsSubmittingState(false);
    }
  };

  const overallLevel = getScoreLevel(overallPct);

  const domainData = useMemo(() => {
    const all = [...sectionI.domains, ...sectionII.domains];
    return all.map(d => {
      const s = calculateDomainScore(d, data);
      return {
        name: d.name.length > 25 ? d.name.slice(0, 25) + "..." : d.name,
        fullName: d.name,
        pct: Math.round(s.percentage),
        yes: s.yesCount,
        no: s.noCount,
        na: s.naCount,
        section: sectionI.domains.includes(d) ? "I" : "II"
      };
    });
  }, [data]);

  const radarData = useMemo(() => domainData.map(d => ({
    subject: d.name,
    score: d.pct,
    fullMark: 100
  })), [domainData]);

  const pieParts = useMemo(() => {
    const totalYes = s1Score.totalYes + s2Score.totalYes;
    const totalNo = s1Score.totalNo + s2Score.totalNo;
    const totalNA = s1Score.totalNA + s2Score.totalNA;
    return [
      { name: "Compliant (Yes)", value: totalYes, color: "#10b981" },
      { name: "Non-Compliant (No)", value: totalNo, color: "#ef4444" },
      { name: "N/A Skipped", value: totalNA, color: "#94a3b8" },
    ].filter(p => p.value > 0);
  }, [s1Score, s2Score]);

  // Weak areas (prioritized) sorted lowest score first, having actual answers
  const weakDomains = useMemo(() => {
    return domainData
      .filter(d => d.pct < 75 && (d.yes + d.no) > 0)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5);
  }, [domainData]);

  const exportToCSV = () => {
    try {
      const headers = ["Section", "Domain Number", "Domain Name", "Criterion ID", "Question Text", "Auditing Guideline", "Response Answer", "Commentary Remarks"];
      const rows: string[][] = [];

      // Add descriptive metadata block at the top
      rows.push(["IPC FLAT SCORE COMPLIANCE REPORT CARD"]);
      rows.push(["Hospital Name", hospitalInfo.hospitalName || "Unnamed Hospital"]);
      rows.push(["Location Address", hospitalInfo.location || "N/A"]);
      rows.push(["Assessment Date", hospitalInfo.assessmentDate || "N/A"]);
      rows.push(["Assessor(s)", hospitalInfo.assessorNames || "N/A"]);
      rows.push(["Beds Capacity", hospitalInfo.totalBeds || "N/A"]);
      rows.push(["Health Professionals Count", hospitalInfo.totalHealthProfessionals || "N/A"]);
      rows.push(["Support Staff Count", hospitalInfo.totalSupportStaff || "N/A"]);
      rows.push([]);
      rows.push(["SUMMARY SCORES ANALYSIS"]);
      rows.push(["Overall IPC FLAT Score Ratio", `${Math.round(overallPct)}%`, `Grade Category: ${overallLevel.label}`]);
      rows.push(["Section I Score Ratio (Scope & System)", `${Math.round(s1Score.percentage)}%`]);
      rows.push(["Section II Score Ratio (Practices & Compliance)", `${Math.round(s2Score.percentage)}%`]);
      rows.push(["Total Yes (Compliant Items)", String(s1Score.totalYes + s2Score.totalYes)]);
      rows.push(["Total No (Non-Compliant)", String(s1Score.totalNo + s2Score.totalNo)]);
      rows.push(["Total N/A (Excluded Items)", String(s1Score.totalNA + s2Score.totalNA)]);
      rows.push([]);
      rows.push(headers);

      // Loop Section I and Section II elements
      [sectionI, sectionII].forEach(sec => {
        sec.domains.forEach(dom => {
          dom.criteria.forEach(crit => {
            const entry = data[crit.id] || { answer: "", comment: "" };
            rows.push([
              sec.name,
              dom.number,
              dom.name,
              crit.id,
              crit.text.replace(/"/g, '""'),
              crit.guide.replace(/"/g, '""'),
              entry.answer ? entry.answer.toUpperCase() : "UNANSWERED",
              entry.comment ? entry.comment.replace(/"/g, '""') : ""
            ]);
          });
        });
      });

      // Map rows into CSV encoded contents
      const csvStr = rows.map(r => r.map(cell => {
        const escaped = String(cell).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(",")).join("\n");

      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvStr], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `IPC_FLAT_Audit_Report_${(hospitalInfo.hospitalName || "Hospital").replace(/\s+/g, "_")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("CSV Export crashed", err);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Panel with Gauges */}
      <Card className="border-slate-200/50 shadow-md bg-gradient-to-br from-white/90 to-slate-50/50 backdrop-blur-sm relative overflow-hidden">
        {/* Absolute design aesthetic decoration */}
        <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-100 pb-5 mb-5">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Audit Snapshot</p>
              <h3 className="text-base font-extrabold text-slate-800 mt-0.5">
                {hospitalInfo.hospitalName || "Registered Hospital Profile"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {hospitalInfo.location || "Undetermined Location"} • Record Date: {hospitalInfo.assessmentDate || "N/A"}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col md:flex-row gap-2 shrink-0">
              <Button 
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold gap-2 px-4 shadow-sm h-9 rounded-lg cursor-pointer transition-all hover:translate-y-[-1px] disabled:opacity-50"
              >
                <FileSpreadsheet className="h-4 w-4" /> {isSavingDraft ? "Saving..." : "Save Draft"}
              </Button>
              <Button 
                type="button"
                onClick={handleSubmitAssessment}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold gap-2 px-4 shadow-sm h-9 rounded-lg cursor-pointer transition-all hover:translate-y-[-1px] disabled:opacity-50"
              >
                <FileSpreadsheet className="h-4 w-4" /> {isSubmitting ? "Submitting..." : "Submit Audit"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex justify-center md:border-r border-slate-100/80 pr-1">
              <ScoreGauge percentage={overallPct} label="Overall IPC FLAT Score" />
            </div>
            <div className="flex justify-center md:border-r border-slate-100/80 pr-1">
              <ScoreGauge percentage={s1Score.percentage} label="Section I - Capacity & System" size="sm" />
            </div>
            <div className="flex justify-center">
              <ScoreGauge percentage={s2Score.percentage} label="Section II - Practices & Compliance" size="sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats widgets grid row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Trophy, label: "Compliance Grade", value: `${Math.round(overallPct)}%`, sub: overallLevel.label, color: "bg-blue-500" },
          { icon: Shield, label: "Total Safe (Yes)", value: s1Score.totalYes + s2Score.totalYes, sub: "Compliant parameters", color: "bg-emerald-500" },
          { icon: AlertTriangle, label: "Total Deficit (No)", value: s1Score.totalNo + s2Score.totalNo, sub: "Remedial actions needed", color: "bg-red-500" },
          { icon: TrendingUp, label: "Applicable Audits", value: s1Score.applicable + s2Score.applicable, sub: `of ${s1Score.applicable + s2Score.applicable + s1Score.totalNA + s2Score.totalNA} checked`, color: "bg-indigo-500" },
        ].map((kpi, index) => (
          <Card key={index} className="border-slate-200/50 shadow-sm bg-white/60 backdrop-blur-sm overflow-hidden relative">
            <CardContent className="py-4 px-4 flex items-center gap-3.5 leading-normal">
              <div className={`p-2.5 rounded-lg text-white ${kpi.color}`}>
                <kpi.icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">{kpi.label}</p>
                <p className="text-xl font-extrabold text-slate-800 tracking-tight mt-0.5">{kpi.value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium truncate">{kpi.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Visualizers group row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horizontal bar chart */}
        <Card className="border-slate-200/50 shadow-sm overflow-hidden bg-white/70 backdrop-blur-sm">
          <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100 text-left">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-500" /> Executive Domain Performance (%)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pr-4 pl-0">
            <div className="h-80 text-xs font-bold">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={domainData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={10} />
                  <YAxis type="category" dataKey="name" width={140} fontSize={9} stroke="#64748b" />
                  <RechartsTooltip formatter={(v: number) => [`${v}%`, "Domain Score"]} />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                    {domainData.map((d, i) => {
                      const col = d.pct >= 80 
                        ? "#10b981" 
                        : d.pct >= 60 
                          ? "#3b82f6" 
                          : d.pct >= 40 
                            ? "#f59e0b" 
                            : "#ef4444";
                      return <Cell key={i} fill={col} />;
                    })}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Coverage Radar */}
        <Card className="border-slate-200/50 shadow-sm overflow-hidden bg-white/70 backdrop-blur-sm">
          <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100 text-left">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-505 text-indigo-550" /> IPC Strategic Coverage Area Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex justify-center">
            <div className="h-80 w-full text-xs max-w-sm">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" fontSize={8} stroke="#475569" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} fontSize={8} />
                  <Radar name="Scoring" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom widgets row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <Card className="border-slate-200/50 shadow-sm overflow-hidden bg-white/70 backdrop-blur-sm">
          <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100 text-left">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" /> Response Audit Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 flex items-center justify-center">
            <div className="h-64 w-full text-xs font-semibold max-w-xs relative flex flex-col justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieParts} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={75} 
                    innerRadius={45} 
                    label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`} 
                    fontSize={10}
                    fontWeight="700"
                  >
                    {pieParts.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priorities Weak Areas Warning Card */}
        <Card className="border-slate-200/50 shadow-sm overflow-hidden bg-white/70 backdrop-blur-sm text-left">
          <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0" /> Bottom Priority Improvement Areas
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500 font-medium">
              We identified these domains as having compliance scores below 75%. Urgently implement correcting SOPs.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 pb-5">
            {weakDomains.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Sparkles className="h-8 w-8 text-amber-500 mx-auto animate-bounce" />
                <p className="font-bold text-slate-800 text-sm">Outstanding IPC Compliance! 🎉</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  All 10 domains are performing at or above 75%. Keep doing this splendid job.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {weakDomains.map((d, index) => {
                  const level = getScoreLevel(d.pct);
                  return (
                    <div key={d.fullName} className="space-y-1.5 p-3 rounded-lg border border-slate-100 bg-slate-50/30">
                      <div className="flex items-center justify-between gap-3 font-semibold">
                        <span className="text-xs text-slate-800 truncate max-w-[70%]">
                          {index + 1}. {d.fullName}
                        </span>
                        <Badge className={`text-[10px] font-bold text-white border-transparent ${level.bg}`}>
                          {d.pct}%
                        </Badge>
                      </div>
                      <Progress value={d.pct} className="h-1.5 bg-slate-150 [&>div]:bg-amber-500" />
                      <div className="flex items-center justify-between text-[10px] text-slate-450 font-bold font-mono">
                        <span>Current Audit: {d.yes}Y / {d.no}N / {d.na}NA</span>
                        <span className="text-rose-600 font-bold">{d.no} Active Discrepancies</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed domains breakdown table */}
      <Card className="border-slate-200/50 shadow-sm overflow-hidden bg-white/75 backdrop-blur-sm">
        <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Consolidated IPC Domain Scoring Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-150 bg-slate-50/30 text-[10px] uppercase font-bold text-slate-450 select-none">
                  <th className="py-3 px-4 font-extrabold">Section</th>
                  <th className="py-3 px-4 font-extrabold">Operational Domain Name</th>
                  <th className="py-3 px-3 text-center font-extrabold">Yes</th>
                  <th className="py-3 px-3 text-center font-extrabold">No</th>
                  <th className="py-3 px-3 text-center font-extrabold">N/A</th>
                  <th className="py-3 px-4 text-center font-extrabold">Compliance Ratio</th>
                  <th className="py-3 px-4 text-center font-extrabold">Rating Status</th>
                </tr>
              </thead>
              <tbody>
                {domainData.map((d, index) => {
                  const level = getScoreLevel(d.pct);
                  return (
                    <tr key={index} className="border-b border-slate-100/50 hover:bg-slate-50/40 font-medium transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-bold font-mono">Sec {d.section}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{d.fullName}</td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-extrabold">{d.yes}</td>
                      <td className="py-3 px-3 text-center text-rose-600 font-extrabold">{d.no}</td>
                      <td className="py-3 px-3 text-center text-slate-450">{d.na}</td>
                      <td className="py-3 px-4 text-center font-black text-slate-900">{d.pct}%</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={`text-[10px] font-bold text-white border-transparent ${level.bg}`}>
                          {level.label.split(" ")[0]}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
