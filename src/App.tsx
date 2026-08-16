import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Shell from './components/Shell';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Feed from './pages/Feed';
import Discover from './pages/Discover';
import Faculties from './pages/Faculties';
import Community from './pages/Community';
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';
import MapPage from './pages/MapPage';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import SettingsPrivacy from './pages/SettingsPrivacy';
import Admin from './pages/Admin';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/auth/login" replace />;
  return children;
}

function OnboardedRoute({ children }: { children: JSX.Element }) {
  const { profile, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />;
  return children;
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="seal w-16 h-16 animate-pulse">CM</div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<Signup />} />

      <Route
        path="/onboarding"
        element={
          <PrivateRoute>
            <Onboarding />
          </PrivateRoute>
        }
      />

      <Route
        element={
          <PrivateRoute>
            <OnboardedRoute>
              <Shell />
            </OnboardedRoute>
          </PrivateRoute>
        }
      >
        <Route path="/home" element={<Feed />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/faculties" element={<Faculties />} />
        <Route path="/communities/:id" element={<Community />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings/privacy" element={<SettingsPrivacy />} />
        <Route path="/admin" element={<Admin />} />
      </Route>

      {/* Full-screen routes without the shell chrome */}
      <Route
        path="/messages/:id"
        element={
          <PrivateRoute>
            <OnboardedRoute>
              <Conversation />
            </OnboardedRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/map"
        element={
          <PrivateRoute>
            <OnboardedRoute>
              <MapPage />
            </OnboardedRoute>
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
