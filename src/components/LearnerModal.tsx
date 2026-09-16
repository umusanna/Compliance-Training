import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck, KeyRound } from 'lucide-react';
import { Learner, RoleLevel, BusinessProfile } from '../types';

interface LearnerModalProps {
  profile: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (learner: Learner) => void;
  initialLearner?: Learner | null;
}

export const LearnerModal: React.FC<LearnerModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
  initialLearner,
}) => {
  const [name, setName] = useState(initialLearner?.name || '');
  const [email, setEmail] = useState(initialLearner?.email || '');
  const [roleLevel, setRoleLevel] = useState<RoleLevel>(initialLearner?.roleLevel || 'field_worker');
  const [jobTitle, setJobTitle] = useState(initialLearner?.jobTitle || '');
  const [department, setDepartment] = useState(initialLearner?.department || '');
  const [startDate, setStartDate] = useState(
    initialLearner?.startDate || new Date().toISOString().split('T')[0]
  );
  const [rightToWorkStatus, setRightToWorkStatus] = useState<
    'verified_statutory_excuse' | 'pending_verification'
  >(initialLearner?.rightToWorkStatus || 'verified_statutory_excuse');
  const [rightToWorkShareCode, setRightToWorkShareCode] = useState(
    initialLearner?.rightToWorkShareCode || ''
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const learner: Learner = {
      id: initialLearner?.id || `lrn-usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      roleLevel,
      jobTitle: jobTitle.trim() || 'Staff Member',
      department: department.trim() || 'Operations',
      startDate,
      rightToWorkStatus,
      rightToWorkShareCode: rightToWorkShareCode.trim().toUpperCase() || undefined,
      rightToWorkCheckDate:
        rightToWorkStatus === 'verified_statutory_excuse' ? startDate : undefined,
      courses: initialLearner?.courses || [],
    };

    onSave(learner);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-tertiary-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-tertiary-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-tertiary-800 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-tertiary-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {initialLearner ? 'Edit Learner Profile' : 'Register New Staff Member'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
            <input
              id="new-learner-name"
              type="text"
              required
              placeholder="e.g. Rachel Adams"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-tertiary-950 border border-tertiary-800 rounded-xl px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
            <input
              id="new-learner-email"
              type="email"
              required
              placeholder="e.g. r.adams@business.co.uk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-tertiary-950 border border-tertiary-800 rounded-xl px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Workforce Tier *</label>
              <select
                id="new-learner-role"
                value={roleLevel}
                onChange={(e) => setRoleLevel(e.target.value as RoleLevel)}
                className="w-full bg-tertiary-950 border border-tertiary-800 rounded-xl px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
              >
                <option value="manager" className="bg-tertiary-900">Manager / Director</option>
                <option value="supervisor" className="bg-tertiary-900">Supervisor / Lead</option>
                <option value="field_worker" className="bg-tertiary-900">Field / Frontline Staff</option>
                <option value="admin" className="bg-tertiary-900">Admin & Support</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Job Title</label>
              <input
                type="text"
                placeholder="e.g. Head of Kitchen"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full bg-tertiary-950 border border-tertiary-800 rounded-xl px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Department</label>
              <input
                type="text"
                placeholder="e.g. Operations"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-tertiary-950 border border-tertiary-800 rounded-xl px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-tertiary-950 border border-tertiary-800 rounded-xl px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-tertiary-800">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Home Office Right to Work Status
              </label>
              <select
                value={rightToWorkStatus}
                onChange={(e) =>
                  setRightToWorkStatus(
                    e.target.value as 'verified_statutory_excuse' | 'pending_verification'
                  )
                }
                className="w-full bg-tertiary-950 border border-tertiary-800 rounded-xl px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
              >
                <option value="verified_statutory_excuse" className="bg-tertiary-900">
                  Verified Statutory Excuse (Checked & Defended)
                </option>
                <option value="pending_verification" className="bg-tertiary-900">
                  Pending Verification (£45,000 Fine Risk Flagged)
                </option>
              </select>
            </div>

            {rightToWorkStatus === 'verified_statutory_excuse' && (
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Home Office Online Share Code (Optional)
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. W12 345 678"
                    value={rightToWorkShareCode}
                    onChange={(e) => setRightToWorkShareCode(e.target.value)}
                    className="w-full bg-tertiary-950 border border-tertiary-800 rounded-xl pl-8 pr-3 py-2 text-white font-mono uppercase focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-tertiary-800 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-tertiary-700 text-slate-300 font-medium hover:bg-tertiary-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-new-learner-btn"
              type="submit"
              className="px-4 py-2 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-500 transition-colors shadow-sm"
            >
              Save Learner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
