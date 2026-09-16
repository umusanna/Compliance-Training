export type SectorId =
  | 'food_hospitality'
  | 'health_social_care'
  | 'financial_services'
  | 'construction'
  | 'general_business';

export type RoleLevel = 'manager' | 'supervisor' | 'field_worker' | 'admin';

export type Jurisdiction = 'england_wales' | 'scotland' | 'northern_ireland';

export type UserRole = 'admin' | 'business_manager' | 'viewer';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  businessId?: string;
}

export interface Tenant {
  id: string;
  name: string;
  contactEmail: string;
  createdAt: string;
  plan: 'standard' | 'enterprise';
}

export interface RoleBreakdown {
  manager: number;
  supervisor: number;
  field_worker: number;
  admin: number;
}

export interface BusinessProfile {
  id: string;
  tenantId?: string;
  name: string;
  tradingName?: string;
  sector: SectorId;
  subSector: string;
  jurisdiction: Jurisdiction;
  companyNumber: string;
  employeeCounts: RoleBreakdown;
  turnoverGbp: number;
  balanceSheetGbp: number;
  fsaRegistered?: boolean;
  cqcRegistered?: boolean;
  fcaAuthorised?: boolean;
  cdmNotifiable?: boolean;
  onboardingCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ChecklistCategory =
  | 'sector_specific'
  | 'universal_hse'
  | 'universal_employment'
  | 'universal_gdpr'
  | 'universal_companies_house';

export type AuditItemStatus = 'compliant' | 'in_progress' | 'gap_critical' | 'not_started';

export interface ChecklistAttachment {
  id: string;
  checklistId?: string;
  fileName: string;
  fileType?: string;
  fileSizeBytes?: number;
  fileSize?: string;
  uploadedAt?: string;
  uploadedDate?: string;
  uploadedBy?: string;
  notes?: string;
}

export type EvidenceAttachment = ChecklistAttachment;

export interface AuditChecklistItem {
  id: string;
  businessId?: string;
  category: ChecklistCategory;
  sector?: SectorId;
  title: string;
  description: string;
  plainLanguageHelp?: string; // Clear 1-2 sentences on what "compliant" looks like
  regulatoryBody: string; // e.g. 'FSA', 'CQC', 'FCA', 'HSE', 'Home Office', 'ICO', 'HMRC'
  legalReference: string; // e.g. 'Food Safety Act 1990', 'Border Security Act 2025'
  status: AuditItemStatus;
  managerNotes: string;
  evidenceDocumented: boolean;
  attachments?: ChecklistAttachment[];
  lastReviewedDate?: string;
  penaltyRiskText: string;
  scoringWeight: number; // 1 to 5
  lastVerifiedDate?: string; // When this regulatory requirement was verified by our compliance team
  sourceUrl?: string; // Official gov.uk / regulatory citation
  isCustomClientOverride?: boolean; // Bespoke checklist item added for this client
}

export interface Course {
  id: string;
  code: string;
  title: string;
  sector: SectorId | 'universal';
  targetRoles: RoleLevel[];
  description: string;
  plainLanguageHelp?: string;
  durationHours: number;
  accreditation: string; // e.g. 'CPD Certified', 'RoSPA Approved', 'CIEH Assured', 'Skills for Care Endorsed'
  renewalMonths: number; // e.g. 12, 24, 36 months
  isMandatoryByLaw: boolean;
  regulatoryDriver: string;
  lastVerifiedDate?: string;
  sourceUrl?: string;
}

export interface LearnerCourseRecord {
  courseId: string;
  courseTitle: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'expired';
  progressPercent: number;
  completedDate?: string;
  expiryDate?: string;
  certificateNumber?: string;
  score?: number;
  isOurPlatform: boolean; // Running in our client LMS environment
}

export interface Learner {
  id: string;
  businessId?: string;
  name: string;
  email: string;
  roleLevel: RoleLevel;
  jobTitle: string;
  department: string;
  startDate: string;
  rightToWorkStatus: 'verified_statutory_excuse' | 'pending_verification' | 'expired_check';
  rightToWorkCheckDate?: string;
  rightToWorkShareCode?: string;
  courses: LearnerCourseRecord[];
  notes?: string;
  isArchived?: boolean;
  archivedAt?: string;
  archivedDate?: string;
  archivedReason?: string;
}

export interface FoodHygieneScoreBreakdown {
  hygieneProceduresScore: number; // 0, 5, 10, 15, 20, 25
  structuralComplianceScore: number; // 0, 5, 10, 15, 20, 25
  confidenceInManagementScore: number; // 0, 5, 10, 20, 30
  totalScore: number;
  officialRating: number; // 0 to 5
  descriptor: string;
  cappedByElement: boolean;
  limitingFactor?: string;
}

export interface CqcScoreBreakdown {
  safe: 'Outstanding' | 'Good' | 'Requires Improvement' | 'Inadequate';
  effective: 'Outstanding' | 'Good' | 'Requires Improvement' | 'Inadequate';
  caring: 'Outstanding' | 'Good' | 'Requires Improvement' | 'Inadequate';
  responsive: 'Outstanding' | 'Good' | 'Requires Improvement' | 'Inadequate';
  wellLed: 'Outstanding' | 'Good' | 'Requires Improvement' | 'Inadequate';
  overallRating: 'Outstanding' | 'Good' | 'Requires Improvement' | 'Inadequate';
}

export interface PriorityActionItem {
  id: string;
  title: string;
  type: 'missing_training' | 'expired_cert' | 'unverified_rtw' | 'critical_checklist';
  description: string;
  severity: 'critical' | 'high' | 'medium';
  impactWeight: number;
  potentialPenalty: string;
  remediationAction: string;
  targetTab: 'learners' | 'checklists' | 'solutions' | 'business';
  entityId?: string;
}

export interface ComplianceAuditReport {
  hasEnoughData: boolean; // False if 0 learners or 0 checklists
  overallScorePercent: number;
  gradeBadge: string;
  gradeDescription: string;
  gradeColor: 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';
  scoreWeightingRationale: string; // Documentation of the 45/40/15 split
  
  trainingScorePercent: number;
  operationalChecklistScorePercent: number;
  rightToWorkScorePercent: number;

  totalEmployees: number;
  totalLearnersRegistered: number;
  fullyCompliantLearners: number;
  learnersWithTrainingGaps: number;

  totalMandatoryCourseSlots: number;
  completedMandatoryCourseSlots: number;
  expiredMandatoryCourseSlots: number;
  inProgressCourseSlots: number;
  missingMandatoryCourseSlots: number;

  expiringWithin30DaysSlots: number;

  learnerGaps: {
    learner: Learner;
    missingMandatoryCourses: Course[];
    expiredCourses: Course[];
    expiringSoonCourses: Course[];
    inProgressCourses: LearnerCourseRecord[];
  }[];

  statutoryPenaltiesRisk: {
    regulator: string;
    regulation: string;
    riskAmountFormatted: string;
    riskDescription: string;
    severity: 'critical' | 'warning' | 'advisory';
    sourceUrl?: string;
    lastVerifiedDate?: string;
  }[];

  foodHygieneBreakdown?: FoodHygieneScoreBreakdown;
  cqcBreakdown?: CqcScoreBreakdown;

  criticalOperationalGaps: AuditChecklistItem[];
  inProgressOperationalItems: AuditChecklistItem[];

  priorityActions: PriorityActionItem[];
}

export interface AuditSnapshot {
  id: string;
  businessId: string;
  timestamp: string;
  inspectorRef?: string;
  notes?: string;
  overallScorePercent: number;
  trainingScorePercent: number;
  operationalChecklistScorePercent: number;
  rightToWorkScorePercent: number;
  gradeBadge: string;
  totalEmployees: number;
  totalLearners: number;
  criticalGapsCount: number;
  expiredCertsCount: number;
  summary: string;
  reportJson: string;
}

export interface RegulatoryChangelogEntry {
  id: string;
  entityType: 'penalty_figure' | 'course_requirement' | 'checklist_template' | 'scoring_threshold';
  entityId: string;
  changedField: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedDate: string;
  sourceReference: string;
}

export interface PortfolioClientMetric {
  businessId: string;
  businessName: string;
  sector: SectorId;
  totalEmployees: number;
  overallScorePercent: number;
  gradeBadge: string;
  expiredCertsCount: number;
  pendingRtwCount: number;
  lastAuditDate?: string;
  status: 'compliant' | 'warning' | 'critical';
}
