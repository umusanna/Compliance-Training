import React from 'react';
import {
  Building2,
  Users,
  Briefcase,
  Shield,
  FileCheck,
  Scale,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { BusinessProfile, RoleLevel, SectorId, Jurisdiction } from '../types';
import { SECTOR_METADATA } from '../data/regulatoryStandards';

interface BusinessProfileViewProps {
  profile: BusinessProfile;
  onUpdateProfile: (updated: Partial<BusinessProfile>) => void;
  registeredLearnerCount: number;
  readOnly?: boolean;
}

export const BusinessProfileView: React.FC<BusinessProfileViewProps> = ({
  profile,
  onUpdateProfile,
  registeredLearnerCount,
  readOnly = false,
}) => {
  const totalEmployees: number = (Object.values(profile?.employeeCounts || {}) as number[]).reduce(
    (a, b) => a + (Number(b) || 0),
    0
  );

  // Calculate Company Size Tier according to UK Companies Act (2025/2026 updated thresholds):
  // Micro: Turnover <= £1m, Balance Sheet <= £500k, Employees <= 10 (meets 2 of 3)
  // Small: Turnover <= £15m, Balance Sheet <= £7.5m, Employees <= 50 (meets 2 of 3)
  // Medium: Turnover <= £54m, Balance Sheet <= £27m, Employees <= 250 (meets 2 of 3)
  // Large: Above medium
  let sizeTier = 'Small Company';
  let sizeAuditStatus = 'Audit Exempt (Small Company Accounts)';

  const t: number = Number(profile.turnoverGbp) || 0;
  const b: number = Number(profile.balanceSheetGbp) || 0;
  const e: number = totalEmployees;

  const isMicroCriteria = [t <= 1000000, b <= 500000, e <= 10].filter(Boolean).length >= 2;
  const isSmallCriteria = [t <= 15000000, b <= 7500000, e <= 50].filter(Boolean).length >= 2;
  const isMediumCriteria = [t <= 54000000, b <= 27000000, e <= 250].filter(Boolean).length >= 2;

  if (isMicroCriteria) {
    sizeTier = 'Micro-Entity';
    sizeAuditStatus = 'Audit Exempt; simplified balance sheet filing only';
  } else if (isSmallCriteria) {
    sizeTier = 'Small Company';
    sizeAuditStatus = 'Audit Exempt; eligible for filleted public accounts';
  } else if (isMediumCriteria) {
    sizeTier = 'Medium Company';
    sizeAuditStatus = 'Statutory audit mandatory; full accounts disclosure';
  } else {
    sizeTier = 'Large Enterprise';
    sizeAuditStatus = 'Statutory audit mandatory; complex disclosures & modern slavery statement';
  }

  const handleRoleCountChange = (role: RoleLevel, value: number) => {
    if (readOnly) return;
    const safeVal = Math.max(0, isNaN(value) ? 0 : value);
    onUpdateProfile({
      employeeCounts: {
        ...profile.employeeCounts,
        [role]: safeVal,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="bg-tertiary-900 border border-tertiary-800 rounded-2xl p-5 md:p-6 shadow-sm text-slate-100">
        <div className="flex items-center space-x-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary-600/20 border border-primary-500/40 text-primary-400 flex items-center justify-center font-bold text-lg">
            1
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Business Information & Workforce Role Levels
            </h2>
            <p className="text-xs text-slate-400">
              Configures statutory perimeter, applicable regulatory authorities, and role-based training allocation.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Business Entity & Sector Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Entity Details Card */}
          <div className="bg-tertiary-900 border border-tertiary-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-primary-400" />
              <span>Company Entity Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Registered Business Name
                </label>
                <input
                  id="biz-name-input"
                  type="text"
                  disabled={readOnly}
                  value={profile.name}
                  onChange={(e) => onUpdateProfile({ name: e.target.value })}
                  className="w-full text-xs bg-tertiary-950 border border-tertiary-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Trading Name (if different)
                </label>
                <input
                  id="biz-trading-name-input"
                  type="text"
                  disabled={readOnly}
                  value={profile.tradingName || ''}
                  onChange={(e) => onUpdateProfile({ tradingName: e.target.value })}
                  placeholder="e.g. Crown & Anchor Pub"
                  className="w-full text-xs bg-tertiary-950 border border-tertiary-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Companies House Number
                </label>
                <input
                  id="biz-company-no-input"
                  type="text"
                  disabled={readOnly}
                  value={profile.companyNumber}
                  onChange={(e) => onUpdateProfile({ companyNumber: e.target.value })}
                  placeholder="8-digit CRN (e.g. 09845120)"
                  className="w-full text-xs bg-tertiary-950 border border-tertiary-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jurisdiction & Devolved Scheme
                </label>
                <select
                  id="biz-jurisdiction-select"
                  value={profile.jurisdiction}
                  disabled={readOnly}
                  onChange={(e) => onUpdateProfile({ jurisdiction: e.target.value as Jurisdiction })}
                  className="w-full text-xs bg-tertiary-950 border border-tertiary-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="england_wales" className="bg-tertiary-900">England & Wales (FSA 0-5 FHRS, CQC, HSE)</option>
                  <option value="scotland" className="bg-tertiary-900">Scotland (Food Hygiene FHIS Pass/Fail)</option>
                  <option value="northern_ireland" className="bg-tertiary-900">Northern Ireland (Mandatory FHRS display)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary Regulated Industry Sector
                </label>
                <select
                  id="biz-sector-select"
                  value={profile.sector}
                  disabled={readOnly}
                  onChange={(e) => onUpdateProfile({ sector: e.target.value as SectorId })}
                  className="w-full text-xs bg-tertiary-950 border border-tertiary-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-primary-500"
                >
                  {Object.entries(SECTOR_METADATA).map(([key, meta]) => (
                    <option key={key} value={key} className="bg-tertiary-900">
                      {meta.name} ({meta.regulator.split('(')[0].trim()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sub-Sector Specialization
                </label>
                <input
                  id="biz-subsector-input"
                  type="text"
                  disabled={readOnly}
                  value={profile.subSector}
                  onChange={(e) => onUpdateProfile({ subSector: e.target.value })}
                  placeholder="e.g. Care Home, Domiciliary, Gastropub, Fintech"
                  className="w-full text-xs bg-tertiary-950 border border-tertiary-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {/* Sector Specific Declarations */}
            <div className="pt-4 border-t border-tertiary-800">
              <h4 className="text-xs font-bold text-slate-300 mb-2">
                Sector Regulatory Registrations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {profile.sector === 'food_hospitality' && (
                  <label className="flex items-center space-x-2 p-3 rounded-xl border border-tertiary-800 bg-tertiary-950 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={profile.fsaRegistered ?? true}
                      onChange={(e) => onUpdateProfile({ fsaRegistered: e.target.checked })}
                      className="rounded border-tertiary-700 bg-tertiary-900 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-slate-200 font-medium">
                      Registered with Local Authority EHO (&gt;28 days notice)
                    </span>
                  </label>
                )}

                {profile.sector === 'health_social_care' && (
                  <label className="flex items-center space-x-2 p-3 rounded-xl border border-tertiary-800 bg-tertiary-950 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={profile.cqcRegistered ?? true}
                      onChange={(e) => onUpdateProfile({ cqcRegistered: e.target.checked })}
                      className="rounded border-tertiary-700 bg-tertiary-900 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-slate-200 font-medium">
                      Active CQC Provider Registration & Registered Manager
                    </span>
                  </label>
                )}

                {profile.sector === 'financial_services' && (
                  <label className="flex items-center space-x-2 p-3 rounded-xl border border-tertiary-800 bg-tertiary-950 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={profile.fcaAuthorised ?? true}
                      onChange={(e) => onUpdateProfile({ fcaAuthorised: e.target.checked })}
                      className="rounded border-tertiary-700 bg-tertiary-900 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-slate-200 font-medium">
                      FCA Authorised / Registered on Financial Services Register
                    </span>
                  </label>
                )}

                {profile.sector === 'construction' && (
                  <label className="flex items-center space-x-2 p-3 rounded-xl border border-tertiary-800 bg-tertiary-950 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={profile.cdmNotifiable ?? true}
                      onChange={(e) => onUpdateProfile({ cdmNotifiable: e.target.checked })}
                      className="rounded border-tertiary-700 bg-tertiary-900 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-slate-200 font-medium">
                      CDM 2015 Notifiable Project (&gt;30 days/20 workers or 500 person-days)
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Workforce Role Levels & Headcount */}
          <div className="bg-tertiary-900 border border-tertiary-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Users className="h-4 w-4 text-primary-400" />
                  <span>Workforce Role Level Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  How many employees you have at each responsibility level. Mandatory courses scale automatically.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Total Workforce:</span>
                <span className="text-xl font-black text-white ml-1.5">{totalEmployees}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Managers */}
              <div className="border border-tertiary-800 rounded-xl p-3 bg-tertiary-950">
                <div className="text-xs font-semibold text-slate-200">Managers & Directors</div>
                <div className="text-[11px] text-slate-400 mb-2">
                  Accountable leads, SMF holders, registered managers
                </div>
                <input
                  id="role-count-manager"
                  type="number"
                  min="0"
                  disabled={readOnly}
                  value={profile?.employeeCounts?.manager || 0}
                  onChange={(e) => handleRoleCountChange('manager', parseInt(e.target.value))}
                  className="w-full text-sm font-bold bg-tertiary-900 border border-tertiary-700 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Supervisors */}
              <div className="border border-tertiary-800 rounded-xl p-3 bg-tertiary-950">
                <div className="text-xs font-semibold text-slate-200">Supervisors & Leads</div>
                <div className="text-[11px] text-slate-400 mb-2">
                  Team leaders, sous chefs, site safety supervisors
                </div>
                <input
                  id="role-count-supervisor"
                  type="number"
                  min="0"
                  disabled={readOnly}
                  value={profile?.employeeCounts?.supervisor || 0}
                  onChange={(e) => handleRoleCountChange('supervisor', parseInt(e.target.value))}
                  className="w-full text-sm font-bold bg-tertiary-900 border border-tertiary-700 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Field Workers */}
              <div className="border border-tertiary-800 rounded-xl p-3 bg-tertiary-950">
                <div className="text-xs font-semibold text-slate-200">Field & Frontline Staff</div>
                <div className="text-[11px] text-slate-400 mb-2">
                  Kitchen cooks, care assistants, operatives, trades
                </div>
                <input
                  id="role-count-field-worker"
                  type="number"
                  min="0"
                  disabled={readOnly}
                  value={profile?.employeeCounts?.field_worker || 0}
                  onChange={(e) => handleRoleCountChange('field_worker', parseInt(e.target.value))}
                  className="w-full text-sm font-bold bg-tertiary-900 border border-tertiary-700 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Admin */}
              <div className="border border-tertiary-800 rounded-xl p-3 bg-tertiary-950">
                <div className="text-xs font-semibold text-slate-200">Admin & Office Support</div>
                <div className="text-[11px] text-slate-400 mb-2">
                  Payroll, HR, reception, administrative clerks
                </div>
                <input
                  id="role-count-admin"
                  type="number"
                  min="0"
                  disabled={readOnly}
                  value={profile?.employeeCounts?.admin || 0}
                  onChange={(e) => handleRoleCountChange('admin', parseInt(e.target.value))}
                  className="w-full text-sm font-bold bg-tertiary-900 border border-tertiary-700 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>Currently registered in learner roster: <strong className="text-white">{registeredLearnerCount} learners</strong></span>
              {registeredLearnerCount < totalEmployees && (
                <span className="text-secondary-400 font-medium">
                  ⚠️ {totalEmployees - registeredLearnerCount} employees not yet added to learner register
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Statutory Size Tier & Financial Thresholds */}
        <div className="space-y-6">
          <div className="bg-tertiary-900 border border-tertiary-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Scale className="h-4 w-4 text-secondary-400" />
              <span>Company Size & Filing Tier</span>
            </h3>

            <div className="bg-tertiary-950 border border-tertiary-800 rounded-xl p-3.5 space-y-2">
              <div className="text-xs text-slate-400 font-medium">Statutory Classification:</div>
              <div className="text-base font-bold text-secondary-400">{sizeTier}</div>
              <p className="text-xs text-slate-400 leading-snug">{sizeAuditStatus}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Annual Turnover (£ GBP)
                </label>
                <input
                  id="turnover-input"
                  type="number"
                  step="10000"
                  disabled={readOnly}
                  value={profile.turnoverGbp}
                  onChange={(e) => onUpdateProfile({ turnoverGbp: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs bg-tertiary-950 border border-tertiary-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-500 font-mono"
                />
                <span className="text-[10px] text-slate-500">Micro ≤ £1m | Small ≤ £15m | Med ≤ £54m</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Balance Sheet Total (£ GBP)
                </label>
                <input
                  id="balance-sheet-input"
                  type="number"
                  step="10000"
                  disabled={readOnly}
                  value={profile.balanceSheetGbp}
                  onChange={(e) =>
                    onUpdateProfile({ balanceSheetGbp: parseInt(e.target.value) || 0 })
                  }
                  className="w-full text-xs bg-tertiary-950 border border-tertiary-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-500 font-mono"
                />
                <span className="text-[10px] text-slate-500">Micro ≤ £500k | Small ≤ £7.5m | Med ≤ £27m</span>
              </div>
            </div>

            {/* Applicable Regulators Summary */}
            <div className="pt-3 border-t border-tertiary-800">
              <div className="text-xs font-bold text-white mb-2">
                Enforcing Regulators for this Business:
              </div>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-400 shrink-0" />
                  <span>{SECTOR_METADATA[profile.sector].regulator}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-400 shrink-0" />
                  <span>Home Office (Right to Work & Immigration)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-400 shrink-0" />
                  <span>Health and Safety Executive (HSE)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-400 shrink-0" />
                  <span>Information Commissioner's Office (ICO GDPR)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-400 shrink-0" />
                  <span>HMRC (PAYE, Corporation Tax, Minimum Wage)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
