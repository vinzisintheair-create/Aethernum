import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-vault-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative calm background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(22,101,52,0.04)_0%,_transparent_65%)] pointer-events-none"></div>
      
      <div className="w-full max-w-md flex flex-col gap-8 relative z-10">
        {/* Core Identity Branding */}
        <div className="flex flex-col items-center text-center gap-2">
          <span className="text-4xl select-none" role="img" aria-label="Aeternum Vault Emblem">🏛️</span>
          <h2 className="text-3xl font-bold tracking-widest uppercase gold-gradient-text font-serif mt-2">Aeternum</h2>
          <p className="text-xs text-vault-muted tracking-widest uppercase font-medium">Preserve Life's Greatest Memories</p>
        </div>

        {/* Center Card Outlet */}
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
