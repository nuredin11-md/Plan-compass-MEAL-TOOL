/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { AssessmentItem } from '../../types';
import { SECTION_WEIGHTS, QUESTION_CHOICES } from '../../lib/assessmentTemplates';
import { AlertTriangle, CheckCircle2, MessageSquare, Info } from 'lucide-react';

interface SectionContainerProps {
  sectionName: string;
  items: AssessmentItem[];
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
}

export default function SectionContainer({
  sectionName,
  items,
  register,
  watch,
  setValue,
  errors
}: SectionContainerProps) {
  const watchResponses = watch('responses') || {};
  const weightInfo = SECTION_WEIGHTS.find(sw => sw.section === sectionName) || { displayName: sectionName, weight: 0.33 };

  // Calculate local progress status of this section
  let totalPointsEarned = 0;
  let maxPossiblePoints = 0;
  let itemsCompletedCount = 0;

  items.forEach(item => {
    maxPossiblePoints += item.max_score;
    const itemResponse = watchResponses[item.id] || { score_achieved: 0 };
    const score = Number(itemResponse.score_achieved) || 0;
    if (watchResponses[item.id]) {
      itemsCompletedCount += 1;
    }
    totalPointsEarned += score;
  });

  const sectionPercent = maxPossiblePoints > 0 ? (totalPointsEarned / maxPossiblePoints) * 100 : 0;
  const weightedContribution = sectionPercent * weightInfo.weight;

  return (
    <div id={`section-container-${sectionName.replace(/\s+/g, '-').toLowerCase()}`} className="space-y-6">
      {/* Header and overview of Section Specific Scoring Multiplier */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2 space-y-1">
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
            Weighted Performance Zone
          </span>
          <h3 className="text-base font-semibold text-gray-800 tracking-tight">{weightInfo.displayName}</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            This module represents <span className="font-bold text-gray-700">{weightInfo.weight * 100}%</span> of total audit evaluation weight. 
            Scores on individual items map direct point-contributions to this sector.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Section Score</p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-xl font-extrabold text-slate-800">
              {totalPointsEarned}
            </span>
            <span className="text-xs text-gray-400 font-medium">/ {maxPossiblePoints} pts</span>
          </div>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(sectionPercent, 100)}%` }}
            />
          </div>
          <p className="text-[10px] font-semibold text-indigo-700 mt-1">
            {sectionPercent.toFixed(1)}% ({weightedContribution.toFixed(1)}% of total)
          </p>
        </div>
      </div>

      {/* Checklist items dynamic mapping */}
      <div className="space-y-6">
        {items.map((item, idx) => {
          const fieldBase = `responses.${item.id}`;
          const currentResponse = watchResponses[item.id] || { score_achieved: 0, remarks: '' };
          const scoreAchieved = Number(currentResponse.score_achieved) || 0;
          
          // Require remarks if score is low (< 50% of maximum score) to encourage detail documentation
          const isLowScore = scoreAchieved < (item.max_score / 2);
          const itemError = errors.responses?.[item.id] as any;

          return (
            <div 
              key={item.id}
              id={`audit-item-card-${item.id}`}
              className={`p-5 rounded-xl border transition-all duration-150 relative ${
                itemError 
                  ? 'border-red-200 bg-red-50/10' 
                  : scoreAchieved === item.max_score
                    ? 'border-emerald-200/80 bg-emerald-50/5 hover:border-emerald-300'
                    : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Visual state indicator */}
                <span className="flex-shrink-0 w-7 h-7 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-mono text-xs font-bold mt-0.5">
                  {(idx + 1).toString().padStart(2, '0')}
                </span>

                <div className="flex-1 space-y-4">
                  {/* Item text metadata */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-800 leading-relaxed">
                      {item.item_description}
                    </h4>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono font-bold">
                        Max: {item.max_score} {item.max_score === 100 ? '%' : 'pts'}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium font-sans">
                        <Info className="w-3.5 h-3.5 text-gray-400" /> {item.max_score === 100 ? 'Provide a percentage rating from 0-100%' : 'Select from preset compliant options'}
                      </span>
                    </div>
                    {item.hint && (
                      <div className="mt-2.5 bg-sky-50 text-sky-900 border border-sky-100 p-2.5 px-3 rounded-lg flex items-start gap-2 text-[11px] font-medium leading-relaxed shadow-sm">
                        <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold uppercase text-[9px] tracking-wider text-sky-700 block mb-0.5">Assessor Instruction Guideline Hint</span>
                          {item.hint}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Score Select and Remarks Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {/* Select Score */}
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-sans">
                        {item.max_score === 100 ? 'Percentage Score *' : 'Compliance Choice *'}
                      </label>
                      {QUESTION_CHOICES[item.id] ? (
                        <select
                          id={`select-score-${item.id}`}
                          defaultValue=""
                          className={`w-full bg-white border ${
                            itemError?.score_achieved ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-indigo-100'
                          } rounded-lg px-2.5 py-2.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:border-indigo-500 transition`}
                          {...register(`${fieldBase}.score_achieved`, { 
                            valueAsNumber: true,
                            required: "Option selection is required"
                          })}
                        >
                          <option value="">-- Choose OPTION --</option>
                          {QUESTION_CHOICES[item.id].map(choice => (
                            <option key={choice.value} value={choice.value}>
                              {choice.label} ({choice.value} pt{choice.value !== 1 ? 's' : ''})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="relative flex items-center">
                          <input
                            id={`input-percentage-${item.id}`}
                            type="number"
                            min="0"
                            max="100"
                            className={`w-full bg-white border ${
                              itemError?.score_achieved ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-indigo-100'
                            } rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:border-indigo-500 transition`}
                            placeholder="0 - 100"
                            {...register(`${fieldBase}.score_achieved`, {
                              valueAsNumber: true,
                              required: "Percentage score is required",
                              min: { value: 0, message: "Min score is 0%" },
                              max: { value: 100, message: "Max score is 100%" }
                            })}
                          />
                          <span className="absolute right-3 text-xs font-extrabold text-slate-400 font-mono">%</span>
                        </div>
                      )}
                      {itemError?.score_achieved && (
                        <p className="text-red-500 text-[10px] mt-1 font-medium font-sans">{itemError.score_achieved.message}</p>
                      )}
                    </div>

                    {/* Remarks Input field */}
                    <div className="md:col-span-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          Remarks & Findings {isLowScore && <span className="text-amber-500">* (Low Score Audit Alert)</span>}
                        </label>
                        {isLowScore && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            <AlertTriangle className="w-3 h-3 text-amber-500" /> Specify corrective gap details
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400">
                          <MessageSquare className="w-4 h-4" />
                        </span>
                        <input
                          id={`input-remark-${item.id}`}
                          type="text"
                          placeholder={isLowScore ? "Required: Why is this indicator subpar? Specify gap..." : "Optional: Add observations or verification evidence..."}
                          className={`w-full bg-white border ${
                            itemError?.remarks ? 'border-red-400' : 'border-gray-200'
                          } rounded-lg pl-9 pr-4 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition`}
                          {...register(`${fieldBase}.remarks`, {
                            validate: (val) => {
                              if (isLowScore && (!val || val.trim().length === 0)) {
                                return "Please provide remarks clarifying why maximum target points were not met.";
                              }
                              return true;
                            }
                          })}
                        />
                      </div>
                      {itemError?.remarks && (
                        <p className="text-red-500 text-[10px] mt-1 font-medium">{itemError.remarks.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
