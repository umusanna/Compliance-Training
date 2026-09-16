import React, { useState } from 'react';
import { Archive, AlertCircle, X, Check } from 'lucide-react';
import { Learner } from '../../types';

interface ArchiveLearnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (learnerId: string, reason: string) => void;
  learner: Learner | null;
}

export const ArchiveLearnerModal: React.FC<ArchiveLearnerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  learner,
}) => {
  const [reason, setReason] = useState('Resigned / Contract Ended');
  const [customNotes, setCustomNotes] = useState('');

  if (!isOpen || !learner) return null;

  const handleConfirm = () => {
    const finalReason = customNotes ? `${reason}: ${customNotes}` : reason;
    onConfirm(learner.id, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl text-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Archive Former Staff Member</h2>
              <p className="text-xs text-slate-400">{learner.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-slate-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Archiving <span className="font-semibold text-white">{learner.name}</span> removes them from live mandatory audit scoring and headcounts, but safely retains all past training completion logs for historical statutory inspection.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason for Departure / Archival *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Resigned / Contract Ended">Resigned / Contract Ended</option>
              <option value="Transferred to Other Branch">Transferred to Other Branch</option>
              <option value="Redundancy / Position Closed">Redundancy / Position Closed</option>
              <option value="Sabbatical / Career Break">Sabbatical / Career Break</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Additional Notes (Optional)
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Last working day 31 August 2026"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors shadow"
          >
            <Check className="w-4 h-4" />
            Confirm Archival
          </button>
        </div>
      </div>
    </div>
  );
};
