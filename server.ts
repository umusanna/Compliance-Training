import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase, DB_PATH } from './server/db';
import { Course, RoleBreakdown, AuditChecklistItem, ChecklistAttachment } from './src/types';

// Initialize SQLite schema and seed records
initDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // ==========================================
  // API ROUTES (MUST COME FIRST)
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', engine: 'deterministic-sqlite', time: new Date().toISOString() });
  });

  // Users (for role switching: Admin, Business Manager, Viewer)
  app.get('/api/users', (req, res) => {
    const users = db.prepare('SELECT * FROM users').all();
    res.json(users);
  });

  // Tenants & Businesses
  app.get('/api/tenants', (req, res) => {
    const tenants = db.prepare('SELECT * FROM tenants').all();
    res.json(tenants);
  });

  app.get('/api/businesses', (req, res) => {
    const businesses = db.prepare(`
      SELECT b.*, t.name as tenant_name
      FROM businesses b
      LEFT JOIN tenants t ON b.tenant_id = t.id
      ORDER BY b.name ASC
    `).all() as any[];

    const formatted = businesses.map((b) => ({
      ...b,
      employeeCounts: JSON.parse(b.employee_counts_json || '{}'),
      fsaRegistered: Boolean(b.fsa_registered),
      cqcRegistered: Boolean(b.cqc_registered),
      fcaAuthorised: Boolean(b.fca_authorised),
      cdmNotifiable: Boolean(b.cdm_notifiable),
      onboardingCompleted: Boolean(b.onboarding_completed),
    }));

    res.json(formatted);
  });

  app.get('/api/business/:id', (req, res) => {
    const b = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id) as any;
    if (!b) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json({
      id: b.id,
      tenantId: b.tenant_id,
      name: b.name,
      tradingName: b.trading_name,
      sector: b.sector,
      subSector: b.sub_sector,
      jurisdiction: b.jurisdiction,
      companyNumber: b.company_number,
      turnoverGbp: b.turnover_gbp,
      balanceSheetGbp: b.balance_sheet_gbp,
      employeeCounts: JSON.parse(b.employee_counts_json || '{}'),
      fsaRegistered: Boolean(b.fsa_registered),
      cqcRegistered: Boolean(b.cqc_registered),
      fcaAuthorised: Boolean(b.fca_authorised),
      cdmNotifiable: Boolean(b.cdm_notifiable),
      onboardingCompleted: Boolean(b.onboarding_completed),
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    });
  });

  app.put('/api/business/:id', (req, res) => {
    const b = req.body;
    const updatedAt = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE businesses SET
        name = ?,
        trading_name = ?,
        sector = ?,
        sub_sector = ?,
        jurisdiction = ?,
        company_number = ?,
        turnover_gbp = ?,
        balance_sheet_gbp = ?,
        employee_counts_json = ?,
        fsa_registered = ?,
        cqc_registered = ?,
        fca_authorised = ?,
        cdm_notifiable = ?,
        onboarding_completed = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      b.name,
      b.tradingName || '',
      b.sector,
      b.subSector || '',
      b.jurisdiction,
      b.companyNumber || '',
      b.turnoverGbp || 0,
      b.balanceSheetGbp || 0,
      JSON.stringify(b.employeeCounts || {}),
      b.fsaRegistered ? 1 : 0,
      b.cqcRegistered ? 1 : 0,
      b.fcaAuthorised ? 1 : 0,
      b.cdmNotifiable ? 1 : 0,
      b.onboardingCompleted ? 1 : 0,
      updatedAt,
      req.params.id
    );

    res.json({ success: true, updatedAt });
  });

  app.post('/api/business', (req, res) => {
    const b = req.body;
    const id = b.id || `biz-${Date.now()}`;
    const now = new Date().toISOString();
    const tenantId = b.tenantId || 'ten-apex-hospitality';

    const stmt = db.prepare(`
      INSERT INTO businesses (
        id, tenant_id, name, trading_name, sector, sub_sector, jurisdiction,
        company_number, turnover_gbp, balance_sheet_gbp, employee_counts_json,
        fsa_registered, cqc_registered, fca_authorised, cdm_notifiable,
        onboarding_completed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      tenantId,
      b.name,
      b.tradingName || '',
      b.sector,
      b.subSector || '',
      b.jurisdiction || 'england_wales',
      b.companyNumber || '',
      b.turnoverGbp || 0,
      b.balanceSheetGbp || 0,
      JSON.stringify(b.employeeCounts || { manager: 1, supervisor: 1, field_worker: 5, admin: 1 }),
      b.fsaRegistered ? 1 : 0,
      b.cqcRegistered ? 1 : 0,
      b.fcaAuthorised ? 1 : 0,
      b.cdmNotifiable ? 1 : 0,
      1,
      now,
      now
    );

    res.json({ id, success: true });
  });

  // Learners & Course Records
  app.get('/api/business/:id/learners', (req, res) => {
    const businessId = req.params.id;
    const includeArchived = req.query.includeArchived === 'true';

    const sql = includeArchived
      ? 'SELECT * FROM learners WHERE business_id = ? ORDER BY name ASC'
      : 'SELECT * FROM learners WHERE business_id = ? AND is_archived = 0 ORDER BY name ASC';

    const rawLearners = db.prepare(sql).all(businessId) as any[];

    const learnersWithCourses = rawLearners.map((l) => {
      const records = db.prepare(`
        SELECT * FROM learner_course_records WHERE learner_id = ?
      `).all(l.id) as any[];

      return {
        id: l.id,
        businessId: l.business_id,
        name: l.name,
        email: l.email,
        roleLevel: l.role_level,
        jobTitle: l.job_title || '',
        department: l.department || '',
        startDate: l.start_date || '',
        rightToWorkStatus: l.right_to_work_status,
        rightToWorkCheckDate: l.right_to_work_check_date || '',
        notes: l.notes || '',
        isArchived: Boolean(l.is_archived),
        archivedAt: l.archived_at || undefined,
        archivedReason: l.archived_reason || undefined,
        courses: records.map((r) => ({
          courseId: r.course_id,
          courseTitle: r.course_title,
          status: r.status,
          progressPercent: r.progress_percent,
          completedDate: r.completed_date || undefined,
          expiryDate: r.expiry_date || undefined,
          score: r.score || undefined,
          isOurPlatform: Boolean(r.is_our_platform),
        })),
      };
    });

    res.json(learnersWithCourses);
  });

  app.post('/api/business/:id/learners', (req, res) => {
    const l = req.body;
    const businessId = req.params.id;
    const id = l.id || `lrn-${Date.now()}`;

    const insertLearner = db.prepare(`
      INSERT INTO learners (
        id, business_id, name, email, role_level, job_title, department,
        start_date, right_to_work_status, right_to_work_check_date, notes, is_archived
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    insertLearner.run(
      id,
      businessId,
      l.name,
      l.email,
      l.roleLevel,
      l.jobTitle || '',
      l.department || '',
      l.startDate || new Date().toISOString().split('T')[0],
      l.rightToWorkStatus || 'pending_verification',
      l.rightToWorkCheckDate || '',
      l.notes || ''
    );

    if (Array.isArray(l.courses)) {
      const insertRecord = db.prepare(`
        INSERT INTO learner_course_records (
          id, learner_id, course_id, course_title, status, progress_percent,
          completed_date, expiry_date, score, is_our_platform
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const c of l.courses) {
        insertRecord.run(
          `rec-${id}-${c.courseId}`,
          id,
          c.courseId,
          c.courseTitle,
          c.status,
          c.progressPercent || 0,
          c.completedDate || null,
          c.expiryDate || null,
          c.score || null,
          c.isOurPlatform ? 1 : 0
        );
      }
    }

    res.json({ id, success: true });
  });

  app.put('/api/business/:id/learners/:learnerId', (req, res) => {
    const l = req.body;
    const stmt = db.prepare(`
      UPDATE learners SET
        name = ?,
        email = ?,
        role_level = ?,
        job_title = ?,
        department = ?,
        start_date = ?,
        right_to_work_status = ?,
        right_to_work_check_date = ?,
        notes = ?
      WHERE id = ? AND business_id = ?
    `);

    stmt.run(
      l.name,
      l.email,
      l.roleLevel,
      l.jobTitle || '',
      l.department || '',
      l.startDate || '',
      l.rightToWorkStatus,
      l.rightToWorkCheckDate || '',
      l.notes || '',
      req.params.learnerId,
      req.params.id
    );

    res.json({ success: true });
  });

  app.post('/api/business/:id/learners/:learnerId/archive', (req, res) => {
    const { reason } = req.body;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE learners SET
        is_archived = 1,
        archived_at = ?,
        archived_reason = ?
      WHERE id = ? AND business_id = ?
    `);

    stmt.run(now, reason || 'Worker departed / contract ended', req.params.learnerId, req.params.id);
    res.json({ success: true, archivedAt: now });
  });

  app.post('/api/business/:id/learners/:learnerId/restore', (req, res) => {
    const stmt = db.prepare(`
      UPDATE learners SET
        is_archived = 0,
        archived_at = NULL,
        archived_reason = NULL
      WHERE id = ? AND business_id = ?
    `);

    stmt.run(req.params.learnerId, req.params.id);
    res.json({ success: true });
  });

  app.post('/api/business/:id/learners/:learnerId/courses', (req, res) => {
    const { courseId, courseTitle, status, progressPercent, completedDate, expiryDate, score } = req.body;
    const learnerId = req.params.learnerId;

    const upsertStmt = db.prepare(`
      INSERT INTO learner_course_records (
        id, learner_id, course_id, course_title, status, progress_percent,
        completed_date, expiry_date, score, is_our_platform
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET
        course_title = excluded.course_title,
        status = excluded.status,
        progress_percent = excluded.progress_percent,
        completed_date = excluded.completed_date,
        expiry_date = excluded.expiry_date,
        score = excluded.score
    `);

    upsertStmt.run(
      `rec-${learnerId}-${courseId}`,
      learnerId,
      courseId,
      courseTitle,
      status,
      progressPercent || 0,
      completedDate || null,
      expiryDate || null,
      score || null
    );

    res.json({ success: true });
  });

  // Bulk CSV Import of Learners
  app.post('/api/business/:id/learners/bulk-import', (req, res) => {
    const { rows } = req.body as { rows: Array<{
      name: string;
      email: string;
      roleLevel: string;
      jobTitle?: string;
      department?: string;
      startDate?: string;
      rightToWorkStatus?: string;
      completedCourses?: string; // comma separated course codes
    }> };

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No rows provided' });
    }

    const businessId = req.params.id;
    let importedCount = 0;

    const insertLearner = db.prepare(`
      INSERT INTO learners (
        id, business_id, name, email, role_level, job_title, department,
        start_date, right_to_work_status, right_to_work_check_date, notes, is_archived
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    const insertRecord = db.prepare(`
      INSERT INTO learner_course_records (
        id, learner_id, course_id, course_title, status, progress_percent,
        completed_date, expiry_date, score, is_our_platform
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const courses = db.prepare('SELECT * FROM courses').all() as any[];

    for (const r of rows) {
      if (!r.name || !r.email) continue;
      const id = `lrn-csv-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const roleLevel = ['manager', 'supervisor', 'field_worker', 'admin'].includes(r.roleLevel)
        ? r.roleLevel
        : 'field_worker';
      const rtw = r.rightToWorkStatus === 'verified_statutory_excuse' ? r.rightToWorkStatus : 'pending_verification';

      insertLearner.run(
        id,
        businessId,
        r.name.trim(),
        r.email.trim(),
        roleLevel,
        r.jobTitle || 'Team Member',
        r.department || 'Operations',
        r.startDate || new Date().toISOString().split('T')[0],
        rtw,
        rtw === 'verified_statutory_excuse' ? new Date().toISOString().split('T')[0] : '',
        'Imported via CSV bulk upload'
      );

      // Link any completed courses indicated in the import
      if (r.completedCourses) {
        const codes = r.completedCourses.split(',').map((s) => s.trim().toUpperCase());
        for (const code of codes) {
          const matchedCourse = courses.find((c) => c.code.toUpperCase() === code || c.id.toUpperCase() === code);
          if (matchedCourse) {
            const today = new Date().toISOString().split('T')[0];
            const expDate = new Date();
            expDate.setMonth(expDate.getMonth() + (matchedCourse.renewal_months || 24));

            insertRecord.run(
              `rec-${id}-${matchedCourse.id}`,
              id,
              matchedCourse.id,
              matchedCourse.title,
              'completed',
              100,
              today,
              expDate.toISOString().split('T')[0],
              95
            );
          }
        }
      }

      importedCount++;
    }

    res.json({ success: true, importedCount });
  });

  // Checklists
  app.get('/api/business/:id/checklists', (req, res) => {
    let rawChecklists = db.prepare(`
      SELECT * FROM checklist_items WHERE business_id = ? ORDER BY scoring_weight DESC, title ASC
    `).all(req.params.id) as any[];

    if (rawChecklists.length === 0) {
      const biz = db.prepare('SELECT sector FROM businesses WHERE id = ?').get(req.params.id) as any;
      const sector = biz?.sector || 'general_business';
      const templates = db.prepare(`
        SELECT * FROM checklist_templates
        WHERE sector_applicability = 'universal' OR sector_applicability = ?
      `).all(sector) as any[];

      const insertChecklist = db.prepare(`
        INSERT INTO checklist_items (
          id, business_id, category, sector, title, description, plain_language_help,
          regulatory_body, legal_reference, status, manager_notes, evidence_documented,
          attachments_json, penalty_risk_text, scoring_weight, last_verified_date,
          source_url, is_custom_client_override
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_started', '', 0, '[]', ?, ?, ?, ?, 0)
      `);

      for (const t of templates) {
        insertChecklist.run(
          `chk-${req.params.id}-${t.id}`,
          req.params.id,
          t.category,
          t.sector_applicability,
          t.title,
          t.description,
          t.plain_language_help,
          t.regulatory_body,
          t.legal_reference,
          t.penalty_risk_text,
          t.scoring_weight,
          t.last_verified_date,
          t.source_url
        );
      }

      rawChecklists = db.prepare(`
        SELECT * FROM checklist_items WHERE business_id = ? ORDER BY scoring_weight DESC, title ASC
      `).all(req.params.id) as any[];
    }

    const formatted: AuditChecklistItem[] = rawChecklists.map((c) => ({
      id: c.id,
      businessId: c.business_id,
      category: c.category,
      sector: c.sector || undefined,
      title: c.title,
      description: c.description || '',
      plainLanguageHelp: c.plain_language_help || undefined,
      regulatoryBody: c.regulatory_body,
      legalReference: c.legal_reference,
      status: c.status,
      managerNotes: c.manager_notes || '',
      evidenceDocumented: Boolean(c.evidence_documented),
      attachments: JSON.parse(c.attachments_json || '[]'),
      lastReviewedDate: c.last_reviewed_date || undefined,
      penaltyRiskText: c.penalty_risk_text || '',
      scoringWeight: c.scoring_weight || 3,
      lastVerifiedDate: c.last_verified_date || undefined,
      sourceUrl: c.source_url || undefined,
      isCustomClientOverride: Boolean(c.is_custom_client_override),
    }));

    res.json(formatted);
  });

  app.put('/api/business/:id/checklists/:checklistId', (req, res) => {
    const c = req.body;
    const now = new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      UPDATE checklist_items SET
        status = ?,
        manager_notes = ?,
        evidence_documented = ?,
        last_reviewed_date = ?,
        attachments_json = ?
      WHERE id = ? AND business_id = ?
    `);

    stmt.run(
      c.status,
      c.managerNotes || '',
      c.evidenceDocumented ? 1 : 0,
      now,
      JSON.stringify(c.attachments || []),
      req.params.checklistId,
      req.params.id
    );

    res.json({ success: true, lastReviewedDate: now });
  });

  app.post('/api/business/:id/checklists/:checklistId/attachments', (req, res) => {
    const { fileName, fileType, fileSizeBytes, notes, uploadedBy } = req.body;
    const businessId = req.params.id;
    const checklistId = req.params.checklistId;

    const row = db.prepare(`
      SELECT attachments_json, evidence_documented FROM checklist_items WHERE id = ? AND business_id = ?
    `).get(checklistId, businessId) as any;

    if (!row) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    const attachments: ChecklistAttachment[] = JSON.parse(row.attachments_json || '[]');
    const newAtt: ChecklistAttachment = {
      id: `att-${Date.now()}`,
      checklistId,
      fileName: fileName || 'Evidence_Document.pdf',
      fileType: fileType || 'application/pdf',
      fileSizeBytes: fileSizeBytes || 128000,
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploadedBy || 'Current Manager',
      notes: notes || '',
    };

    attachments.push(newAtt);

    const updateStmt = db.prepare(`
      UPDATE checklist_items SET
        attachments_json = ?,
        evidence_documented = 1,
        last_reviewed_date = ?
      WHERE id = ? AND business_id = ?
    `);

    updateStmt.run(
      JSON.stringify(attachments),
      new Date().toISOString().split('T')[0],
      checklistId,
      businessId
    );

    res.json({ success: true, attachment: newAtt, totalAttachments: attachments.length });
  });

  app.delete('/api/business/:id/checklists/:checklistId/attachments/:attachmentId', (req, res) => {
    const businessId = req.params.id;
    const checklistId = req.params.checklistId;
    const attachmentId = req.params.attachmentId;

    const row = db.prepare(`
      SELECT attachments_json FROM checklist_items WHERE id = ? AND business_id = ?
    `).get(checklistId, businessId) as any;

    if (!row) return res.status(404).json({ error: 'Not found' });

    let attachments: ChecklistAttachment[] = JSON.parse(row.attachments_json || '[]');
    attachments = attachments.filter((a) => a.id !== attachmentId);

    const updateStmt = db.prepare(`
      UPDATE checklist_items SET
        attachments_json = ?,
        evidence_documented = ?
      WHERE id = ? AND business_id = ?
    `);

    updateStmt.run(
      JSON.stringify(attachments),
      attachments.length > 0 ? 1 : 0,
      checklistId,
      businessId
    );

    res.json({ success: true, remaining: attachments.length });
  });

  // Courses Catalog & Regulatory Verification
  app.get('/api/courses', (req, res) => {
    const rawCourses = db.prepare('SELECT * FROM courses ORDER BY code ASC').all() as any[];
    const courses: Course[] = rawCourses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      sector: c.sector,
      targetRoles: JSON.parse(c.target_roles_json || '[]'),
      description: c.description,
      plainLanguageHelp: c.plain_language_help,
      durationHours: c.duration_hours,
      accreditation: c.accreditation,
      renewalMonths: c.renewal_months,
      isMandatoryByLaw: Boolean(c.is_mandatory_by_law),
      regulatoryDriver: c.regulatory_driver,
      lastVerifiedDate: c.last_verified_date,
      sourceUrl: c.source_url,
    }));

    res.json(courses);
  });

  app.put('/api/courses/:id', (req, res) => {
    const c = req.body;
    const stmt = db.prepare(`
      UPDATE courses SET
        title = ?,
        description = ?,
        plain_language_help = ?,
        duration_hours = ?,
        accreditation = ?,
        renewal_months = ?,
        is_mandatory_by_law = ?,
        regulatory_driver = ?,
        last_verified_date = ?,
        source_url = ?
      WHERE id = ?
    `);

    stmt.run(
      c.title,
      c.description,
      c.plainLanguageHelp || '',
      c.durationHours,
      c.accreditation,
      c.renewalMonths,
      c.isMandatoryByLaw ? 1 : 0,
      c.regulatoryDriver,
      c.lastVerifiedDate || new Date().toISOString().split('T')[0],
      c.sourceUrl,
      req.params.id
    );

    // Record in changelog
    const changelogStmt = db.prepare(`
      INSERT INTO regulatory_changelog (
        id, entity_type, entity_id, changed_field, old_value, newValue,
        changed_by, changed_date, source_reference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    changelogStmt.run(
      `log-${Date.now()}`,
      'course_requirement',
      req.params.id,
      'regulatory_metadata',
      'Previous definition',
      JSON.stringify({ renewalMonths: c.renewalMonths, lastVerifiedDate: c.lastVerifiedDate }),
      'Eleanor Vance (Admin)',
      new Date().toISOString(),
      c.sourceUrl || 'Official Regulatory Guidance'
    );

    res.json({ success: true });
  });

  // Audit Snapshots (Timestamped historical records)
  app.get('/api/business/:id/snapshots', (req, res) => {
    const snapshots = db.prepare(`
      SELECT * FROM audit_snapshots WHERE business_id = ? ORDER BY timestamp DESC
    `).all(req.params.id) as any[];

    res.json(snapshots.map((s) => ({
      id: s.id,
      businessId: s.business_id,
      timestamp: s.timestamp,
      inspectorRef: s.inspector_ref,
      notes: s.notes,
      overallScorePercent: s.overall_score_percent,
      trainingScorePercent: s.training_score_percent,
      operationalChecklistScorePercent: s.operational_checklist_score_percent,
      rightToWorkScorePercent: s.right_to_work_score_percent,
      gradeBadge: s.grade_badge,
      totalEmployees: s.total_employees,
      totalLearners: s.total_learners,
      criticalGapsCount: s.critical_gaps_count,
      expiredCertsCount: s.expired_certs_count,
      summary: s.summary,
      reportJson: s.report_json,
    })));
  });

  app.post('/api/business/:id/snapshots', (req, res) => {
    const s = req.body;
    const id = `snap-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO audit_snapshots (
        id, business_id, timestamp, inspector_ref, notes,
        overall_score_percent, training_score_percent,
        operational_checklist_score_percent, right_to_work_score_percent,
        grade_badge, total_employees, total_learners, critical_gaps_count,
        expired_certs_count, summary, report_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      id,
      req.params.id,
      timestamp,
      s.inspectorRef || 'INTERNAL-AUDIT-SNAP',
      s.notes || '',
      s.overallScorePercent || 0,
      s.trainingScorePercent || 0,
      s.operationalChecklistScorePercent || 0,
      s.rightToWorkScorePercent || 0,
      s.gradeBadge || 'Draft',
      s.totalEmployees || 0,
      s.totalLearners || 0,
      s.criticalGapsCount || 0,
      s.expiredCertsCount || 0,
      s.summary || 'Audit report snapshot saved.',
      JSON.stringify(s.reportJson || {})
    );

    res.json({ success: true, id, timestamp });
  });

  // Admin: Portfolio View Across All Clients
  app.get('/api/admin/portfolio', (req, res) => {
    const businesses = db.prepare(`
      SELECT b.id, b.name, b.sector, b.employee_counts_json,
             (SELECT count(*) FROM learners WHERE business_id = b.id AND is_archived = 0) as total_learners,
             (SELECT count(*) FROM learners WHERE business_id = b.id AND is_archived = 0 AND right_to_work_status != 'verified_statutory_excuse') as pending_rtw,
             (SELECT count(*) FROM learner_course_records r JOIN learners l ON r.learner_id = l.id WHERE l.business_id = b.id AND l.is_archived = 0 AND r.status = 'expired') as expired_certs,
             (SELECT count(*) FROM checklist_items c WHERE c.business_id = b.id AND c.status = 'gap_critical') as critical_checklist_gaps,
             (SELECT timestamp FROM audit_snapshots WHERE business_id = b.id ORDER BY timestamp DESC LIMIT 1) as last_snapshot_date,
             (SELECT overall_score_percent FROM audit_snapshots WHERE business_id = b.id ORDER BY timestamp DESC LIMIT 1) as last_snapshot_score
      FROM businesses b
      ORDER BY b.name ASC
    `).all() as any[];

    res.json(businesses.map((b) => ({
      businessId: b.id,
      businessName: b.name,
      sector: b.sector,
      totalEmployees: Object.values(JSON.parse(b.employee_counts_json || '{}')).reduce<number>(
        (acc, val) => acc + (Number(val) || 0),
        0
      ),
      totalLearners: b.total_learners,
      pendingRtwCount: b.pending_rtw,
      expiredCertsCount: b.expired_certs,
      criticalGapsCount: b.critical_checklist_gaps,
      lastAuditDate: b.last_snapshot_date || undefined,
      lastScore: b.last_snapshot_score ?? null,
      status: b.pending_rtw > 0 || b.expired_certs > 0 || b.critical_checklist_gaps > 0 ? 'warning' : 'compliant',
    })));
  });

  // Admin: Regulatory Changelog
  app.get('/api/admin/changelog', (req, res) => {
    const logs = db.prepare('SELECT * FROM regulatory_changelog ORDER BY changed_date DESC').all();
    res.json(logs);
  });

  // Proactive Email Reminders Mock Service
  app.post('/api/business/:id/reminders/send', (req, res) => {
    const businessId = req.params.id;
    const learners = db.prepare(`
      SELECT l.id, l.name, l.email, l.right_to_work_status,
             r.course_title, r.expiry_date, r.status
      FROM learners l
      LEFT JOIN learner_course_records r ON l.id = r.learner_id
      WHERE l.business_id = ? AND l.is_archived = 0 AND (
        l.right_to_work_status != 'verified_statutory_excuse' OR
        r.status = 'expired'
      )
    `).all(businessId) as any[];

    const notificationsSent = learners.map((l) => ({
      recipientName: l.name,
      recipientEmail: l.email,
      triggerType: l.status === 'expired' ? 'CERTIFICATE_EXPIRED_WARNING' : 'RIGHT_TO_WORK_PENDING',
      messagePreview: l.status === 'expired'
        ? `Action Required: Your mandatory certification for "${l.course_title}" expired on ${l.expiry_date}. Please complete the online refresher module.`
        : `Statutory Check Required: Please provide your Home Office share code to verify your Right to Work statutory excuse.`,
      dispatchedAt: new Date().toISOString(),
      status: 'dispatched_simulated',
    }));

    res.json({
      success: true,
      dispatchedCount: notificationsSent.length,
      notifications: notificationsSent,
    });
  });

  // Reset Demo Database to Clean Seed State
  app.post('/api/reset-demo', (req, res) => {
    db.exec(`
      DELETE FROM audit_snapshots;
      DELETE FROM learner_course_records;
      DELETE FROM learners;
      DELETE FROM checklist_items;
      DELETE FROM courses;
      DELETE FROM businesses;
      DELETE FROM tenants;
      DELETE FROM users;
      DELETE FROM regulatory_changelog;
    `);
    // Re-seed
    initDatabase();
    res.json({ success: true, message: 'Database reset to default seed state' });
  });

  // ==========================================
  // VITE DEV / PRODUCTION MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Compliance Dashboard full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
