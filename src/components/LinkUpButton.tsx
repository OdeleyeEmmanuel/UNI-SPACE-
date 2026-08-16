import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Connection, LinkUpViewState } from '../types';

function deriveState(conn: Connection | null, myId: string): LinkUpViewState {
  if (!conn) return 'none';
  if (conn.status === 'declined') return 'declined';
  if (conn.status === 'blocked') return 'blocked';
  if (conn.status === 'accepted') return 'connected';
  // pending
  return conn.requester_id === myId ? 'request_sent' : 'request_received';
}

export default function LinkUpButton({ targetId }: { targetId: string }) {
  const { profile } = useAuth();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('connections')
      .select('*')
      .or(
        `and(requester_id.eq.${profile.id},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${profile.id})`
      )
      .maybeSingle();
    setConnection((data as Connection) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, profile?.id]);

  if (!profile || profile.id === targetId) return null;

  const state = deriveState(connection, profile.id);

  const sendRequest = async () => {
    setBusy(true);
    const { error } = await supabase
      .from('connections')
      .insert({ requester_id: profile.id, addressee_id: targetId, status: 'pending' });
    setBusy(false);
    if (!error) load();
  };

  const respond = async (status: 'accepted' | 'declined') => {
    if (!connection) return;
    setBusy(true);
    const { error } = await supabase
      .from('connections')
      .update({ status })
      .eq('id', connection.id);
    setBusy(false);
    if (!error) load();
  };

  const cancelOrRemove = async () => {
    if (!connection) return;
    setBusy(true);
    const { error } = await supabase.from('connections').delete().eq('id', connection.id);
    setBusy(false);
    if (!error) load();
  };

  if (loading) {
    return <div className="h-9 w-28 rounded-full bg-ink/5 animate-pulse" />;
  }

  if (state === 'none' || state === 'declined') {
    return (
      <button
        onClick={sendRequest}
        disabled={busy}
        className="seal px-5 py-2 text-xs rounded-full disabled:opacity-50"
      >
        Link Up
      </button>
    );
  }

  if (state === 'request_sent') {
    return (
      <button
        onClick={cancelOrRemove}
        disabled={busy}
        className="px-5 py-2 text-xs font-mono rounded-full border border-ink/20 text-ink-soft hover:border-coral hover:text-coral transition-colors"
      >
        Request sent · Cancel
      </button>
    );
  }

  if (state === 'request_received') {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => respond('accepted')}
          disabled={busy}
          className="seal px-4 py-2 text-xs rounded-full"
        >
          Accept
        </button>
        <button
          onClick={() => respond('declined')}
          disabled={busy}
          className="px-4 py-2 text-xs rounded-full border border-ink/20 text-ink-soft"
        >
          Decline
        </button>
      </div>
    );
  }

  if (state === 'connected') {
    return (
      <div className="flex items-center gap-2">
        <span className="px-4 py-2 text-xs font-mono rounded-full bg-sage/10 text-sage border border-sage/30">
          Connected
        </span>
        <button
          onClick={cancelOrRemove}
          disabled={busy}
          className="text-xs text-ink-soft underline"
        >
          Remove
        </button>
      </div>
    );
  }

  return null;
}
