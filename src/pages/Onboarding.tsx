import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { University, Faculty, Department, AcademicLevel } from '../types';

const STEPS = ['University', 'Faculty', 'Department', 'Level', 'Profile'] as const;

export default function Onboarding() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [levels, setLevels] = useState<AcademicLevel[]>([]);
  const [deptSearch, setDeptSearch] = useState('');

  const [universityId, setUniversityId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [bio, setBio] = useState('');

  useEffect(() => {
    supabase.from('universities').select('*').order('name').then(({ data }) => {
      if (data) setUniversities(data as University[]);
    });
    supabase.from('academic_levels').select('*').order('sort_order').then(({ data }) => {
      if (data) setLevels(data as AcademicLevel[]);
    });
  }, []);

  useEffect(() => {
    if (!universityId) return setFaculties([]);
    supabase
      .from('faculties')
      .select('*')
      .eq('university_id', universityId)
      .order('name')
      .then(({ data }) => setFaculties((data as Faculty[]) ?? []));
  }, [universityId]);

  useEffect(() => {
    if (!facultyId) return setDepartments([]);
    let query = supabase.from('departments').select('*').eq('faculty_id', facultyId);
    if (deptSearch.trim()) query = query.ilike('name', `%${deptSearch.trim()}%`);
    query.order('name').then(({ data }) => setDepartments((data as Department[]) ?? []));
  }, [facultyId, deptSearch]);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    if (!profile) return;
    setError(null);

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setError('Username must be 3–20 characters: lowercase letters, numbers, underscores only.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        bio: bio || null,
        university_id: universityId,
        faculty_id: facultyId,
        department_id: departmentId,
        level_id: levelId,
        onboarding_completed: true,
      })
      .eq('id', profile.id);
    setSaving(false);

    if (error) {
      setError(error.message.includes('duplicate') ? 'That username is already taken.' : error.message);
      return;
    }

    await refreshProfile();
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="px-6 py-6 max-w-lg w-full mx-auto flex-1">
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < step ? 'bg-gold' : i === step ? 'bg-gold/50' : 'bg-ink/10'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono border-2 ${
              i < step ? 'bg-gold border-gold text-ink' : i === step ? 'border-gold text-gold' : 'border-ink/15 text-ink-soft'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
          ))}
        </div>

        <span className="font-mono text-xs uppercase tracking-widest text-gold">
          Step {step + 1} of {STEPS.length}
        </span>
        <h1 className="font-display text-3xl font-semibold mt-1 mb-8">{STEPS[step]}</h1>

        {step === 0 && (
          <div className="space-y-2">
            {universities.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setUniversityId(u.id);
                  setFacultyId('');
                  setDepartmentId('');
                  next();
                }}
                className={`w-full text-left px-4 py-3.5 rounded-lg border transition-colors ${
                  universityId === u.id ? 'border-gold bg-gold-soft/20' : 'border-ink/10 hover:border-ink/30'
                }`}
              >
                <p className="font-medium">{u.name}</p>
                {u.city && <p className="text-sm text-ink-soft">{u.city}</p>}
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2">
            {faculties.length === 0 && (
              <p className="text-ink-soft text-sm">No faculties found for this university yet.</p>
            )}
            {faculties.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFacultyId(f.id);
                  setDepartmentId('');
                  next();
                }}
                className={`w-full text-left px-4 py-3.5 rounded-lg border transition-colors ${
                  facultyId === f.id ? 'border-gold bg-gold-soft/20' : 'border-ink/10 hover:border-ink/30'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div>
            <input
              value={deptSearch}
              onChange={(e) => setDeptSearch(e.target.value)}
              placeholder="Search your department…"
              className="w-full px-4 py-2.5 rounded-lg border border-ink/15 bg-white mb-3 focus:border-gold outline-none"
            />
            <div className="space-y-2">
              {departments.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setDepartmentId(d.id);
                    next();
                  }}
                  className={`w-full text-left px-4 py-3.5 rounded-lg border transition-colors ${
                    departmentId === d.id ? 'border-gold bg-gold-soft/20' : 'border-ink/10 hover:border-ink/30'
                  }`}
                >
                  {d.name}
                </button>
              ))}
              {departments.length === 0 && (
                <p className="text-ink-soft text-sm">No matching departments.</p>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-2 gap-2">
            {levels.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setLevelId(l.id);
                  next();
                }}
                className={`px-4 py-3.5 rounded-lg border font-mono text-sm transition-colors ${
                  levelId === l.id ? 'border-gold bg-gold-soft/20' : 'border-ink/10 hover:border-ink/30'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="w-full px-4 py-2.5 rounded-lg border border-ink/15 bg-white focus:border-gold outline-none font-mono"
                placeholder="emmanuel_odeleye"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Bio (optional)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-ink/15 bg-white focus:border-gold outline-none"
                placeholder="What are you working on?"
              />
            </div>
            {error && <p className="text-coral text-sm">{error}</p>}
            <button
              onClick={finish}
              disabled={saving || !username}
              className="seal w-full py-3 rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? 'Setting up your profile…' : 'Enter Coursemate'}
            </button>
          </div>
        )}

        {step > 0 && step < 4 && (
          <button onClick={back} className="mt-6 text-sm text-ink-soft underline">
            Back
          </button>
        )}
      </div>
    </div>
  );
}
