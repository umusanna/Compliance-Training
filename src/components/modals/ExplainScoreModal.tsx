import React from 'react';
import { ShieldCheck, BookOpen, FileCheck, UserCheck, AlertTriangle, ExternalLink, X, Scale } from 'lucide-react';
import { ComplianceAuditReport } from '../../types';

interface ExplainScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ComplianceAuditReport;
}

export const ExplainScoreModal: React.FC<ExplainScoreModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">How Your Compliance Score is Calculated</h2>
              <p className="text-xs text-slate-400">
                Deterministic, 100% rule-based audit scoring model aligned with UK statutory inspection frameworks
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Overview Banner */}
          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white">Overall Audit Readiness Score:</span>
              <span className="text-xl font-extrabold text-emerald-400">{report.overallScorePercent}%</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Unlike subjective or opaque algorithms, this compliance engine computes audit readiness via an exact mathematical tripartite formula weighted across three statutory pillars:
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                <span className="text-emerald-400 font-bold text-sm block">45%</span>
                <span className="text-[11px] text-slate-300">LMS Training Compliance</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                <span className="text-blue-400 font-bold text-sm block">40%</span>
                <span className="text-[11px] text-slate-300">Operational Checklists</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                <span className="text-amber-400 font-bold text-sm block">15%</span>
                <span className="text-[11px] text-slate-300">Right to Work Verification</span>
              </div>
            </div>
          </div>

          {/* Pillar 1: Training */}
          <div className="space-y-2 border-l-2 border-emerald-500 pl-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                1. LMS Training Compliance Component (45% Weight)
              </h3>
              <span className="font-bold text-emerald-400 text-sm">
                Score: {report.trainingScorePercent}% ({Math.round(report.trainingScorePercent * 0.45)} / 45 pts)
              </span>
            </div>
            <p className="leading-relaxed">
              Every employee’s role level is evaluated against statutory mandatory course criteria. Completed valid certificates contribute positive points. A course whose renewal period has lapsed is classified as <span className="text-rose-400 font-semibold">Expired</span>, which yields zero credit and applies a statutory non-compliance deduction.
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
              Training Score = (Completed Valid Courses / Total Mandatory Course Requirements) * 100 - (Expired Cert Penalties)
            </div>
          </div>

          {/* Pillar 2: Checklists */}
          <div className="space-y-2 border-l-2 border-blue-500 pl-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" />
                2. Operational Audit Checklists (40% Weight)
              </h3>
              <span className="font-bold text-blue-400 text-sm">
                Score: {report.operationalChecklistScorePercent}% ({Math.round(report.operationalChecklistScorePercent * 0.40)} / 40 pts)
              </span>
            </div>
            <p className="leading-relaxed">
              Covers universal statutory duties (HSE written policy, £5m+ Employer Liability, ICO registration) plus sector-specific inspector demands (e.g. SFBB/HACCP diary for Food, Regulation 12 MAR charts for CQC, SM&CR for FCA). Each checklist item carries a legal severity weight from 1 (minor administrative) to 5 (criminal or mandatory closure risk).
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
              Checklist Score = ∑(Item Weight * Status Multiplier: Compliant=1.0, In-Progress=0.4, Critical Gap=0.0) / ∑(Total Max Weights) * 100
            </div>
          </div>

          {/* Pillar 3: Right to Work */}
          <div className="space-y-2 border-l-2 border-amber-500 pl-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                3. Right to Work Verification Component (15% Weight)
              </h3>
              <span className="font-bold text-amber-400 text-sm">
                Score: {report.rightToWorkScorePercent}% ({Math.round(report.rightToWorkScorePercent * 0.15)} / 15 pts)
              </span>
            </div>
            <p className="leading-relaxed">
              Under the Immigration, Asylum and Nationality Act 2006 and Border Security Act 2025, employers face civil penalties of up to <span className="text-rose-400 font-semibold">£45,000 per illegal worker</span> for a first breach (£60,000 for repeat). Verification must take place before Day 1 to establish the statutory excuse defense.
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
              RTW Score = (Verified Workers with Statutory Excuse / Total Active Registered Workers) * 100
            </div>
          </div>

          {/* Statutory Integrity Note */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start gap-2.5 text-[11px] text-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Auditable Regulatory Governance</span>
              All course renewal periods and legal references are pegged directly to published HSE, FSA, CQC, and Home Office statutory codes. Every change to threshold rules is logged with an auditable timestamp and reviewer ID.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close Formula Explainer
          </button>
        </div>
      </div>
    </div>
  );
};
