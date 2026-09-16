import { AuditChecklistItem, SectorId } from '../types';
import { CHECKLIST_IDS } from './checklistConstants';

export const UNIVERSAL_CHECKLIST_ITEMS: AuditChecklistItem[] = [
  // Right to Work & Employment (Universal)
  {
    id: CHECKLIST_IDS.UNIV_RTW_CHECKS,
    category: 'universal_employment',
    title: 'Statutory Excuse Right to Work Verification',
    description:
      'Documented verification (Home Office online share code, registered IDSP, or original physical document check) completed BEFORE worker’s first day on shift.',
    plainLanguageHelp:
      'Inspect and record the worker’s digital share code or biometric document prior to work commencement. Keep copies for 2 years after employment ends to establish statutory excuse against civil penalties.',
    regulatoryBody: 'Home Office (Immigration Enforcement)',
    legalReference: 'Immigration, Asylum and Nationality Act 2006 & Border Security Act 2025',
    status: 'compliant',
    managerNotes: 'All new hires have digital Home Office share codes validated during onboarding.',
    evidenceDocumented: true,
    lastReviewedDate: '2026-08-15',
    penaltyRiskText:
      'Civil penalty up to £45,000 per worker for first breach; £60,000 for repeat breach. Potential criminal prosecution up to 5 years.',
    scoringWeight: 5,
    lastVerifiedDate: '2026-08-15',
    sourceUrl: 'https://www.gov.uk/penalties-for-employing-illegal-workers',
  },
  {
    id: CHECKLIST_IDS.UNIV_NATIONAL_MIN_WAGE,
    category: 'universal_employment',
    title: 'National Living Wage (£12.71/hr) & Deductions Audit',
    description:
      'Audited effective hourly pay rates to ensure no uniform deductions, mandatory unpaid training hours, or travel time drag pay below statutory minimums.',
    plainLanguageHelp:
      'Audit all deductions (uniforms, name badges, equipment) and mandatory training hours. Under law, mandatory training counts as working hours.',
    regulatoryBody: 'HMRC (National Minimum Wage Enforcement)',
    legalReference: 'National Minimum Wage Act 1998 (Rates from 1 April 2026)',
    status: 'compliant',
    managerNotes: 'Payroll audited across all age tiers. All training hours are fully compensated.',
    evidenceDocumented: true,
    lastReviewedDate: '2026-08-01',
    penaltyRiskText:
      '100% back-pay plus civil penalty up to 200% of underpayment (capped at £20,000 per worker) and public naming and shaming.',
    scoringWeight: 4,
    lastVerifiedDate: '2026-08-01',
    sourceUrl: 'https://www.gov.uk/national-minimum-wage-rates',
  },
  {
    id: CHECKLIST_IDS.UNIV_PAYE_PENSION_AUTO_ENROL,
    category: 'universal_employment',
    title: 'Workplace Pension Auto-Enrolment Compliance',
    description:
      'Automatic enrolment for all eligible staff (aged 22 to State Pension age earning >£10,000/yr) with at least 3% employer contribution (8% total).',
    plainLanguageHelp:
      'Every eligible employee must be enrolled within 3 months of joining. Submit re-declaration of compliance to TPR every 3 years.',
    regulatoryBody: 'The Pensions Regulator (TPR)',
    legalReference: 'Pensions Act 2008',
    status: 'compliant',
    managerNotes: 'Active scheme with NEST. Re-declaration of compliance submitted.',
    evidenceDocumented: true,
    lastReviewedDate: '2026-07-20',
    penaltyRiskText:
      'Fixed penalty notice of £400 followed by escalating daily penalties from £50 to £10,000 per day.',
    scoringWeight: 3,
    lastVerifiedDate: '2026-07-20',
    sourceUrl: 'https://www.thepensionsregulator.gov.uk/en/employers',
  },

  // Health & Safety (Universal HSE)
  {
    id: CHECKLIST_IDS.UNIV_HSE_WRITTEN_POLICY,
    category: 'universal_hse',
    title: 'Documented Workplace Risk Assessment & Written Policy',
    description:
      'Documented, suitable and sufficient risk assessment covering workplace physical hazards, psychosocial risks, fire, manual handling, and lone working.',
    plainLanguageHelp:
      'Businesses with 5 or more employees must have a written health and safety policy and documented risk assessments.',
    regulatoryBody: 'Health and Safety Executive (HSE)',
    legalReference: 'Management of Health and Safety at Work Regs 1999 (Reg 3)',
    status: 'compliant',
    managerNotes: 'Annual risk assessment conducted and signed by company director.',
    evidenceDocumented: true,
    lastReviewedDate: '2026-06-10',
    penaltyRiskText:
      'HSE Improvement Notice, Prohibition Notice, and Fee for Intervention (FFI) at £163/hour for material breaches.',
    scoringWeight: 5,
    lastVerifiedDate: '2026-06-10',
    sourceUrl: 'https://www.hse.gov.uk/simple-health-safety/risk/index.htm',
  },
  {
    id: CHECKLIST_IDS.UNIV_EMPLOYERS_LIABILITY,
    category: 'universal_hse',
    title: "Employer's Liability Compulsory Insurance (£5m+)",
    description:
      'Current policy certificate with minimum £5,000,000 indemnity cover displayed on site or digitally accessible to all staff at all times.',
    plainLanguageHelp:
      'Law requires at least £5,000,000 cover from an authorized insurer. The certificate must be displayed or made easily accessible digitally to all employees.',
    regulatoryBody: 'HSE',
    legalReference: "Employers' Liability (Compulsory Insurance) Act 1969",
    status: 'compliant',
    managerNotes: 'Policy active with Aviva for £10,000,000 cover. Expiry June 2027.',
    evidenceDocumented: true,
    lastReviewedDate: '2026-06-01',
    penaltyRiskText:
      'Criminal fine up to £2,500 for every single day the business trades without insurance, plus £1,000 for failing to display the certificate.',
    scoringWeight: 5,
    lastVerifiedDate: '2026-06-01',
    sourceUrl: 'https://www.hse.gov.uk/business/employers-liability.htm',
  },

  // Data Protection (Universal ICO)
  {
    id: CHECKLIST_IDS.UNIV_ICO_FEE_REGISTRATION,
    category: 'universal_gdpr',
    title: 'ICO Data Protection Registration Fee Payment',
    description:
      'Current registration certificate on the ICO Data Protection Register and tiered annual fee paid.',
    plainLanguageHelp:
      'Unless exempt, any organization processing personal information on a computer must pay the annual ICO data protection fee.',
    regulatoryBody: "Information Commissioner's Office (ICO)",
    legalReference: 'Data Protection (Charges and Information) Regulations 2018',
    status: 'compliant',
    managerNotes: 'Tier 1 fee paid; registration active through April 2027.',
    evidenceDocumented: true,
    lastReviewedDate: '2026-04-12',
    penaltyRiskText:
      'Fixed civil penalty notices up to £4,350 from ICO for operating without active registration.',
    scoringWeight: 3,
    lastVerifiedDate: '2026-08-10',
    sourceUrl: 'https://ico.org.uk/for-organisations/data-protection-fee/',
  },
  {
    id: CHECKLIST_IDS.UNIV_GDPR_PRIVACY_NOTICE,
    category: 'universal_gdpr',
    title: 'Privacy Notice & Subject Access Request (SAR) Procedure',
    description:
      'Standard operating procedure to respond to SARs within the 1-month statutory deadline and documented Article 6/9 lawful basis.',
    plainLanguageHelp:
      'Privacy notice must clearly explain what personal data is collected and lawful basis. SAR procedure ensures replies within 30 calendar days.',
    regulatoryBody: 'ICO',
    legalReference: 'UK GDPR Article 12 & 15 / Data Protection Act 2018',
    status: 'in_progress',
    managerNotes: 'Privacy policy published; SAR template drafted, awaiting manager sign-off.',
    evidenceDocumented: false,
    lastReviewedDate: '2026-07-15',
    penaltyRiskText:
      'Standard tier fine up to £8.7m or 2% of worldwide turnover for procedural failings.',
    scoringWeight: 4,
    lastVerifiedDate: '2026-07-15',
    sourceUrl: 'https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/individual-rights/right-of-access/',
  },

  // Corporate & Companies House
  {
    id: CHECKLIST_IDS.UNIV_COMPANIES_HOUSE_CS01,
    category: 'universal_companies_house',
    title: 'Companies House Confirmation Statement & Accounts',
    description:
      'Annual confirmation statement filed every 12 months and statutory financial accounts submitted within 9 months of financial year end.',
    plainLanguageHelp:
      'Check filing status on the Companies House register. Late filing incurs automatic civil fines and risks company strike-off.',
    regulatoryBody: 'Companies House',
    legalReference: 'Companies Act 2006 (s.441 & s.853A)',
    status: 'compliant',
    managerNotes: 'Accounts submitted on time. Confirmation statement due November 2026.',
    evidenceDocumented: true,
    lastReviewedDate: '2026-05-30',
    penaltyRiskText:
      'Automatic late filing penalties up to £1,500; persistent non-filing triggers company strike-off and personal director disqualification.',
    scoringWeight: 3,
    lastVerifiedDate: '2026-05-30',
    sourceUrl: 'https://www.gov.uk/file-your-company-annual-return',
  },
];

export const SECTOR_SPECIFIC_CHECKLISTS: Record<SectorId, AuditChecklistItem[]> = {
  food_hospitality: [
    {
      id: CHECKLIST_IDS.FOOD_HACCP_PLAN,
      category: 'sector_specific',
      sector: 'food_hospitality',
      title: 'Documented FSMS (Safer Food, Better Business / HACCP)',
      description:
        'Complete, signed SFBB pack or documented HACCP plan with daily opening/closing checks, four-weekly reviews, and corrective action logs.',
      plainLanguageHelp:
        'The EHO will immediately ask to see your food safety management diary. All daily opening and closing checks must be signed off by kitchen leads.',
      regulatoryBody: 'FSA / EHO (Confidence in Management element)',
      legalReference: 'Regulation (EC) No 852/2004 Article 5',
      status: 'compliant',
      managerNotes: 'SFBB diary signed daily by head chef and duty manager.',
      evidenceDocumented: true,
      lastReviewedDate: '2026-09-12',
      penaltyRiskText:
        'Scores 20–30 on Confidence in Management, automatically capping FHRS rating to 0 or 1 regardless of kitchen cleanliness.',
      scoringWeight: 5,
      lastVerifiedDate: '2026-08-01',
      sourceUrl: 'https://www.food.gov.uk/business-guidance/safer-food-better-business',
    },
    {
      id: CHECKLIST_IDS.FOOD_TEMP_LOGS,
      category: 'sector_specific',
      sector: 'food_hospitality',
      title: 'Temperature Control & Probe Calibration Records',
      description:
        'Twice-daily chiller temperatures (<8°C, ideally 1–5°C), freezer checks (<-18°C), hot holding (>63°C), and monthly ice/boiling water probe calibration.',
      plainLanguageHelp:
        'Maintain daily temperature sheets or automated sensor logs. Verify calibrated food core thermometer accuracy monthly.',
      regulatoryBody: 'FSA / EHO (Food Hygiene & Safety Procedures element)',
      legalReference: 'Food Safety and Hygiene (England) Regs 2013 Schedule 4',
      status: 'in_progress',
      managerNotes: 'Digital temperature loggers in place; backup paper probe sheet has 3 missed entries last week.',
      evidenceDocumented: false,
      lastReviewedDate: '2026-09-08',
      penaltyRiskText:
        'Scores 10–15 on Hygiene Procedures, dropping rating ceiling to 2 or 3 and risking Improvement Notices.',
      scoringWeight: 4,
      lastVerifiedDate: '2026-08-01',
      sourceUrl: 'https://www.food.gov.uk/business-guidance/chilling-food-correctly',
    },
    {
      id: CHECKLIST_IDS.FOOD_ALLERGEN_MATRIX,
      category: 'sector_specific',
      sector: 'food_hospitality',
      title: "14 Allergens Matrix & Natasha's Law PPDS Labels",
      description:
        'Accurate, up-to-date allergen matrix for all menu items and compliant full ingredient & emphasized allergen labeling for any Prepacked for Direct Sale food.',
      plainLanguageHelp:
        'All 14 statutory allergens clearly declared on menu matrices. Pre-packed food must show full ingredients with allergens in bold.',
      regulatoryBody: 'FSA / Trading Standards',
      legalReference: "Food Information (Amendment) (England) Regs 2019 (Natasha's Law)",
      status: 'compliant',
      managerNotes: 'Digital QR allergen guide updated for autumn menu; PPDS grab-and-go labels printed with software.',
      evidenceDocumented: true,
      lastReviewedDate: '2026-09-01',
      penaltyRiskText:
        'Unlimited fines and criminal prosecution under Food Safety Act 1990; immediate civil liability for anaphylaxis incidents.',
      scoringWeight: 5,
      lastVerifiedDate: '2026-08-15',
      sourceUrl: 'https://www.food.gov.uk/business-guidance/allergen-guidance-for-food-businesses',
    },
    {
      id: CHECKLIST_IDS.FOOD_PEST_CONTROL,
      category: 'sector_specific',
      sector: 'food_hospitality',
      title: 'Pest Control Contract & Proofing Inspection Reports',
      description:
        'Professional pest control contract with routine inspections, bait station maps, fly-killer maintenance, and zero active rodent/insect activity.',
      plainLanguageHelp:
        'Contract with pest prevention company with inspection reports retained on site. EHO checks for droppings, grease smears, and fly screens.',
      regulatoryBody: 'FSA / EHO (Structural Compliance element)',
      legalReference: 'Regulation (EC) No 852/2004 Annex II Chapter IX',
      status: 'compliant',
      managerNotes: 'Ecolab quarterly inspection carried out 14 August 2026. No activity found.',
      evidenceDocumented: true,
      lastReviewedDate: '2026-08-14',
      penaltyRiskText:
        'Active infestation triggers Hygiene Emergency Prohibition Notice with immediate court-ordered closure.',
      scoringWeight: 5,
      lastVerifiedDate: '2026-08-14',
      sourceUrl: 'https://www.food.gov.uk/business-guidance/pest-control-for-food-businesses',
    },
  ],

  health_social_care: [
    {
      id: CHECKLIST_IDS.CARE_DBS_CHECKS,
      category: 'sector_specific',
      sector: 'health_social_care',
      title: 'Enhanced DBS with Barred List Checks for 100% of Staff',
      description:
        'Completed Enhanced DBS certificates with Adult/Child Barred List checks on file prior to unchaperoned care contact, with annual update service checks.',
      plainLanguageHelp:
        'Never allow care workers to commence lone work without an enhanced DBS check and barred list clearance on file.',
      regulatoryBody: 'Care Quality Commission (CQC)',
      legalReference: 'Health and Social Care Act 2008 (Regulated Activities) Regs 2014 Reg 19',
      status: 'compliant',
      managerNotes: 'All carers have active DBS numbers linked to the update service.',
      evidenceDocumented: true,
      lastReviewedDate: '2026-08-28',
      penaltyRiskText:
        'Critical breach of Regulation 19. Triggers immediate Warning Notice and drops Safe key question to Inadequate.',
      scoringWeight: 5,
      lastVerifiedDate: '2026-08-20',
      sourceUrl: 'https://www.cqc.org.uk/guidance-providers/regulations-enforcement/regulation-19-fit-proper-persons-employed',
    },
    {
      id: CHECKLIST_IDS.CARE_MAR_CHARTS,
      category: 'sector_specific',
      sector: 'health_social_care',
      title: 'Safe Medication Administration & Controlled Drugs Audits',
      description:
        'Double-witnessed controlled drugs register, monthly MAR chart audits, fridge thermometer records (2–8°C), and zero uninvestigated omissions.',
      plainLanguageHelp:
        'Audit Medication Administration Records (MAR) monthly for blank gaps, codes, and correct signatures.',
      regulatoryBody: 'CQC (Safe)',
      legalReference: 'CQC Regulation 12 (Safe care and treatment)',
      status: 'compliant',
      managerNotes: 'Weekly blister pack reconciliation. Medication error incident log clear.',
      evidenceDocumented: true,
      lastReviewedDate: '2026-09-10',
      penaltyRiskText:
        'Requirement Notice or suspension of registration for systemic medicines mismanagement.',
      scoringWeight: 5,
      lastVerifiedDate: '2026-08-25',
      sourceUrl: 'https://www.cqc.org.uk/guidance-providers/adult-social-care/managing-medicines-adult-social-care',
    },
    {
      id: CHECKLIST_IDS.CARE_PERSON_CENTRED_PLANS,
      category: 'sector_specific',
      sector: 'health_social_care',
      title: 'Person-Centred Care Plans & Monthly Risk Reviews',
      description:
        'Personalized care plans reflecting individual consent, preferences, MUST nutrition scores, Waterlow pressure ulcer scores, reviewed every 30 days.',
      plainLanguageHelp:
        'Care plans must reflect service user choices, consent, and clinically validated risk assessments reviewed every month.',
      regulatoryBody: 'CQC (Responsive & Caring)',
      legalReference: 'CQC Regulation 9 (Person-centred care)',
      status: 'in_progress',
      managerNotes: '92% of resident care plans updated; 3 require review following recent hospital discharge.',
      evidenceDocumented: false,
      lastReviewedDate: '2026-09-05',
      penaltyRiskText:
        'Down-rates Responsive to Requires Improvement; local council contracts placed on embargo.',
      scoringWeight: 4,
      lastVerifiedDate: '2026-08-20',
      sourceUrl: 'https://www.cqc.org.uk/guidance-providers/regulations-enforcement/regulation-9-person-centred-care',
    },
    {
      id: CHECKLIST_IDS.CARE_REGISTERED_MANAGER,
      category: 'sector_specific',
      sector: 'health_social_care',
      title: 'Safeguarding Incident Register & Multi-Agency Referrals',
      description:
        'Prompt statutory notification to CQC (Regulation 18) and Local Authority Safeguarding Adults Board (Care Act s.42) for any alleged abuse or serious injury.',
      plainLanguageHelp:
        'Any safeguarding allegation or serious injury must be notified to CQC and local council safeguarding within statutory deadlines.',
      regulatoryBody: 'CQC (Safe & Well-led)',
      legalReference: 'CQC Regulation 13 & Care Act 2014',
      status: 'compliant',
      managerNotes: 'Clear log with zero open un-notified incidents. All staff briefed on whistleblowing.',
      evidenceDocumented: true,
      lastReviewedDate: '2026-08-20',
      penaltyRiskText:
        'Criminal prosecution for failing to notify CQC of notifiable incidents under Regulation 18.',
      scoringWeight: 5,
      lastVerifiedDate: '2026-08-20',
      sourceUrl: 'https://www.cqc.org.uk/guidance-providers/notifications',
    },
  ],

  financial_services: [
    {
      id: CHECKLIST_IDS.FIN_SMCR_STATEMENTS,
      category: 'sector_specific',
      sector: 'financial_services',
      title: 'SM&CR Management Responsibilities Map (SMF Roles)',
      description:
        'Formal Statements of Responsibilities (SoRs) allocated to all Senior Managers and annual Fit and Proper certificates signed.',
      plainLanguageHelp:
        'Document clear lines of accountability for Senior Management Functions (SMF) and conduct annual Fit and Proper assessments.',
      regulatoryBody: 'Financial Conduct Authority (FCA)',
      legalReference: 'Senior Managers & Certification Regime (SM&CR / FSMA 2000)',
      status: 'compliant',
      managerNotes: 'Board SoRs submitted via Connect; annual fit and proper attestation completed July 2026.',
      evidenceDocumented: true,
      lastReviewedDate: '2026-07-15',
      penaltyRiskText:
        'Personal liability, civil fines, and prohibition orders against individual directors under section 66 FSMA.',
      scoringWeight: 5,
      lastVerifiedDate: '2026-07-15',
      sourceUrl: 'https://www.fca.org.uk/firms/senior-managers-and-certification-regime',
    },
    {
      id: CHECKLIST_IDS.FIN_CONSUMER_DUTY,
      category: 'sector_specific',
      sector: 'financial_services',
      title: 'FCA Consumer Duty Board Champion & Outcome Monitoring',
      description:
        'Appointed NED/Director Consumer Duty Champion, annual board outcome assessment, fair value assessments for all active product lines.',
      plainLanguageHelp:
        'Board must approve the annual Consumer Duty report evidencing products offer fair value and good customer understanding.',
      regulatoryBody: 'FCA (Conduct)',
      legalReference: 'FCA Principle 12 & PRIN 2A (Consumer Duty)',
      status: 'in_progress',
      managerNotes: 'Board report drafted; awaiting Q3 customer vulnerability analytics review.',
      evidenceDocumented: false,
      lastReviewedDate: '2026-08-10',
      penaltyRiskText:
        'FCA formal skilled persons review (s.166), public censure, and restitution orders for customer harm.',
      scoringWeight: 4,
      lastVerifiedDate: '2026-08-01',
      sourceUrl: 'https://www.fca.org.uk/firms/consumer-duty',
    },
    {
      id: CHECKLIST_IDS.FIN_CASS_RECONCILIATIONS,
      category: 'sector_specific',
      sector: 'financial_services',
      title: 'CASS 15 Safeguarding & Daily Reconciliations (2026 Regime)',
      description:
        'Daily internal and external segregation of payment funds, updated CASS Resolution Pack, and independent safeguarding audit readiness.',
      plainLanguageHelp:
        'Perform daily internal and external reconciliations by the statutory deadline each business day. Keep CASS Resolution Pack updated.',
      regulatoryBody: 'FCA (CASS)',
      legalReference: 'CASS 15 Safeguarding Regime (In force 7 May 2026)',
      status: 'compliant',
      managerNotes: 'Automated daily reconciliation running at 07:00. Resolution pack tested.',
      evidenceDocumented: true,
      lastReviewedDate: '2026-09-02',
      penaltyRiskText:
        'Immediate restriction on accepting customer funds; suspension of API/EMI permissions.',
      scoringWeight: 5,
      lastVerifiedDate: '2026-08-10',
      sourceUrl: 'https://www.handbook.fca.org.uk/handbook/CASS/',
    },
    {
      id: CHECKLIST_IDS.FIN_AML_SAR_PROCEDURES,
      category: 'sector_specific',
      sector: 'financial_services',
      title: 'AML/CTF Business Wide Risk Assessment & SAR Procedures',
      description:
        'Documented BWRA covering customer risk, geographic risk, delivery channels, annual MLRO report to the board, and live PEP/sanctions screening.',
      plainLanguageHelp:
        'Written Business-Wide Risk Assessment reviewed annually. Documented escalation route for Suspicious Activity Reports to the MLRO.',
      regulatoryBody: 'FCA',
      legalReference: 'Money Laundering, Terrorist Financing and Transfer of Funds Regulations 2017 Reg 18',
      status: 'compliant',
      managerNotes: 'Annual MLRO report presented to board May 2026. Sanctions feed active.',
      evidenceDocumented: true,
      lastReviewedDate: '2026-05-18',
      penaltyRiskText:
        'Multi-million pound FCA enforcement penalties and criminal prosecution under POCA 2002.',
      scoringWeight: 5,
      lastVerifiedDate: '2026-08-01',
      sourceUrl: 'https://www.fca.org.uk/firms/financial-crime/money-laundering-regulations',
    },
  ],

  construction: [
    {
      id: CHECKLIST_IDS.CONST_CONSTRUCTION_PHASE_PLAN,
      category: 'sector_specific',
      sector: 'construction',
      title: 'Construction Phase Plan (CPP) Prior to Site Setup',
      description:
        'Site-specific CPP prepared by Principal Contractor before work starts, detailing site rules, emergency plans, traffic management, and high-risk RAMS.',
      plainLanguageHelp:
        'Under CDM 2015 Reg 12, no work may start until a site-specific Construction Phase Plan is written and available on site.',
      regulatoryBody: 'HSE (CDM 2015)',
      legalReference: 'CDM Regulations 2015 Regulation 12',
      status: 'compliant',
      managerNotes: 'CPP signed off by Principal Designer and displayed in welfare unit.',
      evidenceDocumented: true,
      lastReviewedDate: '2026-08-10',
      penaltyRiskText:
        'Immediate HSE Prohibition Notice shutting down site operations; Fee for Intervention charged.',
      scoringWeight: 5,
      lastVerifiedDate: '2026-07-01',
      sourceUrl: 'https://www.hse.gov.uk/construction/cdm/2015/principal-contractors.htm',
    },
    {
      id: CHECKLIST_IDS.CONST_CSCS_VERIFICATION,
      category: 'sector_specific',
      sector: 'construction',
      title: 'CSCS Card Verification & Daily RAMS Briefing Register',
      description:
        '100% verification of valid CSCS smartcards for all operatives on site, signed daily RAMS briefings, and documented site inductions.',
      plainLanguageHelp:
        'Scan all worker CSCS smartcards using the CSCS Smart Check app prior to granting site access. Log daily risk briefings.',
      regulatoryBody: 'HSE / Principal Contractor',
      legalReference: 'CDM Regulations 2015 Regulations 13 & 15',
      status: 'in_progress',
      managerNotes: 'Smart card scanner at turnstile; 4 new agency bricklayers have pending physical card checks.',
      evidenceDocumented: false,
      lastReviewedDate: '2026-09-11',
      penaltyRiskText:
        'Breach of competence requirements; site access refusal and principal contractor contractual penalties.',
      scoringWeight: 4,
      lastVerifiedDate: '2026-07-01',
      sourceUrl: 'https://www.cscs.uk.com/',
    },
    {
      id: CHECKLIST_IDS.CONST_ASBESTOS_SURVEY,
      category: 'sector_specific',
      sector: 'construction',
      title: 'Refurbishment / Demolition Asbestos Survey & Register',
      description:
        'Pre-works R&D asbestos survey available on site for any pre-2000 structure, with clear demarcation of any identified ACMs.',
      plainLanguageHelp:
        'For structures built before 2000, an R&D asbestos survey must be shared with all contractors before invasive work starts.',
      regulatoryBody: 'HSE',
      legalReference: 'Control of Asbestos Regulations 2012 Regulation 4',
      status: 'compliant',
      managerNotes: 'Survey received from client; non-licensed removals completed by specialist contractor.',
      evidenceDocumented: true,
      lastReviewedDate: '2026-08-01',
      penaltyRiskText:
        'HSE immediate prosecution, stop-work order, and unlimited fines for disturbing unmanaged asbestos.',
      scoringWeight: 5,
      lastVerifiedDate: '2026-07-01',
      sourceUrl: 'https://www.hse.gov.uk/asbestos/duty.htm',
    },
  ],

  general_business: [
    {
      id: CHECKLIST_IDS.UNIV_EMPLOYMENT_CONTRACTS,
      category: 'sector_specific',
      sector: 'general_business',
      title: 'Written Section 1 Employment Statements on Day 1',
      description:
        'Written statement of employment particulars provided to 100% of employees and workers on or before their first day of work.',
      plainLanguageHelp:
        'Under Section 1 of the Employment Rights Act 1996, every worker must receive written terms of employment on or before their first day.',
      regulatoryBody: 'Employment Tribunal / ACAS',
      legalReference: 'Employment Rights Act 1996 s.1',
      status: 'compliant',
      managerNotes: 'Standard employment contracts issued via DocuSign prior to start dates.',
      evidenceDocumented: true,
      lastReviewedDate: '2026-07-25',
      penaltyRiskText:
        'Employment Tribunal compensation awards of 2 to 4 weeks’ pay per employee for failure to provide written particulars.',
      scoringWeight: 4,
      lastVerifiedDate: '2026-07-01',
      sourceUrl: 'https://www.gov.uk/employment-contracts-and-conditions/written-statement-of-employment-particulars',
    },
  ],
};
