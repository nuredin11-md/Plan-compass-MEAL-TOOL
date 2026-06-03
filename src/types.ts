export interface KPIDefinition {
  id: number;
  name: string;
  target: number;
  weight: number;
  type: 'prop' | 'cat';
  measure?: string;
  rules?: { min: number; max: number; score: number }[];
}

export interface KPIRecord {
  id?: string; // unique ID; may be undefined before DB upsert
  kpiId: number;
  month: string; // YYYY-MM
  actualValue: number;
  calculatedScore: number;
  gap: number;
  status: 'OK' | 'GAP';
}

export interface ActionPlan {
  id: string;
  kpiId: number;
  month: string;
  gapDescription: string;
  rootCause: string;
  correctiveAction: string;
  responsiblePerson: string;
  deadline: string;
  progress: 'Not started' | 'In progress' | 'Completed';
  priority?: 'High' | 'Medium' | 'Low';
}

export interface UserProfile {
  name: string;
  role: string;
  hospital: string;
  cellNumber: string;
  email: string;
}

export interface Notification {
  id: string;
  month: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: string;
}

export interface AssessmentItem {
  id: string; // matches UUID or key
  section_name: string;
  item_description: string;
  weighting: number; // e.g. 0.35 (35%)
  max_score: number; // e.g. 5
  hint?: string;
  guide_notes?: string;
}
