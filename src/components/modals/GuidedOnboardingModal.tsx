import React, { useState } from 'react';
import {
  Building2,
  Users,
  ShieldAlert,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { BusinessProfile, SectorId, Jurisdiction } from '../../types';
import { SECTOR_METADATA } from '../../data/regulatoryStandards';

interface GuidedOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profileData: Partial<BusinessProfile>) => void;
  currentProfile: BusinessProfile;
}

export const GuidedOnboardingModal: React.FC<GuidedOnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  currentProfile,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState({
    name: currentProfile?.name || '',
    tradingName: currentProfile?.tradingName || '',
    sector: currentProfile?.sector || 'food_hospitality',
    subSector: currentProfile?.subSector || '',
    jurisdiction: currentProfile?.jurisdiction || 'england_wales',
    companyNumber: currentProfile?.companyNumber || '',
    turnoverGbp: currentProfile?.turnoverGbp || 1000000,
    employeeCounts: {
      manager: currentProfile?.employeeCounts?.manager || 2,
      supervisor: currentProfile?.employeeCounts?.supervisor || 3,
      field_worker: currentProfile?.employeeCounts?.field_worker || 8,
      admin: currentProfile?.employeeCounts?.admin || 1,
    },
    fsaRegistered: currentProfile?.fsaRegistered ?? true,
    cqcRegistered: currentProfile?.cqcRegistered ?? false,
    fcaAuthorised: currentProfile?.fcaAuthorised ?? false,
    cdmNotifiable: currentProfile?.cdmNotifiable ?? false,
  });

  if (!isOpen) return null;

  const totalStaff =
    formData.employeeCounts.manager +
    formData.employeeCounts.supervisor +
    formData.employeeCounts.field_worker +
    formData.employeeCounts.admin;

  const handleFinish = () => {
    onComplete({
      ...formData,
      onboardingCompleted: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Compliance Audit Setup Wizard</h2>
              <p className="text-xs text-slate-400">Step {step} of 4: Tailor your regulatory requirements</p>
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

        {/* Step Indicator */}
        <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/60 text-xs text-center font-medium">
          <div
            className={`py-2.5 border-b-2 transition-colors ${
              step === 1 ? 'border-emerald-500 text-emerald-400 font-semibold' : 'border-transparent text-slate-400'
            }`}
          >
            1. Business Entity
          </div>
          <div
            className={`py-2.5 border-b-2 transition-colors ${
              step === 2 ? 'border-emerald-500 text-emerald-400 font-semibold' : 'border-transparent text-slate-400'
            }`}
          >
            2. Workforce Roles
          </div>
          <div
            className={`py-2.5 border-b-2 transition-colors ${
              step === 3 ? 'border-emerald-500 text-emerald-400 font-semibold' : 'border-transparent text-slate-400'
            }`}
          >
            3. Regulatory Scope
          </div>
          <div
            className={`py-2.5 border-b-2 transition-colors ${
              step === 4 ? 'border-emerald-500 text-emerald-400 font-semibold' : 'border-transparent text-slate-400'
            }`}
          >
            4. Confirmation
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Registered Legal Business Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Hospitality & Leisure Ltd"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Trading Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.tradingName}
                    onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                    placeholder="e.g. The Copper Kettle Bistro"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Companies House Number
                  </label>
                  <input
                    type="text"
                    value={formData.companyNumber}
                    onChange={(e) => setFormData({ ...formData, companyNumber: e.target.value })}
                    placeholder="e.g. 12984521"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Primary Regulatory Sector *
                  </label>
                  <select
                    value={formData.sector}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sector: e.target.value as SectorId,
                        fsaRegistered: e.target.value === 'food_hospitality',
                        cqcRegistered: e.target.value === 'health_social_care',
                        fcaAuthorised: e.target.value === 'financial_services',
                        cdmNotifiable: e.target.value === 'construction',
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="food_hospitality">Food & Hospitality (FSA / EHO)</option>
                    <option value="health_social_care">Health & Social Care (CQC)</option>
                    <option value="financial_services">Financial Services (FCA)</option>
                    <option value="construction">Construction & Engineering (CDM 2015)</option>
                    <option value="general_business">General Business / Tech</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    UK Statutory Jurisdiction
                  </label>
                  <select
                    value={formData.jurisdiction}
                    onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value as Jurisdiction })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="england_wales">England & Wales</option>
                    <option value="scotland">Scotland</option>
                    <option value="northern_ireland">Northern Ireland</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs text-slate-300 flex items-start gap-2.5">
                <Users className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  Workforce role breakdown establishes your legal training requirements and statutory duties (e.g. 5+ staff requires written Health & Safety policy; supervisory roles require Level 3 food or SMSTS).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <label className="block text-xs font-bold text-white mb-1">Managers</label>
                  <span className="text-[11px] text-slate-400 block mb-2">Directors, GMs, SMF holders</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.employeeCounts.manager}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employeeCounts: {
                          ...formData.employeeCounts,
                          manager: Math.max(0, parseInt(e.target.value) || 0),
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white"
                  />
                </div>

                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <label className="block text-xs font-bold text-white mb-1">Supervisors</label>
                  <span className="text-[11px] text-slate-400 block mb-2">Head chefs, team leads, gangers</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.employeeCounts.supervisor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employeeCounts: {
                          ...formData.employeeCounts,
                          supervisor: Math.max(0, parseInt(e.target.value) || 0),
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white"
                  />
                </div>

                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <label className="block text-xs font-bold text-white mb-1">Field / Frontline Workers</label>
                  <span className="text-[11px] text-slate-400 block mb-2">Care workers, cooks, servers, trades</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.employeeCounts.field_worker}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employeeCounts: {
                          ...formData.employeeCounts,
                          field_worker: Math.max(0, parseInt(e.target.value) || 0),
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white"
                  />
                </div>

                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <label className="block text-xs font-bold text-white mb-1">Administrative / Support</label>
                  <span className="text-[11px] text-slate-400 block mb-2">HR, finance, reception, schedulers</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.employeeCounts.admin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employeeCounts: {
                          ...formData.employeeCounts,
                          admin: Math.max(0, parseInt(e.target.value) || 0),
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Total Active Headcount:</span>
                <span className="text-emerald-400 font-bold text-sm">{totalStaff} Employees</span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Confirm which statutory regulatory frameworks apply to your business operations:
              </p>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.fsaRegistered}
                    onChange={(e) => setFormData({ ...formData, fsaRegistered: e.target.checked })}
                    className="mt-0.5 rounded border-slate-600 text-emerald-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      FSA / Environmental Health Food Business Registration
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Registered under Regulation (EC) 852/2004 with local council. Enables FHRS 0–5 star hygiene rating checks.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.cqcRegistered}
                    onChange={(e) => setFormData({ ...formData, cqcRegistered: e.target.checked })}
                    className="mt-0.5 rounded border-slate-600 text-emerald-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Care Quality Commission (CQC) Regulated Activity
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Subject to Fundamental Standards and 5 Key Questions (Safe, Effective, Caring, Responsive, Well-led).
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.fcaAuthorised}
                    onChange={(e) => setFormData({ ...formData, fcaAuthorised: e.target.checked })}
                    className="mt-0.5 rounded border-slate-600 text-emerald-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      FCA Authorised / Registered Firm
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Subject to Senior Managers and Certification Regime (SM&CR), Principle 12 Consumer Duty, and CASS 15 safeguarding.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.cdmNotifiable}
                    onChange={(e) => setFormData({ ...formData, cdmNotifiable: e.target.checked })}
                    className="mt-0.5 rounded border-slate-600 text-emerald-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      CDM 2015 Construction Duty-Holder
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Client, Principal Contractor, or Designer duties under Construction (Design and Management) Regulations 2015.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 bg-emerald-600/20 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Ready to Initialise Compliance Engine</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Your business profile for <span className="text-white font-semibold">{formData.name}</span> will be saved to your persistent SQLite database, with statutory checklist templates automatically seeded for {SECTOR_METADATA[formData.sector].name}.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sector Regulator:</span>
                  <span className="text-white font-semibold">{SECTOR_METADATA[formData.sector].regulator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Workforce:</span>
                  <span className="text-emerald-400 font-semibold">{totalStaff} Registered Positions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Statutory Scheme:</span>
                  <span className="text-white font-semibold">{SECTOR_METADATA[formData.sector].scoringSystem}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="inline-flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow"
            >
              Complete Setup & Open Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
