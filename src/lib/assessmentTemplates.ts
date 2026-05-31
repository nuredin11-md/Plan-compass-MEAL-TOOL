import { INITIAL_ASSESSMENT_ITEMS } from '../data/assessmentChecklist';
import { AssessmentItem } from '../types';

export const DEFAULT_ASSESSMENT_ITEMS: AssessmentItem[] = INITIAL_ASSESSMENT_ITEMS.map(item => ({
  id: item.id,
  section_name: item.section_name,
  item_description: item.item_description,
  weighting: item.weighting,
  max_score: item.max_score,
  guide_notes: item.guide_notes,
  hint: item.guide_notes // Alias hint to guide_notes for SectionContainer compatibility
}));

export const SECTION_WEIGHTS = [
  { section: "Section A: HIS Structure & Governance", displayName: "Section A: HIS Structure & Governance", weight: 0.30 },
  { section: "Section B: Data Quality & Management", displayName: "Section B: Data Quality & Management", weight: 0.40 },
  { section: "Section B: Data Quality Audit & Reporting", displayName: "Section B: Data Quality & Management", weight: 0.40 },
  { section: "Section C: Information Use for Decision", displayName: "Section C: Information Use for Decision", weight: 0.30 },
  { section: "Section C: Digital Health & M&E Infrastructure", displayName: "Section C: Information Use for Decision", weight: 0.30 }
];

export const QUESTION_CHOICES: Record<string, { value: number; label: string }[]> = {
  item_a1: [
    { value: 0, label: "No coordinator / Not appointed" },
    { value: 2, label: "Appointed, but not active or lacks Job Description" },
    { value: 5, label: "Fully competent coordinator, active and documented JDs" }
  ],
  item_a2: [
    { value: 0, label: "No committee established" },
    { value: 1, label: "Established, but meets irregularly without minutes" },
    { value: 3, label: "Meets monthly, minutes are partial or unsigned" },
    { value: 5, label: "Meets monthly with signed minutes and action logs" }
  ],
  item_a3: [
    { value: 0, label: "No aligned annual plan" },
    { value: 2, label: "Plan exists, but not aligned or shared" },
    { value: 5, label: "Plan perfectly aligned and posted on notice boards" }
  ],
  item_a4: [
    { value: 0, label: "SOPs unavailable in critical registry points" },
    { value: 2, label: "Available in some key clinics/wards" },
    { value: 5, label: "Accurate & current SOPs fully available at all critical units" }
  ],
  item_a5: [
    { value: 0, label: "No confidentiality agreements signed" },
    { value: 2, label: "Agreement template exists, signed by < 50% staff" },
    { value: 5, label: "Signed charters available in files for 100% staff" }
  ],
  item_b1: [
    { value: 0, label: "No routine DQAs conducted" },
    { value: 2, label: "DQA conducted occasionally or quarterly" },
    { value: 5, label: "Rigorous monthly DQA folders actively maintained" }
  ],
  item_b2: [
    { value: 0, label: "ANC registers have many missing values" },
    { value: 2, label: "Partially complete (< 85% fields)" },
    { value: 5, label: "Nearly perfect ANC registers (100% audit completeness)" }
  ],
  item_b3: [
    { value: 0, label: "Reports consistently late (> 10th GC day)" },
    { value: 2, label: "Submitted between 6th and 10th day" },
    { value: 5, label: "Transmitted reliably before the 5th GC day" }
  ],
  item_b4: [
    { value: 0, label: "No cross-checks active" },
    { value: 2, label: "Inconsistent cross-checks run manually" },
    { value: 5, label: "Active validation rules run on 100% of DHIS2 forms" }
  ],
  item_b5: [
    { value: 0, label: "No feedback sent to departments" },
    { value: 2, label: "Feedback compiled but not distributed or lacks action tracking" },
    { value: 5, label: "Comprehensive, acted corrective loops closed weekly" }
  ],
  item_c1: [
    { value: 0, label: "15% or less electronic entries" },
    { value: 2, label: "Some clinics have active EMR software" },
    { value: 5, label: "Full clinical electronic entry is standard across the hospital" }
  ],
  item_c2: [
    { value: 0, label: "No functional UPS or major power outages" },
    { value: 2, label: "UPS exists but untested or partially failing" },
    { value: 5, label: "Full modular online UPS units operating at 100% battery state" }
  ],
  item_c3: [
    { value: 0, label: "No automated or physical back-ups" },
    { value: 2, label: "Manual mirroring occasionally" },
    { value: 5, label: "Full automated daily incremental mirroring to off-site cloud" }
  ],
  item_c4: [
    { value: 0, label: "No staff trained" },
    { value: 2, label: "Partial staff certified (< 50% staff)" },
    { value: 5, label: "More than 75% of officers highly qualified and certified" }
  ],
  item_c5: [
    { value: 0, label: "High latency, down > 50% of month" },
    { value: 2, label: "Active but occasional downtime or sluggish speed" },
    { value: 5, label: "Reliable fiber/broadband connection > 99% up-time" }
  ]
};

export function calculateSectionScores(
  items: AssessmentItem[],
  responses: Record<string, { score_achieved: number; remarks?: string }>
) {
  const sections = [
    { key: "Section A", name: "Section A: HIS Structure & Governance", weight: 0.30 },
    { key: "Section B", name: "Section B: Data Quality & Management", weight: 0.40 },
    { key: "Section C", name: "Section C: Information Use for Decision", weight: 0.30 }
  ];

  let overallPercentage = 0;
  const sectionBreakdown = sections.map(sec => {
    const secItems = items.filter(item => item.section_name.includes(sec.key));
    let achievedScoreOfSection = 0;
    let maxPossibleScoreOfSection = 0;

    secItems.forEach(item => {
      const response = responses[item.id];
      const score = response && response.score_achieved !== undefined ? Number(response.score_achieved) : 0;
      achievedScoreOfSection += score;
      maxPossibleScoreOfSection += item.max_score;
    });

    const performancePercentage = maxPossibleScoreOfSection > 0 
      ? (achievedScoreOfSection / maxPossibleScoreOfSection) * 100 
      : 0;
    
    const weightedWeightContribution = performancePercentage * sec.weight;
    overallPercentage += weightedWeightContribution;

    return {
      displayName: sec.name,
      weight: sec.weight,
      achievedScoreOfSection,
      maxPossibleScoreOfSection,
      performancePercentage,
      weightedWeightContribution
    };
  });

  overallPercentage = Math.round(overallPercentage * 10) / 10;

  return {
    overallPercentage,
    sectionBreakdown
  };
}
