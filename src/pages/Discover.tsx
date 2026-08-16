import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ProfileCard from '../components/ProfileCard';
import type { AcademicLevel, Department, Profile, University } from '../types';

const SELECT = `
  *,
  university:universities(id,name,short_name,city),
  faculty:faculties(id,name,university_id),
  department:departments(id,name,faculty_id,university_id,community_id),
  level:academic_levels(id,name,sort_order)
`;

export default function Discover() {
  const { profile: me } = useAuth();
  const [search, setSearch] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [sameDeptOnly, setSameDeptOnly] = useState(true);

  const [universities, setUniversities] = useState<University[]>([]);
  const [levels, setLevels] = useState<AcademicLevel[]>([]);
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('universities').select('*').order('name').then(({ data }) => setUniversities((data as University[]) ?? []));
    supabase.from('academic_levels').select('*').order('sort_order').then(({ data }) => setLevels((data as AcademicLevel[]) ?? []));
  }, []);

  useEffect(() => {
    if (!me) return;
    setLoading(true);
    let query = supabase.from('profiles').select(SELECT).eq('onboarding_completed', true).neq('id', me.id);

    if (sameDeptOnly && me.department_id) {
      query = query.eq('department_id', me.department_id);
    }
    if (universityId) query = query.eq('university_id', universityId);
    if (levelId) query = query.eq('level_id', levelId);
    if (search.trim()) query = query.ilike('full_name', `%${search.trim()}%`);

    query
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setResults((data as unknown as Profile[]) ?? []);
        setLoading(false);
      });
  }, [me, search, universityId, levelId, sameDeptOnly]);

  return (
    <div className="px-6 py-8 md:px-10 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-semibold mb-1">Discover students</h1>
      <p className="text-ink-soft mb-6">
        {me?.department ? (
          <>Same discipline, every campus — starting with <strong>{me.department.name}</strong>.</>
        ) : (
          'Find people studying what you study.'
        )}
      </p>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-ink/15 bg-white focus:border-gold outline-none"
          />
        </div>
        <select
          value={universityId}
          onChange={(e) => setUniversityId(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-ink/15 bg-white outline-none"
        >
          <option value="">All universities</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <select
          value={levelId}
          onChange={(e) => setLevelId(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-ink/15 bg-white outline-none"
        >
          <option value="">All levels</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {me?.department_id && (
        <label className="flex items-center gap-2 mb-6 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={sameDeptOnly}
            onChange={(e) => setSameDeptOnly(e.target.checked)}
            className="accent-gold"
          />
          Only show my department ({me.department?.name})
        </label>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-ink/5 animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-ink-soft">
          <p className="font-display text-xl mb-2">No one here yet</p>
          <p className="text-sm">Be the first from your department to show up — invite a coursemate.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}
    </div>
  );
}
