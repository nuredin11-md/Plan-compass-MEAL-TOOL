/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DEFAULT_ASSESSMENT_ITEMS, calculateSectionScores } from '../../lib/assessmentTemplates';
import { useIndicators } from '../../context/IndicatorsContext';
import { useAssessmentData } from '../../hooks/useAssessmentData';
import { gregorianToEthiopian } from '../../lib/ethiopianDate';
import SectionContainer from './SectionContainer';
import { CheckCircle2, ChevronRight, ChevronLeft, Save, AlertCircle, FileText, Settings, RefreshCw, BarChart2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const facilitySchema = z.object({
  name: z.string().min(3, "Facility Name must be at least 3 characters"),
  code: z.string().min(2, "Facility Code is required"),
  region: z.string().min(1, "Please pick a Region"),
  zone: z.string().min(1, "Please pick a Zone"),
  woreda: z.string().min(1, "Please pick a Woreda")
});

const assessmentSchema = z.object({
  facility: facilitySchema,
  assessment_date: z.string().min(10, "Please supply a valid Gregorian date"),
  quarter: z.string().min(1, "Ethiopian quarter is required"),
  ethiopianDateStr: z.string().optional(),
  responses: z.record(
    z.string(),
    z.object({
      score_achieved: z.number().min(0),
      remarks: z.string().optional()
    })
  )
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

interface AssessmentWizardProps {
  onSave?: (data: AssessmentFormValues) => Promise<{ success: boolean; id?: string; score?: number; error?: string }>;
  isSubmitting?: boolean;
  isLiveConnected?: boolean;
  onOpenConfig?: () => void;
}

export default function AssessmentWizard({
  onSave,
  isSubmitting,
  isLiveConnected,
  onOpenConfig
}: AssessmentWizardProps) {
  const indicatorsContext = useIndicators() as any;
  const activeFacility = indicatorsContext?.facility || {
    name: "CHEFA ROBIT HOSPITAL",
    code: "HOSP-CHEFAROBIT",
    region: "Amhara",
    zone: "Oromia Special Zone",
    woreda: "Chefa Robit"
  };

  const { submitAssessment, isSubmitting: isLocalSubmitting } = useAssessmentData();
  const activeIsSubmitting = isSubmitting ?? isLocalSubmitting;

  const hasSupabase = typeof window !== "undefined" &&
    !!(import.meta.env.VITE_SUPABASE_URL || "").trim() &&
    !!(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
  const liveConnected = isLiveConnected ?? hasSupabase;

  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [successScore, setSuccessScore] = useState<number | null>(null);

  const steps = [
    { title: "Section A", description: "HIS Structure & Governance (30%)" },
    { title: "Section B", description: "Data Quality & Management (40%)" },
    { title: "Section C", description: "Information Use for Decision (30%)" },
    { title: "Review & Submit", description: "Consolidated audit scorecard summary" }
  ];

  // Initialize react-hook-form
  const methods = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    mode: "all",
    defaultValues: {
      facility: {
        name: activeFacility?.name || "",
        code: activeFacility?.code || "",
        region: activeFacility?.region || "",
        zone: activeFacility?.zone || "",
        woreda: activeFacility?.woreda || ""
      },
      assessment_date: new Date().toISOString().split('T')[0],
      quarter: "",
      ethiopianDateStr: "",
      responses: DEFAULT_ASSESSMENT_ITEMS.reduce((api, item) => {
        api[item.id] = {
          score_achieved: item.max_score === 100 ? 80 : undefined as any,
          remarks: ""
        };
        return api;
      }, {} as any)
    }
  });

  const { register, watch, setValue, trigger, handleSubmit, formState: { errors } } = methods;
  const formValues = watch();

  // Keep demographic details synchronized with the global app profile
  useEffect(() => {
    if (activeFacility) {
      setValue('facility.name', activeFacility.name || "");
      setValue('facility.code', activeFacility.code || "");
      setValue('facility.region', activeFacility.region || "");
      setValue('facility.zone', activeFacility.zone || "");
      setValue('facility.woreda', activeFacility.woreda || "");
    }
  }, [activeFacility, setValue]);

  // Live convert Gregorian date to Ethiopian calendar date & fiscal quarter
  const selectedDate = watch('assessment_date');
  useEffect(() => {
    if (selectedDate) {
      const ethInfo = gregorianToEthiopian(selectedDate);
      setValue('quarter', ethInfo.formattedQuarter);
      setValue('ethiopianDateStr', ethInfo.formatted);
    }
  }, [selectedDate, setValue]);

  // Score calculations live preview
  const itemsA = DEFAULT_ASSESSMENT_ITEMS.filter(i => i.section_name.includes("Section A"));
  const itemsB = DEFAULT_ASSESSMENT_ITEMS.filter(i => i.section_name.includes("Section B"));
  const itemsC = DEFAULT_ASSESSMENT_ITEMS.filter(i => i.section_name.includes("Section C"));

  const scoreSummary = useMemo(() => calculateSectionScores(DEFAULT_ASSESSMENT_ITEMS, formValues.responses || {}), [formValues.responses]);

  const handleNext = async () => {
    let fieldsToValidate: string[] = [];
    if (currentStep === 0) {
      fieldsToValidate = ['assessment_date', ...itemsA.map(i => `responses.${i.id}`)];
    } else if (currentStep === 1) {
      fieldsToValidate = itemsB.map(i => `responses.${i.id}`);
    } else if (currentStep === 2) {
      fieldsToValidate = itemsC.map(i => `responses.${i.id}`);
    }

    const isStepValid = await trigger(fieldsToValidate as any);
    if (isStepValid) {
      setSubmitError(null);
      setCurrentStep((p) => p + 1);
    } else {
      setSubmitError('Please make sure all questions are answered, and provide required remarks for any scores under 50% before advancing.');
    }
  };

  const handleBack = () => {
    setSubmitError(null);
    setCurrentStep((prev: number) => Math.max(0, prev - 1));
  };

  const handleSaveChecklist = async () => {
    setSubmitError(null);
    const isValid = await trigger();
    if (!isValid) {
      setSubmitError('Please complete the required fields before submitting.');
      return;
    }
    const data = methods.getValues();
    setLastSavedId(null);
    setSuccessScore(null);
    try {
      const profile = {
        name: data.facility.name,
        code: data.facility.code,
        region: data.facility.region,
        zone: data.facility.zone,
        woreda: data.facility.woreda,
        assessment_date: data.assessment_date,
        quarter: data.quarter,
      };
      const formattedResponses = Object.entries(data.responses || {}).map(([item_id, resVal]: [string, any]) => ({
        item_id,
        score_achieved: Number(resVal?.score_achieved) || 0,
        remarks: resVal?.remarks || '',
      }));
      const res = await submitAssessment(profile, formattedResponses, scoreSummary.overallPercentage);
      if (res?.success) {
        setLastSavedId(res.id || 'success-simulated-id');
        setSuccessScore(scoreSummary.overallPercentage);
        setCurrentStep(4);
      } else {
        setSubmitError(res?.error || 'Submission transaction failed.');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Unexpected error while saving assessment.');
    }
  };

  const resetWizardState = () => {
    methods.reset();
    setCurrentStep(0);
    setLastSavedId(null);
    setSuccessScore(null);
    setSubmitError(null);
  };

  return (
    <FormProvider {...methods}>
      <div id="assessment-wizard-container" className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-full font-sans">
        {/* Wizard Header Status / Bar */}
        <div className="bg-gradient-to-r from-emerald-800 to-indigo-900 text-white p-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 rounded-md px-2 py-0.5">
                  AUDIT CONTROLLER v1.0
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider rounded-md px-2 py-0.5 ${
                  liveConnected
                    ? 'bg-emerald-400 text-emerald-950'
                    : 'bg-amber-400/20 text-amber-300 border border-amber-400/20'
                }`}>
                  {liveConnected ? "● LIVE SUPABASE" : "⚡ SIMULATED MODE"}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-2 flex items-center gap-2">
                Hospital HIS Assessment Checklist
              </h1>
              <p className="text-emerald-100 text-xs mt-1 max-w-xl font-medium leading-relaxed">
                Standardized Evaluation Tool tracking structure compliance, quality checks, and reporting integrity.
              </p>
            </div>

            {/* Score circle */}
            {currentStep < 4 && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/20 flex flex-col items-center justify-center min-w-[120px] shadow-lg">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-200">Current Score</span>
                <span className="text-3xl font-extrabold font-mono text-white mt-1">
                  {scoreSummary.overallPercentage}%
                </span>
                <span className="text-[9px] text-indigo-200 mt-1.5 font-bold tracking-wide">
                  Weighted Target
                </span>
              </div>
            )}
          </div>

          {/* Stepper Wizard Indicator */}
          {currentStep < 4 && (
            <div className="grid grid-cols-4 gap-2 mt-8 border-t border-white/10 pt-4 overflow-x-auto whitespace-nowrap">
              {steps.map((step, idx) => (
                <button
                  key={idx}
                  id={`stepper-btn-${idx}`}
                  type="button"
                  onClick={() => {
                    if (idx < currentStep) {
                      setCurrentStep(idx);
                    }
                  }}
                  className="flex flex-col text-left group focus:outline-none flex-1 min-w-[70px]"
                >
                  <div className="w-full bg-white/20 h-1 relative rounded overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                        idx <= currentStep ? 'bg-emerald-400' : 'bg-transparent'
                      }`}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold mt-2 truncate ${
                    idx === currentStep ? 'text-emerald-300 font-extrabold' : idx < currentStep ? 'text-gray-300' : 'text-white/40'
                  }`}>
                    {idx + 1}. {step.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Wizard Main Content Panel */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[650px] bg-gray-50/50">

          {submitError && (
            <div id="submit-error-banner" className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-4 mb-6 flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Execution Warning:</span> {submitError}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onsubmit as any)} className="space-y-6">

            {/* STEP 0: Section A Checklist + Date Selector */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-indigo-100 rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-sans">
                      <Calendar className="w-4 h-4 text-indigo-600" /> Assessment Date (Gregorian) *
                    </label>
                    <input
                      id="input-assessment-date"
                      type="date"
                      className={`w-full bg-white border ${
                        errors.assessment_date ? 'border-red-400 focus:ring-red-100' : 'border-indigo-200 focus:ring-indigo-100'
                      } rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-500 focus:ring-4 transition font-semibold`}
                      {...register('assessment_date')}
                    />
                    {errors.assessment_date && (
                      <p className="text-red-500 text-xs mt-1 font-sans">{String(errors.assessment_date.message)}</p>
                    )}
                  </div>

                  <div className="space-y-2 bg-white/60 p-3.5 border border-indigo-100/50 rounded-xl">
                    <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest block font-sans">
                      Ethiopian Reporting Calendar
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-gray-400 block font-medium">Fiscal Quarter:</span>
                        <span className="font-extrabold text-indigo-900 font-sans">{formValues.quarter || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Ethiopian Year:</span>
                        <span className="font-bold text-emerald-800 font-sans">{formValues.ethiopianDateStr || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <SectionContainer
                  sectionName="Section A: HIS Structure & Governance"
                  items={itemsA}
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  errors={errors}
                />
              </div>
            )}

            {/* STEP 1: Section B Checklist */}
            {currentStep === 1 && (
              <SectionContainer
                sectionName="Section B: Data Quality & Management"
                items={itemsB}
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
              />
            )}

            {/* STEP 2: Section C Checklist */}
            {currentStep === 2 && (
              <SectionContainer
                sectionName="Section C: Information Use for Decision"
                items={itemsC}
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
              />
            )}

            {/* STEP 3: Review Summary Assessment before Commit */}
            {currentStep === 3 && (
              <div id="wizard-review-screen" className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-lg font-medium text-gray-900 tracking-tight">Final Assessment Audit Summary</h2>
                  <p className="text-xs text-gray-500">Ensure all facility metadata and scores are correct before executing the transaction to Supabase storage.</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Facility Demographic Profile</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <span className="text-gray-500">Facility Name:</span>
                      <span className="font-semibold text-gray-800">{formValues.facility?.name}</span>

                      <span className="text-gray-500">Facility Code:</span>
                      <span className="font-mono font-bold text-gray-800">{formValues.facility?.code}</span>

                      <span className="text-gray-500">Woreda / Location:</span>
                      <span className="font-semibold text-gray-800">{formValues.facility?.woreda}, {formValues.facility?.zone}, {formValues.facility?.region}</span>
                    </div>
                  </div>

                  <div className="space-y-3 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Reporting Period & Dates</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <span className="text-gray-500">Assessment Date (G):</span>
                      <span className="font-semibold text-gray-800">{formValues.assessment_date}</span>

                      <span className="text-gray-500">Ethiopian Calendar:</span>
                      <span className="font-medium text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-fit">
                        {formValues.ethiopianDateStr || "N/A"}
                      </span>

                      <span className="text-gray-500">Fiscal Quarter:</span>
                      <span className="font-bold text-indigo-900">{formValues.quarter}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weighted Performance Sections</h3>

                  <div className="space-y-4 pt-1">
                    {scoreSummary.sectionBreakdown.map((sec, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-gray-700">{sec.displayName} (Weight: {sec.weight * 100}%)</span>
                          <span className="text-slate-900 font-bold">
                            {sec.achievedScoreOfSection} / {sec.maxPossibleScoreOfSection} {sec.maxPossibleScoreOfSection === 400 ? '%' : 'pts'} ({sec.performancePercentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                          <div
                            className={`h-2.5 transition-all duration-300 ${
                              sec.performancePercentage >= 80 ? 'bg-emerald-500' : sec.performancePercentage >= 50 ? 'bg-indigo-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${sec.performancePercentage}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-gray-500 text-right">
                          Contribution to overall score: <strong className="text-indigo-800">{sec.weightedWeightContribution.toFixed(2)}%</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-300 pt-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-600 block">FINAL AGGREGATED SCORE</span>
                      <span className="text-xs text-gray-400">Section weighted average (A + B + C)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-indigo-950 font-mono">
                        {scoreSummary.overallPercentage}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-indigo-700 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-indigo-900 leading-relaxed">
                    By clicking submit, you initiate a relational schema insert transaction inside your storage layer.
                    This will upsert standard facility information, generate an audit container header, and append response tracking rows atomically.
                  </p>
                </div>
              </div>
            )}

            {/* COMPLETION SUCCESS SCREEN */}
            {currentStep === 4 && (
              <div id="completion-screen" className="py-8 flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold rounded-full px-3 py-1 uppercase tracking-wide">
                    Success! Transaction Committed
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight pt-1">
                    Assessment Data Saved Successfully
                  </h2>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    The facility profile, dates, and calculated section score ratios were successfully committed.
                    Review log outputs below to inspect transaction database steps.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-inner grid grid-cols-2 gap-4 text-xs text-left">
                  <div>
                    <span className="text-gray-400 block font-semibold uppercase text-[9px] tracking-widest">TRANSACTION ID</span>
                    <span className="font-mono font-bold text-slate-800 break-all">{lastSavedId}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold uppercase text-[9px] tracking-widest">FINAL SCORE</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">{successScore}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold uppercase text-[9px] tracking-widest">FACILITY</span>
                    <span className="font-semibold text-slate-800">{formValues.facility?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold uppercase text-[9px] tracking-widest">ETHIOPIAN CALENDAR</span>
                    <span className="font-semibold text-indigo-900">{formValues.ethiopianDateStr} ({formValues.quarter})</span>
                  </div>
                </div>

                <button
                  id="reset-audit-form-btn"
                  type="button"
                  onClick={resetWizardState}
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl px-6 py-3 text-sm tracking-wide shadow-lg shadow-emerald-600/10 transition flex items-center gap-2 cursor-pointer mx-auto"
                >
                  <RefreshCw className="w-4 h-4" /> Begin New Assessment
                </button>
              </div>
            )}

            {/* Controls Navigation Bar */}
            {currentStep < 4 && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                <button
                  id="wizard-back-btn"
                  type="button"
                  disabled={currentStep === 0}
                  onClick={handleBack}
                  className="border border-gray-200 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed bg-white text-gray-700 text-xs font-semibold rounded-lg px-4 py-2.5 transition flex items-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                {currentStep < 3 ? (
                  <button
                    id="wizard-next-btn"
                    type="button"
                    onClick={handleNext}
                    className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-lg px-5 py-2.5 transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    Next Step <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="wizard-submit-btn"
                    type="button"
                    onClick={handleSaveChecklist}
                    disabled={activeIsSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg px-6 py-2.5 transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/15 disabled:opacity-50"
                  >
                    {activeIsSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Committing Transaction...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save & Commit Checklist
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

          </form>
        </div>
      </div>
    </FormProvider>
  );
}
