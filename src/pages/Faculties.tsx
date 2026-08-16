import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Department, University } from '../types';

export default function Faculties() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [universities, setUniversities] = useState<University[]>([]);
  const [universityId, setUniversityId] = useState('');
  const [faculties, setFaculties] = useState<{ id: string; name: string }[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    supabase.from('universities').select('*').order('name').then(({ data }) => {
      setUniversities((data as University[]) ?? []);
      const preset = profile?.university_id ?? (data as University[])?.[0]?.id ?? '';
      setUniversityId(preset);
    });
  }, [profile]);

  useEffect(() => {
    if (!universityId) return;
    supabase.from('faculties').select('id,name').eq('university_id', universityId).order('name').then(({ data }) => {
      setFaculties(data ?? []);
      setSelectedFaculty(null);
      setDepartments([]);
    });
  }, [universityId]);

  useEffect(() => {
    if (!selectedFaculty) return setDepartments([]);
    let query = supabase.from('departments').select('*').eq('faculty_id', selectedFaculty);
    if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);
    query.order('name').then(({ data }) => setDepartments((data as Department[]) ?? []));
  }, [selectedFaculty, search]);

  return (
    <div className="px-6 py-8 md:px-10 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-semibold mb-1">Faculties</h1>
      <p className="text-ink-soft mb-6">Browse by university, then find your discipline's cross-university community.</p>

      <select
        value={universityId}
        onChange={(e) => setUniversityId(e.target.value)}
        className="px-4 py-2.5 rounded-lg border border-ink/15 bg-white outline-none mb-6"
      >
        {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>

      <div className="grid sm:grid-cols-2 gap-2 mb-6">
        {faculties.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFaculty(f.id)}
            className={`text-left px-4 py-3 rounded-lg border transition-colors ${
              selectedFaculty === f.id ? 'border-gold bg-gold-soft/20' : 'border-ink/10 hover:border-ink/30'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      {selectedFaculty && (
        <div>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your department…"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-ink/15 bg-white outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            {departments.map((d) => (
              <button
                key={d.id}
                onClick={() => navigate(`/communities/${d.community_id}`)}
                className="w-full text-left px-4 py-3.5 rounded-lg border border-ink/10 hover:border-gold transition-colors flex items-center justify-between"
              >
                <span>{d.name}</span>
                <span className="text-xs font-mono text-gold uppercase">Open community →</span>
              </button>
            ))}
            {departments.length === 0 && <p className="text-sm text-ink-soft">No departments found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
