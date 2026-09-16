/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BusinessProfile,
  Learner,
  AuditChecklistItem,
  Course,
  LearnerCourseRecord,
} from './types';
import { SAMPLE_BUSINESS_PRESETS } from './data/sampleProfiles';
import {
  UNIVERSAL_CHECKLIST_ITEMS,
  SECTOR_SPECIFIC_CHECKLISTS,
} from './data/initialChecklists';
import { COURSES_CATALOG, SECTOR_METADATA } from './data/regulatoryStandards';
import { runComplianceAudit } from './utils/complianceEngine';

import { Header } from './components/Header';
import { AuditOverview } from './components/AuditOverview';
import { BusinessProfileView } from './components/BusinessProfileView';
import { ManagerChecklistsView } from './components/ManagerChecklistsView';
import { LearnersRegisterView } from './components/LearnersRegisterView';
import { TrainingSolutionsView } from './components/TrainingSolutionsView';
import { LearnerModal } from './components/LearnerModal';
import { EnrolCourseModal } from './components/EnrolCourseModal';
import { AuditReportModal } from './components/AuditReportModal';

export default function App() {
  const initialPreset = SAMPLE_BUSINESS_PRESETS.food_hospitality;

  // Primary Application State
  const [profile, setProfile] = useState<BusinessProfile>(initialPreset.profile);
  const [learners, setLearners] = useState<Learner[]>(initialPreset.learners);
  const [checklists, setChecklists] = useState<AuditChecklistItem[]>([
    ...UNIVERSAL_CHECKLIST_ITEMS,
    ...(SECTOR_SPECIFIC_CHECKLISTS.food_hospitality || []),
  ]);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'business' | 'checklists' | 'learners' | 'solutions'
  >('overview');

  // Modal States
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLearnerModal, setShowLearnerModal] = useState(false);
  const [editingLearner, setEditingLearner] = useState<Learner | null>(null);
  const [selectedLearnerForEnrol, setSelectedLearnerForEnrol] = useState<Learner | null>(null);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Switch Business Preset
  const handleSelectPreset = (presetKey: string) => {
    const preset = SAMPLE_BUSINESS_PRESETS[presetKey];
    if (!preset) return;

    setProfile(preset.profile);
    setLearners(preset.learners);

    // Merge universal checklists with this sector's checklists
    const sectorItems = SECTOR_SPECIFIC_CHECKLISTS[preset.profile.sector] || [];
    setChecklists([...UNIVERSAL_CHECKLIST_ITEMS, ...sectorItems]);

    triggerToast(`Loaded preset for ${preset.profile.name} (${SECTOR_METADATA[preset.profile.sector].shortName})`);
  };

  // Update Profile
  const handleUpdateProfile = (updated: Partial<BusinessProfile>) => {
    const newProfile = { ...profile, ...updated };
    setProfile(newProfile);

    // If sector changed, refresh sector-specific checklists
    if (updated.sector && updated.sector !== profile.sector) {
      const sectorItems = SECTOR_SPECIFIC_CHECKLISTS[updated.sector] || [];
      const nonSectorItems = checklists.filter((c) => c.category !== 'sector_specific');
      setChecklists([...nonSectorItems, ...sectorItems]);
      triggerToast(`Switched sector to ${SECTOR_METADATA[updated.sector].name}. Regulatory audit standards updated.`);
    }
  };

  // Checklist updates
  const handleUpdateChecklistItem = (id: string, updated: Partial<AuditChecklistItem>) => {
    setChecklists((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const handleAddChecklistItem = (newItem: AuditChecklistItem) => {
    setChecklists((prev) => [newItem, ...prev]);
    triggerToast(`Added checklist requirement: ${newItem.title}`);
  };

  // Learner operations
  const handleSaveLearner = (learner: Learner) => {
    setLearners((prev) => {
      const exists = prev.some((l) => l.id === learner.id);
      if (exists) {
        return prev.map((l) => (l.id === learner.id ? learner : l));
      } else {
        return [learner, ...prev];
      }
    });
    triggerToast(`Saved learner ${learner.name} (${learner.jobTitle})`);
  };

  const handleUpdateLearner = (id: string, updated: Partial<Learner>) => {
    setLearners((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updated } : l))
    );
  };

  const handleSaveLearnerCourseRecord = (record: LearnerCourseRecord) => {
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

    triggerToast(`Enrolled ${selectedLearnerForEnrol.name} in ${record.courseTitle}`);
  };

  // Batch Enrol Action for Course
  const handleBatchEnrolCourse = (course: Course, targetLearnerIds: string[]) => {
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

    triggerToast(`Enrolled ${targetLearnerIds.length} employees in ${course.title} via our LMS`);
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

  // Audit calculation engine
  const report = useMemo(() => {
    return runComplianceAudit(profile, checklists, learners);
  }, [profile, checklists, learners]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2 animate-bounce">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Primary Header */}
      <Header
        currentProfile={profile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectPreset={handleSelectPreset}
        onOpenReport={() => setShowReportModal(true)}
        compliancePercent={report.overallScorePercent}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <AuditOverview
            report={report}
            profile={profile}
            onNavigateToTab={setActiveTab}
            onQuickEnrolLearners={handleQuickEnrolFromOverview}
          />
        )}

        {activeTab === 'business' && (
          <BusinessProfileView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            registeredLearnerCount={learners.length}
          />
        )}

        {activeTab === 'checklists' && (
          <ManagerChecklistsView
            checklists={checklists}
            onUpdateItem={handleUpdateChecklistItem}
            onAddItem={handleAddChecklistItem}
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
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-700">
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
    </div>
  );
}
