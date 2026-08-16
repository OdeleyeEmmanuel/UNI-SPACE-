import { useEffect, useState } from 'react';
import { ShieldOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function BlockButton({ targetId }: { targetId: string }) {
  const { profile } = useAuth();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', profile.id)
      .eq('blocked_id', targetId)
      .maybeSingle()
      .then(({ data }) => setBlocked(!!data));
  }, [profile, targetId]);

  const toggle = async () => {
    if (!profile) return;
    if (blocked) {
      await supabase.from('blocks').delete().eq('blocker_id', profile.id).eq('blocked_id', targetId);
    } else {
      if (!confirm('Block this user? They will no longer be able to contact you.')) return;
      await supabase.from('blocks').insert({ blocker_id: profile.id, blocked_id: targetId });
    }
    setBlocked(!blocked);
  };

  if (!profile || profile.id === targetId) return null;

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 text-xs ${blocked ? 'text-coral' : 'text-ink-soft hover:text-coral'}`}
    >
      <ShieldOff size={13} /> {blocked ? 'Unblock' : 'Block'}
    </button>
  );
}
