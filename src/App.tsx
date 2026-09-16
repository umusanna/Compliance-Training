/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  BusinessProfile,
  Learner,
  AuditChecklistItem,
  Course,
  LearnerCourseRecord,
  UserRole,
} from './types';
import { SAMPLE_BUSINESS_PRESETS } from './data/sampleProfiles';
import {
  UNIVERSAL_CHECKLIST_ITEMS,
  SECTOR_SPECIFIC_CHECKLISTS,
} from './data/initialChecklists';
import { COURSES_CATALOG, SECTOR_METADATA } from './data/regulatoryStandards';
import { runComplianceAudit } from './utils/complianceEngine';
import { api } from './services/api';
import { useToast } from './context/ToastContext';

import { Header } from './components/Header';
import { AuditOverview } from './components/AuditOverview';
import { BusinessProfileView } from './components/BusinessProfileView';
import { ManagerChecklistsView } from './components/ManagerChecklistsView';
import { LearnersRegisterView } from './components/LearnersRegisterView';
import { TrainingSolutionsView } from './components/TrainingSolutionsView';
import { AdminPortfolioView } from './components/AdminPortfolioView';
import { AdminRegulatoryView } from './components/AdminRegulatoryView';
import { LearnerModal } from './components/LearnerModal';
import { EnrolCourseModal } from './components/EnrolCourseModal';
import { AuditReportModal } from './components/AuditReportModal';
import { GuidedOnboardingModal } from './components/modals/GuidedOnboardingModal';

export default function App() {
  const { showToast } = useToast();
  const initialPreset = SAMPLE_BUSINESS_PRESETS.food_hospitality;

  // Primary Application State
  const [profile, setProfile] = useState<BusinessProfile>(initialPreset.profile);
  const [learners, setLearners] = useState<Learner[]>(initialPreset.learners);
  const [checklists, setChecklists] = useState<AuditChecklistItem[]>([
    ...UNIVERSAL_CHECKLIST_ITEMS,
    ...(SECTOR_SPECIFIC_CHECKLISTS.food_hospitality || []),
  ]);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('business_manager');

  const [activeTab, setActiveTab] = useState<
    'overview' | 'business' | 'checklists' | 'learners' | 'solutions' | 'portfolio' | 'regulatory'
  >('overview');

  // Modal States
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLearnerModal, setShowLearnerModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [editingLearner, setEditingLearner] = useState<Learner | null>(null);
  const [selectedLearnerForEnrol, setSelectedLearnerForEnrol] = useState<Learner | null>(null);

  // Initialize data from SQLite backend
  useEffect(() => {
    const initData = async () => {
      try {
        let list = await api.fetchBusinesses();
        if (!Array.isArray(list) || list.length === 0) {
          await api.resetDemoDatabase();
          list = await api.fetchBusinesses();
        }
        if (Array.isArray(list) && list.length > 0) {
          setBusinesses(list);
          const savedId = localStorage.getItem('est_active_business_id');
          const targetBiz = list.find((b) => b.id === savedId) || list[0];
          setProfile(targetBiz);
          localStorage.setItem('est_active_business_id', targetBiz.id);
          try {
            const [fetchedLearners, fetchedChecklists] = await Promise.all([
              api.fetchLearners(targetBiz.id),
              api.fetchChecklists(targetBiz.id),
            ]);
            setLearners(Array.isArray(fetchedLearners) ? fetchedLearners : []);
            setChecklists(Array.isArray(fetchedChecklists) ? fetchedChecklists : []);
          } catch (err) {
            console.warn('Could not load learners/checklists from backend', err);
          }
        }
      } catch (err) {
        console.warn('Could not fetch businesses from backend', err);
      }
    };
    initData();
  }, []);

  // Switch Business from SQLite database
  const handleSelectBusinessId = async (id: string) => {
    try {
      const [biz, bLearners, bChecklists] = await Promise.all([
        api.fetchBusiness(id),
        api.fetchLearners(id),
        api.fetchChecklists(id),
      ]);
      setProfile(biz);
      setLearners(Array.isArray(bLearners) ? bLearners : []);
      setChecklists(Array.isArray(bChecklists) ? bChecklists : []);
      localStorage.setItem('est_active_business_id', id);
      showToast(`Switched client to ${biz.name}`, 'info');
    } catch (err) {
      console.error('Failed to switch business', err);
      showToast('Could not load client business data', 'error');
    }
  };

  // Switch Business Preset
  const handleSelectPreset = async (presetKey: string) => {
    const preset = SAMPLE_BUSINESS_PRESETS[presetKey];
    if (!preset) return;

    // Check if a business matching this preset sector already exists in SQLite
    const existing = businesses.find((b) => b.sector === presetKey);
    if (existing) {
      await handleSelectBusinessId(existing.id);
      showToast(`Loaded existing client ${existing.name} (${SECTOR_METADATA[existing.sector].shortName})`, 'info');
      return;
    }

    try {
      const created = await api.createBusiness({
        ...preset.profile,
        id: preset.profile.id,
      });
      for (const l of preset.learners) {
        await api.createLearner(created.id, l);
      }
      const updatedList = await api.fetchBusinesses();
      setBusinesses(updatedList);
      await handleSelectBusinessId(created.id);
      showToast(`Created & loaded ${preset.profile.name} in database`, 'success');
    } catch (err) {
      console.error('Failed to persist preset business to database', err);
      setProfile(preset.profile);
      setLearners(preset.learners);
      const sectorItems = SECTOR_SPECIFIC_CHECKLISTS[preset.profile.sector] || [];
      setChecklists([...UNIVERSAL_CHECKLIST_ITEMS, ...sectorItems]);
      showToast(`Loaded preset for ${preset.profile.name}`, 'info');
    }
  };

  // Update Profile
  const handleUpdateProfile = async (updated: Partial<BusinessProfile>) => {
    const newProfile = { ...profile, ...updated };
    setProfile(newProfile);

    if (profile.id) {
      try {
        await api.updateBusiness(profile.id, updated);
      } catch (err) {
        console.warn('Failed to update business on server', err);
      }
    }

    // If sector changed, refresh sector-specific checklists
    if (updated.sector && updated.sector !== profile.sector) {
      try {
        const refreshedChecklists = await api.fetchChecklists(profile.id);
        if (Array.isArray(refreshedChecklists) && refreshedChecklists.length > 0) {
          setChecklists(refreshedChecklists);
        } else {
          const sectorItems = SECTOR_SPECIFIC_CHECKLISTS[updated.sector] || [];
          const nonSectorItems = checklists.filter((c) => c.category !== 'sector_specific');
          setChecklists([...nonSectorItems, ...sectorItems]);
        }
      } catch {
        const sectorItems = SECTOR_SPECIFIC_CHECKLISTS[updated.sector] || [];
        const nonSectorItems = checklists.filter((c) => c.category !== 'sector_specific');
        setChecklists([...nonSectorItems, ...sectorItems]);
      }
      showToast(`Switched sector to ${SECTOR_METADATA[updated.sector].name}. Regulatory audit standards updated.`, 'info');
    } else {
      showToast('Business profile updated successfully', 'success');
    }
  };

  // Checklist updates
  const handleUpdateChecklistItem = async (id: string, updated: Partial<AuditChecklistItem>) => {
    setChecklists((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
    if (profile.id) {
      try {
        await api.updateChecklist(profile.id, id, updated);
      } catch (err) {
        console.warn('Failed to persist checklist update', err);
      }
    }
  };

  const handleAddChecklistItem = async (newItem: AuditChecklistItem) => {
    setChecklists((prev) => [newItem, ...prev]);
    if (profile?.id) {
      try {
        await api.createChecklistItem(profile.id, newItem);
      } catch (err) {
        console.warn('Failed to persist checklist item', err);
      }
    }
    showToast(`Added checklist requirement: ${newItem.title}`, 'success');
  };

  // Learner operations
  const handleSaveLearner = async (learner: Learner) => {
    const exists = learners.some((l) => l.id === learner.id);
    setLearners((prev) => {
      if (exists) {
        return prev.map((l) => (l.id === learner.id ? learner : l));
      } else {
        return [learner, ...prev];
      }
    });

    if (profile.id) {
      try {
        if (exists) {
          await api.updateLearner(profile.id, learner.id, learner);
        } else {
          await api.createLearner(profile.id, learner);
        }
      } catch (err) {
        console.warn('Failed to persist learner on server', err);
      }
    }
    showToast(`Saved learner ${learner.name} (${learner.jobTitle})`, 'success');
  };

  const handleUpdateLearner = async (id: string, updated: Partial<Learner>) => {
    setLearners((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updated } : l))
    );
    if (profile.id) {
      try {
        await api.updateLearner(profile.id, id, updated);
      } catch (err) {
        console.warn('Failed to update learner on server', err);
      }
    }
  };

  const handleArchiveLearner = async (learnerId: string, reason: string) => {
    if (profile.id) {
      try {
        await api.archiveLearner(profile.id, learnerId, reason);
      } catch (err) {
        console.warn('Failed to archive learner on server', err);
      }
    }
    setLearners((prev) =>
      prev.map((l) =>
        l.id === learnerId
          ? {
              ...l,
              isArchived: true,
              archivedReason: reason,
              archivedAt: new Date().toISOString(),
            }
          : l
      )
    );
    showToast('Learner archived', 'info');
  };

  const handleRestoreLearner = async (learnerId: string) => {
    if (profile.id) {
      try {
        await api.restoreLearner(profile.id, learnerId);
      } catch (err) {
        console.warn('Failed to restore learner on server', err);
      }
    }
    setLearners((prev) =>
      prev.map((l) =>
        l.id === learnerId
          ? { ...l, isArchived: false, archivedReason: undefined, archivedAt: undefined }
          : l
      )
    );
    showToast('Learner restored to active staff', 'success');
  };

  const handleBulkImportSuccess = async () => {
    if (profile.id) {
      try {
        const updatedLearners = await api.fetchLearners(profile.id);
        setLearners(updatedLearners);
        showToast('Learner records reloaded from database', 'info');
      } catch (err) {
        console.warn('Failed to refresh learners after import', err);
      }
    }
  };

  const handleSaveLearnerCourseRecord = async (record: LearnerCourseRecord) => {
    if (!selectedLearnerForEnrol) return;
    const learnerId = selectedLearnerForEnrol.id;

    setLearners((prev) =>
      prev.map((l) => {
        if (l.id === learnerId) {
          const filtered = l.courses.filter((c) => c.courseId !== record.courseId);
          return {
            ...l,
            courses: [...filtered, record],
          };
        }
        return l;
      })
    );

    if (profile.id) {
      try {
        await api.enrolCourse(profile.id, learnerId, {
          courseId: record.courseId,
          courseTitle: record.courseTitle,
          status: record.status,
          progressPercent: record.progressPercent,
          completedDate: record.completedDate,
          expiryDate: record.expiryDate,
          score: record.score,
        });
      } catch (err) {
        console.warn('Failed to persist course enrollment', err);
      }
    }

    showToast(`Enrolled ${selectedLearnerForEnrol.name} in ${record.courseTitle}`, 'success');
  };

  // Batch Enrol Action for Course
  const handleBatchEnrolCourse = async (course: Course, targetLearnerIds: string[]) => {
    setLearners((prev) =>
      prev.map((l) => {
        if (targetLearnerIds.includes(l.id)) {
          const alreadyHas = l.courses.some(
            (c) => c.courseId === course.id && c.status === 'completed'
          );
          if (alreadyHas) return l;

          const newRecord: LearnerCourseRecord = {
            courseId: course.id,
            courseTitle: course.title,
            status: 'in_progress',
            progressPercent: 15,
            isOurPlatform: true,
          };
          const filtered = l.courses.filter((c) => c.courseId !== course.id);
          return {
            ...l,
            courses: [...filtered, newRecord],
          };
        }
        return l;
      })
    );

    if (profile.id) {
      for (const lid of targetLearnerIds) {
        try {
          await api.enrolCourse(profile.id, lid, {
            courseId: course.id,
            courseTitle: course.title,
            status: 'in_progress',
            progressPercent: 15,
          });
        } catch {
          // ignore individual error
        }
      }
    }

    showToast(`Enrolled ${targetLearnerIds.length} employees in ${course.title} via our LMS`, 'success');
  };

  // Quick enrol from Overview
  const handleQuickEnrolFromOverview = (courseId: string) => {
    const course = COURSES_CATALOG.find((c) => c.id === courseId);
    if (!course) return;

    // Find learners who need it
    const targetLearners = learners.filter((l) => {
      if (!course.targetRoles.includes(l.roleLevel)) return false;
      return !l.courses.some(
        (c) => c.courseId === course.id && (c.status === 'completed' || c.status === 'in_progress')
      );
    });

    handleBatchEnrolCourse(
      course,
      targetLearners.map((l) => l.id)
    );
  };

  // Role Switcher
  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'admin') {
      setActiveTab('portfolio');
    } else if (activeTab === 'portfolio' || activeTab === 'regulatory') {
      setActiveTab('overview');
    }
    showToast(
      `Switched to ${
        newRole === 'admin'
          ? 'Training Provider Admin'
          : newRole === 'viewer'
          ? 'Read-Only Auditor'
          : 'Business Manager'
      }`,
      'info'
    );
  };

  // Reset Demo Database
  const handleResetDemo = async () => {
    try {
      await api.resetDemoDatabase();
      const list = await api.fetchBusinesses();
      setBusinesses(list);
      if (list.length > 0) {
        await handleSelectBusinessId(list[0].id);
      }
      showToast('Database reset to default seed state', 'success');
    } catch (err) {
      showToast('Failed to reset demo database', 'error');
    }
  };

  // Guided Onboarding Complete
  const handleCompleteOnboarding = async (profileData: Partial<BusinessProfile>) => {
    try {
      const res = await api.createBusiness({
        ...profileData,
        onboardingCompleted: true,
      });
      const newBizId = res.id;
      const list = await api.fetchBusinesses();
      setBusinesses(list);
      await handleSelectBusinessId(newBizId);
      setShowOnboardingModal(false);
      showToast('Setup wizard complete: Business profile and statutory framework configured in database.', 'success');
    } catch (err) {
      console.error('Failed to complete onboarding', err);
      showToast('Failed to save onboarded business', 'error');
    }
  };

  // Audit calculation engine
  const report = useMemo(() => {
    return runComplianceAudit(profile, checklists, learners);
  }, [profile, checklists, learners]);

  const isReadOnly = currentRole === 'viewer';

  return (
    <div className="min-h-screen bg-tertiary-950 text-slate-100 flex flex-col font-sans">
      {/* Primary Header */}
      <Header
        currentProfile={profile}
        businesses={businesses}
        onSelectBusinessId={handleSelectBusinessId}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectPreset={handleSelectPreset}
        onOpenReport={() => setShowReportModal(true)}
        onOpenOnboarding={() => setShowOnboardingModal(true)}
        onResetDemo={handleResetDemo}
        compliancePercent={report.overallScorePercent}
        currentRole={currentRole}
        onChangeRole={handleRoleChange}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'portfolio' && (
          <AdminPortfolioView
            onSelectBusiness={(bizId) => {
              handleSelectBusinessId(bizId);
              setActiveTab('overview');
            }}
          />
        )}

        {activeTab === 'regulatory' && <AdminRegulatoryView />}

        {activeTab === 'overview' && (
          <AuditOverview
            report={report}
            profile={profile}
            onNavigateToTab={setActiveTab}
            onQuickEnrolLearners={handleQuickEnrolFromOverview}
            readOnly={isReadOnly}
          />
        )}

        {activeTab === 'business' && (
          <BusinessProfileView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            registeredLearnerCount={learners.length}
            readOnly={isReadOnly}
          />
        )}

        {activeTab === 'checklists' && (
          <ManagerChecklistsView
            checklists={checklists}
            onUpdateItem={handleUpdateChecklistItem}
            onAddItem={handleAddChecklistItem}
            readOnly={isReadOnly}
          />
        )}

        {activeTab === 'learners' && (
          <LearnersRegisterView
            learners={learners}
            profile={profile}
            onAddLearner={handleSaveLearner}
            onUpdateLearner={handleUpdateLearner}
            onOpenEnrolModal={(learner) => {
              setSelectedLearnerForEnrol(learner);
            }}
            onOpenAddModal={() => {
              setEditingLearner(null);
              setShowLearnerModal(true);
            }}
            onBulkImportSuccess={handleBulkImportSuccess}
            onArchiveLearner={handleArchiveLearner}
            onRestoreLearner={handleRestoreLearner}
            readOnly={isReadOnly}
          />
        )}

        {activeTab === 'solutions' && (
          <TrainingSolutionsView
            learners={learners}
            profile={profile}
            onEnrolLearnerInCourse={(learnerId, course) =>
              handleBatchEnrolCourse(course, [learnerId])
            }
            onBatchEnrolCourse={handleBatchEnrolCourse}
            readOnly={isReadOnly}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-tertiary-900 border-t border-tertiary-800 py-6 text-xs text-slate-400 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-200">
              UK Compliance Status Checker & Audit Preparation System
            </span>
            <span className="mx-2">•</span>
            <span>September 2026 Regulatory Data</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>FSA FHRS Brand Standard</span>
            <span>•</span>
            <span>CQC 2026 Framework</span>
            <span>•</span>
            <span>FCA SM&CR & CASS 15</span>
            <span>•</span>
            <span>HSE CDM 2015 & Border Security Act 2025</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LearnerModal
        profile={profile}
        isOpen={showLearnerModal}
        onClose={() => {
          setShowLearnerModal(false);
          setEditingLearner(null);
        }}
        onSave={handleSaveLearner}
        initialLearner={editingLearner}
      />

      {selectedLearnerForEnrol && (
        <EnrolCourseModal
          learner={selectedLearnerForEnrol}
          profile={profile}
          isOpen={!!selectedLearnerForEnrol}
          onClose={() => setSelectedLearnerForEnrol(null)}
          onSaveRecord={handleSaveLearnerCourseRecord}
        />
      )}

      <AuditReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        profile={profile}
        report={report}
        checklists={checklists}
        learners={learners}
      />

      <GuidedOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={handleCompleteOnboarding}
        currentProfile={profile}
      />
    </div>
  );
}
