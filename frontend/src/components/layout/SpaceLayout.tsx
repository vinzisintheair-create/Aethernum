import { useState } from 'react';
import { NavLink, useParams, useNavigate, Outlet } from 'react-router-dom';
import { BookOpen, Library, Settings, LogOut, ShieldAlert } from 'lucide-react';
import api from '../../utils/api';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface SpaceLayoutProps {
  children?: React.ReactNode;
}

export default function SpaceLayout({ children }: SpaceLayoutProps) {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();

  // Navigation Links definition
  const navItems = [
    {
      name: 'Timeline',
      path: `/space/${spaceId}`,
      icon: BookOpen,
      end: true
    },
    {
      name: 'Albums',
      path: `/space/${spaceId}/albums`,
      icon: Library,
      end: false
    },
    {
      name: 'Settings',
      path: `/space/${spaceId}/settings`,
      icon: Settings,
      end: false
    }
  ];

  const [mustReset, setMustReset] = useState(
    localStorage.getItem('aeternum_must_reset') === 'true'
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleForceReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setResetError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetting(true);
    setResetError('');
    try {
      await api.post('/auth/reset-password', { newPassword });
      localStorage.setItem('aeternum_must_reset', 'false');
      setResetSuccess('Password updated successfully. Accessing Circle Space...');
      setTimeout(() => {
        setMustReset(false);
      }, 1500);
    } catch (err: any) {
      setResetError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aeternum_must_reset');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text flex flex-col md:flex-row">
      {/* Sidebar - Desktop Layout */}
      <aside className="w-full md:w-64 bg-vault-card border-b md:border-b-0 md:border-r border-vault-border/55 flex flex-col md:fixed md:inset-y-0 md:left-0 z-30">
        {/* Brand identity header */}
        <div className="p-6 border-b border-vault-border/55 flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label="Aeternum Vault Logo">🏛️</span>
          <div>
            <h2 className="text-lg font-bold tracking-wider font-serif uppercase gold-gradient-text">Aeternum</h2>
            <p className="text-[10px] text-vault-muted uppercase tracking-widest font-semibold">Friend Archival</p>
          </div>
        </div>

        {/* Space contextual info */}
        <div className="p-4 mx-4 mt-4 bg-primary-light/30 border border-vault-border/50 rounded-lg">
          <p className="text-[10px] text-vault-muted uppercase tracking-wider font-semibold">Active Vault</p>
          <p className="text-xs font-bold text-white mt-0.5 truncate">The Sterling Circle Vault</p>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-grow px-4 py-6 space-y-1.5 flex flex-col">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                onClick={(e) => {
                  if (mustReset) {
                    e.preventDefault();
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    mustReset
                      ? 'opacity-40 cursor-not-allowed pointer-events-none'
                      : isActive
                        ? 'bg-accent/15 text-white border-l-2 border-accent'
                        : 'text-vault-muted hover:text-vault-text hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5" aria-hidden="true" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info and sign out */}
        <div className="p-4 border-t border-vault-border/55 flex flex-col gap-2 mt-auto">
          <div className="flex items-center gap-2 px-4 py-2 text-[11px] text-vault-muted bg-white/5 rounded">
            <ShieldAlert className="w-3.5 h-3.5 text-accent-light" />
            <span>Tenant Isolation Active</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-vault-muted hover:text-danger hover:bg-danger/10 rounded-lg w-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            <LogOut className="w-4.5 h-4.5" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main body wrapper */}
      <div className="flex-grow flex flex-col md:pl-64 min-h-screen">
        {/* Main layout contents */}
        <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-8 md:py-12 flex flex-col gap-8">
          {mustReset ? (
            <div className="flex justify-center items-center py-12 md:py-24">
              <Card className="border border-vault-border/60 max-w-md w-full flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold text-white">Temporary Credentials Detected</h3>
                  <p className="text-xs text-vault-muted">For your security, you are required to configure a new permanent password on your first login.</p>
                </div>

                {resetError && (
                  <div className="text-xs text-danger bg-danger/10 border border-danger/25 p-3 rounded-lg font-medium">
                    {resetError}
                  </div>
                )}

                {resetSuccess && (
                  <div className="text-xs text-success bg-success/10 border border-success/25 p-3 rounded-lg font-medium">
                    {resetSuccess}
                  </div>
                )}

                <form onSubmit={handleForceReset} className="flex flex-col gap-4">
                  <Input
                    label="New Password (min 8 characters)"
                    type="password"
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setResetError('');
                    }}
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setResetError('');
                    }}
                    required
                  />
                  <Button type="submit" variant="primary" className="w-full mt-2" disabled={resetting || !!resetSuccess}>
                    {resetting ? 'Updating...' : 'Set Permanent Password'}
                  </Button>
                </form>
              </Card>
            </div>
          ) : (
            children || <Outlet />
          )}
        </main>

        {/* Simple discrete footer */}
        <footer className="w-full py-6 text-center text-[10px] text-vault-muted border-t border-vault-border/30">
          Aeternum Platform — Protecting friends' legacies securely.
        </footer>
      </div>
    </div>
  );
}
