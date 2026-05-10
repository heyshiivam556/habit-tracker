import { Settings, Moon, Download, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user, loginWithGoogle, logout } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 mb-4">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-full shadow-md object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[var(--color-accent-rose)] to-[var(--color-accent-peach)] flex items-center justify-center text-white text-2xl font-bold shadow-md">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold">{user?.displayName || 'Alex'}</h2>
          <p className="text-[var(--text-muted)] text-sm">{user?.email || 'Free Plan'}</p>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] rounded-3xl p-2 shadow-sm border border-[var(--text-muted)]/10">
        <div className="p-4 flex items-center justify-between border-b border-[var(--text-muted)]/10 hover:bg-[var(--bg-main)]/50 rounded-t-3xl cursor-pointer">
          <div className="flex items-center gap-3">
            <Moon size={20} className="text-[var(--text-muted)]" />
            <span className="font-medium">Dark Mode</span>
          </div>
          <div className="w-10 h-6 bg-[var(--text-muted)]/20 rounded-full flex items-center px-1">
            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
          </div>
        </div>
        
        {user ? (
          <div onClick={logout} className="p-4 flex items-center justify-between border-b border-[var(--text-muted)]/10 hover:bg-red-400/10 cursor-pointer text-red-500 transition-colors">
            <div className="flex items-center gap-3">
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </div>
            <span className="text-xs bg-red-400/10 px-2 py-1 rounded-md font-medium">Connected</span>
          </div>
        ) : (
          <div onClick={loginWithGoogle} className="p-4 flex items-center justify-between border-b border-[var(--text-muted)]/10 hover:bg-[var(--bg-main)]/50 cursor-pointer">
            <div className="flex items-center gap-3">
              <LogIn size={20} className="text-[var(--text-muted)]" />
              <span className="font-medium">Connect Google</span>
            </div>
            <span className="text-xs text-[var(--text-muted)] bg-[var(--text-muted)]/10 px-2 py-1 rounded-md font-medium">Not Connected</span>
          </div>
        )}

        <div className="p-4 flex items-center justify-between hover:bg-[var(--bg-main)]/50 rounded-b-3xl cursor-pointer">
          <div className="flex items-center gap-3">
            <Download size={20} className="text-[var(--text-muted)]" />
            <span className="font-medium">Export Data</span>
          </div>
        </div>
      </div>
      
      <div className="bg-[var(--bg-surface)] rounded-3xl p-2 shadow-sm border border-[var(--text-muted)]/10 mt-2">
        <div className="p-4 flex items-center justify-between hover:bg-[var(--bg-main)]/50 rounded-3xl cursor-pointer">
          <div className="flex items-center gap-3 text-red-500">
            <Settings size={20} />
            <span className="font-medium">Advanced Settings</span>
          </div>
        </div>
      </div>
    </div>
  );
}
