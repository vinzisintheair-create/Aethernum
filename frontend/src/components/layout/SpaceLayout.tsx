import { useState } from 'react';
import { NavLink, useParams, useNavigate, Outlet } from 'react-router-dom';
import { BookOpen, Library, Settings, LogOut, ShieldAlert, Menu, X as XIcon } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleForceReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setResetError('Display username is required.');
      return;
    }
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
      await api.post('/auth/reset-password', { newPassword, username: username.trim() });
      localStorage.setItem('aeternum_must_reset', 'false');
      setResetSuccess('Credentials updated successfully. Accessing Circle Space...');
      setTimeout(() => {
        setMustReset(false);
      }, 1500);
    } catch (err: any) {
      setResetError(err.response?.data?.error || 'Failed to update credentials.');
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aeternum_must_reset');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text flex flex-col md:flex-row relative">
      {/* Top Header Bar on Mobile */}
      <header className="flex md:hidden items-center justify-between p-4 bg-vault-card border-b border-vault-border/55 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <span className="text-xl" role="img" aria-label="Aeternum Vault Logo">🏛️</span>
          <div>
            <span className="text-sm font-bold tracking-wider font-serif uppercase gold-gradient-text">Aeternum</span>
            <p className="text-[8px] text-vault-muted uppercase tracking-widest font-semibold">Circle Archival</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-vault-muted hover:text-white focus:outline-none p-1"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Backdrop overlay for mobile menu drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Responsive Mobile Drawer Layout */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-vault-card border-r border-vault-border/55 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:fixed md:inset-y-0 md:left-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand identity header */}
        <div className="p-6 border-b border-vault-border/55 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="Aeternum Vault Logo">🏛️</span>
            <div>
              <h2 className="text-lg font-bold tracking-wider font-serif uppercase gold-gradient-text">Aeternum</h2>
              <p className="text-[10px] text-vault-muted uppercase tracking-widest font-semibold">Friend Archival</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-vault-muted hover:text-white focus:outline-none p-1"
            aria-label="Close menu"
          >
            <XIcon className="w-5 h-5" />
          </button>
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
                  } else {
                    setIsMobileMenuOpen(false);
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
            <span>Circle Isolation Active</span>
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
                    label="Choose Display Name / Username (Required)"
                    type="text"
                    placeholder="e.g. Uncle David, Sarah Sterling"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setResetError('');
                    }}
                    required
                  />
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
                    {resetting ? 'Updating...' : 'Set Display Name & Password'}
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
