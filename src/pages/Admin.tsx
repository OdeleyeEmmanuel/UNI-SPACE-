import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ReportRow {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: { full_name: string; username: string };
}

export default function Admin() {
  const { profile } = useAuth();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from('reports')
      .select('id, target_type, target_id, reason, status, created_at, reporter:profiles!reports_reporter_id_fkey(full_name, username)')
      .order('created_at', { ascending: false });
    setReports((data as unknown as ReportRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.role === 'admin' || profile?.role === 'moderator') load();
  }, [profile]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('reports').update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null }).eq('id', id);
    load();
  };

  if (!profile) return null;
  if (profile.role !== 'admin' && profile.role !== 'moderator') return <Navigate to="/home" replace />;

  return (
    <div className="px-6 py-8 md:px-10 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-semibold mb-1">Moderation queue</h1>
      <p className="text-ink-soft mb-6">Reports from students, newest first.</p>

      {loading ? (
        [...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-ink/5 animate-pulse mb-2" />)
      ) : reports.length === 0 ? (
        <p className="text-center text-ink-soft py-16 text-sm">No reports. All clear.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="id-card p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono uppercase tracking-wide text-gold">{r.target_type}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    r.status === 'open' ? 'bg-coral/10 text-coral' : 'bg-sage/10 text-sage'
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <p className="text-sm">{r.reason}</p>
              <p className="text-xs text-ink-soft mt-1">
                Reported by {r.reporter.full_name} · {new Date(r.created_at).toLocaleDateString()}
              </p>
              {r.status === 'open' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => updateStatus(r.id, 'resolved')} className="text-xs font-medium text-sage underline">
                    Resolve
                  </button>
                  <button onClick={() => updateStatus(r.id, 'dismissed')} className="text-xs font-medium text-ink-soft underline">
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
