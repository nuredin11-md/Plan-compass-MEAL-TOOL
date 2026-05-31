import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  CheckCircle, 
  XCircle, 
  MinusCircle, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  MessageSquare, 
  Search,
  Filter,
  Check,
  AlertCircle
} from "lucide-react";
import type { Section, AssessmentData, CriterionAnswer, Domain, Criterion } from "./ipcData";
import { calculateDomainScore, getScoreLevel } from "./ipcData";

interface Props {
  section: Section;
  data: AssessmentData;
  onChange: (data: AssessmentData) => void;
}

function AnswerButton({ 
  value, 
  current, 
  onClick, 
  children, 
  icon: Icon, 
  colorClasses
}: { 
  value: CriterionAnswer; 
  current: CriterionAnswer; 
  onClick: () => void; 
  children: React.ReactNode; 
  icon: React.ElementType; 
  colorClasses: string;
}) {
  const isActive = current === value;
  return (
    <Button 
      type="button"
      size="sm" 
      variant={isActive ? "default" : "outline"} 
      className={`h-8 px-2.5 text-xs gap-1 transition-all rounded-lg select-none ${
        isActive 
          ? colorClasses 
          : "hover:bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-950 hover:border-slate-350"
      }`} 
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" /> 
      {children}
    </Button>
  );
}

function CriterionRow({ 
  criterion, 
  entry, 
  onAnswer, 
  onComment 
}: { 
  criterion: Criterion; 
  entry: { answer: CriterionAnswer; comment: string }; 
  onAnswer: (answer: CriterionAnswer) => void; 
  onComment: (comment: string) => void; 
}) {
  const [showComment, setShowComment] = useState(!!entry.comment);
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className={`p-4 rounded-xl border transition-all text-left ${
      entry.answer === "yes" 
        ? "border-emerald-500/20 bg-emerald-500/[0.02]" 
        : entry.answer === "no" 
          ? "border-rose-500/20 bg-rose-500/[0.02]" 
          : entry.answer === "na" 
            ? "border-slate-300/30 bg-slate-500/[0.02]" 
            : "border-slate-200/80 bg-white"
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        {/* Criterion Description Text */}
        <div className="flex-1 space-y-1">
          <p className="text-xs font-semibold text-slate-800 leading-relaxed">
            {criterion.text}
          </p>
          {showGuide && (
            <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-lg text-[11px] text-slate-600 flex gap-1.5 items-start mt-2">
              <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-700 block mb-0.5">Auditing Guideline:</span>
                <p className="leading-normal">{criterion.guide}</p>
              </div>
            </div>
          )}
        </div>

        {/* Buttons and actions */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 select-none">
          {/* Guide toggle button */}
          <Button 
            type="button"
            variant="ghost" 
            size="icon" 
            onClick={() => setShowGuide(!showGuide)}
            className={`h-8 w-8 rounded-lg shrink-0 ${showGuide ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-900"}`}
            title="Read auditing guideline instructions"
          >
            <Info className="h-4 w-4" />
          </Button>

          {/* Yes, No, NA Answers actions */}
          <div className="flex items-center gap-1">
            <AnswerButton 
              value="yes" 
              current={entry.answer} 
              onClick={() => onAnswer("yes")} 
              icon={CheckCircle} 
              colorClasses="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
            >
              Yes
            </AnswerButton>
            <AnswerButton 
              value="no" 
              current={entry.answer} 
              onClick={() => onAnswer("no")} 
              icon={XCircle} 
              colorClasses="bg-rose-600 text-white hover:bg-rose-700 font-semibold"
            >
              No
            </AnswerButton>
            <AnswerButton 
              value="na" 
              current={entry.answer} 
              onClick={() => onAnswer("na")} 
              icon={MinusCircle} 
              colorClasses="bg-slate-400 text-white hover:bg-slate-500 font-semibold"
            >
              N/A
            </AnswerButton>
          </div>

          {/* Comment icon */}
          <Button 
            type="button"
            variant="ghost" 
            size="icon" 
            onClick={() => setShowComment(!showComment)}
            className={`h-8 w-8 rounded-lg shrink-0 ${showComment || entry.comment ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-900"}`}
            title="Add audit observation comments"
          >
            <MessageSquare className={`h-4 w-4 ${entry.comment ? "text-blue-500 fill-blue-50" : ""}`} />
          </Button>
        </div>
      </div>

      {showComment && (
        <div className="mt-3">
          <Textarea 
            value={entry.comment} 
            onChange={e => onComment(e.target.value)} 
            placeholder="Document observed gap details, specific ward numbers, stocking issues, or remediation timelines..." 
            className="text-xs min-h-[50px] bg-slate-50/50 border-slate-200 rounded-lg text-slate-800 focus:bg-white" 
          />
        </div>
      )}
    </div>
  );
}

function DomainCard({ 
  domain, 
  data, 
  onChange,
  searchTerm,
  unansweredOnly 
}: { 
  domain: Domain; 
  data: AssessmentData; 
  onChange: (id: string, field: "answer" | "comment", value: string) => void;
  searchTerm: string;
  unansweredOnly: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const score = calculateDomainScore(domain, data);
  const matchedLevel = getScoreLevel(score.percentage);

  // Filter criteria inside domain according to search and unanswered filter
  const filteredCriteria = useMemo(() => {
    return domain.criteria.filter(c => {
      // 1. Text filter
      const textMatch = c.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                     c.guide.toLowerCase().includes(searchTerm.toLowerCase());
      if (!textMatch) return false;

      // 2. Unanswered filter
      if (unansweredOnly) {
        const entry = data[c.id];
        const isAnswered = entry && entry.answer !== "";
        return !isAnswered;
      }

      return true;
    });
  }, [domain.criteria, searchTerm, unansweredOnly, data]);

  const answeredCount = score.yesCount + score.noCount + score.naCount;
  const isCompleted = answeredCount === domain.criteria.length;

  return (
    <Card className={`border-slate-200/70 shadow-sm overflow-hidden bg-white/60 backdrop-blur-sm transition-all duration-200 ${
      !expanded ? "hover:border-slate-350" : ""
    }`}>
      <CardHeader 
        className="py-3 px-4 cursor-pointer hover:bg-slate-50/50 transition-colors select-none border-b border-slate-100" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Domain Title details */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
            <Badge variant="outline" className="font-mono text-[10px] font-bold text-slate-500 border-slate-300">
              {domain.number}
            </Badge>
            <CardTitle className="text-xs md:text-sm font-bold text-slate-800 truncate">
              {domain.name}
            </CardTitle>
          </div>

          {/* Domain progress and rates indicators */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            {/* Answered progress fractions */}
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCompleted ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {answeredCount}/{domain.criteria.length} Answered
              </span>
            </div>

            {/* Score indicators */}
            <div className="flex items-center gap-2.5">
              <div className="w-16 hidden md:block">
                <Progress value={score.percentage} className="h-1.5 bg-slate-100 [&>div]:bg-emerald-500" />
              </div>
              <Badge className={`text-[11px] font-bold px-2 py-0.5 rounded text-white border-transparent ${matchedLevel.bg}`}>
                {answeredCount > 0 ? `${Math.round(score.percentage)}%` : "—"}
              </Badge>
              {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </div>
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="px-4 py-4 space-y-3.5 bg-slate-50/25">
          {filteredCriteria.length === 0 ? (
            <div className="p-8 text-center bg-white border border-dashed border-slate-250 rounded-xl text-slate-450 text-xs">
              {unansweredOnly ? (
                <div className="space-y-1">
                  <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-700">All questions answered in this domain!</p>
                  <p>Great job. Turn off "Unanswered Only" to review responses.</p>
                </div>
              ) : (
                <p>No questions matched your search query in this domain.</p>
              )}
            </div>
          ) : (
            filteredCriteria.map(c => {
              const entry = data[c.id] || { answer: "" as CriterionAnswer, comment: "" };
              return (
                <CriterionRow 
                  key={c.id} 
                  criterion={c} 
                  entry={entry} 
                  onAnswer={a => onChange(c.id, "answer", a)} 
                  onComment={cm => onChange(c.id, "comment", cm)} 
                />
              );
            })
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function AssessmentSection({ section, data, onChange }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [unansweredOnly, setUnansweredOnly] = useState(false);

  // Overall answers progress inside Section
  const sectionStats = useMemo(() => {
    let totalQuestions = 0;
    let answeredQuestions = 0;

    section.domains.forEach(dom => {
      totalQuestions += dom.criteria.length;
      dom.criteria.forEach(crit => {
        const entry = data[crit.id];
        if (entry && entry.answer !== "") {
          answeredQuestions++;
        }
      });
    });

    const completionPercent = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    return {
      totalQuestions,
      answeredQuestions,
      completionPercent: Math.round(completionPercent)
    };
  }, [section, data]);

  const handleChange = (id: string, field: "answer" | "comment", value: string) => {
    onChange({
      ...data,
      [id]: {
        ...(data[id] || { answer: "", comment: "" }),
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/70 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Search criteria or guidelines..." 
            className="pl-9 h-9 text-xs border-slate-200 bg-slate-50/50 focus:bg-white rounded-lg" 
          />
        </div>

        {/* Filters Toggles */}
        <div className="flex flex-wrap items-center gap-5 justify-between">
          <div className="flex items-center space-x-2">
            <Switch 
              id="switch-unanswered" 
              checked={unansweredOnly} 
              onCheckedChange={setUnansweredOnly} 
              className="data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="switch-unanswered" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 select-none cursor-pointer">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              Unanswered Only
            </Label>
          </div>

          <div className="text-left md:text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Section Completion Progress
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-bold text-slate-700">
                {sectionStats.answeredQuestions} / {sectionStats.totalQuestions} questions
              </span>
              <Badge className="bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 font-bold text-[10px]">
                {sectionStats.completionPercent}% Complete
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar meter */}
      <div className="space-y-1.5 p-1">
        <Progress value={sectionStats.completionPercent} className="h-2 bg-slate-100 [&>div]:bg-blue-600 rounded-full" />
      </div>

      {/* List of Domains */}
      <div className="space-y-5">
        {section.domains.map(domain => (
          <DomainCard 
            key={domain.id} 
            domain={domain} 
            data={data} 
            onChange={handleChange} 
            searchTerm={searchTerm}
            unansweredOnly={unansweredOnly}
          />
        ))}
      </div>
    </div>
  );
}
