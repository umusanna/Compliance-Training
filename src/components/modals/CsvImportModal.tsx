import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number) => void;
  businessId: string;
}

interface ParsedCsvRow {
  name: string;
  email: string;
  roleLevel: string;
  jobTitle?: string;
  department?: string;
  startDate?: string;
  rightToWorkStatus?: string;
  completedCourses?: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  businessId,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadSampleTemplate = () => {
    const csvContent =
      'Name,Email,RoleLevel,JobTitle,Department,StartDate,RightToWorkStatus,CompletedCourses\n' +
      'Eleanor Wright,e.wright@business.co.uk,manager,General Operations Manager,Management,2024-01-15,verified_statutory_excuse,HS-GEN-01,FOOD-L3-01\n' +
      'Liam Gallagher,l.gallagher@business.co.uk,supervisor,Head Chef / Kitchen Lead,Kitchen,2024-02-01,verified_statutory_excuse,FOOD-L3-01,FOOD-ALLERGENS-01\n' +
      'Sophie Bennett,s.bennett@business.co.uk,field_worker,Line Cook,Kitchen,2024-06-10,verified_statutory_excuse,FOOD-L2-01\n' +
      'Tariq Khan,t.khan@business.co.uk,field_worker,Commis Chef,Kitchen,2026-08-01,pending_verification,\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'compliance_learners_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('File is empty');

        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);

        if (lines.length < 2) {
          throw new Error('CSV must contain a header row and at least one worker record');
        }

        const rows: ParsedCsvRow[] = [];
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.trim());
          if (parts.length < 2 || !parts[0] || !parts[1]) continue;

          rows.push({
            name: parts[0],
            email: parts[1],
            roleLevel: parts[2] || 'field_worker',
            jobTitle: parts[3] || 'Staff Member',
            department: parts[4] || 'Operations',
            startDate: parts[5] || new Date().toISOString().split('T')[0],
            rightToWorkStatus: parts[6] || 'pending_verification',
            completedCourses: parts[7] || '',
          });
        }

        if (rows.length === 0) {
          throw new Error('No valid learner rows found. Please check columns match the sample template.');
        }

        setParsedRows(rows);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCommitImport = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/business/${businessId}/learners/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedRows }),
      });

      if (!res.ok) {
        throw new Error('Import failed on server');
      }

      const data = await res.json();
      showToast(`Successfully imported ${data.importedCount} learners into database`, 'success');
      onSuccess(data.importedCount);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing bulk import');
      showToast('Bulk import failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Bulk CSV Import: Learners & Training Records</h2>
              <p className="text-xs text-slate-400">
                Upload existing HR or LMS rosters directly into your client compliance database
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Action Row */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 text-xs">
            <div>
              <span className="font-bold text-white block">Need the standard import format?</span>
              <span className="text-slate-400">Download our formatted CSV template with valid role levels and course codes.</span>
            </div>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </button>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileText className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">
              {fileName ? fileName : 'Click to select CSV file, or drag and drop'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Supports standard CSV exports from Workday, BreatheHR, or Excel</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">
                  {parsedRows.length} Valid Records Ready to Import
                </span>
                <span className="text-slate-400 text-[11px]">Previewing first 5</span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg bg-slate-950 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Role Level</th>
                      <th className="p-2">Job Title</th>
                      <th className="p-2">RTW Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {(parsedRows || []).slice(0, 5).map((r, i) => (
                      <tr key={i}>
                        <td className="p-2 font-medium text-white">{r.name}</td>
                        <td className="p-2 capitalize">{r.roleLevel.replace('_', ' ')}</td>
                        <td className="p-2">{r.jobTitle}</td>
                        <td className="p-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              r.rightToWorkStatus === 'verified_statutory_excuse'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {r.rightToWorkStatus === 'verified_statutory_excuse' ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCommitImport}
            disabled={parsedRows.length === 0 || isProcessing}
            className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Commit Import to Database ({parsedRows.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
