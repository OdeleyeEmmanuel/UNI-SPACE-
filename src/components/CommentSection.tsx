import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface CommentRow {
  id: string;
  body: string;
  created_at: string;
  author: { id: string; full_name: string; username: string; avatar_url: string | null };
}

export default function CommentSection({ postId }: { postId: string }) {
  const { profile } = useAuth();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('comments')
      .select('id, body, created_at, author:profiles!comments_author_id_fkey(id,full_name,username,avatar_url)')
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
    setComments((data as unknown as CommentRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const submit = async () => {
    if (!profile || !draft.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from('comments')
      .insert({ post_id: postId, author_id: profile.id, body: draft.trim() });
    setSending(false);
    if (!error) {
      setDraft('');
      load();
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-ink/10 space-y-3">
      {loading ? (
        <p className="text-xs text-ink-soft">Loading comments…</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex gap-2 text-sm">
            <div className="w-7 h-7 rounded-full bg-ink/10 flex items-center justify-center text-xs font-medium shrink-0">
              {c.author.full_name[0]}
            </div>
            <div>
              <span className="font-medium">{c.author.full_name}</span>{' '}
              <span className="text-ink-soft">{c.body}</span>
            </div>
          </div>
        ))
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Write a comment…"
          className="flex-1 px-3 py-1.5 rounded-full border border-ink/15 text-sm outline-none focus:border-gold"
        />
        <button
          onClick={submit}
          disabled={sending || !draft.trim()}
          className="text-xs font-medium text-ink-soft hover:text-ink disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
