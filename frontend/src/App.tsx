import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSpaceDetails } from './hooks/useMemories';
import AuthLayout from './components/layout/AuthLayout';
import SpaceLayout from './components/layout/SpaceLayout';
import TimelinePage from './pages/TimelinePage';
import { Card } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Button } from './components/ui/Button';
import api from './utils/api';
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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email address is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('aeternum_must_reset', res.data.member.mustResetPassword ? 'true' : 'false');
      window.location.href = '/space/sterling-vault-1';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials or connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col gap-6 border border-vault-border/60">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold text-white">Access Your Vault</h3>
        <p className="text-xs text-vault-muted">Authentication is required to enter isolated Friend Spaces.</p>
      </div>

      {error && (
        <div className="text-xs text-danger bg-danger/10 border border-danger/25 p-3 rounded-lg font-medium">
          {error}
        </div>
      )}

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
          label="Secret Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          required
        />
        <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
          {loading ? 'Unlocking...' : 'Unlock Vault'}
        </Button>
      </form>

      <div className="text-center text-xs text-vault-muted border-t border-vault-border/30 pt-4 mt-2">
        Need to preserve a new archive circle?{' '}
        <Link to="/register" className="text-accent-light hover:underline font-medium focus-visible:ring-1 focus-visible:ring-accent rounded px-1">
          Create an Account
        </Link>
      </div>
    </Card>
  );
}

function RegisterPage() {
  return (
    <Card className="flex flex-col gap-6 text-center border border-vault-border/60 p-8">
      <span className="text-4xl select-none" role="img" aria-label="Shield lock">🔒</span>
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold text-white">Private Circle Registry</h3>
        <p className="text-sm text-vault-muted leading-relaxed">
          Public registration is disabled on Aeternum to protect the integrity and isolation of vault spaces.
        </p>
        <p className="text-xs text-vault-muted/70 mt-1">
          You must be invited by a Friend Space Administrator to join. They will generate your account and temporary access credentials.
        </p>
      </div>
      <Link to="/login" className="w-full">
        <Button variant="primary" className="w-full">Back to Login</Button>
      </Link>
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
          <h1 className="text-3xl font-bold font-serif">Shared Albums</h1>
          <p className="text-sm text-vault-muted mt-1">Curated collections organizing group documents and legacy media.</p>
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
  const { data: space, refetch } = useSpaceDetails(spaceId || '');
  const [spaceName, setSpaceName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [generatedTempPassword, setGeneratedTempPassword] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (space) {
      setSpaceName(space.name);
    }
  }, [space]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    setInviteError('');
    setGeneratedTempPassword(null);
    setInviteSent(false);

    try {
      const response = await api.post(`/spaces/${spaceId}/invitations`, { email: inviteEmail });
      setInviteSent(true);
      setGeneratedTempPassword(response.data.invitation.tempPassword || null);
      setInviteEmail('');
      refetch(); // Reload the circle members list dynamically!
    } catch (err: any) {
      setInviteError(err.response?.data?.error || 'Failed to generate invitation.');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-vault-border/30 pb-6">
        <h1 className="text-3xl font-bold font-serif">Vault Settings</h1>
        <p className="text-sm text-vault-muted mt-1">Configure isolation rules and manage verified circle friends.</p>
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
            <h3 className="text-lg font-bold font-serif">Invite Close Friend</h3>
            <p className="text-xs text-vault-muted">Generate an access link and temporary password for your friend.</p>
            
            {inviteError && (
              <div className="text-xs text-danger bg-danger/10 border border-danger/25 p-3 rounded-lg font-medium">
                {inviteError}
              </div>
            )}

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
              <Button type="submit" variant="primary" disabled={inviting}>
                {inviting ? 'Generating...' : 'Send Invitation'}
              </Button>
            </form>

            {inviteSent && (
              <div className="mt-3 p-4 bg-accent/10 border border-accent/25 rounded-lg text-sm text-vault-text">
                <p className="font-semibold text-green-300">✓ Invitation generated successfully!</p>
                {generatedTempPassword ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-vault-muted">Share this temporary password with your friend. They will be forced to change it on their first login:</p>
                    <div className="mt-2 bg-black/40 p-2.5 rounded font-mono text-xs border border-vault-border/50 flex items-center justify-between">
                      <span>Temp Password: <strong className="text-white select-all">{generatedTempPassword}</strong></span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-vault-muted mt-1">This user already has a verified account and has been added to the Circle space.</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Quota information */}
        <div className="flex flex-col gap-6">
          <Card className="border-l-4 border-accent border-vault-border/40 flex flex-col gap-4">
            <h3 className="text-md font-bold font-serif flex items-center gap-2">
              <Key className="w-4 h-4 text-accent-light" />
              Circle Isolation
            </h3>
            <p className="text-xs text-vault-muted leading-relaxed">
              This space belongs to <strong>{spaceId}</strong>. Database indices are structured to block cross-circle data leakage. No public metadata search exists.
            </p>
          </Card>

          <Card className="border-vault-border/40 flex flex-col gap-4">
            <h3 className="text-md font-bold font-serif flex items-center gap-2">
              <Users className="w-4 h-4 text-accent-light" />
              Circle Access List
            </h3>
            <div className="divide-y divide-vault-border/30 text-xs">
              {space?.members ? (
                space.members.map((member) => (
                  <div key={member.id} className="py-2.5 flex justify-between items-center">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-white">{member.email}</span>
                      {member.bio && <span className="text-[10px] text-vault-muted">{member.bio}</span>}
                    </div>
                    <span className={`font-bold capitalize ${member.role === 'ADMIN' ? 'text-accent-light' : 'text-vault-muted'}`}>
                      {member.role.toLowerCase()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-vault-muted">Loading access list...</div>
              )}
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
