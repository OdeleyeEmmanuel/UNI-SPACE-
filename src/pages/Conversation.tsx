import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface MessageRow {
  id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
  sender: { full_name: string; avatar_url: string | null };
}

export default function Conversation() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState('');
  const [title, setTitle] = useState('Conversation');
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, body, created_at, sender:profiles!messages_sender_id_fkey(full_name, avatar_url)')
      .eq('conversation_id', id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
    setMessages((data as unknown as MessageRow[]) ?? []);
  };

  const loadTitle = async () => {
    if (!id || !profile) return;
    const { data: convo } = await supabase.from('conversations').select('type, name').eq('id', id).single();
    if (convo?.type === 'group') {
      setTitle(convo.name ?? 'Group');
    } else {
      const { data: member } = await supabase
        .from('conversation_members')
        .select('profiles(full_name)')
        .eq('conversation_id', id)
        .neq('user_id', profile.id)
        .maybeSingle();
      setTitle((member as any)?.profiles?.full_name ?? 'Conversation');
    }
  };

  useEffect(() => {
    load();
    loadTitle();

    // mark read
    if (id && profile) {
      supabase.from('conversation_members').update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', id).eq('user_id', profile.id).then();
    }

    if (!id) return;
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, profile?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    if (!profile || !id || !draft.trim()) return;
    const body = draft.trim();
    setDraft('');
    await supabase.from('messages').insert({ conversation_id: id, sender_id: profile.id, body });
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-ink/10 bg-paper">
        <Link to="/messages" className="text-ink-soft"><ArrowLeft size={20} /></Link>
        <p className="font-medium">{title}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => {
          const mine = m.sender_id === profile?.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                  mine ? 'bg-ink text-paper rounded-br-sm' : 'bg-paper-dim text-ink rounded-bl-sm'
                }`}
              >
                {m.body}
                <p className={`text-[10px] mt-1 ${mine ? 'text-paper/60' : 'text-ink-soft'}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-ink/10 bg-paper">
        <button className="text-ink-soft" aria-label="Attach file">
          <Paperclip size={18} />
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Message…"
          className="flex-1 px-4 py-2.5 rounded-full border border-ink/15 outline-none focus:border-gold text-sm"
        />
        <button onClick={send} disabled={!draft.trim()} className="seal w-10 h-10 rounded-full disabled:opacity-40">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
