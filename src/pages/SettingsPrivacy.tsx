import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type Audience = 'everyone' | 'connections' | 'no_one';

export default function SettingsPrivacy() {
  const { profile } = useAuth();
  const [linkUpAudience, setLinkUpAudience] = useState<Audience>('everyone');
  const [messageAudience, setMessageAudience] = useState<Audience>('connections');
  const [locationVisibility, setLocationVisibility] = useState<'off' | 'connections' | 'selected'>('off');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase.from('location_settings').select('visibility').eq('user_id', profile.id).maybeSingle().then(({ data }) => {
      if (data) setLocationVisibility(data.visibility);
    });
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    await supabase.from('location_settings').upsert({ user_id: profile.id, visibility: locationVisibility });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const RadioGroup = ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: any) => void;
    options: { value: string; label: string }[];
  }) => (
    <div className="flex gap-2 flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${
            value === o.value ? 'border-gold bg-gold-soft/20 text-ink' : 'border-ink/15 text-ink-soft'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="px-6 py-8 md:px-10 max-w-lg mx-auto">
      <h1 className="font-display text-3xl font-semibold mb-6">Privacy</h1>

      <div className="space-y-6">
        <div>
          <p className="font-medium text-sm mb-2">Who can send Link Up requests?</p>
          <RadioGroup
            value={linkUpAudience}
            onChange={setLinkUpAudience}
            options={[
              { value: 'everyone', label: 'Everyone' },
              { value: 'connections', label: 'Nobody new (already connected only)' },
            ]}
          />
        </div>

        <div>
          <p className="font-medium text-sm mb-2">Who can message me?</p>
          <RadioGroup
            value={messageAudience}
            onChange={setMessageAudience}
            options={[
              { value: 'connections', label: 'Connections only' },
              { value: 'everyone', label: 'Everyone' },
            ]}
          />
        </div>

        <div className="pt-4 border-t border-ink/10">
          <p className="font-medium text-sm mb-1">Location sharing</p>
          <p className="text-xs text-ink-soft mb-2">
            Off by default. Only approximate, campus-level location is ever shared — never your exact address.
          </p>
          <RadioGroup
            value={locationVisibility}
            onChange={setLocationVisibility}
            options={[
              { value: 'off', label: 'Off' },
              { value: 'connections', label: 'Connections' },
              { value: 'selected', label: 'Selected people' },
            ]}
          />
        </div>

        <button onClick={save} className="seal px-6 py-2.5 text-sm rounded-full">
          {saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
