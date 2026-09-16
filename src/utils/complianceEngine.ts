import {
  AuditChecklistItem,
  BusinessProfile,
  ComplianceAuditReport,
  Course,
  FoodHygieneScoreBreakdown,
  CqcScoreBreakdown,
  Learner,
  LearnerCourseRecord,
  RoleLevel,
  PriorityActionItem,
} from '../types';
import { COURSES_CATALOG } from '../data/regulatoryStandards';
import { CHECKLIST_IDS, validateChecklistIntegrity } from '../data/checklistConstants';

/**
 * Computes expiration date given a completion date string (YYYY-MM-DD) and renewal duration in months.
 */
export function computeExpiryDate(completedDate: string, renewalMonths: number): string {
  const comp = new Date(completedDate);
  if (isNaN(comp.getTime())) {
    const today = new Date();
    today.setMonth(today.getMonth() + renewalMonths);
    return today.toISOString().split('T')[0];
  }
  const exp = new Date(comp);
  exp.setMonth(exp.getMonth() + renewalMonths);
  return exp.toISOString().split('T')[0];
}

/**
 * Checks and updates a learner course record's status based on current date vs expiryDate.
 * Returns days until expiry:
 *   negative = already expired
 *   0 to 30 = expiring soon (amber warning)
 *   > 30 = currently valid
 */
export function evaluateRecordExpiry(
  record: LearnerCourseRecord,
  renewalMonths?: number
): { status: LearnerCourseRecord['status']; daysUntilExpiry: number; expiryDate: string } {
  if (record.status !== 'completed' && record.status !== 'expired') {
    return { status: record.status, daysUntilExpiry: 999, expiryDate: record.expiryDate || '' };
  }

  let expiryDate = record.expiryDate;
  if (!expiryDate && record.completedDate && renewalMonths) {
    expiryDate = computeExpiryDate(record.completedDate, renewalMonths);
  }

  if (!expiryDate) {
    return { status: record.status, daysUntilExpiry: 999, expiryDate: '' };
  }

  const today = new Date();
  const exp = new Date(expiryDate);
  const diffTime = exp.getTime() - today.getTime();
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return { status: 'expired', daysUntilExpiry, expiryDate };
  }

  return { status: 'completed', daysUntilExpiry, expiryDate };
}

/**
 * Normalizes all course records for a learner against catalog renewal periods,
 * updating any lapsed certificates to status 'expired'.
 */
export function syncLearnerCertificatesWithExpiry(
  learner: Learner,
  coursesCatalog: Course[] = COURSES_CATALOG
): Learner {
  const updatedCourses = learner.courses.map((record) => {
    const catalogItem = coursesCatalog.find((c) => c.id === record.courseId);
    const renewalMonths = catalogItem?.renewalMonths || 24;
    const { status, expiryDate } = evaluateRecordExpiry(record, renewalMonths);
    return {
      ...record,
      status,
      expiryDate,
    };
  });

  return {
    ...learner,
    courses: updatedCourses,
  };
}

/**
 * Determines mandatory courses for a learner given their workforce role and business sector.
 */
export function getMandatoryCoursesForLearner(
  roleLevel: RoleLevel,
  sector: BusinessProfile['sector'],
  coursesCatalog: Course[] = COURSES_CATALOG
): Course[] {
  return coursesCatalog.filter((course) => {
    if (!course.targetRoles.includes(roleLevel)) {
      return false;
    }

    if (course.sector === 'universal') {
      if (course.id === 'course-univ-rtw') {
        return roleLevel === 'manager' || roleLevel === 'admin';
      }
      if (course.id === 'course-univ-gdpr') {
        return roleLevel === 'manager' || roleLevel === 'admin';
      }
      return true; // e.g. HS-GEN-101, FIRE-101
    }

    return course.sector === sector;
  });
}

/**
 * Evaluates Food Hygiene Rating according to official FSA Brand Standard.
 */
export function calculateFoodHygieneScore(
  checklists: AuditChecklistItem[],
  learners: Learner[]
): FoodHygieneScoreBreakdown {
  const tempCheck = checklists.find((c) => c.id === CHECKLIST_IDS.FOOD_TEMP_LOGS);
  const pestCheck = checklists.find((c) => c.id === CHECKLIST_IDS.FOOD_PEST_CONTROL);
  const sfbbCheck = checklists.find((c) => c.id === CHECKLIST_IDS.FOOD_HACCP_PLAN);
  const allergenCheck = checklists.find((c) => c.id === CHECKLIST_IDS.FOOD_ALLERGEN_MATRIX);

  const kitchenStaff = learners.filter(
    (l) => !l.isArchived && (l.roleLevel === 'field_worker' || l.roleLevel === 'supervisor')
  );

  // Exclude expired certificates from valid trained count
  const trainedCount = kitchenStaff.filter((l) =>
    l.courses.some(
      (c) =>
        (c.courseId === 'course-food-l2' || c.courseId === 'course-food-l3') &&
        c.status === 'completed'
    )
  ).length;
  const trainingRatio = kitchenStaff.length > 0 ? trainedCount / kitchenStaff.length : 1;

  // 1. Hygiene & safety procedures
  let hygieneScore = 0;
  if (tempCheck?.status === 'gap_critical' || trainingRatio < 0.5) {
    hygieneScore = 15;
  } else if (tempCheck?.status === 'in_progress' || trainingRatio < 0.8) {
    hygieneScore = 10;
  } else if (!tempCheck?.evidenceDocumented) {
    hygieneScore = 5;
  }

  // 2. Structural compliance
  let structuralScore = 0;
  if (pestCheck?.status === 'gap_critical') {
    structuralScore = 20;
  } else if (pestCheck?.status === 'in_progress') {
    structuralScore = 10;
  } else if (!pestCheck?.evidenceDocumented) {
    structuralScore = 5;
  }

  // 3. Confidence in management (SFBB / HACCP, Supervisor training)
  const managerTrained = learners
    .filter((l) => !l.isArchived && (l.roleLevel === 'manager' || l.roleLevel === 'supervisor'))
    .some((l) =>
      l.courses.some((c) => c.courseId === 'course-food-l3' && c.status === 'completed')
    );

  let confidenceScore = 0;
  if (sfbbCheck?.status === 'gap_critical' || !managerTrained) {
    confidenceScore = 20;
  } else if (sfbbCheck?.status === 'in_progress' || allergenCheck?.status === 'in_progress') {
    confidenceScore = 10;
  } else if (!sfbbCheck?.evidenceDocumented) {
    confidenceScore = 5;
  }

  const totalScore = hygieneScore + structuralScore + confidenceScore;
  const maxElement = Math.max(hygieneScore, structuralScore, confidenceScore);

  let officialRating = 5;
  let descriptor = 'Very good';
  let cappedByElement = false;
  let limitingFactor: string | undefined;

  // Official FSA Brand Standard additional scoring factor capping rules
  if (totalScore <= 15 && maxElement <= 5) {
    officialRating = 5;
    descriptor = 'Very good';
  } else if (totalScore <= 20 && maxElement <= 10) {
    officialRating = 4;
    descriptor = 'Good';
    if (totalScore <= 15 && maxElement > 5) {
      cappedByElement = true;
      limitingFactor = `An individual element scored ${maxElement} (max allowed for Rating 5 is 5).`;
    }
  } else if (totalScore <= 30 && maxElement <= 10) {
    officialRating = 3;
    descriptor = 'Generally satisfactory';
    if (totalScore <= 20 && maxElement > 10) {
      cappedByElement = true;
      limitingFactor = `An individual element scored ${maxElement} (max allowed for Rating 4 is 10).`;
    }
  } else if (totalScore <= 40 && maxElement <= 15) {
    officialRating = 2;
    descriptor = 'Improvement necessary';
    if (totalScore <= 30 && maxElement > 10) {
      cappedByElement = true;
      limitingFactor = `An individual element scored ${maxElement} (max allowed for Rating 3 is 10).`;
    }
  } else if (totalScore <= 50 && maxElement <= 20) {
    officialRating = 1;
    descriptor = 'Major improvement necessary';
    if (totalScore <= 40 && maxElement > 15) {
      cappedByElement = true;
      limitingFactor = `An individual element scored ${maxElement} (max allowed for Rating 2 is 15).`;
    }
  } else {
    officialRating = 0;
    descriptor = 'Urgent improvement necessary';
  }

  return {
    hygieneProceduresScore: hygieneScore,
    structuralComplianceScore: structuralScore,
    confidenceInManagementScore: confidenceScore,
    totalScore,
    officialRating,
    descriptor,
    cappedByElement,
    limitingFactor,
  };
}

/**
 * Evaluates CQC 5 Key Questions and 4-tier overall rating.
 */
export function calculateCqcBreakdown(
  checklists: AuditChecklistItem[],
  learners: Learner[]
): CqcScoreBreakdown {
  const dbsCheck = checklists.find((c) => c.id === CHECKLIST_IDS.CARE_DBS_CHECKS);
  const medsCheck = checklists.find((c) => c.id === CHECKLIST_IDS.CARE_MAR_CHARTS);
  const carePlansCheck = checklists.find((c) => c.id === CHECKLIST_IDS.CARE_PERSON_CENTRED_PLANS);
  const safeguardCheck = checklists.find((c) => c.id === CHECKLIST_IDS.CARE_REGISTERED_MANAGER);

  const careWorkers = learners.filter((l) => !l.isArchived && l.roleLevel === 'field_worker');
  const careCertDone = careWorkers.filter((l) =>
    l.courses.some((c) => c.courseId === 'course-care-cert' && c.status === 'completed')
  ).length;
  const careCertRatio = careWorkers.length > 0 ? careCertDone / careWorkers.length : 1;

  let safe: 'Outstanding' | 'Good' | 'Requires Improvement' | 'Inadequate' = 'Good';
  if (dbsCheck?.status === 'gap_critical' || medsCheck?.status === 'gap_critical') {
    safe = 'Inadequate';
  } else if (dbsCheck?.status === 'in_progress' || medsCheck?.status === 'in_progress') {
    safe = 'Requires Improvement';
  } else if (dbsCheck?.evidenceDocumented && medsCheck?.evidenceDocumented && careCertRatio >= 0.95) {
    safe = 'Outstanding';
  }

  let effective: 'Outstanding' | 'Good' | 'Requires Improvement' | 'Inadequate' = 'Good';
  if (careCertRatio < 0.5) {
    effective = 'Inadequate';
  } else if (careCertRatio < 0.8) {
    effective = 'Requires Improvement';
  } else if (careCertRatio >= 0.9) {
    effective = 'Good';
  }

  const caring: 'Outstanding' | 'Good' | 'Requires Improvement' | 'Inadequate' = 'Good';

  let responsive: 'Outstanding' | 'Good' | 'Requires Improvement' | 'Inadequate' = 'Good';
  if (carePlansCheck?.status === 'gap_critical') {
    responsive = 'Requires Improvement';
  } else if (carePlansCheck?.status === 'compliant' && carePlansCheck?.evidenceDocumented) {
    responsive = 'Good';
  }

  let wellLed: 'Outstanding' | 'Good' | 'Requires Improvement' | 'Inadequate' = 'Good';
  if (safeguardCheck?.status === 'gap_critical') {
    wellLed = 'Inadequate';
  } else if (safeguardCheck?.status === 'in_progress') {
    wellLed = 'Requires Improvement';
  } else if (safeguardCheck?.evidenceDocumented) {
    wellLed = 'Good';
  }

  const ratings = [safe, effective, caring, responsive, wellLed];
  const inadequateCount = ratings.filter((r) => r === 'Inadequate').length;
  const requiresImprovementCount = ratings.filter((r) => r === 'Requires Improvement').length;
  const outstandingCount = ratings.filter((r) => r === 'Outstanding').length;

  let overallRating: 'Outstanding' | 'Good' | 'Requires Improvement' | 'Inadequate' = 'Good';
  if (inadequateCount >= 2 || (inadequateCount >= 1 && wellLed === 'Inadequate')) {
    overallRating = 'Inadequate';
  } else if (requiresImprovementCount >= 2 || inadequateCount >= 1) {
    overallRating = 'Requires Improvement';
  } else if (outstandingCount >= 2 && requiresImprovementCount === 0 && inadequateCount === 0) {
    overallRating = 'Outstanding';
  } else {
    overallRating = 'Good';
  }

  return {
    safe,
    effective,
    caring,
    responsive,
    wellLed,
    overallRating,
  };
}

/**
 * Main Compliance Audit Analysis Engine
 * 100% Deterministic and Rule-based.
 *
 * Weighting Split:
 * - 45% Workforce Training Completion & Recency (LMS courses, penalizing expired certs)
 * - 40% Manager Operational Checklists & Evidenced Registers
 * - 15% Statutory Right to Work & Legal Baseline
 */
export function runComplianceAudit(
  profile: BusinessProfile,
  checklists: AuditChecklistItem[],
  rawLearners: Learner[],
  coursesCatalog: Course[] = COURSES_CATALOG
): ComplianceAuditReport {
  // Validate checklist ID integrity on startup
  validateChecklistIntegrity(checklists, [
    CHECKLIST_IDS.UNIV_RTW_CHECKS,
    CHECKLIST_IDS.UNIV_EMPLOYERS_LIABILITY,
  ]);

  // Synchronize expiry dates for all active (non-archived) learners
  const activeLearners = rawLearners
    .filter((l) => !l.isArchived)
    .map((l) => syncLearnerCertificatesWithExpiry(l, coursesCatalog));

  const totalEmployees = Object.values(profile.employeeCounts).reduce<number>(
    (a, b) => a + (Number(b) || 0),
    0
  );

  // Check for Zero-Division / Not Enough Data edge case
  const hasEnoughData = activeLearners.length > 0 && checklists.length > 0;
  if (!hasEnoughData) {
    return {
      hasEnoughData: false,
      overallScorePercent: 0,
      gradeBadge: 'Not enough data yet',
      gradeDescription:
        'Register your business learners and complete initial checklists to calculate your audit readiness grade.',
      gradeColor: 'slate',
      scoreWeightingRationale:
        'Audits are weighted 45% Training, 40% Operational Checklists, and 15% Right to Work verification. Data is currently insufficient to evaluate.',
      trainingScorePercent: 0,
      operationalChecklistScorePercent: 0,
      rightToWorkScorePercent: 0,
      totalEmployees,
      totalLearnersRegistered: activeLearners.length,
      fullyCompliantLearners: 0,
      learnersWithTrainingGaps: 0,
      totalMandatoryCourseSlots: 0,
      completedMandatoryCourseSlots: 0,
      expiredMandatoryCourseSlots: 0,
      inProgressCourseSlots: 0,
      missingMandatoryCourseSlots: 0,
      expiringWithin30DaysSlots: 0,
      learnerGaps: [],
      statutoryPenaltiesRisk: [],
      criticalOperationalGaps: [],
      inProgressOperationalItems: [],
      priorityActions: [
        {
          id: 'action-add-learners',
          title: 'Register Initial Learners Roster',
          type: 'missing_training',
          description: 'Add your staff members or import via CSV to begin compliance tracking.',
          severity: 'critical',
          impactWeight: 5,
          potentialPenalty: 'Audit preparation incomplete',
          remediationAction: 'Go to Learners tab and register staff or import CSV',
          targetTab: 'learners',
        },
      ],
    };
  }

  // 1. Evaluate Learners Training
  let totalMandatorySlots = 0;
  let completedMandatorySlots = 0;
  let inProgressSlots = 0;
  let expiredMandatorySlots = 0;
  let expiringWithin30DaysSlots = 0;
  let fullyCompliantLearnersCount = 0;

  const learnerGaps: ComplianceAuditReport['learnerGaps'] = [];

  activeLearners.forEach((learner) => {
    const mandatoryCourses = getMandatoryCoursesForLearner(
      learner.roleLevel,
      profile.sector,
      coursesCatalog
    );
    const missingCourses: Course[] = [];
    const expiredCourses: Course[] = [];
    const expiringSoonCourses: Course[] = [];
    const inProgressRecords: LearnerCourseRecord[] = [];

    mandatoryCourses.forEach((requiredCourse) => {
      totalMandatorySlots += 1;
      const record = learner.courses.find((c) => c.courseId === requiredCourse.id);

      if (!record || record.status === 'not_started') {
        missingCourses.push(requiredCourse);
      } else if (record.status === 'expired') {
        expiredCourses.push(requiredCourse);
        expiredMandatorySlots += 1;
      } else if (record.status === 'completed') {
        completedMandatorySlots += 1;
        // Check if expiring within 30 days
        const { daysUntilExpiry } = evaluateRecordExpiry(record, requiredCourse.renewalMonths);
        if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
          expiringSoonCourses.push(requiredCourse);
          expiringWithin30DaysSlots += 1;
        }
      } else if (record.status === 'in_progress') {
        inProgressSlots += 1;
        // partial credit for active coursework running in our LMS
        completedMandatorySlots += (record.progressPercent || 50) / 100;
        inProgressRecords.push(record);
      }
    });

    const isFullyCompliant =
      missingCourses.length === 0 &&
      expiredCourses.length === 0 &&
      inProgressRecords.length === 0 &&
      learner.rightToWorkStatus === 'verified_statutory_excuse';

    if (isFullyCompliant) {
      fullyCompliantLearnersCount += 1;
    }

    if (
      missingCourses.length > 0 ||
      expiredCourses.length > 0 ||
      expiringSoonCourses.length > 0 ||
      inProgressRecords.length > 0
    ) {
      learnerGaps.push({
        learner,
        missingMandatoryCourses: missingCourses,
        expiredCourses,
        expiringSoonCourses,
        inProgressCourses: inProgressRecords,
      });
    }
  });

  const trainingScorePercent =
    totalMandatorySlots > 0 ? Math.round((completedMandatorySlots / totalMandatorySlots) * 100) : 0;

  // 2. Evaluate Operational & Audit Checklists
  let totalChecklistWeight = 0;
  let achievedChecklistWeight = 0;

  checklists.forEach((item) => {
    const weight = item.scoringWeight || 3;
    totalChecklistWeight += weight;

    if (item.status === 'compliant') {
      // Full points if evidence is attached/documented, 85% if ticked compliant with no evidence
      achievedChecklistWeight += weight * (item.evidenceDocumented ? 1.0 : 0.85);
    } else if (item.status === 'in_progress') {
      achievedChecklistWeight += weight * 0.45;
    } else {
      achievedChecklistWeight += 0;
    }
  });

  const operationalChecklistScorePercent =
    totalChecklistWeight > 0 ? Math.round((achievedChecklistWeight / totalChecklistWeight) * 100) : 0;

  // 3. Right-to-Work Score & Statutory Excuse Verification
  const totalLearners = activeLearners.length;
  const unverifiedLearners = activeLearners.filter(
    (l) => l.rightToWorkStatus === 'pending_verification' || l.rightToWorkStatus === 'expired_check'
  );
  const verifiedLearners = activeLearners.filter(
    (l) => l.rightToWorkStatus === 'verified_statutory_excuse'
  );
  const rightToWorkScorePercent =
    totalLearners > 0 ? Math.round((verifiedLearners.length / totalLearners) * 100) : 0;

  // 4. Combined Overall Compliance Score
  // Documented Split Rationale:
  // - 45% Workforce Training: Primary driver of frontline competency and mandatory certifications. Expired certs hit this directly.
  // - 40% Operational Checklists: Structural controls, documented policies (HACCP/SFBB, fire assessments, risk registers).
  // - 15% Statutory Right to Work: Universal legal requirement carrying direct £45,000–£60,000 civil fines.
  const scoreWeightingRationale =
    'Overall score is mathematically calculated as 45% Workforce Training Completion & Recency, 40% Operational Checklists & Evidenced Registers, and 15% Home Office Statutory Right to Work Verification. Expired certificates receive zero credit and trigger direct audit gaps.';

  const overallScorePercent = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        trainingScorePercent * 0.45 +
          operationalChecklistScorePercent * 0.4 +
          rightToWorkScorePercent * 0.15
      )
    )
  );

  // 5. Grade Badge & Description
  let gradeBadge = 'Compliant';
  let gradeDescription = 'High audit readiness with minor or no gaps identified.';
  let gradeColor: ComplianceAuditReport['gradeColor'] = 'emerald';

  if (overallScorePercent >= 90 && unverifiedLearners.length === 0 && expiredMandatorySlots === 0) {
    gradeBadge = 'Full Audit Readiness';
    gradeDescription = 'Exemplary compliance posture. Documentation and training meet regulatory standards.';
    gradeColor = 'emerald';
  } else if (overallScorePercent >= 75) {
    gradeBadge = 'Generally Satisfactory';
    gradeDescription = 'Satisfactory compliance with minor training or evidence documentation gaps.';
    gradeColor = 'blue';
  } else if (overallScorePercent >= 55) {
    gradeBadge = 'Requires Improvement';
    gradeDescription = 'Substantial compliance gaps detected. Action required to avoid regulatory intervention.';
    gradeColor = 'amber';
  } else {
    gradeBadge = 'High Audit Risk';
    gradeDescription = 'Severe statutory violations or training deficits. High vulnerability to enforcement fines.';
    gradeColor = 'rose';
  }

  // 6. Sector specific breakdowns
  let foodHygieneBreakdown: FoodHygieneScoreBreakdown | undefined;
  let cqcBreakdown: CqcScoreBreakdown | undefined;

  if (profile.sector === 'food_hospitality') {
    foodHygieneBreakdown = calculateFoodHygieneScore(checklists, activeLearners);
  } else if (profile.sector === 'health_social_care') {
    cqcBreakdown = calculateCqcBreakdown(checklists, activeLearners);
  }

  // 7. Statutory Penalties Exposure
  const statutoryPenaltiesRisk: ComplianceAuditReport['statutoryPenaltiesRisk'] = [];

  // Home Office Right to Work Risk
  if (unverifiedLearners.length > 0) {
    const penaltyAmount = unverifiedLearners.length * 45000;
    statutoryPenaltiesRisk.push({
      regulator: 'Home Office (Immigration Enforcement)',
      regulation: 'Immigration Act 2016 & Border Security Act 2025',
      riskAmountFormatted: `£${penaltyAmount.toLocaleString('en-GB')}`,
      riskDescription: `${unverifiedLearners.length} employee(s) lack verified statutory excuse before shift start. Civil penalties are £45,000 per worker for first breach, escalating to £60,000.`,
      severity: 'critical',
      sourceUrl: 'https://www.gov.uk/penalties-for-employing-illegal-workers',
      lastVerifiedDate: '2026-08-15',
    });
  }

  // Expired Certificate Risk
  if (expiredMandatorySlots > 0) {
    statutoryPenaltiesRisk.push({
      regulator: 'Regulated Sector Audit Standard',
      regulation: 'Statutory Training Recency Standards (HSE / FSA / CQC / FCA)',
      riskAmountFormatted: `${expiredMandatorySlots} Expired Certifications`,
      riskDescription: `${expiredMandatorySlots} mandatory training certificates have passed their legal renewal date. Regulators treat expired certificates as non-compliant breaches.`,
      severity: 'critical',
      sourceUrl: 'https://www.hse.gov.uk/training/',
      lastVerifiedDate: '2026-09-01',
    });
  }

  // HSE Insurance Risk
  const insuranceCheck = checklists.find((c) => c.id === CHECKLIST_IDS.UNIV_EMPLOYERS_LIABILITY);
  if (insuranceCheck && insuranceCheck.status !== 'compliant') {
    statutoryPenaltiesRisk.push({
      regulator: 'Health and Safety Executive (HSE)',
      regulation: "Employers' Liability (Compulsory Insurance) Act 1969",
      riskAmountFormatted: '£2,500 / day',
      riskDescription: 'Trading without valid £5,000,000 minimum Employer’s Liability Insurance is a criminal offence punishable by up to £2,500 fine per day.',
      severity: 'critical',
      sourceUrl: 'https://www.hse.gov.uk/business/employers-liability.htm',
      lastVerifiedDate: '2026-08-01',
    });
  }

  // HSE Fee for Intervention Risk
  const criticalHse = checklists.filter(
    (c) => c.category === 'universal_hse' && c.status === 'gap_critical'
  );
  if (criticalHse.length > 0) {
    statutoryPenaltiesRisk.push({
      regulator: 'HSE',
      regulation: 'Health and Safety at Work etc. Act 1974 (Fee for Intervention)',
      riskAmountFormatted: '£163 / hour + Notices',
      riskDescription: 'Material health & safety breaches trigger HSE Fee for Intervention invoicing for all inspector time, plus potential Improvement or Prohibition Notices.',
      severity: 'warning',
      sourceUrl: 'https://www.hse.gov.uk/fees-for-intervention.htm',
      lastVerifiedDate: '2026-07-15',
    });
  }

  // ICO UK GDPR Risk
  const icoFeeCheck = checklists.find((c) => c.id === CHECKLIST_IDS.UNIV_ICO_FEE_REGISTRATION);
  if (icoFeeCheck?.status === 'gap_critical') {
    statutoryPenaltiesRisk.push({
      regulator: "Information Commissioner's Office (ICO)",
      regulation: 'Data Protection (Charges and Information) Regulations 2018',
      riskAmountFormatted: 'Up to £4,350 fixed civil fine',
      riskDescription: 'Processing personal data without paying the mandatory annual ICO data protection fee.',
      severity: 'warning',
      sourceUrl: 'https://ico.org.uk/for-organisations/data-protection-fee/',
      lastVerifiedDate: '2026-08-10',
    });
  }

  // FSA Rating 0-2 Risk for Food
  if (foodHygieneBreakdown && foodHygieneBreakdown.officialRating <= 2) {
    statutoryPenaltiesRisk.push({
      regulator: 'Food Standards Agency / Local EHO',
      regulation: 'Food Safety Act 1990 & FHRS Brand Standard',
      riskAmountFormatted: `Rating ${foodHygieneBreakdown.officialRating} (${foodHygieneBreakdown.descriptor})`,
      riskDescription: 'Low ratings trigger re-inspection enforcement, commercial delisting on delivery aggregators, and risk of Hygiene Improvement Notices.',
      severity: 'critical',
      sourceUrl: 'https://www.food.gov.uk/safety-hygiene/food-hygiene-rating-scheme',
      lastVerifiedDate: '2026-08-20',
    });
  }

  // CQC Inadequate Risk
  if (cqcBreakdown && (cqcBreakdown.overallRating === 'Inadequate' || cqcBreakdown.safe === 'Inadequate')) {
    statutoryPenaltiesRisk.push({
      regulator: 'Care Quality Commission (CQC)',
      regulation: 'Health and Social Care Act 2008 Regulated Activities',
      riskAmountFormatted: 'Special Measures / License Suspension',
      riskDescription: 'CQC Inadequate rating triggers special measures, local authority commissioning embargoes, and potential cancellation of registered provider license.',
      severity: 'critical',
      sourceUrl: 'https://www.cqc.org.uk/guidance-providers/regulations-enforcement',
      lastVerifiedDate: '2026-08-25',
    });
  }

  const criticalOperationalGaps = checklists.filter(
    (c) => c.status === 'gap_critical' || (c.status === 'not_started' && c.scoringWeight >= 4)
  );

  const inProgressOperationalItems = checklists.filter(
    (c) => c.status === 'in_progress' || (c.status === 'compliant' && !c.evidenceDocumented)
  );

  // 8. Ranked Priority Action List (ordered by impact and penalty severity)
  const priorityActions: PriorityActionItem[] = [];

  // RTW checks first
  if (unverifiedLearners.length > 0) {
    priorityActions.push({
      id: 'p-action-rtw',
      title: `Verify Right to Work for ${unverifiedLearners.length} employee(s)`,
      type: 'unverified_rtw',
      description: `Home Office civil penalties are £45,000 per worker for first breach. Secure digital share codes immediately.`,
      severity: 'critical',
      impactWeight: 5,
      potentialPenalty: `£${(unverifiedLearners.length * 45000).toLocaleString('en-GB')} Civil Penalty`,
      remediationAction: 'Open Learner Records and verify Right to Work statutory excuses',
      targetTab: 'learners',
    });
  }

  // Expired courses
  if (expiredMandatorySlots > 0) {
    priorityActions.push({
      id: 'p-action-expired-certs',
      title: `Re-certify ${expiredMandatorySlots} expired course certificate(s)`,
      type: 'expired_cert',
      description: 'Certificates that passed renewal dates are treated as non-compliant breaches by statutory auditors.',
      severity: 'critical',
      impactWeight: 5,
      potentialPenalty: 'Audit Non-Compliance Finding',
      remediationAction: 'Enrol affected staff into refresher modules in the Solutions Catalog',
      targetTab: 'solutions',
    });
  }

  // Critical operational gaps
  criticalOperationalGaps.forEach((gap) => {
    priorityActions.push({
      id: `p-action-chk-${gap.id}`,
      title: `Resolve Checklist Gap: ${gap.title}`,
      type: 'critical_checklist',
      description: `${gap.description} (${gap.regulatoryBody})`,
      severity: gap.scoringWeight >= 5 ? 'critical' : 'high',
      impactWeight: gap.scoringWeight,
      potentialPenalty: gap.penaltyRiskText,
      remediationAction: 'Document procedure and attach evidence on the Checklists tab',
      targetTab: 'checklists',
      entityId: gap.id,
    });
  });

  // Missing mandatory training
  const missingSlotsCount = Math.max(
    0,
    totalMandatorySlots - Math.round(completedMandatorySlots) - inProgressSlots
  );
  if (missingSlotsCount > 0) {
    priorityActions.push({
      id: 'p-action-missing-courses',
      title: `Enrol staff in ${missingSlotsCount} missing mandatory course slot(s)`,
      type: 'missing_training',
      description: 'Close workforce role training gaps to boost your overall audit readiness score.',
      severity: 'high',
      impactWeight: 4,
      potentialPenalty: 'Staffing Competence Deficiency',
      remediationAction: 'Batch-enrol non-compliant staff via the Training Solutions tab',
      targetTab: 'solutions',
    });
  }

  return {
    hasEnoughData: true,
    overallScorePercent,
    gradeBadge,
    gradeDescription,
    gradeColor,
    scoreWeightingRationale,
    trainingScorePercent,
    operationalChecklistScorePercent,
    rightToWorkScorePercent,
    totalEmployees,
    totalLearnersRegistered: activeLearners.length,
    fullyCompliantLearners: fullyCompliantLearnersCount,
    learnersWithTrainingGaps: learnerGaps.length,
    totalMandatoryCourseSlots: totalMandatorySlots,
    completedMandatoryCourseSlots: Math.round(completedMandatorySlots),
    expiredMandatoryCourseSlots: expiredMandatorySlots,
    inProgressCourseSlots: inProgressSlots,
    missingMandatoryCourseSlots: missingSlotsCount,
    expiringWithin30DaysSlots,
    learnerGaps,
    statutoryPenaltiesRisk,
    foodHygieneBreakdown,
    cqcBreakdown,
    criticalOperationalGaps,
    inProgressOperationalItems,
    priorityActions,
  };
}
