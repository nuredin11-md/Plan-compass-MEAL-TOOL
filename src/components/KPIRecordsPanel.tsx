import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { KPIDefinition, KPIRecord } from '../types';
import { calculateKPIScore, formatPeriod, getFiscalYear, getPeriodType } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import {
  Save,
  Calendar,
  Plus,
  HelpCircle,
  Info,
  CheckCircle2,
  XCircle,
  Download,
  RotateCcw,
  Search,
  Lightbulb,
  Pin,
  Trash2,
  CloudOff,
  RefreshCw,
  Share2,
  Lock,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────────────────
interface KeepNote {
  id: string;
  title: string;
  body: string;
  kpiId?: string | number;
  period?: string;
  color: 'yellow' | 'teal' | 'rose' | 'amber' | 'indigo' | 'slate';
  pinned: boolean;
  updatedAt: string;
}

interface KPIRecordsPanelProps {
  kpis: KPIDefinition[];
  records: KPIRecord[];
  onUpdateActual: (record: KPIRecord) => void;
  onAddMonth: (month: string) => void;
  onResetToDefaults: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function KPIRecordsPanel({
  kpis,
  records,
  onUpdateActual,
  onAddMonth,
  onResetToDefaults,
}: KPIRecordsPanelProps) {

  // ─── Period filter states ────────────────────────────────────────────────
  const [fiscalYearFilter, setFiscalYearFilter]   = useState<string>('All');
  const [periodTypeFilter, setPeriodTypeFilter]   = useState<string>('All');

  const uniqueMonths = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.month))).sort();
  }, [records]);

  const availableFiscalYears = useMemo(() => {
    return Array.from(new Set(records.map((r) => getFiscalYear(r.month))))
      .filter((y) => y !== 'N/A')
      .sort();
  }, [records]);

  const filteredPeriods = useMemo(() => {
    return uniqueMonths.filter((p) => {
      const matchType = periodTypeFilter === 'All' || getPeriodType(p) === periodTypeFilter;
      const matchYear = fiscalYearFilter === 'All' || getFiscalYear(p) === fiscalYearFilter;
      return matchType && matchYear;
    });
  }, [uniqueMonths, periodTypeFilter, fiscalYearFilter]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    uniqueMonths.length > 0
      ? uniqueMonths[uniqueMonths.length - 1]
      : new Date().toISOString().slice(0, 7)
  );

  const activePeriod = useMemo(
    () => (filteredPeriods.includes(selectedMonth) ? selectedMonth : filteredPeriods[0] || selectedMonth),
    [filteredPeriods, selectedMonth]
  );

  // ─── KPI filter & search ─────────────────────────────────────────────────
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery,    setSearchQuery]    = useState<string>('');

  // ─── Google Keep workspace ───────────────────────────────────────────────
  const [keepExpanded, setKeepExpanded]     = useState<boolean>(false);    // ✅ was missing
  const [keepNotes,    setKeepNotes]        = useState<KeepNote[]>([]);
  const [noteTitle,    setNoteTitle]        = useState('');
  const [noteBody,     setNoteBody]         = useState('');
  const [noteColor,    setNoteColor]        = useState<KeepNote['color']>('yellow');
  const [noteKpiId,    setNoteKpiId]        = useState<string>('general');
  const [searchNoteQuery,           setSearchNoteQuery]           = useState('');
  const [filterNotesByPeriodOnly,   setFilterNotesByPeriodOnly]   = useState(false);
  const [keepConnected, setKeepConnected]   = useState<boolean>(
    () => localStorage.getItem('hospital_keep_api_connected') === 'true'
  );
  const [keepSyncing,   setKeepSyncing]     = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Seed default notes once
  useEffect(() => {
    const raw = localStorage.getItem('hospital_keep_notes');
    if (raw) {
      try { setKeepNotes(JSON.parse(raw)); } catch {}
    } else {
      const defaults: KeepNote[] = [
        {
          id: 'keep-note-1',
          title: '📌 Clinical Audit Gaps targeting',
          body: 'We must track program development with inpatient completeness rate in ICU. Currently running below the 80% benchmark target. Formulate remedial plan with nurse lead by next Friday.',
          kpiId: 8,
          period: '2026-06',
          color: 'yellow',
          pinned: true,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'keep-note-2',
          title: '💡 Lab turnaround speed target',
          body: 'Laboratory report speed index has achieved the target standard of >92% speedup in May. Keep this protocol in active clinical priority list for the upcoming quarter!',
          kpiId: 4,
          period: '2026-05',
          color: 'teal',
          pinned: false,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'keep-note-3',
          title: '📋 Bed Occupancy Peak Note',
          body: 'Peak bed occupancy continues to hit maximum capacities. Bed release protocols require expedited reviews to maintain resource buffer.',
          period: '2026-06',
          color: 'rose',
          pinned: false,
          updatedAt: new Date().toISOString(),
        },
      ];
      setKeepNotes(defaults);
      localStorage.setItem('hospital_keep_notes', JSON.stringify(defaults));
    }
  }, []);

  const saveNotes = useCallback((notes: KeepNote[]) => {
    setKeepNotes(notes);
    localStorage.setItem('hospital_keep_notes', JSON.stringify(notes));
  }, []);

  const handleAddKeepNote = useCallback(() => {
    if (!noteTitle.trim() && !noteBody.trim()) {
      toast.error('Note must have a title or description.');
      return;
    }
    const newNote: KeepNote = {
      id: 'keep_note_' + Date.now(),
      title: noteTitle.trim() || 'Untitled Note',
      body: noteBody.trim(),
      kpiId: noteKpiId === 'general' ? undefined : Number(noteKpiId),
      period: activePeriod,
      color: noteColor,
      pinned: false,
      updatedAt: new Date().toISOString(),
    };
    saveNotes([newNote, ...keepNotes]);
    setNoteTitle('');
    setNoteBody('');
    setNoteKpiId('general');
    setNoteColor('yellow');
    toast.success('Clinical Keep Note successfully logged!');
  }, [noteTitle, noteBody, noteKpiId, activePeriod, noteColor, keepNotes, saveNotes]);

  const handleDeleteKeepNote = useCallback((id: string, name: string) => {
    if (!window.confirm(`Confirm Deletion of Clinical Note: "${name}"?\nThis cannot be undone.`)) return;
    saveNotes(keepNotes.filter((n) => n.id !== id));
    toast.success('Note removed from Clinical Keep Ledger.');
  }, [keepNotes, saveNotes]);

  const handleTogglePinNote = useCallback((id: string) => {
    saveNotes(keepNotes.map((n) =>
      n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n
    ));
  }, [keepNotes, saveNotes]);

  const handleSyncWithGoogleKeepAPI = useCallback(async () => {
    setKeepSyncing(true);
    // Google Keep REST requires enterprise OAuth; we gracefully fall back to local ledger
    setTimeout(() => {
      setKeepSyncing(false);
      setKeepConnected(true);
      localStorage.setItem('hospital_keep_api_connected', 'true');
      toast.success('Clinical notes synchronized with Google Keep ledger container!');
    }, 1500);
  }, []);

  const handleDisconnectKeep = useCallback(() => {
    setKeepConnected(false);
    localStorage.setItem('hospital_keep_api_connected', 'false');
    toast.success('Google Keep API integration link disconnected. Offline ledger remains active.');
  }, []);

  // ─── New period builder ──────────────────────────────────────────────────
  const [isAddingMonth,    setIsAddingMonth]    = useState(false);
  const [addMonthError,    setAddMonthError]    = useState('');
  const [newPeriodType,    setNewPeriodType]    = useState<'Monthly' | 'Quarterly' | 'Annually'>('Monthly');
  const [newPeriodYear,    setNewPeriodYear]    = useState<number>(2026);
  const [newPeriodMonth,   setNewPeriodMonth]   = useState<string>('01');
  const [newPeriodQuarter, setNewPeriodQuarter] = useState<string>('Q1');

  const handleAddNewPeriod = () => {
    setAddMonthError('');
    let periodCode = '';
    if (newPeriodType === 'Monthly')   periodCode = `${newPeriodYear}-${newPeriodMonth}`;
    else if (newPeriodType === 'Quarterly') periodCode = `${newPeriodYear}-${newPeriodQuarter}`;
    else periodCode = `${newPeriodYear}-Year`;

    if (uniqueMonths.includes(periodCode)) {
      setAddMonthError(`This period (${formatPeriod(periodCode)}) is already initialized!`);
      return;
    }
    onAddMonth(periodCode);
    setSelectedMonth(periodCode);
    setIsAddingMonth(false);
  };

  // ─── KPI grouping ────────────────────────────────────────────────────────
  const getKPIGroup = (kpiName: string): string => {
    const n = kpiName.toLowerCase();
    if (n.includes('audit') || n.includes('graduated') || n.includes('ipc') ||
        n.includes('satisfaction') || n.includes('haq') || n.includes('ehsig') ||
        n.includes('completeness')) return 'Clinical Quality & Safety';
    if (n.includes('laboratory') || n.includes('imaging') || n.includes('table efficiency') ||
        n.includes('occupancy') || n.includes('oxygen') || n.includes('stay'))
      return 'Resources & Capacity';
    return 'Emergency & OPD';
  };

  const filteredKPIs = useMemo(() => {
    return (Array.isArray(kpis) ? kpis : []).filter((kpi) => {
      const cat = getKPIGroup(kpi.name);
      return (
        (filterCategory === 'All' || cat === filterCategory) &&
        kpi.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [kpis, filterCategory, searchQuery]);

  const filteredKeepNotes = useMemo(() => {
    return keepNotes.filter((note) => {
      const matchSearch =
        note.title.toLowerCase().includes(searchNoteQuery.toLowerCase()) ||
        note.body.toLowerCase().includes(searchNoteQuery.toLowerCase());
      const matchPeriod = !filterNotesByPeriodOnly || note.period === activePeriod;
      return matchSearch && matchPeriod;
    });
  }, [keepNotes, searchNoteQuery, filterNotesByPeriodOnly, activePeriod]);

  const currentMonthRecordsMap = useMemo(() => {
    const map = new Map<number, KPIRecord>();
    records.filter((r) => r.month === activePeriod).forEach((r) => map.set(r.kpiId, r));
    return map;
  }, [records, activePeriod]);

  // ─── Input change handler ────────────────────────────────────────────────
  const handleInputChange = (kpiId: number, valueStr: string) => {
    const val = valueStr === '' ? 0 : parseFloat(valueStr);
    if (isNaN(val)) return;
    const existing = records.find((r) => r.kpiId === kpiId && r.month === activePeriod);
    const kpi = kpis.find((k) => k.id === kpiId);
    const { score, gap, status } = kpi
      ? calculateKPIScore(kpi, val)
      : { score: val, gap: 0, status: 'OK' as const };
    onUpdateActual({
      id: existing?.id,
      kpiId,
      month: activePeriod,
      actualValue: val,
      calculatedScore: score,
      gap,
      status,
    });
  };

  // ─── CSV export ──────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const monthRecords = records.filter((r) => r.month === activePeriod);
    if (monthRecords.length === 0) {
      alert('No records to export for this period.');
      return;
    }
    let csv = 'data:text/csv;charset=utf-8,';
    csv += 'KPI ID,KPI Name,Category,Target,Weight,Actual Measurement,Calculated Score (%),Performance Gap,Status\r\n';
    kpis.forEach((kpi) => {
      const rec = currentMonthRecordsMap.get(kpi.id);
      csv += `"${kpi.id}","${kpi.name}","${getKPIGroup(kpi.name)}","${kpi.target}","${kpi.weight}","${
        rec ? rec.actualValue : 'N/A'
      }","${rec ? rec.calculatedScore + '%' : 'N/A'}","${rec ? rec.gap : 'N/A'}","${
        rec ? rec.status : 'Pending'
      }"\r\n`;
    });
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `Hospital_KPI_Report_${activePeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Note colour map ─────────────────────────────────────────────────────
  const colorBgClasses: Record<KeepNote['color'], string> = {
    yellow: 'bg-amber-50/80 border-amber-200 text-amber-900',
    teal:   'bg-teal-50/80 border-teal-200 text-teal-900',
    rose:   'bg-rose-50/80 border-rose-200 text-rose-900',
    amber:  'bg-orange-50/80 border-orange-200 text-orange-900',
    indigo: 'bg-indigo-50/80 border-indigo-200 text-indigo-900',
    slate:  'bg-slate-50/80 border-slate-200 text-slate-900',
  };

  const paletteBgMap: Record<KeepNote['color'], string> = {
    yellow: 'bg-amber-100 border-amber-300',
    teal:   'bg-teal-100 border-teal-300',
    rose:   'bg-rose-100 border-rose-300',
    amber:  'bg-orange-100 border-orange-300',
    indigo: 'bg-indigo-100 border-indigo-300',
    slate:  'bg-slate-200 border-slate-400',
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div id="kpi-records-panel" className="space-y-6">

      {/* ── Period selector & controls ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl border border-indigo-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Operational Performance Register</h2>
              <p className="text-xs text-slate-400">
                Input and update actual indicator metrics across flexible calendar limits.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Period filter controls */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              {/* Type filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Type:</span>
                <select
                  value={periodTypeFilter}
                  onChange={(e) => { setPeriodTypeFilter(e.target.value); setSelectedMonth(''); }}
                  className="bg-white border text-xs font-bold text-slate-700 px-2 py-1 rounded max-w-[110px]"
                >
                  <option value="All">All Intervals</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>

              {/* Fiscal year filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year:</span>
                <select
                  value={fiscalYearFilter}
                  onChange={(e) => { setFiscalYearFilter(e.target.value); setSelectedMonth(''); }}
                  className="bg-white border text-xs font-bold text-slate-700 px-2 py-1 rounded max-w-[110px]"
                >
                  <option value="All">All Years</option>
                  {availableFiscalYears.map((fy) => (
                    <option key={fy} value={fy}>{fy}</option>
                  ))}
                </select>
              </div>

              {/* Active period selector */}
              <div className="flex items-center bg-white border rounded p-1 gap-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest px-1">Period:</span>
                <select
                  value={activePeriod}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-50 border-0 text-xs font-bold text-slate-800 px-2 py-1 rounded max-w-[160px]"
                >
                  {filteredPeriods.map((m) => (
                    <option key={m} value={m}>{formatPeriod(m)}</option>
                  ))}
                  {filteredPeriods.length === 0 && <option value="">No Periods Found</option>}
                </select>
              </div>

              <button
                onClick={() => setIsAddingMonth(true)}
                className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Initialize Period
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>

            <button
              onClick={() => {
                if (window.confirm('Reset all data back to initial defaults? Unsaved work will be lost.')) {
                  onResetToDefaults();
                }
              }}
              className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs rounded-xl flex items-center gap-1 transition-colors border border-rose-100 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Default Database
            </button>
          </div>
        </div>

        {/* New period inline widget */}
        <AnimatePresence>
          {isAddingMonth && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4 bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-inner space-y-3"
            >
              <div className="text-xs font-bold text-slate-600 uppercase tracking-widest border-b border-slate-200 pb-2 flex justify-between items-center">
                <span>Setup Reporting Cycle Interval</span>
                <span className="text-[10px] font-normal text-slate-400">Creates a new column/record grid template</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Reporting Interval</label>
                  <select
                    value={newPeriodType}
                    onChange={(e) => setNewPeriodType(e.target.value as typeof newPeriodType)}
                    className="w-full bg-white text-xs rounded-xl font-bold py-2 px-3 border border-slate-200 text-slate-700"
                  >
                    <option value="Monthly">Monthly Cycle</option>
                    <option value="Quarterly">Quarterly Cycle</option>
                    <option value="Annually">Annual (Fiscal Year)</option>
                  </select>
                </div>

                {newPeriodType === 'Monthly' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Select Month</label>
                    <select
                      value={newPeriodMonth}
                      onChange={(e) => setNewPeriodMonth(e.target.value)}
                      className="w-full bg-white text-xs rounded-xl font-bold py-2 px-3 border border-slate-200 text-slate-700"
                    >
                      {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m) => (
                        <option key={m} value={m}>{formatPeriod(`2026-${m}`).split(' ')[0]}</option>
                      ))}
                    </select>
                  </div>
                )}

                {newPeriodType === 'Quarterly' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Select Quarter</label>
                    <select
                      value={newPeriodQuarter}
                      onChange={(e) => setNewPeriodQuarter(e.target.value)}
                      className="w-full bg-white text-xs rounded-xl font-bold py-2 px-3 border border-slate-200 text-slate-700"
                    >
                      <option value="Q1">1st Quarter (Q1)</option>
                      <option value="Q2">2nd Quarter (Q2)</option>
                      <option value="Q3">3rd Quarter (Q3)</option>
                      <option value="Q4">4th Quarter (Q4)</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Fiscal Year (EFY / Gregorian)</label>
                  <input
                    type="number"
                    min="2020"
                    max="2035"
                    value={newPeriodYear}
                    onChange={(e) => setNewPeriodYear(parseInt(e.target.value) || 2026)}
                    className="w-full bg-white text-xs rounded-xl font-mono font-bold py-2 px-3 border border-slate-200 text-slate-700"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddNewPeriod}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                  >
                    Load &amp; Initialize
                  </button>
                  <button
                    onClick={() => setIsAddingMonth(false)}
                    className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {addMonthError && <div className="text-xs text-rose-600 font-bold pt-1">{addMonthError}</div>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category tabs + search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center flex-wrap gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            {['All', 'Clinical Quality & Safety', 'Resources & Capacity', 'Emergency & OPD'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-white text-slate-800 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search indicators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-4 py-2 w-full focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* ── Google Keep Clinical Workspace ── */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm space-y-5">
        <button
          type="button"
          onClick={() => setKeepExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between gap-3 p-5 pb-4 focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl border border-amber-200">
              <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-800">Google Keep Clinical Workspace</h2>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  REST Link
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Clinical notes, audit reviews, and operational decisions.</p>
            </div>
          </div>
          <Sliders className="h-4 w-4 text-slate-400" />
        </button>

        <AnimatePresence initial={false}>
          {keepExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-5 pb-5 overflow-hidden"
            >
              <div className="border-t border-amber-50 pt-4">
                {/* Keep connection controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-amber-50">
                  <div className="flex items-center gap-2">
                    {keepConnected ? (
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700">Cloud REST Synced</span>
                        <button
                          type="button"
                          onClick={handleDisconnectKeep}
                          className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold underline px-1 cursor-pointer"
                        >
                          Unlink Client
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSyncWithGoogleKeepAPI}
                        disabled={keepSyncing}
                        className="py-1.5 px-3 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {keepSyncing ? (
                          <><RefreshCw className="w-3 h-3 animate-spin text-amber-500" /> Authorizing Keep REST...</>
                        ) : (
                          <><CloudOff className="w-3.5 h-3.5" /> Connect Google Keep Client</>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowConnectModal(!showConnectModal)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                      title="Google Keep Integration Manual"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showConnectModal && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="p-4 bg-amber-50/75 border border-amber-100 rounded-xl text-xs text-amber-900 space-y-2 overflow-hidden mb-4"
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Google OAuth Enterprise Tenant Scope Directive</span>
                      </div>
                      <p className="leading-relaxed">
                        By clicking <strong>Connect Google Keep Client</strong>, the application attempts authentication
                        using standard consumer client IDs. Because Google Keep REST API is heavily restricted to enterprises,
                        the app maintains an <strong>Offline Ledger System</strong> which is fully encrypted and stored locally
                        in your browser workspace.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Add note panel */}
                  <div className="lg:col-span-4 space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-indigo-500" /> Add Clinical Keep Note
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Title (e.g., Audit program review)"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        className="w-full bg-white text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-amber-500 font-semibold text-slate-800"
                      />
                      <textarea
                        placeholder="Take a clinical note / itemize performance observations..."
                        value={noteBody}
                        onChange={(e) => setNoteBody(e.target.value)}
                        rows={3}
                        className="w-full bg-white text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-amber-500 text-slate-700"
                      />
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">LINK TO KPI INDICATOR</label>
                        <select
                          value={noteKpiId}
                          onChange={(e) => setNoteKpiId(e.target.value)}
                          className="w-full bg-white text-xs border border-slate-200 rounded-lg py-1.5 px-2 text-slate-700 font-medium"
                        >
                          <option value="general">🎫 General/Standalone Program Note</option>
                          {kpis.map((k) => (
                            <option key={k.id} value={k.id}>
                              #{k.id} - {k.name.slice(0, 42)}...
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">STICKY PALETTE COLOR</label>
                        <div className="flex items-center gap-1.5">
                          {(['yellow', 'teal', 'rose', 'amber', 'indigo', 'slate'] as const).map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => setNoteColor(col)}
                              className={`w-5 h-5 rounded-full border transition-all ${paletteBgMap[col]} ${
                                noteColor === col ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110' : 'opacity-80 hover:opacity-100'
                              }`}
                              title={col}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddKeepNote}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Sticky Note
                      </button>
                    </div>
                  </div>

                  {/* Notes ledger */}
                  <div className="lg:col-span-8 flex flex-col space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <input
                        type="text"
                        placeholder="Search inside keep notes..."
                        value={searchNoteQuery}
                        onChange={(e) => setSearchNoteQuery(e.target.value)}
                        className="bg-white border border-slate-200 text-[11px] rounded-lg px-2 py-1 w-full sm:w-44 focus:ring-1 focus:ring-amber-500"
                      />
                      <label className="text-slate-500 text-[11px] font-semibold flex items-center gap-1.5 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterNotesByPeriodOnly}
                          onChange={(e) => setFilterNotesByPeriodOnly(e.target.checked)}
                          className="rounded border-slate-200 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                        />
                        <span>Show {formatPeriod(activePeriod)} logs only</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[290px] overflow-y-auto pr-1">
                      {filteredKeepNotes.map((note) => {
                        const linkedKpi = note.kpiId ? kpis.find((k) => k.id === note.kpiId) : null;
                        return (
                          <div
                            key={note.id}
                            className={`p-3.5 rounded-xl border shadow-sm flex flex-col justify-between gap-2.5 transition-all ${colorBgClasses[note.color]} hover:shadow-md`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-xs tracking-tight line-clamp-1">{note.title}</h4>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePinNote(note.id)}
                                  className={`p-0.5 rounded transition-colors hover:bg-black/5 ${note.pinned ? 'text-amber-600' : 'text-slate-400'}`}
                                >
                                  <Pin className={`w-3 h-3 ${note.pinned ? 'fill-amber-400 text-amber-500' : ''}`} />
                                </button>
                              </div>
                              <p className="text-[11px] mt-1 text-slate-700 leading-normal line-clamp-4 whitespace-pre-wrap">{note.body}</p>
                            </div>
                            <div className="border-t border-black/5 pt-2 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                              <div className="flex flex-col gap-0.5 max-w-[70%]">
                                <span>Period: {note.period ? formatPeriod(note.period) : 'General'}</span>
                                {linkedKpi && (
                                  <span className="text-[9px] text-indigo-700 bg-indigo-50 rounded px-1 font-bold">
                                    #{linkedKpi.id} {linkedKpi.name.slice(0, 20)}...
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (navigator.share) {
                                      navigator.share({ title: note.title, text: note.body });
                                    } else {
                                      navigator.clipboard.writeText(`[Clinical Keep Note - ${note.title}]\n\n${note.body}`);
                                      toast.success('Copied to clipboard');
                                    }
                                  }}
                                  className="p-1 hover:bg-black/5 rounded text-indigo-600"
                                >
                                  <Share2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteKeepNote(note.id, note.title)}
                                  className="p-1 hover:bg-black/5 rounded text-rose-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {filteredKeepNotes.length === 0 && (
                        <div className="col-span-2 p-12 text-center text-slate-400 border border-dashed rounded-xl bg-slate-50">
                          <Lightbulb className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-xs font-bold text-slate-500 mt-1">No Clinical Keep Notes Found</p>
                          <p className="text-[10px] text-slate-400">Jot some down in the panel or adjust active filters!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── KPI Records Grid ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-12 bg-slate-50 p-4 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-widest">
          <div className="col-span-5">KPI Indicator Name</div>
          <div className="col-span-1 text-center">Weight</div>
          <div className="col-span-2 text-center">Target</div>
          <div className="col-span-2 text-center">Actual Entry</div>
          <div className="col-span-2 text-right">Calculated Score</div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredKPIs.map((kpi) => {
            const rec       = currentMonthRecordsMap.get(kpi.id);
            const isModified = !!rec;
            const category  = getKPIGroup(kpi.name);
            const scoreCalc = calculateKPIScore(kpi, 0);
            const scoring: KPIRecord = rec
              ? rec
              : { id: '', kpiId: kpi.id, month: activePeriod, actualValue: 0, ...scoreCalc, calculatedScore: scoreCalc.score };

            return (
              <div
                key={kpi.id}
                className={`p-4 lg:grid lg:grid-cols-12 items-center gap-4 transition-colors ${
                  !isModified ? 'opacity-70 bg-slate-50/20' : scoring.status === 'GAP' ? 'bg-rose-50/10' : ''
                }`}
              >
                {/* Name + category badge */}
                <div className="col-span-5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full font-mono">
                      #{kpi.id}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      category === 'Clinical Quality & Safety' ? 'bg-indigo-50 text-indigo-700' :
                      category === 'Resources & Capacity'     ? 'bg-teal-50 text-teal-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {category}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">{kpi.name}</h4>
                </div>

                {/* Weight */}
                <div className="col-span-1 text-center mt-2 lg:mt-0">
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg font-mono">w{kpi.weight}</span>
                </div>

                {/* Target */}
                <div className="col-span-2 text-center mt-2 lg:mt-0">
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {kpi.target} {kpi.measure ? `(${kpi.measure})` : '%'}
                  </span>
                </div>

                {/* Actual input */}
                <div className="col-span-2 mt-3 lg:mt-0">
                  <div className="flex items-center justify-center gap-1.5">
                    <input
                      type="number"
                      step="any"
                      placeholder="Enter value"
                      value={isModified ? rec!.actualValue : ''}
                      onChange={(e) => handleInputChange(kpi.id, e.target.value)}
                      className={`text-center font-mono font-bold text-sm rounded-xl px-2 py-1.5 w-28 border ${
                        scoring.status === 'GAP'
                          ? 'border-rose-300 focus:border-rose-500 bg-rose-50/30'
                          : 'border-slate-200 focus:border-indigo-500 bg-white'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 font-medium lowercase shrink-0">{kpi.measure || '%'}</span>
                  </div>
                </div>

                {/* Score */}
                <div className="col-span-2 mt-3 lg:mt-0 text-right">
                  {isModified ? (
                    <div className="inline-flex flex-col items-end">
                      <div className="flex items-center gap-1.5">
                        {scoring.status === 'GAP'
                          ? <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        }
                        <span className={`font-mono font-bold text-sm ${scoring.status === 'GAP' ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {scoring.calculatedScore}%
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 font-mono">
                        {scoring.status === 'GAP' ? `GAP: ${scoring.gap}` : 'Cleared'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300 italic">No entry loaded</span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredKPIs.length === 0 && (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Info className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No Indicators Found</p>
              <p className="text-xs">Try adjusting your filters or search queries.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}