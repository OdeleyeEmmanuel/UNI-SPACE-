import { useState } from 'react';
import { Flag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function ReportButton({
  targetType,
  targetId,
}: {
  targetType: 'post' | 'comment' | 'profile' | 'message' | 'resource';
  targetId: string;
}) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!profile || !reason.trim()) return;
    await supabase.from('reports').insert({
      reporter_id: profile.id,
      target_type: targetType,
      target_id: targetId,
      reason: reason.trim(),
    });
    setSent(true);
    setTimeout(() => setOpen(false), 1200);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-ink-soft hover:text-coral" aria-label="Report">
        <Flag size={14} />
      </button>
      {open && (
        <div className="fixed inset-0 bg-ink/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-paper rounded-2xl p-5 w-full max-w-sm">
            {sent ? (
              <p className="text-sm text-center py-4">Report submitted. Thank you.</p>
            ) : (
              <>
                <h3 className="font-display text-lg font-semibold mb-3">Report content</h3>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="What's wrong with this?"
                  className="w-full px-3 py-2 rounded-lg border border-ink/15 text-sm outline-none focus:border-gold"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => setOpen(false)} className="text-sm text-ink-soft">Cancel</button>
                  <button
                    onClick={submit}
                    disabled={!reason.trim()}
                    className="seal px-4 py-1.5 text-xs rounded-full disabled:opacity-40"
                  >
                    Submit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
