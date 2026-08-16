import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { University } from '../types';

const universityIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const personIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [18, 30],
  iconAnchor: [9, 30],
});

interface PersonShare {
  user_id: string;
  approx_latitude: number;
  approx_longitude: number;
  profile: { full_name: string; username: string };
}

export default function MapPage() {
  const { profile } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [shares, setShares] = useState<PersonShare[]>([]);
  const [visibility, setVisibility] = useState<'off' | 'connections' | 'selected'>('off');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    supabase.from('universities').select('*').not('latitude', 'is', null).then(({ data }) => {
      setUniversities((data as University[]) ?? []);
    });
    if (!profile) return;
    supabase.from('location_settings').select('visibility').eq('user_id', profile.id).maybeSingle().then(({ data }) => {
      if (data) setVisibility(data.visibility);
    });
    loadShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const loadShares = async () => {
    const { data } = await supabase
      .from('location_shares')
      .select('user_id, approx_latitude, approx_longitude, profile:profiles!location_shares_user_id_fkey(full_name, username)')
      .gt('expires_at', new Date().toISOString());
    setShares((data as unknown as PersonShare[]) ?? []);
  };

  const shareLocation = () => {
    if (!profile || !navigator.geolocation) return;
    setSharing(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Math.round(pos.coords.latitude * 100) / 100;
        const lng = Math.round(pos.coords.longitude * 100) / 100;

        await supabase.from('location_settings').upsert({ user_id: profile.id, visibility: 'connections' });
        await supabase.from('location_shares').upsert({
          user_id: profile.id,
          approx_latitude: lat,
          approx_longitude: lng,
          university_id: profile.university_id,
          expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        });
        setVisibility('connections');
        setSharing(false);
        loadShares();
      },
      () => setSharing(false)
    );
  };

  const stopSharing = async () => {
    if (!profile) return;
    await supabase.from('location_shares').delete().eq('user_id', profile.id);
    await supabase.from('location_settings').update({ visibility: 'off' }).eq('user_id', profile.id);
    setVisibility('off');
    loadShares();
  };

  return (
    <div className="relative h-screen">
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between">
        <div className="id-card px-4 py-2.5">
          <p className="font-display font-semibold">University map</p>
          <p className="text-xs text-ink-soft">Approximate, opt-in student locations only</p>
        </div>
        {visibility === 'off' ? (
          <button onClick={shareLocation} disabled={sharing} className="seal px-4 py-2.5 text-xs rounded-full flex items-center gap-1.5">
            <Navigation size={13} /> {sharing ? 'Locating…' : 'Share my location'}
          </button>
        ) : (
          <button onClick={stopSharing} className="px-4 py-2.5 text-xs rounded-full border border-coral text-coral bg-paper">
            Stop sharing
          </button>
        )}
      </div>

      <MapContainer center={[9.082, 8.6753]} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {universities.map((u) => (
          <Marker key={u.id} position={[u.latitude!, u.longitude!]} icon={universityIcon}>
            <Popup>
              <strong>{u.name}</strong>
              <br />
              {u.city}
            </Popup>
          </Marker>
        ))}
        {shares.map((s) => (
          <Marker key={s.user_id} position={[s.approx_latitude, s.approx_longitude]} icon={personIcon}>
            <Popup>
              {s.profile.full_name} (@{s.profile.username})
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
