import React from 'react';
import {
  ShieldCheck,
  Building2,
  FileText,
  Sparkles,
  ChevronDown,
  User,
  RotateCcw,
  LayoutGrid,
  Scale,
  Compass,
} from 'lucide-react';
import { BusinessProfile, UserRole } from '../types';
import { SECTOR_METADATA } from '../data/regulatoryStandards';

interface HeaderProps {
  currentProfile: BusinessProfile;
  businesses?: BusinessProfile[];
  onSelectBusinessId?: (id: string) => void;
  activeTab: 'overview' | 'business' | 'checklists' | 'learners' | 'solutions' | 'portfolio' | 'regulatory';
  setActiveTab: (tab: any) => void;
  onOpenReport: () => void;
  onOpenOnboarding?: () => void;
  onResetDemo?: () => void;
  compliancePercent: number;
  currentRole?: UserRole;
  onChangeRole?: (role: UserRole) => void;
  onSelectPreset?: (presetKey: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProfile,
  businesses = [],
  onSelectBusinessId,
  activeTab,
  setActiveTab,
  onOpenReport,
  onOpenOnboarding,
  onResetDemo,
  compliancePercent,
  currentRole = 'business_manager',
  onChangeRole,
  onSelectPreset,
}) => {
  const sectorInfo = SECTOR_METADATA[currentProfile?.sector] || SECTOR_METADATA.general_business;

  return (
    <header className="bg-tertiary-900 border-b border-tertiary-800 text-white sticky top-0 z-30 shadow-md">
      {/* Top Branding & Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3.5 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-inner text-white font-bold">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  Compliance Status Checker
                </span>
                <span className="text-xs bg-tertiary-800 border border-tertiary-700 text-primary-300 font-semibold px-2 py-0.5 rounded-full">
                  UK Audit LMS Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                LMS Course Compliance & Deterministic Statutory Audit Gap Analysis
              </p>
            </div>
          </div>

          {/* Role Switcher & Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Role Switcher */}
            <div className="relative inline-block text-left">
              <div className="flex items-center bg-tertiary-800 border border-tertiary-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
                <User className="h-3.5 w-3.5 text-primary-400 mr-1.5" />
                <span className="text-slate-400 mr-1.5 font-medium">Role:</span>
                <select
                  id="role-selector"
                  value={currentRole}
                  onChange={(e) => onChangeRole?.(e.target.value as UserRole)}
                  className="bg-transparent text-white font-semibold cursor-pointer focus:outline-none pr-2"
                >
                  <option value="business_manager" className="bg-tertiary-900 text-white">
                    Business Manager (Client)
                  </option>
                  <option value="admin" className="bg-tertiary-900 text-white">
                    Admin (Training Provider)
                  </option>
                  <option value="viewer" className="bg-tertiary-900 text-white">
                    Read-Only Auditor (Viewer)
                  </option>
                </select>
                <ChevronDown className="h-3 w-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Business Switcher */}
            <div className="relative inline-block text-left">
              <div className="flex items-center bg-tertiary-800 border border-tertiary-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
                <Building2 className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
                <select
                  id="business-selector"
                  value={currentProfile?.id || ''}
                  onChange={(e) => onSelectBusinessId?.(e.target.value)}
                  className="bg-transparent text-white font-semibold cursor-pointer focus:outline-none pr-2 max-w-[170px] truncate"
                >
                  {(businesses && businesses.length > 0) ? (
                    businesses.map((b) => (
                      <option key={b.id} value={b.id} className="bg-tertiary-900 text-white">
                        {b.name}
                      </option>
                    ))
                  ) : (
                    <option value={currentProfile?.id || 'default'} className="bg-tertiary-900 text-white">
                      {currentProfile?.name || 'Default Business'}
                    </option>
                  )}
                </select>
                <ChevronDown className="h-3 w-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Guided Setup Button */}
            {currentRole !== 'viewer' && onOpenOnboarding && (
              <button
                type="button"
                id="btn-guided-onboarding"
                onClick={onOpenOnboarding}
                className="inline-flex items-center space-x-1 bg-tertiary-800 hover:bg-tertiary-700 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-tertiary-700 transition-colors"
                title="Open 4-step onboarding wizard"
              >
                <Compass className="h-3.5 w-3.5 text-primary-400" />
                <span className="hidden sm:inline">Setup Wizard</span>
              </button>
            )}

            {/* Print/Export Dossier Button */}
            <button
              type="button"
              id="export-dossier-btn"
              onClick={onOpenReport}
              className="inline-flex items-center space-x-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Audit Dossier</span>
            </button>

            {/* Reset Demo Button */}
            {onResetDemo && (
              <button
                type="button"
                id="btn-reset-demo"
                onClick={onResetDemo}
                className="p-1.5 bg-tertiary-800 hover:bg-tertiary-700 text-slate-400 hover:text-slate-200 rounded-lg border border-tertiary-700 transition-colors"
                title="Reset Database to Default Seed State"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Business Sub-bar */}
        <div className="flex flex-wrap items-center justify-between pb-3 text-xs text-slate-300 border-t border-tertiary-800/80 pt-2 gap-2">
          <div className="flex items-center space-x-3 flex-wrap">
            <span className="font-semibold text-white flex items-center">
              <Building2 className="h-3.5 w-3.5 mr-1 text-slate-400" />
              {currentProfile.name}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 bg-tertiary-800 px-2 py-0.5 rounded text-[11px]">
              {sectorInfo.shortName}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Regulator: {sectorInfo.regulator}</span>
            {currentProfile.companyNumber && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Co. No: {currentProfile.companyNumber}</span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-slate-400 text-xs">Deterministic Audit Readiness:</span>
            <span
              className={`font-black px-2.5 py-0.5 rounded text-xs ${
                compliancePercent >= 80
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : compliancePercent >= 60
                  ? 'bg-primary-950 text-primary-300 border border-primary-800'
                  : 'bg-secondary-900/80 text-secondary-300 border border-secondary-700'
              }`}
            >
              {compliancePercent}%
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto border-t border-tertiary-800 pt-1 -mb-px scrollbar-none">
          {/* Admin Mode Special Tabs */}
          {currentRole === 'admin' && (
            <>
              <button
                type="button"
                id="tab-portfolio"
                onClick={() => setActiveTab('portfolio')}
                className={`px-3.5 py-2.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap border-b-2 flex items-center space-x-1.5 ${
                  activeTab === 'portfolio'
                    ? 'bg-tertiary-800 text-primary-300 border-primary-500'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Client Portfolio</span>
              </button>

              <button
                type="button"
                id="tab-regulatory"
                onClick={() => setActiveTab('regulatory')}
                className={`px-3.5 py-2.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap border-b-2 flex items-center space-x-1.5 ${
                  activeTab === 'regulatory'
                    ? 'bg-tertiary-800 text-primary-300 border-primary-500'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <Scale className="h-4 w-4" />
                <span>Regulatory Standards & Catalog</span>
              </button>
            </>
          )}

          <button
            type="button"
            id="tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'overview'
                ? 'bg-tertiary-800 text-primary-300 border-primary-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Audit Gap Overview</span>
          </button>

          <button
            type="button"
            id="tab-business"
            onClick={() => setActiveTab('business')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'business'
                ? 'bg-tertiary-800 text-primary-300 border-primary-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>1. Business & Workforce Levels</span>
          </button>

          <button
            type="button"
            id="tab-checklists"
            onClick={() => setActiveTab('checklists')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'checklists'
                ? 'bg-tertiary-800 text-primary-300 border-primary-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>2. Manager Audit Checklists</span>
          </button>

          <button
            type="button"
            id="tab-learners"
            onClick={() => setActiveTab('learners')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'learners'
                ? 'bg-tertiary-800 text-primary-300 border-primary-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>3. Learners & Training Register</span>
          </button>

          <button
            type="button"
            id="tab-solutions"
            onClick={() => setActiveTab('solutions')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'solutions'
                ? 'bg-tertiary-800 text-primary-300 border-primary-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>4. Our Training Solutions</span>
          </button>
        </div>
      </div>
    </header>
  );
};
