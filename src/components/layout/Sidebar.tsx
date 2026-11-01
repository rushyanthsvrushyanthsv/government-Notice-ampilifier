import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  FileUp, 
  Sparkles, 
  ListTodo, 
  CalendarRange, 
  BookA, 
  Bell, 
  History, 
  ShieldAlert, 
  UserCircle2,
  LogOut,
  Radio
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { StateEmblem } from '../common/StateEmblem';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FileUp, label: 'Upload Notice', path: '/upload' },
  { icon: Radio, label: 'Live Sessions', path: '/live' },
  { icon: History, label: 'History', path: '/history' },
  { icon: ListTodo, label: 'Actions', path: '/actions' },
  { icon: CalendarRange, label: 'Timeline', path: '/timeline' },
  { icon: Bell, label: 'System Alerts', path: '/alerts' },
];

const adminItems = [
  { icon: ShieldAlert, label: 'Admin Panel', path: '/admin' },
];

interface NavItemRenderProps {
  icon: any;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemRenderProps> = ({ icon: Icon, label, isActive }) => {
  return (
    <>
      <Icon className={cn("w-5 h-5 transition-colors duration-500", isActive ? "text-[#c8a84b]" : "text-white/30 group-hover:text-[#c8a84b]")} />
      <span>{label}</span>
      {isActive && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute right-4 w-1.5 h-1.5 bg-[#c8a84b] rounded-full shadow-[0_0_12px_#c8a84b]"
        />
      )}
    </>
  );
};

export const Sidebar: React.FC = () => {
  const { profile, logout, isAdmin } = useAuth();

  return (
    <div className="w-64 h-screen bg-[#1a2744] flex flex-col fixed left-0 top-0 z-50 shadow-2xl border-r border-[#c8a84b]/10">
      <div className="p-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center font-bold text-[#1a2744] shadow-xl border border-[#c8a84b]/40 p-1">
          <StateEmblem size={38} variant="karnataka" />
        </div>
        <div>
          <h1 className="text-white font-serif font-black text-lg leading-none tracking-tight">GovSimplify</h1>
          <p className="text-[#c8a84b] text-[8px] font-black tracking-[0.3em] uppercase mt-1">ಕರ್ನಾಟಕ ಸರ್ಕಾರ</p>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-8 space-y-2">
        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-4 py-2">Universal Access</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-500 group relative font-black text-[10px] uppercase tracking-widest",
              isActive 
                ? "bg-white/5 text-[#c8a84b] border border-white/5 shadow-2xl" 
                : "text-white/40 hover:bg-white/5 hover:text-white"
            )}
          >
            {({ isActive }) => <NavItem icon={item.icon} label={item.label} isActive={isActive} />}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-4 py-6 border-t border-white/5 mt-4">Security Tier</div>
            {adminItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-500 group relative font-black text-[10px] uppercase tracking-widest",
                    isActive 
                      ? "bg-red-500/10 text-red-400 border border-red-500/10" 
                      : "text-white/20 hover:bg-red-500/5 hover:text-red-400"
                  )}
                >
                  {({ isActive }) => <NavItem icon={item.icon} label={item.label} isActive={isActive} />}
                </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/5 mb-4 group hover:border-[#c8a84b]/30 transition-all duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1a2744] border border-[#c8a84b]/30 overflow-hidden ring-1 ring-[#c8a84b]/10">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 className="w-8 h-8 text-[#c8a84b] m-2" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white font-black uppercase tracking-widest truncate">{profile?.displayName || 'Citizen'}</p>
              <p className="text-[8px] text-[#c8a84b] font-black uppercase tracking-[0.2em] mt-1">{profile?.role || 'User'}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl text-white/30 hover:bg-red-500/5 hover:text-red-400 transition-all duration-500 text-[10px] font-black uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};
