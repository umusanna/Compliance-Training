import React, { useState } from 'react';
import {
  ClipboardCheck,
  Filter,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  ShieldAlert,
  Scale,
  Calendar,
  FileText,
  Paperclip,
  ExternalLink,
  HelpCircle,
  Upload,
  Trash2,
} from 'lucide-react';
import { AuditChecklistItem, AuditItemStatus, ChecklistCategory, EvidenceAttachment } from '../types';
import { useToast } from '../context/ToastContext';

interface ManagerChecklistsViewProps {
  checklists: AuditChecklistItem[];
  onUpdateItem: (id: string, updated: Partial<AuditChecklistItem>) => void;
  onAddItem: (newItem: AuditChecklistItem) => void;
  readOnly?: boolean;
}

export const ManagerChecklistsView: React.FC<ManagerChecklistsViewProps> = ({
  checklists = [],
  onUpdateItem,
  onAddItem,
  readOnly = false,
}) => {
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [attachingToId, setAttachingToId] = useState<string | null>(null);

  // Attachment upload state
  const [docName, setDocName] = useState('');
  const [docNotes, setDocNotes] = useState('');

  // New item form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newHelp, setNewHelp] = useState('');
  const [newRegBody, setNewRegBody] = useState('Local Authority / HSE');
  const [newLegalRef, setNewLegalRef] = useState('HSWA 1974 / Sector Standard');
  const [newPenaltyText, setNewPenaltyText] = useState('Improvement notice and potential enforcement fines.');
  const [newCategory, setNewCategory] = useState<ChecklistCategory>('sector_specific');
  const [newSourceUrl, setNewSourceUrl] = useState('');

  const filteredItems = (checklists || []).filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.regulatoryBody.toLowerCase().includes(q) ||
        item.legalReference.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const compliantCount = (checklists || []).filter((c) => c.status === 'compliant').length;
  const inProgressCount = (checklists || []).filter((c) => c.status === 'in_progress').length;
  const criticalCount = (checklists || []).filter((c) => c.status === 'gap_critical').length;
  const notStartedCount = (checklists || []).filter((c) => c.status === 'not_started').length;

  const handleCreateCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: AuditChecklistItem = {
      id: `custom-chk-${Date.now()}`,
      category: newCategory,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Custom manager audit requirement.',
      plainLanguageHelp: newHelp.trim() || 'Ensure physical documentation or signed records are readily accessible during an audit inspection.',
      regulatoryBody: newRegBody.trim(),
      legalReference: newLegalRef.trim(),
      status: 'in_progress',
      managerNotes: 'Added by audit manager.',
      evidenceDocumented: false,
      lastReviewedDate: new Date().toISOString().split('T')[0],
      penaltyRiskText: newPenaltyText.trim(),
      scoringWeight: 4,
      sourceUrl: newSourceUrl.trim() || undefined,
      attachments: [],
    };

    onAddItem(newItem);
    setNewTitle('');
    setNewDesc('');
    setNewHelp('');
    setShowAddModal(false);
    showToast('Custom audit requirement created', 'success');
  };

  const handleAttachDocument = (itemId: string) => {
    if (!docName.trim()) {
      showToast('Please provide a document title', 'error');
      return;
    }

    const target = checklists.find((c) => c.id === itemId);
    if (!target) return;

    const newAttachment: EvidenceAttachment = {
      id: `att-${Date.now()}`,
      fileName: docName.trim().endsWith('.pdf') ? docName.trim() : `${docName.trim()}.pdf`,
      fileSize: '1.2 MB',
      uploadedDate: new Date().toISOString().split('T')[0],
      uploadedBy: 'Compliance Manager',
      notes: docNotes.trim() || 'Verified against statutory inspection standards.',
    };

    const currentAttachments = target.attachments || [];
    onUpdateItem(itemId, {
      attachments: [...currentAttachments, newAttachment],
      evidenceDocumented: true,
    });

    setDocName('');
    setDocNotes('');
    setAttachingToId(null);
    showToast('Evidence document attached and verified', 'success');
  };

  const handleRemoveAttachment = (itemId: string, attachmentId: string) => {
    const target = checklists.find((c) => c.id === itemId);
    if (!target) return;

    const updated = (target.attachments || []).filter((a) => a.id !== attachmentId);
    onUpdateItem(itemId, {
      attachments: updated,
      evidenceDocumented: updated.length > 0,
    });
    showToast('Evidence document removed', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm text-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-lg">
              2
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Manager Fillable Audit Checklists & Operational Forms
              </h2>
              <p className="text-xs text-slate-400">
                Documented evidence, statutory inspection registers, and non-training compliance controls (40% audit weighting).
              </p>
            </div>
          </div>

          {!readOnly && (
            <button
              type="button"
              id="add-custom-audit-item-btn"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm shrink-0 self-start md:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom Checklist Item</span>
            </button>
          )}
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 text-center">
            <div className="text-emerald-400 font-semibold">Compliant</div>
            <div className="text-xl font-black text-white mt-0.5">{compliantCount}</div>
          </div>
          <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-3 text-center">
            <div className="text-blue-400 font-semibold">In Progress</div>
            <div className="text-xl font-black text-white mt-0.5">{inProgressCount}</div>
          </div>
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-center">
            <div className="text-rose-400 font-semibold">Critical Gaps</div>
            <div className="text-xl font-black text-white mt-0.5">{criticalCount}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-slate-400 font-semibold">Not Started</div>
            <div className="text-xl font-black text-white mt-0.5">{notStartedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="search-checklists"
              type="text"
              placeholder="Search checklist or regulation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
            <Filter className="h-3 w-3 text-slate-400" />
            <span className="text-slate-500 text-[11px]">Category:</span>
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-slate-900">All Categories</option>
              <option value="sector_specific" className="bg-slate-900">Sector Regulated</option>
              <option value="universal_employment" className="bg-slate-900">Right to Work & Wages</option>
              <option value="universal_hse" className="bg-slate-900">HSE Workplace Safety</option>
              <option value="universal_gdpr" className="bg-slate-900">Data Protection (ICO)</option>
              <option value="universal_companies_house" className="bg-slate-900">Companies House & Tax</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
            <span className="text-slate-500 text-[11px]">Status:</span>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-slate-900">All Statuses</option>
              <option value="compliant" className="bg-slate-900">Compliant</option>
              <option value="in_progress" className="bg-slate-900">In Progress</option>
              <option value="gap_critical" className="bg-slate-900">Critical Gap</option>
              <option value="not_started" className="bg-slate-900">Not Started</option>
            </select>
          </div>
        </div>
      </div>

      {/* Checklist Items List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
            No checklist items match the current filters.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-5 transition-shadow shadow-sm ${
                item.status === 'gap_critical'
                  ? 'bg-rose-950/20 border-rose-900/60'
                  : item.status === 'in_progress'
                  ? 'bg-blue-950/20 border-blue-900/60'
                  : item.status === 'compliant'
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left: Title, Description, Legal tags & Inspector Help Text */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-sm font-bold text-white">{item.title}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded border border-slate-700">
                      {item.regulatoryBody}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ref: {item.legalReference}
                    </span>
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:underline text-[10px] inline-flex items-center gap-1 font-medium"
                      >
                        <span>gov.uk guide</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

                  {/* Section 5: Plain Language Guidance */}
                  {item.plainLanguageHelp && (
                    <div className="text-xs bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-300 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white font-semibold block text-[11px] uppercase tracking-wider text-emerald-400">
                          What an Auditor Looks For & How to Pass:
                        </strong>
                        <span className="text-slate-300 leading-relaxed">{item.plainLanguageHelp}</span>
                      </div>
                    </div>
                  )}

                  {/* Statutory Penalty Risk Callout */}
                  <div className="text-[11px] bg-rose-950/30 border border-rose-900/50 rounded-xl px-3 py-2 text-rose-200 flex items-start space-x-2">
                    <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold text-white">Statutory Enforcement Consequence:</strong>{' '}
                      {item.penaltyRiskText}
                    </span>
                  </div>

                  {/* Evidence Documentation Section */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Attached Evidence Files ({item.attachments?.length || (item.evidenceDocumented ? 1 : 0)})</span>
                      </span>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => setAttachingToId(attachingToId === item.id ? null : item.id)}
                          className="text-xs text-emerald-400 hover:underline font-semibold inline-flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          <span>{attachingToId === item.id ? 'Cancel Upload' : 'Attach Document'}</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Attachment Form */}
                    {attachingToId === item.id && (
                      <div className="mt-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                        <span className="font-bold text-white block">Attach Document / Verification Record</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Document name (e.g. Fire Risk Assessment 2026.pdf)"
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Inspection notes or certificate ref"
                            value={docNotes}
                            onChange={(e) => setDocNotes(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 text-xs"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setAttachingToId(null)}
                            className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttachDocument(item.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs"
                          >
                            Attach File
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Attached files list */}
                    {item.attachments && item.attachments.length > 0 ? (
                      <div className="mt-2 space-y-1.5">
                        {item.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-emerald-400" />
                              <div>
                                <span className="font-semibold text-white">{att.fileName}</span>
                                <span className="text-slate-500 text-[11px] ml-2">
                                  ({att.fileSize} • Uploaded {att.uploadedDate} by {att.uploadedBy})
                                </span>
                              </div>
                            </div>
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(item.id, att.id)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                                title="Remove attachment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : item.evidenceDocumented ? (
                      <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Signed off and confirmed in physical company register</span>
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-slate-500 italic">
                        No documentary evidence attached yet. (Evidence upload provides score bonus).
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Controls (Status Selector, Evidence Toggle, Review Date) */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 lg:w-64 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                  {/* Status Dropdown */}
                  <div className="w-full sm:w-auto lg:w-full">
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Preparation Status
                    </label>
                    <select
                      id={`status-${item.id}`}
                      value={item.status}
                      disabled={readOnly}
                      onChange={(e) =>
                        onUpdateItem(item.id, { status: e.target.value as AuditItemStatus })
                      }
                      className={`w-full text-xs font-bold rounded-xl px-3 py-2 border cursor-pointer focus:outline-none ${
                        item.status === 'compliant'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : item.status === 'in_progress'
                          ? 'bg-blue-950 text-blue-300 border-blue-800'
                          : item.status === 'gap_critical'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <option value="compliant">Compliant (100%)</option>
                      <option value="in_progress">In Progress (50%)</option>
                      <option value="gap_critical">Critical Gap (0%)</option>
                      <option value="not_started">Not Started (0%)</option>
                    </select>
                  </div>

                  {/* Evidence Toggle */}
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      id={`evidence-${item.id}`}
                      type="checkbox"
                      disabled={readOnly}
                      checked={item.evidenceDocumented}
                      onChange={(e) => onUpdateItem(item.id, { evidenceDocumented: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium flex items-center space-x-1">
                      <FileCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Evidence Attached / Signed</span>
                    </span>
                  </label>

                  {/* Review Date */}
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span>Audited:</span>
                    <input
                      type="date"
                      disabled={readOnly}
                      value={item.lastReviewedDate || ''}
                      onChange={(e) => onUpdateItem(item.id, { lastReviewedDate: e.target.value })}
                      className="bg-transparent text-slate-300 text-[11px] font-medium border-0 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom: Inline Manager Notes */}
              <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 flex items-center space-x-2 text-xs">
                <span className="text-slate-400 font-semibold shrink-0">Manager Notes:</span>
                <input
                  id={`notes-${item.id}`}
                  type="text"
                  disabled={readOnly}
                  placeholder="Record policy numbers, audit dates, contractor names, or remediation actions..."
                  value={item.managerNotes}
                  onChange={(e) => onUpdateItem(item.id, { managerNotes: e.target.value })}
                  className="w-full bg-slate-950 hover:bg-slate-800/60 focus:bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none text-xs transition-colors"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Custom Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-700 text-slate-100">
            <h3 className="text-base font-bold text-white mb-1">
              Add Custom Manager Checklist Item
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add specialized company policies, local council license clauses, or internal audits.
            </p>

            <form onSubmit={handleCreateCustomItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Checklist Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Legionella Risk Assessment & Flushing Log"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Description & Evidence Required
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe the required procedure or physical file to inspect..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Plain-Language Auditor Help (What to show an inspector)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Must show signed water temperature test records conducted every 30 days."
                  value={newHelp}
                  onChange={(e) => setNewHelp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Regulatory Body
                  </label>
                  <input
                    type="text"
                    value={newRegBody}
                    onChange={(e) => setNewRegBody(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Legal Citation
                  </label>
                  <input
                    type="text"
                    value={newLegalRef}
                    onChange={(e) => setNewLegalRef(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ChecklistCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="sector_specific">Sector Specific</option>
                  <option value="universal_hse">HSE Workplace Safety</option>
                  <option value="universal_employment">Right to Work & Wages</option>
                  <option value="universal_gdpr">Data Protection (ICO)</option>
                  <option value="universal_companies_house">Companies House & Tax</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Enforcement Risk / Penalty Text
                </label>
                <input
                  type="text"
                  value={newPenaltyText}
                  onChange={(e) => setNewPenaltyText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Source Guidance URL (gov.uk or regulator link)
                </label>
                <input
                  type="text"
                  placeholder="https://www.hse.gov.uk/..."
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 font-medium hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-sm"
                >
                  Save Checklist Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
