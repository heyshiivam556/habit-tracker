import { useState } from 'react';
import { Settings, Moon, Sun, Download, LogIn, LogOut, Check, Loader, Sparkles, ChevronDown, ChevronUp, Image as ImageIcon, Plus, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useHabits } from '../hooks/useHabits';
import { syncToGoogleSheets } from '../utils/googleSheets';

const ACCENT_THEMES = [
  { id: 'beige', label: 'Cozy Beige', light: '#f2ead0', dark: '#1b1b22', bubble: '#2b2d42', darkBubble: '#f5984f' },
  { id: 'sage', label: 'Forest Sage', light: '#dceee5', dark: '#18231e', bubble: '#2d6a4f', darkBubble: '#6fcf97' },
  { id: 'lavender', label: 'Lavender', light: '#ede8f8', dark: '#1a1726', bubble: '#6b5bb5', darkBubble: '#b39ddb' },
  { id: 'slate', label: 'Ocean Slate', light: '#e4eaf2', dark: '#171c26', bubble: '#3a5a8a', darkBubble: '#7ab3e0' },
  { id: 'rose', label: 'Blossom', light: '#fce8ea', dark: '#261719', bubble: '#c0545a', darkBubble: '#f4a7ab' },
];

const BACKGROUNDS = [
  { id: 'light1', label: 'Light Beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000' },
  { id: 'dark1', label: 'Starry Mountains', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1000' },
  { id: 'dark2', label: 'Dark Forest', url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=1000' }
];

export default function Profile() {
  const { user, loginWithGoogle, logout, googleToken, connectGoogleAPI } = useAuth();
  const { habits } = useHabits();
  const [isExporting, setIsExporting] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark'
  );

  const [activeAccent, setActiveAccent] = useState(() =>
    localStorage.getItem('accent') || 'beige'
  );

  const [isGlass, setIsGlass] = useState(() =>
    document.documentElement.classList.contains('glass') || localStorage.getItem('glass') === 'true'
  );

  const [showAdvanced, setShowAdvanced] = useState(false);

  const [activeBackground, setActiveBackground] = useState(() =>
    localStorage.getItem('glass-bg') || ''
  );

  const [customBackgrounds, setCustomBackgrounds] = useState(() => {
    const saved = localStorage.getItem('custom-glass-bgs');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAddBgModalOpen, setIsAddBgModalOpen] = useState(false);
  const [newBgName, setNewBgName] = useState('');
  const [newBgImage, setNewBgImage] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBgImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomBackground = () => {
    if (newBgName.trim() && newBgImage) {
      const newBg = {
        id: `custom-${Date.now()}`,
        label: newBgName.trim(),
        url: newBgImage
      };
      const updatedList = [...customBackgrounds, newBg];
      setCustomBackgrounds(updatedList);
      localStorage.setItem('custom-glass-bgs', JSON.stringify(updatedList));
      applyBackground(newBgImage);
      setIsAddBgModalOpen(false);
      setNewBgName('');
      setNewBgImage(null);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleGlassMode = () => {
    const newMode = !isGlass;
    setIsGlass(newMode);
    if (newMode) {
      document.documentElement.classList.add('glass');
      localStorage.setItem('glass', 'true');
    } else {
      document.documentElement.classList.remove('glass');
      localStorage.setItem('glass', 'false');
    }
  };

  const applyBackground = (url) => {
    if (!url || activeBackground === url) {
      setActiveBackground('');
      localStorage.removeItem('glass-bg');
      document.documentElement.style.removeProperty('--glass-bg-image');
    } else {
      setActiveBackground(url);
      localStorage.setItem('glass-bg', url);
      document.documentElement.style.setProperty('--glass-bg-image', `url(${url})`);
    }
  };

  const applyAccent = (id) => {
    setActiveAccent(id);
    localStorage.setItem('accent', id);
    document.documentElement.setAttribute('data-theme', id);
  };

  const handleExport = async () => {
    if (!googleToken) {
      alert("Please connect Google Services first to export data to Google Sheets.");
      connectGoogleAPI();
      return;
    }

    setIsExporting(true);
    try {
      const spreadsheetId = await syncToGoogleSheets(googleToken, habits);
      localStorage.setItem('last_sheets_sync', Date.now().toString());
      alert(`Export successful! You can view it in your Google Drive.`);
      window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`, '_blank');
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Make sure you accepted the Drive & Sheets permissions.");
      connectGoogleAPI(); // Re-prompt if scopes are missing
    } finally {
      setIsExporting(false);
    }
  };

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

      {/* Appearance Settings */}
      <div className="bg-[var(--bg-surface)] rounded-3xl p-2 shadow-sm border border-[var(--text-muted)]/10">
        {/* Dark Mode Toggle */}
        <div
          onClick={toggleDarkMode}
          className="p-4 flex items-center justify-between border-b border-[var(--text-muted)]/10 hover:bg-[var(--bg-main)]/50 rounded-t-3xl cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            {isDarkMode
              ? <Moon size={20} className="text-[var(--color-accent-blue)]" />
              : <Sun size={20} className="text-[var(--color-accent-peach)]" />
            }
            <span className="font-medium">Dark Mode</span>
          </div>
          <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors duration-300 ${isDarkMode ? 'bg-[var(--color-accent-blue)]' : 'bg-[var(--text-muted)]/30'}`}>
            <div className={`w-5 h-5 bg-[var(--bg-surface)] rounded-full shadow-md transition-transform duration-300 ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </div>
        </div>

        {/* Accent Colour Picker */}
        <div className="p-4 border-b border-[var(--text-muted)]/10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Accent Theme</p>
            <p className="text-xs text-[var(--text-muted)]">
              {ACCENT_THEMES.find(t => t.id === activeAccent)?.label}
            </p>
          </div>
          <div className="flex gap-4 items-center justify-start mt-2 px-1">
            {ACCENT_THEMES.map((theme) => {
              const swatch = isDarkMode ? theme.dark : theme.light;
              const bubble = isDarkMode ? theme.darkBubble : theme.bubble;
              const isSelected = activeAccent === theme.id;
              return (
                <button
                  key={theme.id}
                  title={theme.label}
                  onClick={() => applyAccent(theme.id)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${isSelected
                      ? 'scale-110 shadow-md'
                      : 'hover:scale-105 opacity-60 hover:opacity-100 shadow-sm'
                    }`}
                  style={{
                    backgroundColor: bubble,
                    border: isSelected
                      ? `2.5px solid ${bubble}`
                      : '2px solid rgba(141,153,174,0.22)',
                  }}
                >
                  {isSelected && <Check size={20} strokeWidth={3} style={{ color: swatch }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Google Connect / Re-auth if token missing */}
        {user && !googleToken && (
          <div
            onClick={connectGoogleAPI}
            className="p-4 flex items-center justify-between border-b border-[var(--text-muted)]/10 hover:bg-blue-400/10 cursor-pointer text-blue-500 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogIn size={20} />
              <span className="font-medium">Connect Google Services</span>
            </div>
            <span className="text-xs bg-blue-400/10 px-2 py-1 rounded-md font-medium">Action Required</span>
          </div>
        )}

        {/* Sign In / Sign Out */}
        {user ? (
          <div onClick={logout} className="p-4 flex items-center justify-between border-b border-[var(--text-muted)]/10 hover:bg-red-400/10 cursor-pointer text-red-500 transition-colors">
            <div className="flex items-center gap-3">
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </div>
            <span className="text-xs bg-red-400/10 px-2 py-1 rounded-md font-medium">
              {googleToken ? 'Fully Connected' : 'App Only'}
            </span>
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

        {/* Export Data */}
        <div
          onClick={handleExport}
          className={`p-4 flex items-center justify-between hover:bg-[var(--bg-main)]/50 rounded-b-3xl cursor-pointer ${isExporting ? 'opacity-50' : ''}`}
        >
          <div className="flex items-center gap-3">
            {isExporting ? <Loader size={20} className="animate-spin text-[var(--color-accent-blue)]" /> : <Download size={20} className="text-[var(--text-muted)]" />}
            <span className="font-medium">{isExporting ? 'Exporting & Formatting Sheet...' : 'Export to Google Sheets'}</span>
          </div>
          {isExporting && <span className="text-xs text-[var(--text-muted)]">Please wait</span>}
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] rounded-3xl p-2 shadow-sm border border-[var(--text-muted)]/10 mt-2">
        <div
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="p-4 flex items-center justify-between hover:bg-[var(--bg-main)]/50 rounded-3xl cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3 text-red-500">
            <Settings size={20} />
            <span className="font-medium">Advanced Settings</span>
          </div>
          {showAdvanced ? <ChevronUp size={20} className="text-[var(--text-muted)]" /> : <ChevronDown size={20} className="text-[var(--text-muted)]" />}
        </div>

        {showAdvanced && (
          <div className="mt-2 border-t border-[var(--text-muted)]/10">
            {/* Glassmorphism Toggle */}
            <div
              onClick={toggleGlassMode}
              className="p-4 flex items-center justify-between hover:bg-[var(--bg-main)]/50 rounded-b-3xl cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="text-[var(--color-accent-blue)]" />
                <span className="font-medium">Glassmorphism UI</span>
              </div>
              <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors duration-300 ${isGlass ? 'bg-[var(--color-accent-blue)]' : 'bg-[var(--text-muted)]/30'}`}>
                <div className={`w-5 h-5 bg-[var(--bg-surface)] rounded-full shadow-md transition-transform duration-300 ${isGlass ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </div>

            {/* Photo Backgrounds (only shown if Glassmorphism is enabled) */}
            {isGlass && (
              <div className="p-4 border-t border-[var(--text-muted)]/10 bg-[var(--bg-main)]/30 rounded-b-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon size={16} className="text-[var(--text-muted)]" />
                  <p className="text-sm font-medium">Photo Backgrounds</p>
                </div>
                <div className="flex flex-col gap-2">
                  {[...BACKGROUNDS, ...customBackgrounds].map((bg) => {
                    const isSelected = activeBackground === bg.url;
                    return (
                      <button
                        key={bg.id}
                        onClick={() => applyBackground(bg.url)}
                        className={`relative w-full h-16 rounded-2xl overflow-hidden flex items-center justify-between px-4 transition-all ${isSelected ? 'ring-2 ring-[var(--color-accent-blue)] shadow-md' : 'opacity-80 hover:opacity-100 hover:shadow-sm'
                          }`}
                      >
                        {/* Background Image inside button */}
                        <div
                          className="absolute inset-0 z-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${bg.url})` }}
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/30 z-10" />

                        <span className="relative z-20 text-white font-medium drop-shadow-md">
                          {bg.label}
                        </span>

                        {isSelected && (
                          <div className="relative z-20 w-6 h-6 rounded-full bg-[var(--color-accent-blue)] flex items-center justify-center text-white">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {/* Add Custom Background Button */}
                  <button
                    onClick={() => setIsAddBgModalOpen(true)}
                    className="relative w-full h-16 rounded-2xl overflow-hidden flex items-center justify-center px-4 transition-all border border-dashed border-[var(--text-muted)]/50 hover:bg-[var(--bg-main)] hover:border-[var(--text-muted)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Plus size={18} />
                      <span>Add Background</span>
                    </div>
                  </button>

                  <button
                    onClick={() => applyBackground('')}
                    className={`relative w-full h-16 rounded-2xl overflow-hidden flex items-center justify-between px-4 transition-all ${!activeBackground ? 'ring-2 ring-[var(--color-accent-blue)] shadow-md' : 'opacity-80 hover:opacity-100 hover:shadow-sm border border-[var(--text-muted)]/20'
                      }`}
                  >
                    {/* Background Gradient inside button */}
                    <div
                      className="absolute inset-0 z-0"
                      style={{ background: 'var(--glass-gradient)' }}
                    />

                    <span className="relative z-20 text-[var(--text-main)] font-medium drop-shadow-sm">
                      Theme Gradient
                    </span>

                    {!activeBackground && (
                      <div className="relative z-20 w-6 h-6 rounded-full bg-[var(--color-accent-blue)] flex items-center justify-center text-white">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Custom Background Modal */}
      <AnimatePresence>
        {isAddBgModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--bg-surface)] p-6 rounded-[2.5rem] w-full max-w-sm shadow-xl relative border border-[var(--text-muted)]/10 flex flex-col"
            >
              <button
                onClick={() => setIsAddBgModalOpen(false)}
                className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors bg-[var(--bg-main)] p-2 rounded-full"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-bold mb-6 mt-2 text-center">Add Background</h3>

              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block uppercase">Background Name</label>
                  <input
                    type="text"
                    placeholder="E.g. My Awesome Photo"
                    value={newBgName}
                    onChange={(e) => setNewBgName(e.target.value)}
                    className="w-full bg-[var(--bg-main)] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[var(--color-accent-blue)] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block uppercase">Select Image</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full h-32 bg-[var(--bg-main)] rounded-xl border-2 border-dashed border-[var(--text-muted)]/30 flex flex-col items-center justify-center overflow-hidden transition-colors hover:border-[var(--color-accent-blue)]">
                      {newBgImage ? (
                        <img src={newBgImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                          <Upload size={24} />
                          <span className="text-xs font-medium">Click to upload</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddCustomBackground}
                disabled={!newBgName.trim() || !newBgImage}
                className="w-full py-4 rounded-3xl font-semibold bg-[var(--text-main)] text-[var(--bg-surface)] hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Background
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
