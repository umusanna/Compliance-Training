import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { COURSES_CATALOG } from '../src/data/regulatoryStandards';
import { UNIVERSAL_CHECKLIST_ITEMS, SECTOR_SPECIFIC_CHECKLISTS } from '../src/data/initialChecklists';
import { CHECKLIST_IDS } from '../src/data/checklistConstants';

export const DB_PATH = path.join(process.cwd(), 'compliance.db');

export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and set journal_mode = DELETE for container filesystem compatibility
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = DELETE;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_email TEXT,
      plan TEXT DEFAULT 'standard',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id),
      name TEXT NOT NULL,
      trading_name TEXT,
      sector TEXT NOT NULL,
      sub_sector TEXT,
      jurisdiction TEXT NOT NULL,
      company_number TEXT,
      turnover_gbp REAL DEFAULT 0,
      balance_sheet_gbp REAL DEFAULT 0,
      employee_counts_json TEXT NOT NULL,
      fsa_registered INTEGER DEFAULT 0,
      cqc_registered INTEGER DEFAULT 0,
      fca_authorised INTEGER DEFAULT 0,
      cdm_notifiable INTEGER DEFAULT 0,
      onboarding_completed INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      sector TEXT NOT NULL,
      target_roles_json TEXT NOT NULL,
      description TEXT,
      plain_language_help TEXT,
      duration_hours REAL,
      accreditation TEXT,
      renewal_months INTEGER,
      is_mandatory_by_law INTEGER DEFAULT 1,
      regulatory_driver TEXT,
      last_verified_date TEXT,
      source_url TEXT
    );

    CREATE TABLE IF NOT EXISTS learners (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role_level TEXT NOT NULL,
      job_title TEXT,
      department TEXT,
      start_date TEXT,
      right_to_work_status TEXT NOT NULL,
      right_to_work_check_date TEXT,
      notes TEXT,
      is_archived INTEGER DEFAULT 0,
      archived_at TEXT,
      archived_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS learner_course_records (
      id TEXT PRIMARY KEY,
      learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES courses(id),
      course_title TEXT,
      status TEXT NOT NULL,
      progress_percent INTEGER DEFAULT 0,
      completed_date TEXT,
      expiry_date TEXT,
      score REAL,
      is_our_platform INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT NOT NULL,
      business_id TEXT NOT NULL REFERENCES businesses(id),
      category TEXT NOT NULL,
      sector TEXT,
      title TEXT NOT NULL,
      description TEXT,
      plain_language_help TEXT,
      regulatory_body TEXT,
      legal_reference TEXT,
      status TEXT NOT NULL,
      manager_notes TEXT,
      evidence_documented INTEGER DEFAULT 0,
      last_reviewed_date TEXT,
      penalty_risk_text TEXT,
      scoring_weight INTEGER DEFAULT 3,
      last_verified_date TEXT,
      source_url TEXT,
      is_custom_client_override INTEGER DEFAULT 0,
      attachments_json TEXT DEFAULT '[]',
      PRIMARY KEY (id, business_id)
    );

    CREATE TABLE IF NOT EXISTS audit_snapshots (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id),
      timestamp TEXT NOT NULL,
      inspector_ref TEXT,
      notes TEXT,
      overall_score_percent INTEGER NOT NULL,
      training_score_percent INTEGER NOT NULL,
      operational_checklist_score_percent INTEGER NOT NULL,
      right_to_work_score_percent INTEGER NOT NULL,
      grade_badge TEXT NOT NULL,
      total_employees INTEGER,
      total_learners INTEGER,
      critical_gaps_count INTEGER,
      expired_certs_count INTEGER,
      summary TEXT,
      report_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS regulatory_changelog (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      changed_field TEXT NOT NULL,
      old_value TEXT,
      newValue TEXT,
      changed_by TEXT NOT NULL,
      changed_date TEXT NOT NULL,
      source_reference TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      tenant_id TEXT REFERENCES tenants(id),
      business_id TEXT REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS checklist_templates (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      sector_applicability TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      plain_language_help TEXT,
      regulatory_body TEXT,
      legal_reference TEXT,
      penalty_risk_text TEXT,
      scoring_weight INTEGER DEFAULT 3,
      last_verified_date TEXT,
      source_url TEXT
    );
  `);

  // Ensure checklist templates are populated
  ensureChecklistTemplates();

  // Seed default data if empty
  seedInitialData();
}

function ensureChecklistTemplates() {
  const templateCount = (db.prepare('SELECT count(*) as count FROM checklist_templates').get() as any)?.count || 0;
  if (templateCount === 0) {
    const insertTemplate = db.prepare(`
      INSERT OR REPLACE INTO checklist_templates (
        id, category, sector_applicability, title, description,
        plain_language_help, regulatory_body, legal_reference,
        penalty_risk_text, scoring_weight, last_verified_date, source_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of UNIVERSAL_CHECKLIST_ITEMS) {
      insertTemplate.run(
        item.id,
        item.category,
        'universal',
        item.title,
        item.description,
        item.plainLanguageHelp || '',
        item.regulatoryBody,
        item.legalReference,
        item.penaltyRiskText,
        item.scoringWeight,
        item.lastVerifiedDate || '2026-08-01',
        item.sourceUrl || 'https://www.gov.uk/'
      );
    }

    for (const [secKey, items] of Object.entries(SECTOR_SPECIFIC_CHECKLISTS)) {
      for (const item of items) {
        insertTemplate.run(
          item.id,
          item.category,
          secKey,
          item.title,
          item.description,
          item.plainLanguageHelp || '',
          item.regulatoryBody,
          item.legalReference,
          item.penaltyRiskText,
          item.scoringWeight,
          item.lastVerifiedDate || '2026-08-01',
          item.sourceUrl || 'https://www.gov.uk/'
        );
      }
    }
  }
}

function seedInitialData() {
  const countStmt = db.prepare('SELECT count(*) as count FROM businesses');
  const countResult = countStmt.get() as { count: number };

  if (countResult.count > 0) {
    return;
  }

  console.log('Seeding initial relational data into SQLite...');

  // 1. Tenants
  const insertTenant = db.prepare(`
    INSERT INTO tenants (id, name, contact_email, plan, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertTenant.run(
    'ten-apex-hospitality',
    'Apex Hospitality & Leisure Ltd',
    'compliance@apexhospitality.co.uk',
    'enterprise',
    '2026-01-10T09:00:00Z'
  );
  insertTenant.run(
    'ten-beacon-care',
    'Beacon Care Communities Group',
    'governance@beaconcare.org.uk',
    'enterprise',
    '2026-02-01T09:00:00Z'
  );

  // 2. Businesses
  const insertBusiness = db.prepare(`
    INSERT INTO businesses (
      id, tenant_id, name, trading_name, sector, sub_sector, jurisdiction,
      company_number, turnover_gbp, balance_sheet_gbp, employee_counts_json,
      fsa_registered, cqc_registered, fca_authorised, cdm_notifiable,
      onboarding_completed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBusiness.run(
    'biz-the-copper-kettle',
    'ten-apex-hospitality',
    'The Copper Kettle Bistro & Rooms Ltd',
    'The Copper Kettle',
    'food_hospitality',
    'Casual Dining & Boutique Hotel',
    'england_wales',
    '12984521',
    1450000,
    620000,
    JSON.stringify({ manager: 2, supervisor: 3, field_worker: 8, admin: 1 }),
    1, // FSA registered
    0,
    0,
    0,
    1,
    '2026-01-15T10:00:00Z',
    '2026-09-14T16:30:00Z'
  );

  insertBusiness.run(
    'biz-oakwood-manor-care',
    'ten-beacon-care',
    'Oakwood Manor Residential Care Home',
    'Oakwood Manor',
    'health_social_care',
    'Dementia & Frail Elderly Residential',
    'england_wales',
    '08764129',
    2800000,
    1950000,
    JSON.stringify({ manager: 3, supervisor: 5, field_worker: 20, admin: 2 }),
    0,
    1, // CQC registered
    0,
    0,
    1,
    '2026-02-10T11:00:00Z',
    '2026-09-10T14:00:00Z'
  );

  // 3. Courses Catalog
  const insertCourse = db.prepare(`
    INSERT OR REPLACE INTO courses (
      id, code, title, sector, target_roles_json, description,
      plain_language_help, duration_hours, accreditation, renewal_months,
      is_mandatory_by_law, regulatory_driver, last_verified_date, source_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of COURSES_CATALOG) {
    insertCourse.run(
      c.id,
      c.code,
      c.title,
      c.sector,
      JSON.stringify(c.targetRoles),
      c.description,
      c.plainLanguageHelp || '',
      c.durationHours,
      c.accreditation,
      c.renewalMonths,
      c.isMandatoryByLaw ? 1 : 0,
      c.regulatoryDriver,
      c.lastVerifiedDate || '2026-08-01',
      c.sourceUrl || 'https://www.gov.uk/'
    );
  }

  // 4. Checklists for Copper Kettle
  const insertChecklist = db.prepare(`
    INSERT OR REPLACE INTO checklist_items (
      id, business_id, category, sector, title, description,
      plain_language_help, regulatory_body, legal_reference, status,
      manager_notes, evidence_documented, last_reviewed_date, penalty_risk_text,
      scoring_weight, last_verified_date, source_url, is_custom_client_override, attachments_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const foodChecklists = [
    ...UNIVERSAL_CHECKLIST_ITEMS,
    ...SECTOR_SPECIFIC_CHECKLISTS['food_hospitality'],
  ];

  for (const item of foodChecklists) {
    const defaultAttachments = item.evidenceDocumented
      ? JSON.stringify([
          {
            id: `att-${item.id}-1`,
            checklistId: item.id,
            fileName: `${item.title.substring(0, 24).replace(/[^a-z0-9]/gi, '_')}_Policy_Cert.pdf`,
            fileType: 'application/pdf',
            fileSizeBytes: 245000,
            uploadedAt: '2026-08-15T14:20:00Z',
            uploadedBy: 'Marcus Davies',
            notes: 'Current signed certificate on file with head office.',
          },
        ])
      : '[]';

    insertChecklist.run(
      item.id,
      'biz-the-copper-kettle',
      item.category,
      item.sector || 'universal',
      item.title,
      item.description,
      item.plainLanguageHelp || '',
      item.regulatoryBody,
      item.legalReference,
      item.status,
      item.managerNotes,
      item.evidenceDocumented ? 1 : 0,
      item.lastReviewedDate || '2026-08-15',
      item.penaltyRiskText,
      item.scoringWeight,
      item.lastVerifiedDate || '2026-08-01',
      item.sourceUrl || 'https://www.gov.uk/',
      0,
      defaultAttachments
    );
  }

  // 5. Learners for Copper Kettle
  const insertLearner = db.prepare(`
    INSERT INTO learners (
      id, business_id, name, email, role_level, job_title, department,
      start_date, right_to_work_status, right_to_work_check_date, notes, is_archived
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLearnerRecord = db.prepare(`
    INSERT INTO learner_course_records (
      id, learner_id, course_id, course_title, status, progress_percent,
      completed_date, expiry_date, score, is_our_platform
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Sample Learners demonstrating real-world scenarios:
  // - 1 expired certification (FSA Level 2 lapsed 2 months ago)
  // - 1 certification expiring in 14 days
  // - 1 unverified Right to Work check
  // - Several fully compliant staff
  const sampleLearners = [
    {
      id: 'lrn-101',
      name: 'Oliver Hughes',
      email: 'o.hughes@thecopperkettle.co.uk',
      roleLevel: 'manager',
      jobTitle: 'General Manager',
      department: 'Management',
      startDate: '2023-04-01',
      rtwStatus: 'verified_statutory_excuse',
      rtwDate: '2023-03-25',
      courses: [
        {
          id: 'course-univ-rtw',
          title: 'Right to Work Compliance & Verification (2026 Rules)',
          status: 'completed',
          progress: 100,
          completedDate: '2025-05-10',
          expiryDate: '2027-05-10',
          score: 96,
        },
        {
          id: 'course-univ-hs-general',
          title: 'Health & Safety at Work Essentials (HSWA 1974)',
          status: 'completed',
          progress: 100,
          completedDate: '2025-05-10',
          expiryDate: '2027-05-10',
          score: 100,
        },
        {
          id: 'course-univ-gdpr',
          title: 'UK GDPR & Data Protection in Practice',
          status: 'completed',
          progress: 100,
          completedDate: '2025-05-12',
          expiryDate: '2027-05-12',
          score: 92,
        },
        {
          id: 'course-univ-fire',
          title: 'Fire Safety Awareness & Warden Duties',
          status: 'completed',
          progress: 100,
          completedDate: '2025-10-01',
          expiryDate: '2026-10-01',
          score: 95,
        },
        {
          id: 'course-food-l3',
          title: 'Supervising Food Safety (Level 3 - Managers & Supervisors)',
          status: 'completed',
          progress: 100,
          completedDate: '2024-02-15',
          expiryDate: '2027-02-15',
          score: 98,
        },
        {
          id: 'course-food-allergens',
          title: "Allergen Awareness & Natasha's Law Compliance",
          status: 'completed',
          progress: 100,
          completedDate: '2025-10-15',
          expiryDate: '2026-10-15',
          score: 100,
        },
        {
          id: 'course-food-haccp',
          title: 'HACCP Principles & Safer Food Better Business (SFBB)',
          status: 'completed',
          progress: 100,
          completedDate: '2024-02-20',
          expiryDate: '2027-02-20',
          score: 94,
        },
      ],
    },
    {
      id: 'lrn-102',
      name: 'Maria Santos',
      email: 'm.santos@thecopperkettle.co.uk',
      roleLevel: 'supervisor',
      jobTitle: 'Head Chef / Kitchen Supervisor',
      department: 'Kitchen',
      startDate: '2024-01-15',
      rtwStatus: 'verified_statutory_excuse',
      rtwDate: '2024-01-10',
      courses: [
        {
          id: 'course-univ-hs-general',
          title: 'Health & Safety at Work Essentials (HSWA 1974)',
          status: 'completed',
          progress: 100,
          completedDate: '2025-02-01',
          expiryDate: '2027-02-01',
          score: 90,
        },
        {
          id: 'course-univ-fire',
          title: 'Fire Safety Awareness & Warden Duties',
          status: 'completed',
          progress: 100,
          completedDate: '2025-09-28',
          expiryDate: '2026-09-28', // Expiring in ~13 days!
          score: 92,
        },
        {
          id: 'course-food-l3',
          title: 'Supervising Food Safety (Level 3 - Managers & Supervisors)',
          status: 'completed',
          progress: 100,
          completedDate: '2024-03-01',
          expiryDate: '2027-03-01',
          score: 96,
        },
        {
          id: 'course-food-allergens',
          title: "Allergen Awareness & Natasha's Law Compliance",
          status: 'completed',
          progress: 100,
          completedDate: '2025-10-10',
          expiryDate: '2026-10-10',
          score: 100,
        },
        {
          id: 'course-food-haccp',
          title: 'HACCP Principles & Safer Food Better Business (SFBB)',
          status: 'completed',
          progress: 100,
          completedDate: '2024-03-05',
          expiryDate: '2027-03-05',
          score: 92,
        },
      ],
    },
    {
      id: 'lrn-103',
      name: 'Callum Wright',
      email: 'c.wright@thecopperkettle.co.uk',
      roleLevel: 'field_worker',
      jobTitle: 'Line Cook',
      department: 'Kitchen',
      startDate: '2023-06-01',
      rtwStatus: 'verified_statutory_excuse',
      rtwDate: '2023-05-25',
      courses: [
        {
          id: 'course-univ-hs-general',
          title: 'Health & Safety at Work Essentials (HSWA 1974)',
          status: 'completed',
          progress: 100,
          completedDate: '2025-06-10',
          expiryDate: '2027-06-10',
          score: 88,
        },
        {
          id: 'course-univ-fire',
          title: 'Fire Safety Awareness & Warden Duties',
          status: 'completed',
          progress: 100,
          completedDate: '2025-08-10',
          expiryDate: '2026-08-10', // EXPIRED 1 month ago!
          score: 85,
        },
        {
          id: 'course-food-l2',
          title: 'Food Safety & Hygiene (Level 2 - Food Handlers)',
          status: 'expired',
          progress: 100,
          completedDate: '2023-07-01',
          expiryDate: '2026-07-01', // EXPIRED 2.5 months ago!
          score: 88,
        },
        {
          id: 'course-food-allergens',
          title: "Allergen Awareness & Natasha's Law Compliance",
          status: 'completed',
          progress: 100,
          completedDate: '2025-10-15',
          expiryDate: '2026-10-15',
          score: 95,
        },
      ],
    },
    {
      id: 'lrn-104',
      name: 'Amina Begum',
      email: 'a.begum@thecopperkettle.co.uk',
      roleLevel: 'field_worker',
      jobTitle: 'Commis Chef / Food Prep',
      department: 'Kitchen',
      startDate: '2026-08-01',
      rtwStatus: 'pending_verification', // PENDING RTW CHECK (£45k civil fine risk)
      rtwDate: '',
      courses: [
        {
          id: 'course-univ-hs-general',
          title: 'Health & Safety at Work Essentials (HSWA 1974)',
          status: 'in_progress',
          progress: 60,
        },
        {
          id: 'course-food-l2',
          title: 'Food Safety & Hygiene (Level 2 - Food Handlers)',
          status: 'in_progress',
          progress: 40,
        },
        {
          id: 'course-food-allergens',
          title: "Allergen Awareness & Natasha's Law Compliance",
          status: 'not_started',
          progress: 0,
        },
      ],
    },
    {
      id: 'lrn-105',
      name: 'Jack Davies',
      email: 'j.davies@thecopperkettle.co.uk',
      roleLevel: 'field_worker',
      jobTitle: 'Front of House Senior Server',
      department: 'Front of House',
      startDate: '2024-09-01',
      rtwStatus: 'verified_statutory_excuse',
      rtwDate: '2024-08-25',
      courses: [
        {
          id: 'course-univ-hs-general',
          title: 'Health & Safety at Work Essentials (HSWA 1974)',
          status: 'completed',
          progress: 100,
          completedDate: '2025-09-05',
          expiryDate: '2027-09-05',
          score: 92,
        },
        {
          id: 'course-univ-fire',
          title: 'Fire Safety Awareness & Warden Duties',
          status: 'completed',
          progress: 100,
          completedDate: '2025-09-05',
          expiryDate: '2026-09-05',
          score: 90,
        },
        {
          id: 'course-food-allergens',
          title: "Allergen Awareness & Natasha's Law Compliance",
          status: 'completed',
          progress: 100,
          completedDate: '2025-10-01',
          expiryDate: '2026-10-01',
          score: 98,
        },
      ],
    },
  ];

  for (const l of sampleLearners) {
    insertLearner.run(
      l.id,
      'biz-the-copper-kettle',
      l.name,
      l.email,
      l.roleLevel,
      l.jobTitle,
      l.department,
      l.startDate,
      l.rtwStatus,
      l.rtwDate,
      '',
      0
    );

    for (const c of l.courses) {
      const courseRec = c as any;
      insertLearnerRecord.run(
        `rec-${l.id}-${c.id}`,
        l.id,
        c.id,
        c.title,
        c.status,
        c.progress,
        courseRec.completedDate || null,
        courseRec.expiryDate || null,
        courseRec.score || null,
        1
      );
    }
  }

  // Learners for Oakwood Manor Care
  const careLearners = [
    {
      id: 'lrn-care-201',
      name: 'Sarah Jenkins',
      email: 's.jenkins@oakwoodmanor.co.uk',
      roleLevel: 'manager',
      jobTitle: 'Registered Care Home Manager',
      department: 'Care Administration',
      startDate: '2023-01-10',
      rtwStatus: 'verified_statutory_excuse',
      rtwDate: '2023-01-05',
      courses: [
        {
          id: 'course-care-meds',
          title: 'Safe Handling & Administration of Medicines',
          status: 'completed',
          progress: 100,
          completedDate: '2025-04-12',
          expiryDate: '2026-04-12',
          score: 98,
        },
        {
          id: 'course-care-safeguard-l3',
          title: 'Safeguarding Adults & Children (Level 3 - Lead & Manager)',
          status: 'completed',
          progress: 100,
          completedDate: '2025-06-01',
          expiryDate: '2026-06-01',
          score: 96,
        },
        {
          id: 'course-care-ipc',
          title: 'Infection Prevention & Control (IPC) in Care Environments',
          status: 'completed',
          progress: 100,
          completedDate: '2025-05-20',
          expiryDate: '2027-05-20',
          score: 94,
        },
        {
          id: 'course-care-mca-dols',
          title: 'Mental Capacity Act (MCA) & Deprivation of Liberty (DoLS)',
          status: 'completed',
          progress: 100,
          completedDate: '2025-06-15',
          expiryDate: '2027-06-15',
          score: 95,
        },
      ],
    },
    {
      id: 'lrn-care-202',
      name: 'Tariq Al-Mansoor',
      email: 't.mansoor@oakwoodmanor.co.uk',
      roleLevel: 'supervisor',
      jobTitle: 'Senior Care Supervisor',
      department: 'Dementia Wing',
      startDate: '2023-08-15',
      rtwStatus: 'verified_statutory_excuse',
      rtwDate: '2023-08-01',
      courses: [
        {
          id: 'course-care-meds',
          title: 'Safe Handling & Administration of Medicines',
          status: 'completed',
          progress: 100,
          completedDate: '2025-05-10',
          expiryDate: '2026-05-10',
          score: 92,
        },
        {
          id: 'course-care-safeguard-l3',
          title: 'Safeguarding Adults & Children (Level 3 - Lead & Manager)',
          status: 'completed',
          progress: 100,
          completedDate: '2025-07-01',
          expiryDate: '2026-07-01',
          score: 94,
        },
      ],
    },
    {
      id: 'lrn-care-203',
      name: 'Amina Begum',
      email: 'a.begum@oakwoodmanor.co.uk',
      roleLevel: 'field_worker',
      jobTitle: 'Senior Care Assistant',
      department: 'Residential Unit',
      startDate: '2024-03-01',
      rtwStatus: 'verified_statutory_excuse',
      rtwDate: '2024-02-28',
      courses: [
        {
          id: 'course-care-safeguard-l2',
          title: 'Safeguarding Adults at Risk (Level 2 - Care Staff)',
          status: 'completed',
          progress: 100,
          completedDate: '2025-08-01',
          expiryDate: '2026-08-01',
          score: 90,
        },
        {
          id: 'course-care-cert',
          title: 'The Care Certificate (All 15 Standards)',
          status: 'in_progress',
          progress: 65,
        },
      ],
    },
  ];

  for (const l of careLearners) {
    insertLearner.run(
      l.id,
      'biz-oakwood-manor-care',
      l.name,
      l.email,
      l.roleLevel,
      l.jobTitle,
      l.department,
      l.startDate,
      l.rtwStatus,
      l.rtwDate,
      '',
      0
    );

    for (const c of l.courses) {
      const courseRec = c as any;
      insertLearnerRecord.run(
        `rec-${l.id}-${c.id}`,
        l.id,
        c.id,
        c.title,
        c.status,
        c.progress,
        courseRec.completedDate || null,
        courseRec.expiryDate || null,
        courseRec.score || null,
        1
      );
    }
  }

  // Seed Oakwood Manor care checklists from templates
  const careTemplates = db.prepare(`
    SELECT * FROM checklist_templates
    WHERE sector_applicability = 'universal' OR sector_applicability = 'health_social_care'
  `).all() as any[];

  for (const t of careTemplates) {
    insertChecklist.run(
      `chk-oakwood-${t.id}`,
      'biz-oakwood-manor-care',
      t.category,
      t.sector_applicability,
      t.title,
      t.description,
      t.plain_language_help || '',
      t.regulatory_body,
      t.legal_reference,
      'compliant',
      'Audited and verified against CQC Key Lines of Enquiry (KLOE).',
      1,
      '2026-08-20',
      t.penalty_risk_text,
      t.scoring_weight,
      t.last_verified_date || '2026-08-01',
      t.source_url || 'https://www.cqc.org.uk',
      0,
      '[]'
    );
  }

  // 6. Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, role, tenant_id, business_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'usr-admin-1',
    'Eleanor Vance (Senior Compliance Officer)',
    'e.vance@learnplatform.com',
    'admin',
    'ten-apex-hospitality',
    'biz-the-copper-kettle'
  );
  insertUser.run(
    'usr-manager-1',
    'Marcus Davies (General Operations Manager)',
    'm.davies@thecopperkettle.co.uk',
    'business_manager',
    'ten-apex-hospitality',
    'biz-the-copper-kettle'
  );
  insertUser.run(
    'usr-viewer-1',
    'Sophie Taylor (Internal Auditor)',
    's.taylor@apexhospitality.co.uk',
    'viewer',
    'ten-apex-hospitality',
    'biz-the-copper-kettle'
  );

  // 7. Seed initial Audit Snapshot
  const insertSnapshot = db.prepare(`
    INSERT INTO audit_snapshots (
      id, business_id, timestamp, inspector_ref, notes,
      overall_score_percent, training_score_percent,
      operational_checklist_score_percent, right_to_work_score_percent,
      grade_badge, total_employees, total_learners, critical_gaps_count,
      expired_certs_count, summary, report_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSnapshot.run(
    'snap-2026-08-01-baseline',
    'biz-the-copper-kettle',
    '2026-08-01T14:00:00Z',
    'EHO-PRE-AUDIT-Q3',
    'Pre-audit internal inspection prior to council EHO unannounced visit.',
    72,
    76,
    80,
    60,
    'Requires Improvement',
    14,
    5,
    2,
    1,
    'Baseline assessment prior to onboarding refresher courses. Primary gaps identified in Right to Work checks and expired food safety certs.',
    JSON.stringify({ baseline: true, score: 72 })
  );

  console.log('Database initialized and seeded successfully.');
}
