import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PostComposer from '../components/PostComposer';
import PostCard, { FeedPost } from '../components/PostCard';

const SELECT = `
  id, body, created_at,
  author:profiles!posts_author_id_fkey(
    id, full_name, username, avatar_url,
    university:universities(name), department:departments(name), level:academic_levels(name)
  ),
  post_media(id, media_type, storage_path, file_name)
`;

export default function Feed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const load = useCallback(async (reset = false) => {
    const from = reset ? 0 : page * PAGE_SIZE;
    const { data } = await supabase
      .from('posts')
      .select(SELECT)
      .eq('scope', 'feed')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    const rows = (data as unknown as FeedPost[]) ?? [];
    setPosts((prev) => (reset ? rows : [...prev, ...rows]));
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (page > 0) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="px-6 py-8 md:px-10 max-w-xl mx-auto">
      <h1 className="font-display text-3xl font-semibold mb-6">Home</h1>
      <PostComposer onPosted={() => load(true)} />

      {loading ? (
        [...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-ink/5 animate-pulse mb-4" />)
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-ink-soft">
          <p className="font-display text-xl mb-2">Quiet in here</p>
          <p className="text-sm">Be the first to post something.</p>
        </div>
      ) : (
        <>
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
          <button
            onClick={() => setPage((p) => p + 1)}
            className="w-full text-sm text-ink-soft py-3 hover:text-ink"
          >
            Load more
          </button>
        </>
      )}
    </div>
  );
}
