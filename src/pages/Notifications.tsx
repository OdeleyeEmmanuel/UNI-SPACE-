import { useEffect, useState } from 'react';
import { Bell, UserPlus, CheckCircle2, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { AppNotification } from '../types';

const ICONS: Record<string, typeof Bell> = {
  link_up_request: UserPlus,
  link_up_accepted: CheckCircle2,
  new_message: MessageSquare,
};

export default function Notifications() {
  const { profile } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(id,full_name,username,avatar_url)')
      .eq('recipient_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setItems((data as unknown as AppNotification[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!profile) return;

    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${profile.id}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', profile.id).eq('is_read', false);
    load();
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="px-6 py-8 md:px-10 max-w-2xl mx-auto grain-bg min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Notice board</h1>
          <p className="text-sm text-ink-soft">{unreadCount > 0 ? `${unreadCount} new` : 'All caught up'}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-ink-soft underline shrink-0">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-ink/5 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-ink-soft">
          <Bell className="mx-auto mb-3 opacity-40" />
          <p className="font-display text-xl mb-1">Nothing pinned yet</p>
          <p className="text-sm">Link Up requests and replies will show up here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((n, i) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <div
                key={n.id}
                className="relative"
                style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 0.6}deg)` }}
              >
                {!n.is_read && <div className="pin absolute -top-1.5 left-1/2 -translate-x-1/2 z-10" />}
                <div className={`id-card p-4 h-full ${n.is_read ? 'opacity-70' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-paper-dim flex items-center justify-center shrink-0 border border-ink/10">
                      <Icon size={16} className="text-gold" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm">
                        {n.actor && <span className="font-medium">{n.actor.full_name}</span>}{' '}
                        <span className="text-ink-soft">{n.message}</span>
                      </p>
                      <p className="text-[11px] text-ink-soft/70 font-mono mt-1.5 uppercase tracking-wide">
                        {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {' · '}
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
