import React, { useState } from 'react';
import { X, GraduationCap, Award, Calendar, CheckCircle2 } from 'lucide-react';
import { Learner, Course, LearnerCourseRecord, BusinessProfile } from '../types';
import { COURSES_CATALOG } from '../data/regulatoryStandards';

interface EnrolCourseModalProps {
  learner: Learner;
  profile: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveRecord: (record: LearnerCourseRecord) => void;
}

export const EnrolCourseModal: React.FC<EnrolCourseModalProps> = ({
  learner,
  profile,
  isOpen,
  onClose,
  onSaveRecord,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(COURSES_CATALOG[0]?.id || '');
  const [enrollmentType, setEnrollmentType] = useState<'our_lms' | 'external'>('our_lms');
  const [status, setStatus] = useState<'in_progress' | 'completed'>('in_progress');
  const [progressPercent, setProgressPercent] = useState<number>(25);
  const [completedDate, setCompletedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [certificateNumber, setCertificateNumber] = useState<string>('');
  const [score, setScore] = useState<number>(90);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const course = COURSES_CATALOG.find((c) => c.id === selectedCourseId);
    if (!course) return;

    const isLms = enrollmentType === 'our_lms';
    const finalStatus = isLms ? status : 'completed';
    const finalProgress = finalStatus === 'completed' ? 100 : progressPercent;

    // Calculate expiry date if completed
    let expiryDate: string | undefined = undefined;
    if (finalStatus === 'completed' && course.renewalMonths > 0) {
      const comp = new Date(completedDate);
      comp.setMonth(comp.getMonth() + course.renewalMonths);
      expiryDate = comp.toISOString().split('T')[0];
    }

    const record: LearnerCourseRecord = {
      courseId: course.id,
      courseTitle: course.title,
      status: finalStatus,
      progressPercent: finalProgress,
      completedDate: finalStatus === 'completed' ? completedDate : undefined,
      expiryDate: expiryDate,
      certificateNumber: certificateNumber.trim() || undefined,
      score: finalStatus === 'completed' ? score : undefined,
      isOurPlatform: isLms,
    };

    onSaveRecord(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-800 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Enrol Learner in Course</h3>
              <p className="text-xs text-slate-400">
                Assigning to: <strong className="text-white">{learner.name}</strong> ({learner.roleLevel.replace('_', ' ')})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          {/* Training Provider Source Toggle */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Course Source / Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEnrollmentType('our_lms');
                  setStatus('in_progress');
                }}
                className={`py-2.5 px-3 rounded-xl border text-left flex flex-col transition-colors ${
                  enrollmentType === 'our_lms'
                    ? 'border-blue-500 bg-blue-950/40 text-white font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs">Our LMS Platform</span>
                <span className="text-[10px] font-normal text-slate-400">
                  Enrol now with live progress tracking
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEnrollmentType('external');
                  setStatus('completed');
                }}
                className={`py-2.5 px-3 rounded-xl border text-left flex flex-col transition-colors ${
                  enrollmentType === 'external'
                    ? 'border-blue-500 bg-blue-950/40 text-white font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs">External Certificate</span>
                <span className="text-[10px] font-normal text-slate-400">
                  Record historic prior certificate
                </span>
              </button>
            </div>
          </div>

          {/* Select Course */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Select Training Course *
            </label>
            <select
              id="select-course-dropdown"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              {COURSES_CATALOG.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900">
                  [{c.code}] {c.title} ({c.durationHours}h - {c.accreditation})
                </option>
              ))}
            </select>
          </div>

          {/* If LMS Mode: Progress & Status */}
          {enrollmentType === 'our_lms' ? (
            <div className="space-y-3 bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Initial Status in Our LMS
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="lms-status"
                      checked={status === 'in_progress'}
                      onChange={() => setStatus('in_progress')}
                      className="text-blue-500"
                    />
                    <span>Running / In Progress</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="lms-status"
                      checked={status === 'completed'}
                      onChange={() => setStatus('completed')}
                      className="text-blue-500"
                    />
                    <span>Completed (100%)</span>
                  </label>
                </div>
              </div>

              {status === 'in_progress' && (
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Active LMS Progress:</span>
                    <strong className="text-blue-400">{progressPercent}%</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    step="5"
                    value={progressPercent}
                    onChange={(e) => setProgressPercent(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <span className="text-[10px] text-slate-500">
                    Learner will access interactive modules directly in our portal.
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* External Cert Details */
            <div className="space-y-3 bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Date Completed
                  </label>
                  <input
                    type="date"
                    value={completedDate}
                    onChange={(e) => setCompletedDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Exam Grade (%)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value) || 80)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Certificate Ref / Accreditation ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CIEH-78921-2024"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              id="confirm-enrol-btn"
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-sm"
            >
              Confirm Enrollment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
