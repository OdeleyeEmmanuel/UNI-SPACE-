import type { Profile } from '../types';
import LinkUpButton from './LinkUpButton';

export default function ProfileCard({ profile }: { profile: Profile }) {
  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="id-card p-5">
      <div className="flex items-start gap-4 pt-2">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            className="w-14 h-14 rounded-full object-cover border-2 border-gold"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-ink text-paper flex items-center justify-center font-display font-semibold border-2 border-gold">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-lg truncate">{profile.full_name}</p>
          <p className="text-sm text-ink-soft font-mono">@{profile.username}</p>
        </div>
      </div>

      <div className="mt-4 space-y-1 text-sm">
        {profile.university && <p className="font-medium">{profile.university.name}</p>}
        {profile.department && <p className="text-ink-soft">{profile.department.name}</p>}
        {profile.level && (
          <p className="font-mono text-xs uppercase tracking-wide text-gold">{profile.level.name}</p>
        )}
      </div>

      {profile.bio && <p className="mt-3 text-sm text-ink-soft line-clamp-2">{profile.bio}</p>}

      <div className="mt-4">
        <LinkUpButton targetId={profile.id} />
      </div>
    </div>
  );
}
