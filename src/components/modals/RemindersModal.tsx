import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({
  isOpen,
  onClose,
  businessId,
}) => {
  const { showToast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [dispatchedLogs, setDispatchedLogs] = useState<any[] | null>(null);

  if (!isOpen) return null;

  const handleSendReminders = async () => {
    setIsSending(true);
    try {
      const res = await fetch(`/api/business/${businessId}/reminders/send`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to dispatch reminders');
      const data = await res.json();
      setDispatchedLogs(Array.isArray(data?.notifications) ? data.notifications : []);
      showToast(`Dispatched ${data.dispatchedCount || 0} proactive compliance reminder emails`, 'success');
    } catch (err: any) {
      showToast('Error dispatching notifications', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white shadow">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Proactive Compliance Reminder Dispatcher</h2>
              <p className="text-xs text-slate-400">
                Automated statutory notices for expiring certificates and pending Right to Work checks
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {!dispatchedLogs ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 text-slate-300 space-y-2">
                <span className="font-bold text-white block">Statutory Early Warning Workflow</span>
                <p className="leading-relaxed">
                  Triggers personalized email notifications to any worker who:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Holds a mandatory training certificate that has <span className="text-rose-400 font-semibold">expired</span> or expires within the next 30 days</li>
                  <li>Has an unverified <span className="text-amber-400 font-semibold">Right to Work</span> status (preventing £45,000 civil penalty liability)</li>
                </ul>
              </div>

              <div className="p-4 bg-sky-950/40 border border-sky-800/60 rounded-xl text-sky-200 text-xs">
                All dispatches include the exact direct link to the LMS refresher module or Home Office share code upload portal.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>{dispatchedLogs.length} Compliance Notifications Dispatched</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {dispatchedLogs.map((item, i) => (
                  <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{item.recipientName} ({item.recipientEmail})</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                        {item.triggerType}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] italic">"{item.messagePreview}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
          >
            Close
          </button>
          {!dispatchedLogs && (
            <button
              type="button"
              onClick={handleSendReminders}
              disabled={isSending}
              className="inline-flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Send Statutory Reminders Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
