import { useRef, useState } from 'react';
import { Image as ImageIcon, FileText, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function PostComposer({
  communityId,
  onPosted,
}: {
  communityId?: string;
  onPosted: () => void;
}) {
  const { profile } = useAuth();
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const isPdf = file?.type === 'application/pdf';

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) {
      setError('File must be under 25MB.');
      return;
    }
    setError(null);
    setFile(f);
  };

  const submit = async () => {
    if (!profile || (!body.trim() && !file)) return;
    setPosting(true);
    setError(null);

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        author_id: profile.id,
        community_id: communityId ?? null,
        scope: communityId ? 'community' : 'feed',
        body: body.trim() || null,
      })
      .select()
      .single();

    if (postError || !post) {
      setError(postError?.message ?? 'Could not create post.');
      setPosting(false);
      return;
    }

    if (file) {
      const path = `${profile.id}/${post.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage.from('post-media').upload(path, file);
      if (!uploadError) {
        await supabase.from('post_media').insert({
          post_id: post.id,
          media_type: isPdf ? 'pdf' : file.type.startsWith('image/') ? 'image' : 'document',
          storage_path: path,
          file_name: file.name,
          file_size_bytes: file.size,
        });
      }
    }

    setBody('');
    setFile(null);
    setPosting(false);
    onPosted();
  };

  return (
    <div className="id-card p-4 mb-6">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={communityId ? 'Share something with the community…' : "What's on your mind?"}
        rows={3}
        className="w-full outline-none resize-none text-sm placeholder:text-ink-soft"
      />

      {file && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-paper-dim rounded-lg text-sm">
          {isPdf ? <FileText size={16} /> : <ImageIcon size={16} />}
          <span className="flex-1 truncate">{file.name}</span>
          <button onClick={() => setFile(null)} aria-label="Remove attachment">
            <X size={14} />
          </button>
        </div>
      )}

      {error && <p className="text-coral text-xs mt-2">{error}</p>}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink/10">
        <button
          onClick={() => fileInput.current?.click()}
          className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
        >
          <ImageIcon size={16} /> Attach
        </button>
        <input ref={fileInput} type="file" hidden accept="image/*,application/pdf" onChange={handleFile} />
        <button
          onClick={submit}
          disabled={posting || (!body.trim() && !file)}
          className="seal px-5 py-1.5 text-xs rounded-full disabled:opacity-40"
        >
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  );
}
