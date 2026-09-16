import React, { useState, useEffect } from 'react';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  Users,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Search,
} from 'lucide-react';
import { PortfolioClientMetric } from '../types';
import { api } from '../services/api';

interface AdminPortfolioViewProps {
  onSelectBusiness: (businessId: string) => void;
}

export const AdminPortfolioView: React.FC<AdminPortfolioViewProps> = ({ onSelectBusiness }) => {
  const [metrics, setMetrics] = useState<PortfolioClientMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchPortfolioMetrics();
      setMetrics(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load portfolio metrics', err);
      setMetrics([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalClients = (metrics || []).length;
  const totalLearners = (metrics || []).reduce((acc, m) => acc + (m.totalLearners || 0), 0);
  const totalExpiredCerts = (metrics || []).reduce((acc, m) => acc + (m.expiredCertsCount || 0), 0);
  const totalPendingRtw = (metrics || []).reduce((acc, m) => acc + (m.pendingRtwCount || 0), 0);

  const filteredMetrics = (metrics || []).filter(
    (m) =>
      (m.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.sector || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/60">
              Training Provider Compliance Console
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight mt-2">
              Cross-Client Portfolio Compliance Monitor
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time multi-tenant surveillance of all enrolled client organizations. Monitor audit preparation, spot systemic statutory breaches, and identify training renewal requirements.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors shadow-sm self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Portfolio</span>
          </button>
        </div>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 block mb-1">Managed Client Accounts</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-white">{totalClients}</span>
              <Building2 className="w-5 h-5 text-slate-500" />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Active business contracts</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 block mb-1">Total Enrolled Learners</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-white">{totalLearners}</span>
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Active staff across clients</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 block mb-1">Expired Training Certs</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-rose-400">{totalExpiredCerts}</span>
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <span className="text-[11px] text-rose-400/80 mt-1 block">Immediate refresher renewal needed</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 block mb-1">Pending RTW Statutory Excuses</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-amber-400">{totalPendingRtw}</span>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-[11px] text-amber-400/80 mt-1 block">£45,000 civil liability risk</span>
          </div>
        </div>
      </div>

      {/* Client Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search clients by name or sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredMetrics.length} of {metrics.length} client accounts
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Client Business</th>
                <th className="p-3.5">Sector</th>
                <th className="p-3.5">Learners</th>
                <th className="p-3.5">Expired Certs</th>
                <th className="p-3.5">Pending RTW</th>
                <th className="p-3.5">Critical Gaps</th>
                <th className="p-3.5">Readiness Score</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredMetrics.map((m) => (
                <tr key={m.businessId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5">
                    <span className="font-bold text-white block">{m.businessName}</span>
                    <span className="text-[11px] text-slate-500">{m.businessId}</span>
                  </td>
                  <td className="p-3.5 capitalize">{m.sector.replace('_', ' ')}</td>
                  <td className="p-3.5 font-semibold text-white">{m.totalLearners}</td>
                  <td className="p-3.5">
                    {m.expiredCertsCount > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                        {m.expiredCertsCount} Expired
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 0
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    {m.pendingRtwCount > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        {m.pendingRtwCount} Pending
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> All Verified
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    {m.criticalGapsCount > 0 ? (
                      <span className="text-rose-400 font-bold">{m.criticalGapsCount}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`font-bold px-2 py-1 rounded text-xs ${
                        (m.lastScore ?? 0) >= 80
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : (m.lastScore ?? 0) >= 60
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {m.lastScore ? `${m.lastScore}%` : 'Audit Pending'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectBusiness(m.businessId)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors shadow-sm text-xs"
                    >
                      <span>Manage Client</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
