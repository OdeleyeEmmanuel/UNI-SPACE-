import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ConvoRow {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  image_url: string | null;
  lastMessage?: { body: string | null; created_at: string } | null;
  otherUser?: { full_name: string; username: string; avatar_url: string | null } | null;
}

export default function Messages() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [convos, setConvos] = useState<ConvoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [connections, setConnections] = useState<{ id: string; full_name: string; username: string; avatar_url: string | null }[]>([]);

  const load = async () => {
    if (!profile) return;
    const { data: memberships } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', profile.id);

    const convoIds = (memberships ?? []).map((m) => m.conversation_id);
    if (convoIds.length === 0) {
      setConvos([]);
      setLoading(false);
      return;
    }

    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, type, name, image_url')
      .in('id', convoIds);

    const enriched: ConvoRow[] = [];
    for (const c of conversations ?? []) {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('body, created_at')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let otherUser = null;
      if (c.type === 'direct') {
        const { data: members } = await supabase
          .from('conversation_members')
          .select('user_id, profiles(full_name, username, avatar_url)')
          .eq('conversation_id', c.id)
          .neq('user_id', profile.id)
          .maybeSingle();
        otherUser = (members as any)?.profiles ?? null;
      }
      enriched.push({ ...c, lastMessage: lastMsg, otherUser });
    }

    enriched.sort((a, b) => {
      const ta = a.lastMessage?.created_at ?? '';
      const tb = b.lastMessage?.created_at ?? '';
      return tb.localeCompare(ta);
    });

    setConvos(enriched);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('connections')
      .select('requester_id, addressee_id, requester:profiles!connections_requester_id_fkey(id,full_name,username,avatar_url), addressee:profiles!connections_addressee_id_fkey(id,full_name,username,avatar_url)')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
      .then(({ data }) => {
        const people = (data ?? []).map((row: any) =>
          row.requester_id === profile.id ? row.addressee : row.requester
        );
        setConnections(people);
      });
  }, [profile]);

  const startDirect = async (otherId: string) => {
    if (!profile) return;
    // Check for an existing direct conversation between the two
    const { data: mine } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', profile.id);
    const { data: theirs } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', otherId);
    const shared = (mine ?? []).map((m) => m.conversation_id).filter((id) => (theirs ?? []).some((t) => t.conversation_id === id));
    if (shared.length > 0) {
      navigate(`/messages/${shared[0]}`);
      return;
    }

    const { data: convo, error } = await supabase
      .from('conversations')
      .insert({ type: 'direct', created_by: profile.id })
      .select()
      .single();
    if (error || !convo) return;

    await supabase.from('conversation_members').insert([
      { conversation_id: convo.id, user_id: profile.id, role: 'admin' },
      { conversation_id: convo.id, user_id: otherId, role: 'member' },
    ]);
    navigate(`/messages/${convo.id}`);
  };

  return (
    <div className="px-6 py-8 md:px-10 max-w-lg mx-auto">
      <h1 className="font-display text-3xl font-semibold mb-6">Messages</h1>

      {connections.length > 0 && (
        <div className="mb-6 -mx-1 overflow-x-auto flex gap-3 px-1 pb-1">
          {connections.map((c) => (
            <button key={c.id} onClick={() => startDirect(c.id)} className="flex flex-col items-center gap-1 shrink-0">
              {c.avatar_url ? (
                <img src={c.avatar_url} className="w-12 h-12 rounded-full object-cover border-2 border-gold" alt="" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-ink text-paper flex items-center justify-center font-medium border-2 border-gold">
                  {c.full_name[0]}
                </div>
              )}
              <span className="text-xs text-ink-soft truncate w-14 text-center">{c.full_name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        [...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-ink/5 animate-pulse mb-2" />)
      ) : convos.length === 0 ? (
        <div className="text-center py-16 text-ink-soft">
          <p className="font-display text-xl mb-2">No conversations yet</p>
          <p className="text-sm">Link Up with someone, then tap their avatar above to start chatting.</p>
        </div>
      ) : (
        <div className="divide-y divide-ink/10">
          {convos.map((c) => {
            const displayName = c.type === 'group' ? c.name ?? 'Group' : c.otherUser?.full_name ?? 'Unknown';
            const avatar = c.type === 'group' ? c.image_url : c.otherUser?.avatar_url;
            return (
              <Link key={c.id} to={`/messages/${c.id}`} className="flex items-center gap-3 py-3">
                {avatar ? (
                  <img src={avatar} className="w-11 h-11 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-ink/10 flex items-center justify-center">
                    {c.type === 'group' ? <Users size={18} /> : <span className="font-medium">{displayName[0]}</span>}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{displayName}</p>
                  <p className="text-xs text-ink-soft truncate">{c.lastMessage?.body ?? 'No messages yet'}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
