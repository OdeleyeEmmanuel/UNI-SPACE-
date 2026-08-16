import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Bookmark, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import CommentSection from './CommentSection';
import ReportButton from './ReportButton';

export interface FeedPost {
  id: string;
  body: string | null;
  created_at: string;
  author: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    university?: { name: string } | null;
    department?: { name: string } | null;
    level?: { name: string } | null;
  };
  post_media: {
    id: string;
    media_type: string;
    storage_path: string;
    file_name: string;
  }[];
}

const BUCKET_URL = (path: string) => {
  const base = (import.meta.env.VITE_SUPABASE_URL as string) ?? '';
  return `${base}/storage/v1/object/public/post-media/${path}`;
};

export default function PostCard({ post }: { post: FeedPost }) {
  const { profile } = useAuth();
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('reactions')
      .select('user_id', { count: 'exact' })
      .eq('post_id', post.id)
      .then(({ count, data }) => {
        setLikeCount(count ?? 0);
        setLiked(!!data?.some((r) => r.user_id === profile.id));
      });
    supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', post.id)
      .then(({ count }) => setCommentCount(count ?? 0));
    supabase
      .from('saved_posts')
      .select('user_id')
      .eq('post_id', post.id)
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [post.id, profile]);

  const toggleLike = async () => {
    if (!profile) return;
    if (liked) {
      await supabase.from('reactions').delete().eq('post_id', post.id).eq('user_id', profile.id);
      setLiked(false);
      setLikeCount((c) => c - 1);
    } else {
      await supabase.from('reactions').insert({ post_id: post.id, user_id: profile.id, type: 'like' });
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  const toggleSave = async () => {
    if (!profile) return;
    if (saved) {
      await supabase.from('saved_posts').delete().eq('post_id', post.id).eq('user_id', profile.id);
    } else {
      await supabase.from('saved_posts').insert({ post_id: post.id, user_id: profile.id });
    }
    setSaved(!saved);
  };

  return (
    <div className="id-card p-4 mb-4">
      <div className="flex items-start gap-3">
        {post.author.avatar_url ? (
          <img src={post.author.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center text-sm font-medium">
            {post.author.full_name[0]}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{post.author.full_name}</p>
          <p className="text-xs text-ink-soft font-mono truncate">
            @{post.author.username}
            {post.author.department && ` · ${post.author.department.name}`}
            {post.author.university?.name && ` · ${post.author.university.name}`}
          </p>
        </div>
        <div className="ml-auto">
          <ReportButton targetType="post" targetId={post.id} />
        </div>
      </div>

      {post.body && <p className="mt-3 text-sm whitespace-pre-wrap">{post.body}</p>}

      {post.post_media?.map((m) =>
        m.media_type === 'image' ? (
          <img key={m.id} src={BUCKET_URL(m.storage_path)} alt="" className="mt-3 rounded-xl w-full max-h-96 object-cover" />
        ) : (
          <a
            key={m.id}
            href={BUCKET_URL(m.storage_path)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-2 px-3 py-2 bg-paper-dim rounded-lg text-sm"
          >
            <FileText size={16} /> {m.file_name}
          </a>
        )
      )}

      <div className="flex items-center gap-5 mt-3 pt-3 border-t border-ink/10">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 text-sm ${liked ? 'text-coral' : 'text-ink-soft'}`}>
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> {likeCount}
        </button>
        <button onClick={() => setShowComments((s) => !s)} className="flex items-center gap-1.5 text-sm text-ink-soft">
          <MessageCircle size={16} /> {commentCount}
        </button>
        <button onClick={toggleSave} className={`ml-auto text-sm ${saved ? 'text-gold' : 'text-ink-soft'}`}>
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {showComments && <CommentSection postId={post.id} />}
    </div>
  );
}
