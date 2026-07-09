import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthLayout from './components/layout/AuthLayout';
import SpaceLayout from './components/layout/SpaceLayout';
import TimelinePage from './pages/TimelinePage';
import { Card } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Button } from './components/ui/Button';
import { Plus, Users, Key } from 'lucide-react';

// Instantiate TanStack Query client for caching state
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    }
  }
});

/* ------------------- AUTH PAGES PLACEHOLDERS ------------------- */

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email address is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    // Simulate redirect to mock space
    window.location.href = '/space/sterling-vault-1';
  };

  return (
    <Card className="flex flex-col gap-6 border border-vault-border/60">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold text-white">Access Your Vault</h3>
        <p className="text-xs text-vault-muted">Authentication is required to enter isolated Family Spaces.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. sarah@sterling.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          error={error && error.includes('Email') ? error : undefined}
          required
        />
        <Input
          label="Secret Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          error={error && error.includes('Password') ? error : undefined}
          required
        />
        <Button type="submit" variant="primary" className="w-full mt-2">
          Unlock Vault
        </Button>
      </form>

      <div className="text-center text-xs text-vault-muted border-t border-vault-border/30 pt-4 mt-2">
        Need to preserve a new lineage?{' '}
        <Link to="/register" className="text-accent-light hover:underline font-medium focus-visible:ring-1 focus-visible:ring-accent rounded px-1">
          Create an Account
        </Link>
      </div>
    </Card>
  );
}

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <Card className="flex flex-col gap-6 text-center">
        <span className="text-4xl">✉️</span>
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-white">Registration Complete</h3>
          <p className="text-sm text-vault-muted leading-relaxed">
            Your identity has been registered in the vault registry. To proceed, please return to log in.
          </p>
        </div>
        <Link to="/login" className="w-full">
          <Button variant="primary" className="w-full">Back to Login</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-6 border border-vault-border/60">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold text-white">Register Preserver</h3>
        <p className="text-xs text-vault-muted">Set up your credentials to begin preserving your family's history.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. sarah@sterling.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          required
        />
        <Input
          label="Password (min 8 chars)"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••••••"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setError('');
          }}
          error={error ? error : undefined}
          required
        />
        <Button type="submit" variant="primary" className="w-full mt-2">
          Register Account
        </Button>
      </form>

      <div className="text-center text-xs text-vault-muted border-t border-vault-border/30 pt-4 mt-2">
        Already registered?{' '}
        <Link to="/login" className="text-accent-light hover:underline font-medium focus-visible:ring-1 focus-visible:ring-accent rounded px-1">
          Sign In
        </Link>
      </div>
    </Card>
  );
}

/* ------------------- SPACE VAULT PAGES ------------------- */

function AlbumsPage() {
  const mockAlbums = [
    { id: '1', title: 'Lineage Portraits', count: 24, desc: 'Original black and white photographs dating back to the late 19th century.' },
    { id: '2', title: 'Homestead Architecture', count: 12, desc: 'Drawings, cabin footprints, and blueprints of the original family properties.' },
    { id: '3', title: 'Letters & Transcripts', count: 8, desc: 'Digitized copies of handwritten mail, recipes, and legacy notes.' }
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-vault-border/30 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif">Heritage Albums</h1>
          <p className="text-sm text-vault-muted mt-1">Curated collections organizing family documents and legacy media.</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2 self-start sm:self-center">
          <Plus className="w-4 h-4" /> Create Album
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockAlbums.map((album) => (
          <Card key={album.id} hoverEffect className="border border-vault-border/40 flex flex-col justify-between gap-6 cursor-pointer">
            <div className="space-y-3">
              <span className="text-4xl text-vault-muted select-none" role="img" aria-label="Folder icon">📁</span>
              <h3 className="text-lg font-bold font-serif">{album.title}</h3>
              <p className="text-xs text-vault-muted leading-relaxed">{album.desc}</p>
            </div>
            <div className="flex justify-between items-center text-xs text-accent-light font-bold uppercase tracking-wider mt-4">
              <span>{album.count} Assets</span>
              <span>Open Album →</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SettingsPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [spaceName, setSpaceName] = useState('The Sterling Family Vault');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setInviteEmail('');
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-vault-border/30 pb-6">
        <h1 className="text-3xl font-bold font-serif">Vault Settings</h1>
        <p className="text-sm text-vault-muted mt-1">Configure isolation rules and manage verified family members.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Space Configurations */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border border-vault-border/40 flex flex-col gap-4">
            <h3 className="text-lg font-bold font-serif">General Profile</h3>
            <div className="flex flex-col gap-4 max-w-md">
              <Input
                label="Space Name"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
              />
              <Input
                label="Unique URL Identifier"
                value={spaceId}
                disabled
                className="bg-primary-dark/80 cursor-not-allowed border-vault-border/30"
              />
              <Button className="w-fit mt-2">Save Parameters</Button>
            </div>
          </Card>

          <Card className="border border-vault-border/40 flex flex-col gap-4">
            <h3 className="text-lg font-bold font-serif">Invite Family Member</h3>
            <p className="text-xs text-vault-muted">Send a cryptographically isolated access link to verified family members.</p>
            <form onSubmit={handleInvite} className="flex gap-4 items-end max-w-lg mt-2">
              <div className="flex-grow">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. cousin.larry@sterling.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="primary">
                Send Invitation
              </Button>
            </form>
            {inviteSent && (
              <span className="text-xs text-success font-medium">
                ✓ Invitation code successfully generated and registered.
              </span>
            )}
          </Card>
        </div>

        {/* Quota information */}
        <div className="flex flex-col gap-6">
          <Card className="border-l-4 border-accent border-vault-border/40 flex flex-col gap-4">
            <h3 className="text-md font-bold font-serif flex items-center gap-2">
              <Key className="w-4 h-4 text-accent-light" />
              Tenant Isolation
            </h3>
            <p className="text-xs text-vault-muted leading-relaxed">
              This space belongs to <strong>{spaceId}</strong>. Database indices are structured to block cross-space data leakage. No public metadata search exists.
            </p>
          </Card>

          <Card className="border-vault-border/40 flex flex-col gap-4">
            <h3 className="text-md font-bold font-serif flex items-center gap-2">
              <Users className="w-4 h-4 text-accent-light" />
              Space Access List
            </h3>
            <div className="divide-y divide-vault-border/30 text-xs">
              <div className="py-2.5 flex justify-between">
                <span>Grandmother Martha</span>
                <span className="text-accent-light font-bold">Admin</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span>Uncle David</span>
                <span className="text-vault-muted">Member</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span>Sarah Sterling</span>
                <span className="text-vault-muted">Member (You)</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ------------------- MAIN ROUTING ROUTER ------------------- */

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth Layout wrappers */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Scoped Space Layout wrappers */}
          <Route path="/space/:spaceId" element={<SpaceLayout />}>
            <Route index element={<TimelinePage />} />
            <Route path="albums" element={<AlbumsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallbacks */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
