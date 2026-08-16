import { Link } from 'react-router-dom';

const DISCIPLINES = ['Computer Science', 'Medicine', 'Law', 'Economics', 'Engineering', 'Nursing'];

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper grain-bg flex flex-col overflow-hidden relative">
      {/* Decorative drifting seals in the background — academic, not corporate */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06]">
        <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full border-[16px] border-ink animate-drift" />
        <div className="absolute top-1/3 -right-16 w-96 h-96 rounded-full border-[20px] border-gold animate-drift" style={{ animationDelay: '-6s' }} />
      </div>

      <header className="relative flex items-center justify-between px-6 py-5 md:px-12 z-10">
        <div className="flex items-center gap-2">
          <div className="seal w-9 h-9 text-[10px]">CM</div>
          <span className="font-display text-lg font-semibold">Coursemate</span>
        </div>
        <Link to="/auth/login" className="text-sm font-medium text-ink-soft hover:text-ink transition-colors">
          Sign in
        </Link>
      </header>

      <section className="relative flex-1 flex flex-col items-center justify-center px-6 text-center max-w-2xl mx-auto z-10">
        <span className="font-mono text-xs tracking-[0.2em] uppercase text-gold mb-4">
          University → Faculty → Department → You
        </span>
        <h1 className="font-display text-4xl md:text-6xl font-semibold leading-tight mb-6">
          Your course exists at every university.
          <br className="hidden md:block" /> Find the rest of it.
        </h1>
        <p className="text-ink-soft text-lg mb-10 max-w-lg">
          Coursemate connects students in the same discipline across every campus —
          share resources, ask questions, and Link Up with people doing exactly what you're doing.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mb-14">
          <Link to="/auth/signup" className="seal px-8 py-3.5 text-sm rounded-full">
            Join Coursemate
          </Link>
          <Link
            to="/auth/login"
            className="px-8 py-3.5 text-sm font-medium rounded-full border border-ink/15 hover:border-ink/30 transition-colors"
          >
            I already have an account
          </Link>
        </div>

        {/* Corkboard strip: pinned discipline "cards" — the app's core idea, shown not told */}
        <div className="ribbon-divider w-full mb-6">Communities live here today</div>
        <div className="flex flex-wrap justify-center gap-3">
          {DISCIPLINES.map((d, i) => (
            <div key={d} className="relative">
              <div className="pin absolute -top-1.5 left-1/2 -translate-x-1/2 z-10" />
              <div
                className="id-card px-4 py-3 text-sm font-medium"
                style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (1 + (i % 3))}deg)` }}
              >
                {d}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative text-center text-xs text-ink-soft/60 py-6 font-mono z-10">
        Built for students, department by department.
      </footer>
    </div>
  );
}
