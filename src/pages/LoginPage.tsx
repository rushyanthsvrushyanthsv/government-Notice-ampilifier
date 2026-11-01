import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Building2,
  Users
} from 'lucide-react';
import { useAuth, ADMIN_CREDENTIALS } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { StateEmblem } from '../components/common/StateEmblem';

const BG_IMAGE = "https://images.unsplash.com/photo-1624396972412-ce4403079b76?q=80&w=2072&auto=format&fit=crop";

const LoginPage: React.FC = () => {
  const { 
    user, 
    loading, 
    isAdmin, 
    loginAsAdmin, 
    loginAsCitizen,
    signInWithGoogle 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'admin' | 'citizen'>('admin');
  
  // Admin Login Inputs (accepts ANY name and password)
  const [adminName, setAdminName] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  
  // Citizen Input
  const [citizenName, setCitizenName] = useState('');

  const [loadingState, setLoadingState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (loading) return null;
  if (user) return <Navigate to={isAdmin ? "/admin" : "/"} replace />;

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingState(true);
    setError(null);

    try {
      const chosenName = adminName.trim() || 'Karnataka State Administrator';
      loginAsAdmin(chosenName);
      setSuccessMsg(`Welcome, ${chosenName}! Access granted to Administration Operations.`);
    } catch (err: any) {
      setError("Login failed. Please retry.");
    } finally {
      setLoadingState(false);
    }
  };

  const handleCitizenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingState(true);
    try {
      loginAsCitizen(citizenName.trim() || 'Karnataka Citizen');
    } finally {
      setLoadingState(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoadingState(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || "Google sign-in was closed or unavailable.");
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#FAF9F6] p-4 md:p-6 selection:bg-red-100 selection:text-red-900">
      {/* Background Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center grayscale opacity-15"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#FAF9F6] via-[#F3F4F6] to-[#E5E5E5]" />
      
      {/* Texture Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }}
      />

      {/* Decorative ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[100px] -ml-40 -mb-40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10 my-8"
      >
        <div className="bg-white/95 backdrop-blur-2xl rounded-[2.8rem] p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border border-white relative overflow-hidden">
          {/* Ornamental Accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />

          {/* Karnataka State Official Emblem Header */}
          <div className="flex flex-col items-center mb-7">
            <motion.div 
              animate={{ 
                boxShadow: [
                  "0 10px 30px -10px rgba(212,175,55,0.25)", 
                  "0 15px 35px -5px rgba(212,175,55,0.5)", 
                  "0 10px 30px -10px rgba(212,175,55,0.25)"
                ] 
              }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="w-24 h-24 bg-gradient-to-b from-white to-amber-50/40 rounded-full flex items-center justify-center mb-3.5 shadow-xl relative border-2 border-[#D4AF37]/50 ring-4 ring-amber-100/60 p-2"
            >
              <StateEmblem size={76} variant="karnataka" />
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-slate-900 tracking-tight text-center">
              ಕರ್ನಾಟಕ ಸರ್ಕಾರ
            </h1>
            <p className="text-amber-800 font-extrabold uppercase tracking-[0.25em] text-[10px] mt-1 text-center">
              Government of Karnataka
            </p>
            <p className="text-slate-500 font-bold uppercase tracking-[0.15em] text-[9px] mt-0.5">
              State Notice Administration & Citizen Portal
            </p>
          </div>

          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 rounded-2xl mb-6 border border-slate-200/60">
            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setError(null); }}
              className={cn(
                "py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer",
                activeTab === 'admin' 
                  ? "bg-slate-900 text-amber-300 shadow-md font-bold" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <ShieldCheck size={16} className={activeTab === 'admin' ? "text-amber-400" : ""} />
              <span>Admin Portal</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('citizen'); setError(null); }}
              className={cn(
                "py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer",
                activeTab === 'citizen' 
                  ? "bg-white text-slate-900 shadow-md font-bold" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Users size={16} />
              <span>Citizen View</span>
            </button>
          </div>

          {/* Active Error / Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs font-semibold leading-relaxed"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
              <div>{error}</div>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold"
            >
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
              <div>{successMsg}</div>
            </motion.div>
          )}

          {/* TAB 1: ADMINISTRATION LOGIN (Accepts ANY Name and Password) */}
          {activeTab === 'admin' && (
            <div className="space-y-5">
              {/* Notification Banner Explaining Any Name & Password is Supported */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-start gap-3">
                <KeyRound className="text-amber-600 w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-black uppercase tracking-wider text-amber-900">
                    Universal Administrator Access
                  </div>
                  <div className="text-slate-600 mt-0.5 leading-relaxed font-medium">
                    Type <strong>any name/username and password</strong> below to log in as administrator. Pre-filled with default credentials for instant access.
                  </div>
                </div>
              </div>

              {/* Form for Any Name & Password */}
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                {/* Admin Name Input */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 ml-1">
                    Administrator Name / Username
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-700 transition-colors" size={18} />
                    <input 
                      type="text"
                      placeholder="e.g. admin, Rushyanth, Officer Kumar"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full h-13 pl-11 pr-4 bg-slate-50 border border-slate-200/90 focus:border-red-600 focus:bg-white rounded-2xl transition-all outline-none text-slate-900 font-bold text-sm placeholder:text-slate-400 shadow-inner"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 ml-1">
                    Accepts any name or official ID.
                  </p>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 ml-1">
                    Admin Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-700 transition-colors" size={18} />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Any password (e.g. admin123)"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full h-13 pl-11 pr-12 bg-slate-50 border border-slate-200/90 focus:border-red-600 focus:bg-white rounded-2xl transition-all outline-none text-slate-900 font-bold text-sm placeholder:text-slate-400 shadow-inner"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 ml-1">
                    Any password is accepted for administrative testing & operations.
                  </p>
                </div>

                {/* Login Button */}
                <motion.button
                  type="submit"
                  disabled={loadingState}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full h-14 bg-gradient-to-r from-slate-900 via-[#1E293B] to-[#881337] hover:from-black hover:to-[#991b1b] text-amber-300 hover:text-amber-200 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 disabled:opacity-50 mt-4 cursor-pointer border border-amber-400/30"
                >
                  {loadingState ? (
                    <Loader2 className="animate-spin text-amber-300" size={20} />
                  ) : (
                    <>
                      <ShieldCheck size={18} className="text-amber-400" />
                      <span>Sign In as Administrator</span>
                      <ChevronRight size={18} />
                    </>
                  )}
                </motion.button>
              </form>

              {/* 1-Click Instant Enter Admin Shortcut */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => loginAsAdmin('Karnataka State Administrator')}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 via-red-700 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-red-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-amber-300/30"
                >
                  <Sparkles size={16} className="text-amber-200" />
                  <span>1-Click Direct Enter (No Typing Required)</span>
                </button>
              </div>

              {/* Or Google 1-Click for Google Workspace / Cloud accounts */}
              <div className="pt-4 border-t border-slate-200/80">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    or authenticate with google
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <button 
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loadingState}
                  className="w-full h-12 bg-white border border-slate-300 hover:border-slate-400 rounded-xl flex items-center justify-center gap-3 text-slate-800 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google Account</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CITIZEN VIEW */}
          {activeTab === 'citizen' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 flex items-start gap-3">
                <Users className="text-blue-600 w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-black uppercase tracking-wider text-blue-900">
                    Public Citizen Access
                  </div>
                  <div className="text-blue-900/80 mt-0.5 leading-relaxed font-medium">
                    Citizens can explore public notices, checklists, multilingual translations, and alerts.
                  </div>
                </div>
              </div>

              <form onSubmit={handleCitizenSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 ml-1">
                    Your Name (Optional)
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input 
                      type="text"
                      placeholder="e.g. Karnataka Citizen"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      className="w-full h-13 pl-11 pr-4 bg-slate-50 border border-slate-200/90 focus:border-blue-600 focus:bg-white rounded-2xl transition-all outline-none text-slate-900 font-bold text-sm placeholder:text-slate-400 shadow-inner"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loadingState}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full h-14 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 disabled:opacity-50 cursor-pointer"
                >
                  <span>Explore as Citizen</span>
                  <ChevronRight size={18} />
                </motion.button>
              </form>

              <button 
                type="button"
                onClick={handleGoogleAuth}
                disabled={loadingState}
                className="w-full h-12 bg-white border border-slate-300 hover:border-slate-400 rounded-xl flex items-center justify-center gap-3 text-slate-800 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Citizen Google Sign-In</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between text-[#8B0000]/60 font-semibold z-10 gap-2 pointer-events-none">
        <div className="flex items-center gap-2.5">
          <StateEmblem size={22} className="opacity-75" />
          <span className="text-[10px] uppercase tracking-widest">Public Notice Portal • Government of Karnataka</span>
        </div>
        <div className="flex gap-4 text-[10px] uppercase tracking-widest">
          <span>Admin Operations</span>
          <span>•</span>
          <span>Bilingual English & Kannada</span>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
