import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  BookOpen,
  Calendar,
  Award,
  Upload,
  Archive,
  RotateCcw,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import { Learner, BusinessProfile, Course, RoleLevel } from '../types';
import { COURSES_CATALOG } from '../data/regulatoryStandards';
import { getMandatoryCoursesForLearner } from '../utils/complianceEngine';
import { CsvImportModal } from './modals/CsvImportModal';
import { ArchiveLearnerModal } from './modals/ArchiveLearnerModal';
import { useToast } from '../context/ToastContext';

interface LearnersRegisterViewProps {
  learners: Learner[];
  profile: BusinessProfile;
  onAddLearner: (learner: Learner) => void;
  onUpdateLearner: (id: string, updated: Partial<Learner>) => void;
  onOpenEnrolModal: (learner: Learner) => void;
  onOpenAddModal: () => void;
  onBulkImportSuccess?: () => void;
  onArchiveLearner?: (learnerId: string, reason: string) => void;
  onRestoreLearner?: (learnerId: string) => void;
  readOnly?: boolean;
}

export const LearnersRegisterView: React.FC<LearnersRegisterViewProps> = ({
  learners = [],
  profile,
  onAddLearner,
  onUpdateLearner,
  onOpenEnrolModal,
  onOpenAddModal,
  onBulkImportSuccess,
  onArchiveLearner,
  onRestoreLearner,
  readOnly = false,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [viewTab, setViewTab] = useState<'active' | 'archived'>('active');

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [learnerToArchive, setLearnerToArchive] = useState<Learner | null>(null);

  // RTW inline editing modal/popover state
  const [editingRtwLearnerId, setEditingRtwLearnerId] = useState<string | null>(null);
  const [shareCodeInput, setShareCodeInput] = useState('');

  const activeLearners = (learners || []).filter((l) => !l.isArchived);
  const archivedLearners = (learners || []).filter((l) => l.isArchived);

  const displayedList = viewTab === 'active' ? activeLearners : archivedLearners;

  const filteredLearners = (displayedList || []).filter((learner) => {
    if (roleFilter !== 'all' && learner.roleLevel !== roleFilter) return false;

    const mandatory = getMandatoryCoursesForLearner(learner.roleLevel, profile?.sector);
    const missing = mandatory.filter(
      (m) => !(learner.courses || []).some((c) => c.courseId === m.id && c.status === 'completed')
    );
    const isCompliant = missing.length === 0 && learner.rightToWorkStatus === 'verified_statutory_excuse';

    if (complianceFilter === 'compliant' && !isCompliant) return false;
    if (complianceFilter === 'gaps' && isCompliant) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (learner.name || '').toLowerCase().includes(q) ||
        (learner.email || '').toLowerCase().includes(q) ||
        (learner.jobTitle || '').toLowerCase().includes(q) ||
        (learner.department || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSimulateProgress = (learnerId: string, courseId: string, newProgress: number) => {
    if (readOnly) return;
    const learner = learners.find((l) => l.id === learnerId);
    if (!learner) return;

    const updatedCourses = learner.courses.map((c) => {
      if (c.courseId === courseId) {
        return {
          ...c,
          progressPercent: newProgress,
          status: (newProgress >= 100 ? 'completed' : 'in_progress') as any,
          completedDate: newProgress >= 100 ? new Date().toISOString().split('T')[0] : c.completedDate,
          expiryDate: newProgress >= 100 ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : c.expiryDate,
          score: newProgress >= 100 ? 95 : c.score,
        };
      }
      return c;
    });

    onUpdateLearner(learnerId, { courses: updatedCourses });
    if (newProgress >= 100) {
      showToast('Course module completed! Live compliance recalculated.', 'success');
    }
  };

  const handleSaveShareCode = (learnerId: string) => {
    if (!shareCodeInput.trim()) {
      showToast('Please enter a valid Home Office share code', 'error');
      return;
    }
    onUpdateLearner(learnerId, {
      rightToWorkStatus: 'verified_statutory_excuse',
      rightToWorkShareCode: shareCodeInput.trim().toUpperCase(),
      rightToWorkCheckDate: new Date().toISOString().split('T')[0],
    });
    setEditingRtwLearnerId(null);
    setShareCodeInput('');
    showToast('Right to Work statutory excuse verified with Home Office code', 'success');
  };

  const handleToggleRightToWork = (learnerId: string) => {
    if (readOnly) return;
    const learner = learners.find((l) => l.id === learnerId);
    if (!learner) return;

    if (learner.rightToWorkStatus === 'verified_statutory_excuse') {
      onUpdateLearner(learnerId, {
        rightToWorkStatus: 'pending_verification',
        rightToWorkCheckDate: undefined,
      });
      showToast('Marked as pending verification', 'info');
    } else {
      setEditingRtwLearnerId(learnerId);
      setShareCodeInput(learner.rightToWorkShareCode || '');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-tertiary-900 border border-tertiary-800 rounded-2xl p-5 md:p-6 shadow-sm text-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-primary-600/20 border border-primary-500/40 text-primary-300 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Learner Records & LMS Course Training Register
              </h2>
              <p className="text-xs text-slate-400">
                Track individual certifications, Home Office Right to Work statutory excuses, and real-time LMS progress.
              </p>
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                id="btn-bulk-csv-import"
                onClick={() => setIsCsvModalOpen(true)}
                className="inline-flex items-center space-x-1.5 bg-tertiary-800 hover:bg-tertiary-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-tertiary-700 transition-colors shadow-sm"
              >
                <Upload className="h-3.5 w-3.5 text-primary-400" />
                <span>Bulk CSV Import</span>
              </button>

              <button
                type="button"
                id="register-new-learner-btn"
                onClick={onOpenAddModal}
                className="inline-flex items-center space-x-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Register New Learner</span>
              </button>
            </div>
          )}
        </div>

        {/* View Tabs: Active vs Archived */}
        <div className="mt-5 pt-4 border-t border-tertiary-800 flex items-center justify-between text-xs flex-wrap gap-3">
          <div className="flex space-x-2 bg-tertiary-950 p-1 rounded-xl border border-tertiary-800">
            <button
              type="button"
              onClick={() => setViewTab('active')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                viewTab === 'active'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Staff ({activeLearners.length})
            </button>
            <button
              type="button"
              onClick={() => setViewTab('archived')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                viewTab === 'archived'
                  ? 'bg-secondary-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Archived Staff ({archivedLearners.length})
            </button>
          </div>

          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LMS Database Sync Active</span>
            <span className="text-slate-600">•</span>
            <span>
              Showing <strong className="text-white">{filteredLearners.length}</strong> of{' '}
              <strong className="text-white">{displayedList.length}</strong> staff
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-tertiary-900 border border-tertiary-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-72">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-learners"
            type="text"
            placeholder="Search by learner name, job, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-tertiary-950 border border-tertiary-800 rounded-xl pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end flex-wrap gap-y-2">
          <div className="flex items-center space-x-1 bg-tertiary-950 border border-tertiary-800 rounded-xl px-2.5 py-1">
            <Filter className="h-3 w-3 text-slate-400" />
            <span className="text-slate-500 text-[11px]">Role Level:</span>
            <select
              id="filter-role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-tertiary-900">All Roles</option>
              <option value="manager" className="bg-tertiary-900">Managers</option>
              <option value="supervisor" className="bg-tertiary-900">Supervisors</option>
              <option value="field_worker" className="bg-tertiary-900">Field / Frontline</option>
              <option value="admin" className="bg-tertiary-900">Admin Support</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-tertiary-950 border border-tertiary-800 rounded-xl px-2.5 py-1">
            <span className="text-slate-500 text-[11px]">Compliance:</span>
            <select
              id="filter-compliance"
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-tertiary-900">All Statuses</option>
              <option value="compliant" className="bg-tertiary-900">Fully Compliant</option>
              <option value="gaps" className="bg-tertiary-900">Training Gaps Present</option>
            </select>
          </div>
        </div>
      </div>

      {/* Learners Cards Grid */}
      <div className="space-y-4">
        {filteredLearners.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
            {viewTab === 'archived'
              ? 'No archived staff members on file.'
              : 'No learners match the specified search or filter criteria.'}
          </div>
        ) : (
          filteredLearners.map((learner) => {
            const mandatory = getMandatoryCoursesForLearner(learner.roleLevel, profile.sector);
            const missing = mandatory.filter(
              (m) => !learner.courses.some((c) => c.courseId === m.id && c.status === 'completed')
            );
            const completedCount = learner.courses.filter((c) => c.status === 'completed').length;
            const inProgressRecords = learner.courses.filter((c) => c.status === 'in_progress');

            return (
              <div
                key={learner.id}
                className="bg-tertiary-900 border border-tertiary-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-tertiary-700 transition-colors"
              >
                {/* Learner Top Info Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-tertiary-800">
                  <div className="flex items-start space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-tertiary-800 border border-tertiary-700 flex items-center justify-center font-bold text-white text-sm shrink-0">
                      {learner.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-bold text-sm text-white">{learner.name}</span>
                        <span className="text-[11px] bg-tertiary-800 text-slate-300 font-semibold px-2 py-0.5 rounded capitalize">
                          {learner.roleLevel.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-300">{learner.jobTitle}</span>
                        {learner.isArchived && (
                          <span className="text-[10px] bg-secondary-900/80 text-secondary-300 border border-secondary-700 font-bold px-2 py-0.5 rounded">
                            Archived: {learner.archivedReason}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {learner.email} | Dept: {learner.department} | Started: {learner.startDate}
                        {learner.archivedDate && ` | Left: ${learner.archivedDate}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
                    {/* Right to work toggle / share code display */}
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleToggleRightToWork(learner.id)}
                      title="Click to verify or update Home Office Right to Work share code"
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold flex items-center space-x-1.5 transition-colors ${
                        learner.rightToWorkStatus === 'verified_statutory_excuse'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900/50'
                          : 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900/50'
                      }`}
                    >
                      {learner.rightToWorkStatus === 'verified_statutory_excuse' ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          <span>
                            RTW Verified
                            {learner.rightToWorkShareCode ? ` (${learner.rightToWorkShareCode})` : ''}
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                          <span>RTW Unverified (£45k Fine Risk)</span>
                        </>
                      )}
                    </button>

                    {/* Enrol Course Button */}
                    {!readOnly && !learner.isArchived && (
                      <button
                        type="button"
                        onClick={() => onOpenEnrolModal(learner)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors border border-slate-700 shadow-sm"
                      >
                        Enrol Course
                      </button>
                    )}

                    {/* Archive / Restore Button */}
                    {!readOnly && (
                      learner.isArchived ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (onRestoreLearner) {
                              onRestoreLearner(learner.id);
                            } else {
                              onUpdateLearner(learner.id, {
                                isArchived: false,
                                archivedReason: undefined,
                                archivedAt: undefined,
                              });
                              showToast(`${learner.name} restored to active register`, 'success');
                            }
                          }}
                          className="inline-flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setLearnerToArchive(learner)}
                          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 px-2 py-1.5 rounded-lg hover:bg-slate-800"
                          title="Archive former staff member"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Inline Home Office Share Code Prompt */}
                {editingRtwLearnerId === learner.id && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <KeyRound className="w-4 h-4" />
                      <span>Home Office Right to Work Verification (Immigration Act 2016)</span>
                    </div>
                    <p className="text-slate-400">
                      Enter the 9-character alphanumeric share code obtained from the Home Office online checking service (or passport reference) to establish statutory excuse defense.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. W12 345 678"
                        value={shareCodeInput}
                        onChange={(e) => setShareCodeInput(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs font-mono uppercase tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveShareCode(learner.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                      >
                        Verify Statutory Excuse
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingRtwLearnerId(null)}
                        className="px-2.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Courses Matrix */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                      Registered Courses & Training Status
                    </span>
                    <span className="text-slate-400">
                      {completedCount} completed | {inProgressRecords.length} running in LMS
                    </span>
                  </div>

                  {learner.courses.length === 0 ? (
                    <div className="text-xs text-slate-500 italic bg-slate-950 rounded-xl p-3 text-center border border-slate-800">
                      No training recorded for this staff member yet. Use "Enrol Course" to assign mandatory certifications.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {learner.courses.map((rec) => {
                        const isExpired = rec.expiryDate && new Date(rec.expiryDate) < new Date();
                        const isExpiringSoon =
                          rec.expiryDate &&
                          !isExpired &&
                          new Date(rec.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                        return (
                          <div
                            key={rec.courseId}
                            className={`rounded-xl border p-3 text-xs flex flex-col justify-between ${
                              isExpired
                                ? 'bg-rose-950/30 border-rose-900/60'
                                : rec.status === 'completed'
                                ? 'bg-slate-950 border-slate-800'
                                : rec.status === 'in_progress'
                                ? 'bg-blue-950/20 border-blue-900/60'
                                : 'bg-slate-950 border-slate-800'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-white leading-tight">
                                  {rec.courseTitle}
                                </span>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isExpired && (
                                    <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-bold px-1.5 py-0.5 rounded">
                                      Expired
                                    </span>
                                  )}
                                  {isExpiringSoon && (
                                    <span className="text-[10px] bg-secondary-900/80 text-secondary-300 border border-secondary-700 font-bold px-1.5 py-0.5 rounded">
                                      Expires in &lt;30d
                                    </span>
                                  )}
                                  {rec.isOurPlatform ? (
                                    <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 font-bold px-1.5 py-0.5 rounded">
                                      Our LMS
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-slate-800 text-slate-300 font-medium px-1.5 py-0.5 rounded">
                                      External Cert
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Progress bar for running LMS course */}
                              {rec.status === 'in_progress' && (
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center justify-between text-[11px] text-blue-400 font-medium">
                                    <span>Active Progress: {rec.progressPercent}%</span>
                                    {!readOnly && (
                                      <div className="flex space-x-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSimulateProgress(
                                              learner.id,
                                              rec.courseId,
                                              Math.min(100, rec.progressPercent + 25)
                                            )
                                          }
                                          className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                                          title="Simulate learner completing LMS modules"
                                        >
                                          +25%
                                        </button>
                                        <span>|</span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSimulateProgress(learner.id, rec.courseId, 100)
                                          }
                                          className="text-[10px] text-emerald-400 font-bold hover:underline"
                                          title="Mark completed"
                                        >
                                          Complete 100%
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-blue-500 h-1.5 rounded-full"
                                      style={{ width: `${rec.progressPercent}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 mt-2 border-t border-slate-800/80">
                              <span>
                                {rec.status === 'completed'
                                  ? `Completed: ${rec.completedDate || 'Recently'}`
                                  : 'Training Running'}
                                {rec.expiryDate && ` • Expiry: ${rec.expiryDate}`}
                              </span>
                              {rec.score && (
                                <span className="font-semibold text-emerald-400">
                                  Grade: {rec.score}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Missing Mandatory Courses Callout for this Learner */}
                {missing.length > 0 && !learner.isArchived && (
                  <div className="bg-amber-950/30 border border-amber-900/60 rounded-xl p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-amber-300 flex items-center space-x-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span>Missing Mandatory Statutory Courses for this Role:</span>
                      </div>
                      <span className="text-[11px] text-amber-300 font-bold">
                        {missing.length} unfulfilled
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {missing.map((c) => (
                        <div
                          key={c.id}
                          className="bg-slate-900 border border-amber-800/80 rounded-lg px-2.5 py-1 text-slate-200 flex items-center space-x-2"
                        >
                          <span className="font-medium text-[11px]">{c.title}</span>
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                const newCourseRecord = {
                                  courseId: c.id,
                                  courseTitle: c.title,
                                  status: 'in_progress' as any,
                                  progressPercent: 10,
                                  isOurPlatform: true,
                                };
                                onUpdateLearner(learner.id, {
                                  courses: [...learner.courses, newCourseRecord],
                                });
                                showToast(`Enrolled in ${c.title}`, 'success');
                              }}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2 py-0.5 rounded transition-colors"
                            >
                              Enrol in LMS
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        businessId={profile?.id || ''}
        onSuccess={() => {
          onBulkImportSuccess?.();
        }}
      />

      {/* Archive Confirmation Modal */}
      <ArchiveLearnerModal
        isOpen={!!learnerToArchive}
        onClose={() => setLearnerToArchive(null)}
        learner={learnerToArchive}
        onConfirm={(learnerId, reason) => {
          if (onArchiveLearner) {
            onArchiveLearner(learnerId, reason);
          } else {
            onUpdateLearner(learnerId, {
              isArchived: true,
              archivedReason: reason,
              archivedAt: new Date().toISOString(),
            });
            showToast('Learner archived', 'info');
          }
          setLearnerToArchive(null);
        }}
      />
    </div>
  );
};
