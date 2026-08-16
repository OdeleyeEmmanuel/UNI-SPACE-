import { NavLink, Outlet } from 'react-router-dom';
import { Home, Compass, GraduationCap, MessageCircle, Bell, MapPinned, UserRound, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/faculties', label: 'Faculties', icon: GraduationCap },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/map', label: 'Map', icon: MapPinned },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

const mobileNavItems = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export default function Shell() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-ink/10 p-6">
        <div className="flex items-center gap-2 mb-10">
          <div className="seal w-10 h-10">CM</div>
          <span className="font-display text-lg font-semibold">Coursemate</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-paper-dim'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        {(profile?.role === 'admin' || profile?.role === 'moderator') && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors mb-1 ${
                isActive ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-paper-dim'
              }`
            }
          >
            <ShieldCheck size={18} /> Moderation
          </NavLink>
        )}
        {profile && (
          <div className="pt-4 border-t border-ink/10">
            <p className="text-sm font-semibold truncate">{profile.full_name}</p>
            <p className="text-xs text-ink-soft font-mono">@{profile.username}</p>
            <NavLink to="/settings/privacy" className="text-xs text-ink-soft underline block mt-1">
              Privacy settings
            </NavLink>
            <button
              onClick={signOut}
              className="mt-3 flex items-center gap-2 text-sm text-ink-soft hover:text-coral transition-colors"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-paper border-t border-ink/10 flex justify-around py-2 z-20">
        {mobileNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-xs font-medium ${
                isActive ? 'text-ink' : 'text-ink-soft'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
