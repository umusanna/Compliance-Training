import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Award,
  Users,
  Search,
  Filter,
  ArrowRight,
  BookOpen,
  Calendar,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { BusinessProfile, Course, Learner } from '../types';
import { COURSES_CATALOG } from '../data/regulatoryStandards';

interface TrainingSolutionsViewProps {
  learners: Learner[];
  profile: BusinessProfile;
  onEnrolLearnerInCourse: (learnerId: string, course: Course) => void;
  onBatchEnrolCourse: (course: Course, targetLearnerIds: string[]) => void;
  readOnly?: boolean;
}

export const TrainingSolutionsView: React.FC<TrainingSolutionsViewProps> = ({
  learners = [],
  profile,
  onEnrolLearnerInCourse,
  onBatchEnrolCourse,
  readOnly = false,
}) => {
  const [selectedSector, setSelectedSector] = useState<string>(profile?.sector || 'general_business');
  const [searchQuery, setSearchQuery] = useState('');

  // Determine non-compliant learners for each course (exclude archived staff)
  const getLearnersNeedingCourse = (course: Course): Learner[] => {
    return (learners || []).filter((learner) => {
      if (learner.isArchived) return false;
      if (!course.targetRoles.includes(learner.roleLevel)) return false;

      const hasCourse = (learner.courses || []).some(
        (c) => c.courseId === course.id && (c.status === 'completed' || c.status === 'in_progress')
      );
      return !hasCourse;
    });
  };

  const filteredCourses = COURSES_CATALOG.filter((course) => {
    if (selectedSector !== 'all') {
      if (course.sector !== 'universal' && course.sector !== selectedSector) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.code.toLowerCase().includes(q) ||
        course.regulatoryDriver.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-tertiary-900 border border-tertiary-800 rounded-2xl p-5 md:p-6 shadow-sm text-slate-100">
        <div className="flex items-center space-x-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary-600/20 border border-primary-500/40 text-primary-400 flex items-center justify-center font-bold text-lg">
            4
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Our Employee Training Solutions Catalog
            </h2>
            <p className="text-xs text-slate-400">
              Turnkey accredited training courses to resolve workforce compliance gaps. Completed modules automatically update audit readiness scores in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-tertiary-900 border border-tertiary-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-courses"
            type="text"
            placeholder="Search training modules, regulators, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-tertiary-950 border border-tertiary-800 rounded-xl pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-1 bg-tertiary-950 border border-tertiary-800 rounded-xl px-2.5 py-1">
            <Filter className="h-3 w-3 text-slate-400" />
            <span className="text-slate-500 text-[11px]">Sector Focus:</span>
            <select
              id="course-sector-filter"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-tertiary-900">All Sectors & Universal</option>
              <option value="food_hospitality" className="bg-tertiary-900">Food & Hospitality (FSA)</option>
              <option value="health_social_care" className="bg-tertiary-900">Health & Social Care (CQC)</option>
              <option value="financial_services" className="bg-tertiary-900">Financial Services (FCA)</option>
              <option value="construction" className="bg-tertiary-900">Construction (HSE CDM)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCourses.map((course) => {
          const needingLearners = getLearnersNeedingCourse(course);
          const hasGapInCurrentBusiness = needingLearners.length > 0;

          return (
            <div
              key={course.id}
              className={`bg-tertiary-900 border rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-shadow hover:border-tertiary-700 ${
                hasGapInCurrentBusiness
                  ? 'border-secondary-500/50 bg-secondary-950/20'
                  : 'border-tertiary-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {course.code}
                      </span>
                      <span className="text-[10px] bg-primary-950 text-primary-300 border border-primary-800 font-bold px-1.5 py-0.5 rounded">
                        {course.accreditation}
                      </span>
                      {course.sector === 'universal' && (
                        <span className="text-[10px] bg-tertiary-800 text-slate-300 font-medium px-1.5 py-0.5 rounded">
                          Universal Baseline
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {course.title}
                    </h3>
                  </div>

                  {/* Duration pill */}
                  <div className="flex items-center space-x-1 text-slate-400 text-xs shrink-0 bg-tertiary-950 border border-tertiary-800 px-2.5 py-1 rounded-lg">
                    <Clock className="h-3 w-3" />
                    <span>{course.durationHours} hrs</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{course.description}</p>

                {/* Plain language guidance */}
                {course.plainLanguageHelp && (
                  <div className="bg-tertiary-950/70 border border-tertiary-800 rounded-xl p-2.5 text-xs text-slate-300 flex items-start gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">{course.plainLanguageHelp}</span>
                  </div>
                )}

                {/* Statutory Driver */}
                <div className="bg-tertiary-950 rounded-xl p-3 text-xs border border-tertiary-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Legal & Audit Requirement
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      {course.renewalMonths === 0 ? 'Permanent Certification' : `Renews every ${course.renewalMonths} months`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium">
                    {course.regulatoryDriver}
                  </div>
                  {course.sourceUrl && (
                    <div className="pt-1">
                      <a
                        href={course.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sky-400 hover:underline text-[10px]"
                      >
                        <span>Official Guidance Document</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Target roles badges */}
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <span className="text-[11px] font-semibold text-slate-400">Target Roles:</span>
                  <div className="flex flex-wrap gap-1">
                    {course.targetRoles.map((r) => (
                      <span
                        key={r}
                        className="bg-tertiary-800 text-slate-300 font-medium text-[10px] px-2 py-0.5 rounded capitalize"
                      >
                        {r.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions & Learner Gaps */}
              <div className="mt-4 pt-3 border-t border-tertiary-800 flex items-center justify-between gap-2">
                {hasGapInCurrentBusiness ? (
                  <div className="text-xs text-amber-300 font-semibold flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>
                      {needingLearners.length} staff member{needingLearners.length > 1 ? 's' : ''} require this course
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400 font-medium flex items-center space-x-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>All eligible staff completed or enrolled</span>
                  </div>
                )}

                {hasGapInCurrentBusiness && !readOnly && (
                  <button
                    type="button"
                    onClick={() =>
                      onBatchEnrolCourse(
                        course,
                        needingLearners.map((l) => l.id)
                      )
                    }
                    className="bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors shadow-sm shrink-0"
                  >
                    Enrol All {needingLearners.length} Staff
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
