import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, FileText, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import PostComposer from '../components/PostComposer';
import PostCard, { FeedPost } from '../components/PostCard';

const POST_SELECT = `
  id, body, created_at,
  author:profiles!posts_author_id_fkey(
    id, full_name, username, avatar_url,
    university:universities(name), department:departments(name), level:academic_levels(name)
  ),
  post_media(id, media_type, storage_path, file_name)
`;

interface Resource {
  id: string;
  title: string;
  file_name: string;
  storage_path: string;
  file_size_bytes: number;
  created_at: string;
  uploader: { full_name: string };
}

export default function Community() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [community, setCommunity] = useState<{ name: string; description: string | null; member_count: number } | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [tab, setTab] = useState<'posts' | 'resources'>('posts');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadCommunity = async () => {
    if (!id) return;
    const { data } = await supabase.from('communities').select('name, description, member_count').eq('id', id).single();
    setCommunity(data);
    if (profile) {
      const { data: mem } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', id)
        .eq('user_id', profile.id)
        .maybeSingle();
      setIsMember(!!mem);
    }
  };

  const loadPosts = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('community_id', id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    setPosts((data as unknown as FeedPost[]) ?? []);
  };

  const loadResources = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('resources')
      .select('id, title, file_name, storage_path, file_size_bytes, created_at, uploader:profiles!resources_uploader_id_fkey(full_name)')
      .eq('community_id', id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    setResources((data as unknown as Resource[]) ?? []);
  };

  useEffect(() => {
    loadCommunity();
    loadPosts();
    loadResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, profile?.id]);

  const join = async () => {
    if (!profile || !id) return;
    await supabase.from('community_members').insert({ community_id: id, user_id: profile.id });
    setIsMember(true);
    loadCommunity();
  };

  const uploadResource = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile || !id) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('File must be under 50MB.');
      return;
    }
    setUploading(true);
    const path = `${profile.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('resources').upload(path, file);
    if (!error) {
      await supabase.from('resources').insert({
        community_id: id,
        uploader_id: profile.id,
        university_id: profile.university_id,
        title: file.name,
        storage_path: path,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
      });
      loadResources();
    }
    setUploading(false);
  };

  const downloadResource = async (r: Resource) => {
    const { data } = await supabase.storage.from('resources').createSignedUrl(r.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    await supabase.rpc('increment_download_count', { resource_id: r.id });
  };

  if (!community) return <div className="px-6 py-8"><div className="h-32 rounded-2xl bg-ink/5 animate-pulse max-w-xl" /></div>;

  return (
    <div className="px-6 py-8 md:px-10 max-w-xl mx-auto">
      <h1 className="font-display text-3xl font-semibold mb-1">{community.name}</h1>
      <p className="text-ink-soft text-sm mb-4">
        {community.member_count} member{community.member_count === 1 ? '' : 's'} across every university
      </p>

      {!isMember && (
        <button onClick={join} className="seal px-5 py-2 text-xs rounded-full mb-6">Join community</button>
      )}

      <div className="flex gap-4 mb-6 border-b border-ink/10">
        {(['posts', 'resources'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium capitalize border-b-2 -mb-px ${
              tab === t ? 'border-gold text-ink' : 'border-transparent text-ink-soft'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'posts' && (
        isMember ? (
          <>
            <PostComposer communityId={id} onPosted={loadPosts} />
            {posts.length === 0 ? (
              <p className="text-center text-ink-soft py-10 text-sm">No posts yet — start the discussion.</p>
            ) : (
              posts.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </>
        ) : (
          <p className="text-center text-ink-soft py-10 text-sm">Join the community to see and share posts.</p>
        )
      )}

      {tab === 'resources' && (
        <div>
          {isMember && (
            <>
              <button
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 mb-4 seal px-4 py-2 text-xs rounded-full"
              >
                <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload PDF or document'}
              </button>
              <input ref={fileInput} type="file" hidden accept=".pdf,.doc,.docx" onChange={uploadResource} />
            </>
          )}
          <div className="space-y-2">
            {resources.map((r) => (
              <div key={r.id} className="id-card p-4 flex items-center gap-3">
                <FileText size={20} className="text-gold shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.file_name}</p>
                  <p className="text-xs text-ink-soft">
                    {(r.file_size_bytes / 1024 / 1024).toFixed(1)}MB · {r.uploader.full_name}
                  </p>
                </div>
                <button onClick={() => downloadResource(r)} className="text-ink-soft hover:text-ink" aria-label="Download">
                  <Download size={16} />
                </button>
              </div>
            ))}
            {resources.length === 0 && <p className="text-center text-ink-soft py-10 text-sm">No resources shared yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
