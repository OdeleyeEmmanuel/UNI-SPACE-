import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // If email confirmation is required, Supabase returns a user but no session.
    if (data.user && !data.session) {
      setCheckEmail(true);
      return;
    }

    navigate('/onboarding');
  };

  if (checkEmail) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6 text-center">
        <div className="max-w-sm">
          <div className="seal w-14 h-14 mx-auto mb-6">CM</div>
          <h1 className="font-display text-2xl font-semibold mb-2">Check your inbox</h1>
          <p className="text-ink-soft">
            We sent a confirmation link to <strong>{email}</strong>. Verify your email, then sign in
            to finish setting up your profile.
          </p>
          <Link to="/auth/login" className="inline-block mt-6 text-sm font-medium underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="seal w-9 h-9 text-[10px] mb-8 inline-flex">CM</Link>
        <h1 className="font-display text-3xl font-semibold mb-2">Create your account</h1>
        <p className="text-ink-soft mb-8">You'll pick your university and department next.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-ink/15 bg-white focus:border-gold outline-none"
              placeholder="Emmanuel Odeleye"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-ink/15 bg-white focus:border-gold outline-none"
              placeholder="you@student.edu.ng"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-ink/15 bg-white focus:border-gold outline-none"
              placeholder="At least 8 characters"
            />
          </div>

          {error && <p className="text-coral text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="seal w-full py-3 rounded-lg text-sm disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-ink-soft mt-6">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-ink font-medium underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
