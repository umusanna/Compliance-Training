import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  GraduationCap,
  ClipboardCheck,
  Building2,
  ArrowRight,
  TrendingUp,
  Scale,
  Users,
  Award,
  AlertCircle,
  Clock,
  ExternalLink,
  History,
  Save,
  HelpCircle,
  Mail,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { BusinessProfile, ComplianceAuditReport, Course, AuditSnapshot } from '../types';
import { SECTOR_METADATA } from '../data/regulatoryStandards';
import { ExplainScoreModal } from './modals/ExplainScoreModal';
import { RemindersModal } from './modals/RemindersModal';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface AuditOverviewProps {
  report: ComplianceAuditReport;
  profile: BusinessProfile;
  onNavigateToTab: (tab: 'business' | 'checklists' | 'learners' | 'solutions') => void;
  onQuickEnrolLearners: (courseId: string) => void;
  readOnly?: boolean;
}

export const AuditOverview: React.FC<AuditOverviewProps> = ({
  report,
  profile,
  onNavigateToTab,
  onQuickEnrolLearners,
  readOnly = false,
}) => {
  const { showToast } = useToast();
  const sectorInfo = SECTOR_METADATA[profile.sector] || SECTOR_METADATA.general_business;

  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<AuditSnapshot[]>([]);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [showSnapshotHistory, setShowSnapshotHistory] = useState(false);

  // Load historical snapshots from SQLite
  useEffect(() => {
    if (profile?.id) {
      api.fetchSnapshots(profile.id)
        .then((res) => setSnapshots(Array.isArray(res) ? res : []))
        .catch((err) => {
          console.error('Error fetching snapshots', err);
          setSnapshots([]);
        });
    }
  }, [profile?.id]);

  const handleSaveSnapshot = async () => {
    if (readOnly) return;
    setIsSavingSnapshot(true);
    try {
      const newSnapshot: Partial<AuditSnapshot> = {
        businessId: profile.id,
        inspectorRef: `AUDIT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
        notes: `Snapshot captured for ${profile.name}. Overall Score: ${report.overallScorePercent}%`,
        overallScorePercent: report.overallScorePercent,
        trainingScorePercent: report.trainingScorePercent,
        operationalChecklistScorePercent: report.operationalChecklistScorePercent,
        rightToWorkScorePercent: report.rightToWorkScorePercent,
        gradeBadge: report.gradeBadge,
        totalEmployees: report.totalEmployeesCount,
        totalLearners: report.totalLearnersRegistered,
        criticalGapsCount: report.criticalOperationalGaps.length,
        expiredCertsCount: report.expiredCertificatesCount,
        summary: report.summary,
        reportJson: report,
      };

      const result = await api.createSnapshot(profile.id, newSnapshot);
      showToast('Timestamped audit snapshot saved to database', 'success');

      // Refresh snapshots
      const updated = await api.fetchSnapshots(profile.id);
      setSnapshots(updated);
    } catch (err) {
      showToast('Failed to save audit snapshot', 'error');
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  // Aggregate missing courses across all learners
  const missingCourseCounts = new Map<string, { course: Course; count: number }>();
  report.learnerGaps.forEach((gap) => {
    gap.missingMandatoryCourses.forEach((c) => {
      const existing = missingCourseCounts.get(c.id);
      if (existing) {
        existing.count += 1;
      } else {
        missingCourseCounts.set(c.id, { course: c, count: 1 });
      }
    });
  });
  const aggregatedTrainingSolutions = Array.from(missingCourseCounts.values());

  return (
    <div className="space-y-6">
      {/* Top Banner with Business Context & Statutory Readiness */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-5 md:p-6 text-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {profile.name}
              </h1>
              <span className="text-xs bg-slate-800 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full border border-slate-700">
                {sectorInfo.name}
              </span>
              {profile.tradingName && (
                <span className="text-xs text-slate-400 italic">
                  t/a {profile.tradingName}
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl">
              Deterministic UK statutory audit readiness evaluation enforcing HSE, Home Office, ICO, HMRC mandates and statutory codes overseen by <strong className="text-white">{sectorInfo.regulator}</strong>.
            </p>
          </div>

          {/* Headline Score & Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            {/* Headline Score Pill */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-x-4 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Readiness Score
                </div>
                <div className="flex items-baseline justify-center space-x-1">
                  <span
                    className={`text-3xl font-black tracking-tight ${
                      report.overallScorePercent >= 80
                        ? 'text-emerald-400'
                        : report.overallScorePercent >= 60
                        ? 'text-blue-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {report.overallScorePercent}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ 100</span>
                </div>
              </div>

              <div className="border-l border-slate-800 pl-4 text-left">
                <div
                  className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${
                    report.gradeColor === 'emerald'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : report.gradeColor === 'blue'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : report.gradeColor === 'amber'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {report.gradeBadge}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[190px] leading-tight">
                  {report.gradeDescription}
                </p>
              </div>
            </div>

            {/* Explainer & Action Buttons */}
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                type="button"
                id="btn-explain-score"
                onClick={() => setIsExplainModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors shadow-sm"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>How Score is Calculated</span>
              </button>

              {!readOnly && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    id="btn-save-snapshot"
                    onClick={handleSaveSnapshot}
                    disabled={isSavingSnapshot}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                    title="Save current state to persistent audit history"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Snapshot</span>
                  </button>

                  <button
                    type="button"
                    id="btn-open-reminders"
                    onClick={() => setIsRemindersModalOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                    title="Dispatch reminder emails for expiring certs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Reminders</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3 Metric Scorecards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-800/80">
          {/* Card 1: Employee Training */}
          <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs uppercase tracking-wide">
                  <GraduationCap className="h-4 w-4 text-blue-400" />
                  <span>Workforce Training (45%)</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {report.trainingScorePercent}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${report.trainingScorePercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                <strong className="text-white font-semibold">
                  {report.completedMandatoryCourseSlots} of {report.totalMandatoryCourseSlots}
                </strong>{' '}
                statutory course slots completed across {report.totalLearnersRegistered} learners ({report.inProgressCourseSlots} active in LMS).
                {report.expiredCertificatesCount > 0 && (
                  <span className="text-rose-400 font-semibold block mt-1">
                    ⚠️ {report.expiredCertificatesCount} lapsed certificate{report.expiredCertificatesCount > 1 ? 's' : ''} require refresher.
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('learners')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1 mt-3 pt-2.5 border-t border-slate-800"
            >
              <span>Manage learner register</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Card 2: Operational Checklists */}
          <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs uppercase tracking-wide">
                  <ClipboardCheck className="h-4 w-4 text-emerald-400" />
                  <span>Manager Audit Checklists (40%)</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {report.operationalChecklistScorePercent}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${report.operationalChecklistScorePercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Weighted against statutory inspection rubrics ({report.criticalOperationalGaps.length} critical gaps, {report.inProgressOperationalItems.length} in progress). Evidence documentation bonus applied.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('checklists')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 mt-3 pt-2.5 border-t border-slate-800"
            >
              <span>Complete audit forms & evidence</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Card 3: Right to Work & Governance */}
          <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs uppercase tracking-wide">
                  <Scale className="h-4 w-4 text-amber-400" />
                  <span>Right to Work Verification (15%)</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {report.rightToWorkScorePercent}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    report.rightToWorkScorePercent === 100 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${report.rightToWorkScorePercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Home Office statutory excuse defense against civil penalties of up to{' '}
                <strong className="text-rose-400 font-semibold">£45,000 per unverified worker</strong>.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('learners')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center space-x-1 mt-3 pt-2.5 border-t border-slate-800"
            >
              <span>Verify employee credentials</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* PRIORITY ACTIONS: What To Do Next (Ranked by Fine Severity) */}
      {report.priorityActionItems && report.priorityActionItems.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-800 gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Priority Remedial Actions (What To Do Next)
                </h2>
                <p className="text-xs text-slate-400">
                  Targeted statutory fixes ranked by regulatory penalty severity and immediate audit exposure
                </p>
              </div>
            </div>
            <span className="text-xs bg-amber-950 text-amber-300 font-bold px-2.5 py-1 rounded-full border border-amber-800/80 self-start sm:self-auto">
              {(report?.priorityActionItems || []).length} Urgent Actions
            </span>
          </div>

          <div className="divide-y divide-slate-800 mt-2">
            {(report?.priorityActionItems || []).map((item) => (
              <div key={item.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        item.severityLevel === 'critical'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : item.severityLevel === 'high'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {item.severityLevel} Priority
                    </span>
                    <span className="text-xs font-bold text-white">{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">{item.description}</p>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-0.5">
                    <span>Legal Basis: <strong className="text-slate-300">{item.legalReference}</strong></span>
                    <span>•</span>
                    <span className="text-rose-400 font-semibold">{item.penaltyExposure}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {item.actionType === 'verify_rtw' && (
                    <button
                      onClick={() => onNavigateToTab('learners')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                    >
                      <span>Verify RTW</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {item.actionType === 'renew_training' && (
                    <button
                      onClick={() => onNavigateToTab('learners')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                    >
                      <span>Enrol Refresher</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {item.actionType === 'resolve_checklist' && (
                    <button
                      onClick={() => onNavigateToTab('checklists')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                    >
                      <span>Complete Checklist</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sector-Specific Official Rating Breakdown */}
      {profile.sector === 'food_hospitality' && report.foodHygieneBreakdown && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-amber-950 text-amber-300 font-bold px-2.5 py-0.5 rounded border border-amber-800">
                  FSA Food Hygiene Rating Scheme (FHRS)
                </span>
                <span className="text-xs text-slate-400">Official Brand Standard Scoring</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                Projected Food Hygiene Inspection Score
              </h2>
            </div>

            {/* Official 0-5 Star Badge */}
            <div className="flex items-center space-x-3 bg-slate-950 text-white px-4 py-2.5 rounded-xl border border-slate-800">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Projected Rating
                </div>
                <div className="text-xs font-bold text-emerald-400">
                  {report.foodHygieneBreakdown.descriptor}
                </div>
              </div>
              <div className="h-10 w-10 bg-emerald-500 text-slate-950 font-black text-2xl flex items-center justify-center rounded-lg shadow">
                {report.foodHygieneBreakdown.officialRating}
              </div>
            </div>
          </div>

          {/* 3 Scored Elements Table */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-950/60">
              <div className="text-xs text-slate-400 font-medium">Element 1</div>
              <div className="text-sm font-semibold text-white mt-0.5">
                Food Hygiene & Safety Procedures
              </div>
              <div className="text-2xl font-bold text-white mt-2">
                {report.foodHygieneBreakdown.hygieneProceduresScore}{' '}
                <span className="text-xs font-normal text-slate-500">/ 25 (lower is better)</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Food handling, cooking temperatures (&gt;75°C), cooling time, cross-contamination prevention, and Level 2 kitchen training.
              </p>
            </div>

            <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-950/60">
              <div className="text-xs text-slate-400 font-medium">Element 2</div>
              <div className="text-sm font-semibold text-white mt-0.5">
                Structural Compliance
              </div>
              <div className="text-2xl font-bold text-white mt-2">
                {report.foodHygieneBreakdown.structuralComplianceScore}{' '}
                <span className="text-xs font-normal text-slate-500">/ 25 (lower is better)</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Premises cleanliness, ventilation, drainage, pest proofing, wash hand basins, and equipment condition.
              </p>
            </div>

            <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-950/60">
              <div className="text-xs text-slate-400 font-medium">Element 3</div>
              <div className="text-sm font-semibold text-white mt-0.5">
                Confidence in Management
              </div>
              <div className="text-2xl font-bold text-white mt-2">
                {report.foodHygieneBreakdown.confidenceInManagementScore}{' '}
                <span className="text-xs font-normal text-slate-500">/ 30 (lower is better)</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Safer Food Better Business (SFBB) diary signed daily, Level 3 supervisor qualification, allergen matrix, and temperature logs.
              </p>
            </div>
          </div>

          {/* Additional scoring factor notice */}
          {report.foodHygieneBreakdown.cappedByElement && (
            <div className="mt-3.5 bg-amber-950/40 border border-amber-800/80 rounded-xl p-3 text-xs text-amber-200 flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">FSA Limiting Factor Capping Rule Triggered:</strong>{' '}
                {report.foodHygieneBreakdown.limitingFactor} Under FSA statutory guidelines, the worst single element score places an absolute ceiling on the final star rating.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statutory Penalties & Legal Risk Exposure Box */}
      {report.statutoryPenaltiesRisk.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-900/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-rose-200 font-bold text-base mb-1">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            <span>Statutory Penalties & Enforcement Liability Exposure</span>
          </div>
          <p className="text-xs text-rose-300 mb-4">
            Under 2026 UK enforcement guidelines, unevidenced compliance or missing training triggers automatic civil penalties, Fee for Intervention (FFI), or license suspensions:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {(report?.statutoryPenaltiesRisk || []).map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-rose-900/50 rounded-xl p-3.5 flex flex-col justify-between text-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      {item.regulator}
                    </span>
                    <span className="font-bold bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded text-[11px]">
                      {item.riskAmountFormatted}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-2 leading-relaxed">
                    {item.riskDescription}
                  </p>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between">
                  <span>Basis: {item.regulation}</span>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>gov.uk</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Gap Remediation Split: Training Solutions vs Operational Checklists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Solution Pillar 1: Employee Training Gaps (Our Solutions!) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Workforce Training Solutions
                  </h3>
                  <p className="text-xs text-slate-400">
                    Accredited courses ready to enrol non-compliant learners
                  </p>
                </div>
              </div>
              <span className="text-xs bg-blue-950 text-blue-300 font-bold px-2 py-1 rounded-md border border-blue-800">
                {aggregatedTrainingSolutions.length} Course Needs
              </span>
            </div>

            {aggregatedTrainingSolutions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                All learners have completed or are actively enrolled in their mandatory courses!
              </div>
            ) : (
              <div className="divide-y divide-slate-800 mt-3 max-h-[380px] overflow-y-auto pr-1">
                {aggregatedTrainingSolutions.map(({ course, count }) => (
                  <div key={course.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">
                          {course.title}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-medium">
                          {course.accreditation}
                        </span>
                      </div>
                      <p className="text-slate-400 leading-snug">
                        {course.description}
                      </p>
                      <div className="text-[11px] text-blue-400 font-semibold flex items-center space-x-2">
                        <span>
                          {count} learner{count > 1 ? 's' : ''} require this course
                        </span>
                        <span>•</span>
                        <span>{course.durationHours} hrs self-paced</span>
                      </div>
                    </div>

                    {!readOnly && (
                      <button
                        onClick={() => onQuickEnrolLearners(course.id)}
                        className="shrink-0 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-2.5 py-1.5 rounded-lg transition-colors shadow-sm"
                      >
                        Enrol {count} Staff
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              LMS courses sync progress automatically with this dashboard.
            </span>
            <button
              onClick={() => onNavigateToTab('solutions')}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <span>Explore full course catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Solution Pillar 2: Operational & Manager Audit Prep */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Operational Evidence & Forms
                  </h3>
                  <p className="text-xs text-slate-400">
                    Manager fillable audit forms & operational evidence
                  </p>
                </div>
              </div>
              <span className="text-xs bg-emerald-950 text-emerald-300 font-bold px-2 py-1 rounded-md border border-emerald-800">
                {(report?.criticalOperationalGaps || []).length + (report?.inProgressOperationalItems || []).length} Gaps / Tasks
              </span>
            </div>

            <div className="divide-y divide-slate-800 mt-3 max-h-[380px] overflow-y-auto pr-1">
              {(report?.criticalOperationalGaps || []).length === 0 &&
              (report?.inProgressOperationalItems || []).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  All operational checklists and evidence documents are 100% compliant!
                </div>
              ) : (
                <>
                  {(report?.criticalOperationalGaps || []).map((item) => (
                    <div key={item.id} className="py-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-400 flex items-center space-x-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                          <span>{item.title}</span>
                        </span>
                        <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-semibold px-2 py-0.5 rounded">
                          Critical Audit Gap
                        </span>
                      </div>
                      <p className="text-slate-300">{item.description}</p>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                        <span>Regulator: {item.regulatoryBody}</span>
                        <span className="text-rose-400 font-medium">
                          {item.penaltyRiskText.split('.')[0]}
                        </span>
                      </div>
                    </div>
                  ))}

                  {(report?.inProgressOperationalItems || []).map((item) => (
                    <div key={item.id} className="py-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 flex items-center space-x-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          <span>{item.title}</span>
                        </span>
                        <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 font-semibold px-2 py-0.5 rounded">
                          {item.evidenceDocumented ? 'In Progress' : 'Needs Evidence Attachment'}
                        </span>
                      </div>
                      <p className="text-slate-300">{item.description}</p>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                        <span>{item.legalReference}</span>
                        <span className="text-slate-400 italic">
                          Notes: {item.managerNotes || 'No notes added'}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Managers can update status and attach evidence anytime.
            </span>
            <button
              onClick={() => onNavigateToTab('checklists')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>Review full audit checklist</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Historical Audit Snapshots Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">Historical Audit Snapshots ({(snapshots || []).length})</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowSnapshotHistory(!showSnapshotHistory)}
            className="text-xs text-sky-400 hover:underline font-semibold"
          >
            {showSnapshotHistory ? 'Hide Snapshot History' : 'Show Snapshot History'}
          </button>
        </div>

        {showSnapshotHistory && (
          <div className="mt-4 space-y-3">
            {(snapshots || []).length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No historical snapshots saved yet. Click "Save Snapshot" above to record current audit status.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(snapshots || []).map((s) => (
                  <div key={s.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-white">{s.inspectorRef || 'Audit Snapshot'}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {s.overallScorePercent}%
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] font-mono">
                      {new Date(s.timestamp).toLocaleString()}
                    </p>
                    <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                      {s.notes || s.summary}
                    </p>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-400">
                      <span>Training: {s.trainingScorePercent}%</span>
                      <span>Checklists: {s.operationalChecklistScorePercent}%</span>
                      <span>RTW: {s.rightToWorkScorePercent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ExplainScoreModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        report={report}
      />

      <RemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        businessId={profile.id}
      />
    </div>
  );
};
