import React from 'react';
import { X, Printer, CheckCircle2, ShieldAlert, FileText, Download, Building2 } from 'lucide-react';
import { BusinessProfile, ComplianceAuditReport, AuditChecklistItem, Learner } from '../types';
import { SECTOR_METADATA } from '../data/regulatoryStandards';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
  report: ComplianceAuditReport;
  checklists: AuditChecklistItem[];
  learners: Learner[];
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  profile,
  report,
  checklists,
  learners,
}) => {
  if (!isOpen) return null;

  const sectorInfo = SECTOR_METADATA[profile.sector];
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-300">
        {/* Header Bar - Hidden in print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-emerald-700" />
            <h3 className="text-base font-bold text-slate-900">
              UK Regulatory Compliance Audit Readiness Dossier
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-900 font-sans print:p-0 print:m-0">
          {/* Header Title Section */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                Official Compliance Dossier • UK Statutory Standards
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-1">
                {profile.name}
              </h1>
              <div className="text-xs text-slate-600 mt-0.5">
                Trading as: {profile.tradingName || profile.name} | CRN: {profile.companyNumber}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Sector: <strong>{sectorInfo.name}</strong> ({profile.subSector}) • Enforcing Body:{' '}
                <strong>{sectorInfo.regulator}</strong>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500">Date Generated:</div>
              <div className="text-sm font-bold text-slate-800">{currentDate}</div>
              <div className="mt-2 inline-block bg-slate-900 text-white font-bold text-xs px-3 py-1 rounded">
                Readiness: {report.overallScorePercent}%
              </div>
            </div>
          </div>

          {/* Executive Summary Box */}
          <div className="grid grid-cols-3 gap-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase">
                Workforce Training Score
              </div>
              <div className="text-xl font-black text-blue-700 mt-0.5">
                {report.trainingScorePercent}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {report.completedMandatoryCourseSlots} / {report.totalMandatoryCourseSlots} mandatory course certifications completed
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase">
                Manager Audit Checklists
              </div>
              <div className="text-xl font-black text-emerald-700 mt-0.5">
                {report.operationalChecklistScorePercent}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Documented policies & operational controls
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase">
                Right to Work Verification
              </div>
              <div className="text-xl font-black text-purple-700 mt-0.5">
                {report.rightToWorkScorePercent}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Statutory excuse secured under Immigration Act
              </div>
            </div>
          </div>

          {/* Sector Specific Result Box */}
          {profile.sector === 'food_hospitality' && report.foodHygieneBreakdown && (
            <div className="border border-slate-300 rounded-lg p-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  FSA Food Hygiene Rating Breakdown (England / Wales Brand Standard)
                </span>
                <span className="font-bold text-sm bg-slate-900 text-white px-2.5 py-0.5 rounded">
                  Rating: {report.foodHygieneBreakdown.officialRating} / 5 ({report.foodHygieneBreakdown.descriptor})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Hygiene Procedures:</span>
                  <div className="font-bold text-slate-900">{report.foodHygieneBreakdown.hygieneProceduresScore} / 25</div>
                </div>
                <div>
                  <span className="text-slate-500">Structural Compliance:</span>
                  <div className="font-bold text-slate-900">{report.foodHygieneBreakdown.structuralComplianceScore} / 25</div>
                </div>
                <div>
                  <span className="text-slate-500">Confidence in Management:</span>
                  <div className="font-bold text-slate-900">{report.foodHygieneBreakdown.confidenceInManagementScore} / 30</div>
                </div>
              </div>
              {report.foodHygieneBreakdown.cappedByElement && (
                <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded mt-2">
                  * Note: Additional scoring factor applied: {report.foodHygieneBreakdown.limitingFactor}
                </div>
              )}
            </div>
          )}

          {/* Statutory Enforcement Risk Exposure */}
          {report.statutoryPenaltiesRisk.length > 0 && (
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-rose-900 mb-2">
                Statutory Penalties & Enforcement Risk Assessment
              </h3>
              <div className="border border-rose-200 rounded-lg overflow-hidden text-xs">
                <table className="min-w-full divide-y divide-rose-200">
                  <thead className="bg-rose-50/80">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-rose-900">Regulator</th>
                      <th className="px-3 py-2 text-left font-semibold text-rose-900">Legal Basis</th>
                      <th className="px-3 py-2 text-left font-semibold text-rose-900">Potential Liability</th>
                      <th className="px-3 py-2 text-left font-semibold text-rose-900">Deficiency Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 bg-white">
                    {report.statutoryPenaltiesRisk.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-semibold text-slate-900">{item.regulator}</td>
                        <td className="px-3 py-2 text-slate-600">{item.regulation}</td>
                        <td className="px-3 py-2 font-bold text-rose-700">{item.riskAmountFormatted}</td>
                        <td className="px-3 py-2 text-slate-600">{item.riskDescription}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Workforce Training Registry Summary */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2">
              Workforce Training Register & LMS Course Status
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Employee</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Level / Role</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Right to Work</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Completed Courses</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Active In LMS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {learners.map((l) => {
                    const completed = l.courses.filter((c) => c.status === 'completed');
                    const inProgress = l.courses.filter((c) => c.status === 'in_progress');
                    return (
                      <tr key={l.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">{l.name}</td>
                        <td className="px-3 py-2 text-slate-600 capitalize">
                          {l.roleLevel.replace('_', ' ')} - {l.jobTitle}
                        </td>
                        <td className="px-3 py-2">
                          {l.rightToWorkStatus === 'verified_statutory_excuse' ? (
                            <span className="text-emerald-700 font-semibold">Verified</span>
                          ) : (
                            <span className="text-rose-700 font-bold">Pending Check</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{completed.length} courses</td>
                        <td className="px-3 py-2 text-blue-700 font-medium">
                          {inProgress.length > 0
                            ? inProgress.map((p) => `${p.courseTitle} (${p.progressPercent}%)`).join(', ')
                            : 'None'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Manager Audit Checklist Findings */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2">
              Manager Audit Checklist & Operational Findings
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Checklist Requirement</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Authority</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Evidenced?</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Manager Audit Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {checklists.map((c) => (
                    <tr key={c.id}>
                      <td className="px-3 py-2 font-medium text-slate-900">{c.title}</td>
                      <td className="px-3 py-2 text-slate-500">{c.regulatoryBody}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`font-semibold capitalize ${
                            c.status === 'compliant'
                              ? 'text-emerald-700'
                              : c.status === 'in_progress'
                              ? 'text-blue-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {c.evidenceDocumented ? 'Yes (Signed)' : 'Pending'}
                      </td>
                      <td className="px-3 py-2 text-slate-600 italic">
                        {c.managerNotes || 'None recorded'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sign-off Block */}
          <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs">
            <div>
              <div className="font-bold text-slate-900">Compliance & Audit Manager Sign-off:</div>
              <div className="mt-8 border-b border-slate-400 w-64" />
              <div className="text-slate-500 mt-1">Signature & Date</div>
            </div>
            <div>
              <div className="font-bold text-slate-900">Managing Director / Responsible Person:</div>
              <div className="mt-8 border-b border-slate-400 w-64" />
              <div className="text-slate-500 mt-1">Signature & Date</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
