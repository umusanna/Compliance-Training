/**
 * Shared constants for regulatory checklist item IDs.
 * Binds the scoring engine, penalty calculations, and templates to a single compile-time source of truth.
 */

export const CHECKLIST_IDS = {
  // Food & Hospitality
  FOOD_TEMP_LOGS: 'chk-food-temp-logs',
  FOOD_ALLERGEN_MATRIX: 'chk-food-allergen-matrix',
  FOOD_HACCP_PLAN: 'chk-food-haccp-plan',
  FOOD_PEST_CONTROL: 'chk-food-pest-control',
  FOOD_CROSS_CONTAM: 'chk-food-cross-contam',

  // Health & Social Care
  CARE_DBS_CHECKS: 'chk-care-dbs-checks',
  CARE_MAR_CHARTS: 'chk-care-mar-charts',
  CARE_PERSON_CENTRED_PLANS: 'chk-care-person-centred-plans',
  CARE_IPC_AUDIT: 'chk-care-ipc-audit',
  CARE_REGISTERED_MANAGER: 'chk-care-registered-manager',

  // Financial Services
  FIN_AML_SAR_PROCEDURES: 'chk-fin-aml-sar-procedures',
  FIN_SMCR_STATEMENTS: 'chk-fin-smcr-statements',
  FIN_CASS_RECONCILIATIONS: 'chk-fin-cass-reconciliations',
  FIN_CONSUMER_DUTY: 'chk-fin-consumer-duty',

  // Construction
  CONST_CONSTRUCTION_PHASE_PLAN: 'chk-const-cpp-plan',
  CONST_ASBESTOS_SURVEY: 'chk-const-asbestos-survey',
  CONST_CSCS_VERIFICATION: 'chk-const-cscs-verification',
  CONST_TEMPORARY_WORKS: 'chk-const-temporary-works',

  // Universal Statutory Requirements
  UNIV_RTW_CHECKS: 'chk-univ-rtw-checks',
  UNIV_NATIONAL_MIN_WAGE: 'chk-univ-nmw-records',
  UNIV_EMPLOYMENT_CONTRACTS: 'chk-univ-sec1-contracts',
  UNIV_HSE_WRITTEN_POLICY: 'chk-univ-hse-written-policy',
  UNIV_FIRE_RISK_ASSESSMENT: 'chk-univ-fra-review',
  UNIV_EMPLOYERS_LIABILITY: 'chk-univ-eli-certificate',
  UNIV_FIRST_AID_PROVISION: 'chk-univ-first-aid',
  UNIV_GDPR_PRIVACY_NOTICE: 'chk-univ-gdpr-privacy-notice',
  UNIV_ICO_FEE_REGISTRATION: 'chk-univ-ico-data-protection-fee',
  UNIV_COMPANIES_HOUSE_CS01: 'chk-univ-ch-confirmation-statement',
  UNIV_PAYE_PENSION_AUTO_ENROL: 'chk-univ-pension-auto-enrol',
} as const;

export type ChecklistIdKey = keyof typeof CHECKLIST_IDS;
export type ChecklistIdValue = typeof CHECKLIST_IDS[ChecklistIdKey];

/**
 * Startup integrity validation function:
 * Ensures all checklist IDs expected by the scoring engine exist in the loaded checklist set.
 * Throws or logs loudly if an ID is missing, preventing silent scoring corruption.
 */
export function validateChecklistIntegrity(
  checklists: { id: string }[],
  requiredIds: ChecklistIdValue[]
): { valid: boolean; missingIds: string[] } {
  const existingSet = new Set(checklists.map((c) => c.id));
  const missingIds = requiredIds.filter((id) => !existingSet.has(id));

  if (missingIds.length > 0) {
    console.warn(
      `[COMPLIANCE ENGINE INTEGRITY ALERT] The following required checklist IDs are missing from the active dataset: ${missingIds.join(
        ', '
      )}. Scoring will degrade gracefully.`
    );
    return { valid: false, missingIds };
  }

  return { valid: true, missingIds: [] };
}
