import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Profile as ProfileType } from '../types';

const SELECT = `
  *,
  university:universities(id,name,short_name,city),
  faculty:faculties(id,name),
  department:departments(id,name),
  level:academic_levels(id,name)
`;

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [full, setFull] = useState<ProfileType | null>(null);
  const [bio, setBio] = useState('');
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase.from('profiles').select(SELECT).eq('id', profile.id).single();
    setFull(data as unknown as ProfileType);
    setBio((data as any)?.bio ?? '');

    const { count } = await supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
      .eq('status', 'accepted');
    setConnectionCount(count ?? 0);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const saveBio = async () => {
    if (!profile) return;
    await supabase.from('profiles').update({ bio }).eq('id', profile.id);
    setEditing(false);
    load();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }

    setUploading(true);
    const path = `${profile.id}/avatar.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      alert(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: pub.publicUrl }).eq('id', profile.id);
    await refreshProfile();
    setUploading(false);
    load();
  };

  if (!full) {
    return <div className="px-6 py-8"><div className="h-40 rounded-2xl bg-ink/5 animate-pulse max-w-md" /></div>;
  }

  const initials = full.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="px-6 py-8 md:px-10 max-w-xl mx-auto">
      <div className="id-card p-6">
        <div className="flex items-center gap-4 pt-2">
          <div className="relative">
            {full.avatar_url ? (
              <img src={full.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-gold" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-ink text-paper flex items-center justify-center font-display text-2xl font-semibold border-2 border-gold">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold flex items-center justify-center border-2 border-paper"
              aria-label="Change photo"
            >
              <Camera size={13} className="text-ink" />
            </button>
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="font-display text-xl font-semibold">{full.full_name}</p>
            <p className="text-sm text-ink-soft font-mono">@{full.username}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-ink-soft text-xs uppercase tracking-wide font-mono mb-0.5">University</p>
            <p className="font-medium">{full.university?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-ink-soft text-xs uppercase tracking-wide font-mono mb-0.5">Level</p>
            <p className="font-medium">{full.level?.name ?? '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-ink-soft text-xs uppercase tracking-wide font-mono mb-0.5">Department</p>
            <p className="font-medium">{full.department?.name ?? '—'}</p>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-ink/10">
          <p className="text-ink-soft text-xs uppercase tracking-wide font-mono mb-1.5">Bio</p>
          {editing ? (
            <div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-ink/15 bg-white outline-none focus:border-gold text-sm"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={saveBio} className="seal px-4 py-1.5 text-xs rounded-full">Save</button>
                <button onClick={() => setEditing(false)} className="text-xs text-ink-soft underline">Cancel</button>
              </div>
            </div>
          ) : (
            <p onClick={() => setEditing(true)} className="text-sm cursor-pointer hover:text-ink-soft">
              {full.bio || <span className="text-ink-soft italic">Add a bio…</span>}
            </p>
          )}
        </div>

        <div className="mt-5 pt-5 border-t border-ink/10 flex items-center justify-between">
          <span className="text-sm text-ink-soft">Connections</span>
          <span className="font-display text-2xl font-semibold">{connectionCount}</span>
        </div>
      </div>
    </div>
  );
}
