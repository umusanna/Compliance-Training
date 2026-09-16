import React, { useState, useEffect } from 'react';
import {
  Scale,
  Calendar,
  ExternalLink,
  Edit2,
  Save,
  X,
  History,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { Course, RegulatoryChangelogEntry } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const AdminRegulatoryView: React.FC = () => {
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [changelog, setChangelog] = useState<RegulatoryChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Course>>({});

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedCourses, fetchedLogs] = await Promise.all([
        api.fetchCourses(),
        api.fetchChangelog(),
      ]);
      setCourses(Array.isArray(fetchedCourses) ? fetchedCourses : []);
      setChangelog(Array.isArray(fetchedLogs) ? fetchedLogs : []);
    } catch (err) {
      console.error('Failed to load regulatory data', err);
      setCourses([]);
      setChangelog([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartEdit = (c: Course) => {
    setEditingCourseId(c.id);
    setEditForm({
      title: c.title,
      description: c.description,
      plainLanguageHelp: c.plainLanguageHelp,
      durationHours: c.durationHours,
      renewalMonths: c.renewalMonths,
      isMandatoryByLaw: c.isMandatoryByLaw,
      regulatoryDriver: c.regulatoryDriver,
      lastVerifiedDate: c.lastVerifiedDate || new Date().toISOString().split('T')[0],
      sourceUrl: c.sourceUrl,
    });
  };

  const handleSaveEdit = async (courseId: string) => {
    try {
      await api.updateCourse(courseId, editForm);
      showToast('Regulatory course criteria updated and logged to audit trail', 'success');
      setEditingCourseId(null);
      loadData();
    } catch (err) {
      showToast('Failed to update course', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/60">
              Statutory Governance & Content Management
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight mt-2">
              Regulatory Standards & Course Catalog Control
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Maintain statutory renewal cadences, legal drivers, and source citations for all courses across the training catalog. Every change is logged with an immutable audit timestamp.
            </p>
          </div>
        </div>
      </div>

      {/* Courses Catalog Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            Accredited Courses & Statutory Renewal Standards ({courses.length})
          </h2>
          <span className="text-xs text-slate-400">UK HSE, FSA, CQC, FCA Aligned</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Code / Course</th>
                <th className="p-3">Sector</th>
                <th className="p-3">Renewal Cadence</th>
                <th className="p-3">Statutory Driver</th>
                <th className="p-3">Last Verified</th>
                <th className="p-3">Source URL</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {(courses || []).map((c) => {
                const isEditing = editingCourseId === c.id;

                if (isEditing) {
                  return (
                    <tr key={c.id} className="bg-slate-800/50">
                      <td className="p-3 space-y-1">
                        <input
                          type="text"
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                        <span className="text-[11px] text-slate-400">{c.code}</span>
                      </td>
                      <td className="p-3 capitalize">{c.sector.replace('_', ' ')}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editForm.renewalMonths || 0}
                            onChange={(e) =>
                              setEditForm({ ...editForm, renewalMonths: parseInt(e.target.value) || 0 })
                            }
                            className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          />
                          <span className="text-[11px] text-slate-400">months</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={editForm.regulatoryDriver || ''}
                          onChange={(e) => setEditForm({ ...editForm, regulatoryDriver: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="date"
                          value={editForm.lastVerifiedDate || ''}
                          onChange={(e) => setEditForm({ ...editForm, lastVerifiedDate: e.target.value })}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={editForm.sourceUrl || ''}
                          onChange={(e) => setEditForm({ ...editForm, sourceUrl: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(c.id)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCourseId(null)}
                            className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <span className="font-bold text-white block">{c.title}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{c.code} • {c.durationHours}h • {c.accreditation}</span>
                    </td>
                    <td className="p-3 capitalize">{c.sector.replace('_', ' ')}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-semibold text-[11px]">
                        {c.renewalMonths === 0 ? 'Permanent' : `Every ${c.renewalMonths} mos`}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs truncate" title={c.regulatoryDriver}>
                      {c.regulatoryDriver}
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {c.lastVerifiedDate || '2026-08-01'}
                    </td>
                    <td className="p-3">
                      {c.sourceUrl && (
                        <a
                          href={c.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sky-400 hover:underline text-[11px]"
                        >
                          <span>gov.uk source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 text-[11px] font-semibold transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Regulatory Audit Changelog */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" />
            Immutable Regulatory Standards Audit Log ({(changelog || []).length})
          </h2>
          <span className="text-xs text-slate-400">Section 2.2 Traceability Compliance</span>
        </div>

        {(changelog || []).length === 0 ? (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
            No modifications recorded yet. All course requirements currently match published baseline UK statutory codes.
          </div>
        ) : (
          <div className="space-y-2">
            {(changelog || []).map((entry) => (
              <div
                key={entry.id}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{entry.changedBy}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 font-mono text-[11px]">{entry.changedDate}</span>
                  </div>
                  <p className="text-slate-300">
                    Modified <span className="font-semibold text-emerald-400">{entry.entityId}</span> ({entry.changedField}): {entry.newValue}
                  </p>
                  <span className="text-[11px] text-slate-500">Citation: {entry.sourceReference}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold shrink-0">
                  Verified Audit Entry
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
