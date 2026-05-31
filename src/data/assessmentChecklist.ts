export interface ChecklistItem {
  id: string; // matches UUID or key
  section_name: string;
  item_description: string;
  weighting: number; // e.g. 0.35 (35%)
  max_score: number; // e.g. 5
  guide_notes?: string;
}

export const ASSESSMENT_SECTIONS = [
  {
    id: "section_a",
    name: "Section A: HIS Structure & Governance",
    weight: 0.35, // 35%
    description: "Evaluates the leadership, institutional design, planning, and Standard Operating Procedures (SOPs) setup."
  },
  {
    id: "section_b",
    name: "Section B: Data Quality Audit & Reporting",
    weight: 0.35, // 35%
    description: "Evaluates the accuracy, consistency, registry completeness, DQA monthly routines, and reporting timeline adherence."
  },
  {
    id: "section_c",
    name: "Section C: Digital Health & M&E Infrastructure",
    weight: 0.30, // 30%
    description: "Evaluates physical and digital readiness, electrical redundancy, server upkeep, and analyst training."
  }
];

export const INITIAL_ASSESSMENT_ITEMS: ChecklistItem[] = [
  // SECTION A
  {
    id: "item_a1",
    section_name: "Section A: HIS Structure & Governance",
    item_description: "Appointed and dedicated HIS/M&E Coordinator is actively directing facility-wide recording protocols.",
    weighting: 0.35,
    max_score: 5,
    guide_notes: "Verify the appointment letter, job description, and active involvement in management boards."
  },
  {
    id: "item_a2",
    section_name: "Section A: HIS Structure & Governance",
    item_description: "Active Performance Review Committee (PRC) is established, meets monthly, and documents actionable minutes.",
    weighting: 0.35,
    max_score: 5,
    guide_notes: "Request and inspect minutes of the last three monthly meetings including attendance rosters."
  },
  {
    id: "item_a3",
    section_name: "Section A: HIS Structure & Governance",
    item_description: "Annual operational plans are aligned with PMT (Performance Monitoring Team) indicators and explicitly shared with units.",
    weighting: 0.35,
    max_score: 5,
    guide_notes: "Inspect the annual KPI master sheet and confirm department-level targets are posted on notice boards."
  },
  {
    id: "item_a4",
    section_name: "Section A: HIS Structure & Governance",
    item_description: "Standard HMIS registrar guidelines and SOP booklets are physically accessible in all registry wards.",
    weighting: 0.35,
    max_score: 5,
    guide_notes: "Observe physical SOP booklets at OPD, IPD, lab, and maternal health registries."
  },
  {
    id: "item_a5",
    section_name: "Section A: HIS Structure & Governance",
    item_description: "Hospital has established official clinical data confidentiality charters signed by all recording personnel.",
    weighting: 0.35,
    max_score: 5,
    guide_notes: "Check signed confidentiality agreement forms in the files of records department staff."
  },

  // SECTION B
  {
    id: "item_b1",
    section_name: "Section B: Data Quality Audit & Reporting",
    item_description: "Routine internal Data Quality Audits (DQA) are performed monthly, tracking trace indicators.",
    weighting: 0.35,
    max_score: 5,
    guide_notes: "Review monthly internal DQA folders for tracing: e.g. malaria, immunizations, and deliveries."
  },
  {
    id: "item_b2",
    section_name: "Section B: Data Quality Audit & Reporting",
    item_description: "Maternal and child health registers show 100% field completeness without blanks.",
    weighting: 0.35,
    max_score: 5,
    guide_notes: "Sample 10 antenatal care (ANC) register rows and count any omitted mandatory cells."
  },
  {
    id: "item_b3",
    section_name: "Section B: Data Quality Audit & Reporting",
    item_description: "Monthly reporting to the regional health bureau is transmitted before the 5th GC day of the successive month.",
    weighting: 0.35,
    max_score: 5,
    guide_notes: "Examine export time-stamps on the DHIS2 portal for the past three filing cycles."
  },
  {
    id: "item_b4",
    section_name: "Section B: Data Quality Audit & Reporting",
    item_description: "Cross-checks and validation rules are active in checking electronic entries against paper tally sheets.",
    weighting: 0.35,
    max_score: 5,
    guide_notes: "Observe the records officer demonstrating how discrepancies between registries and aggregate reports are parsed."
  },
  {
    id: "item_b5",
    section_name: "Section B: Data Quality Audit & Reporting",
    item_description: "Department feedback reports are distributed to ward heads with custom corrective actions for data errors.",
    weighting: 0.35,
    max_score: 5,
    guide_notes: "Verify distribution receipts of feedback memos to the Pediatrics, Surgery, and Gynecology coordinators."
  },

  // SECTION C
  {
    id: "item_c1",
    section_name: "Section C: Digital Health & M&E Infrastructure",
    item_description: "Active deployment of electronic medical records (EMR) or electronic HMIS in core registry points.",
    weighting: 0.30,
    max_score: 5,
    guide_notes: "Walk through registration rooms and check if screens are running active database sessions."
  },
  {
    id: "item_c2",
    section_name: "Section C: Digital Health & M&E Infrastructure",
    item_description: "Server hardware is protected by functional, surge-tested Uninterruptible Power Supply (UPS) units.",
    weighting: 0.30,
    max_score: 5,
    guide_notes: "Inspect the primary server room to verify battery backups and power failure failover triggers."
  },
  {
    id: "item_c3",
    section_name: "Section C: Digital Health & M&E Infrastructure",
    item_description: "Regular server file archives and system configurations are securely mirrored to cloud storage or offline external disks.",
    weighting: 0.30,
    max_score: 5,
    guide_notes: "Confirm backups are made at least weekly; check physical backup logs or automated cloud-backup cron jobs."
  },
  {
    id: "item_c4",
    section_name: "Section C: Digital Health & M&E Infrastructure",
    item_description: "At least 75% of clinical officers have received direct, qualified training on analytic tool usage (Excel, DHIS2, etc.).",
    weighting: 0.30,
    max_score: 5,
    guide_notes: "Review training certificates, attendance registers, or continuous mentorship schedules."
  },
  {
    id: "item_c5",
    section_name: "Section C: Digital Health & M&E Infrastructure",
    item_description: "High-speed Internet connectivity is active in administrative offices to guarantee trouble-free transmission.",
    weighting: 0.30,
    max_score: 5,
    guide_notes: "Assess the average latency and network uptime in the administrative records department."
  }
];
