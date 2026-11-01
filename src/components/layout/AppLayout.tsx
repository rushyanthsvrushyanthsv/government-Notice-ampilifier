import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Watermark } from './Watermark';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Bell, Clock, AlertTriangle, Info, CheckCheck, ExternalLink, ChevronRight, ShieldAlert } from 'lucide-react';
import { StateEmblem } from '../common/StateEmblem';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../../lib/firebase';
import { cn, formatDate, safeDate } from '../../lib/utils';
import { markAllNotificationsAsRead, markNotificationAsRead, AppNotification } from '../../services/notifications';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, profile, isAdmin } = useAuth();
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Real-time notification subscription
  useEffect(() => {
    if (!profile?.uid) return;

    // In demo/bypass mode when Firebase Auth session is absent
    if (!auth.currentUser) {
      setNotifications([
        {
          id: 'demo-notif-1',
          userId: profile.uid,
          title: 'Karnataka Notice Alert System Active',
          message: 'Real-time alert monitoring active for state notices and compliance deadlines.',
          type: 'system',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'demo-notif-2',
          userId: profile.uid,
          title: 'BBMP Property Tax Assessment',
          message: 'Filing rebate window closing soon. Check notice details to claim 5% incentive.',
          type: 'deadline',
          read: false,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        }
      ]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppNotification[];
      docs.sort((a, b) => {
        const timeA = safeDate(a.createdAt)?.getTime() || 0;
        const timeB = safeDate(b.createdAt)?.getTime() || 0;
        return timeB - timeA;
      });
      setNotifications(docs);
    }, (error) => {
      console.warn("Notifications subscription warning:", error);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 4);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Registry Dashboard';
    if (path.startsWith('/notice/')) return 'Document Profile';
    if (path === '/upload') return 'Ingestion Center';
    if (path === '/alerts') return 'System Alerts';
    if (path === '/actions') return 'Action Checklist';
    if (path === '/timeline') return 'Deadline Timeline';
    if (path === '/history') return 'Archive Log';
    if (path === '/live') return 'Live Hub';
    return path.split('/')[1] || 'Portal';
  };

  return (
    <div className="flex min-h-screen bg-[#FAF9F6] font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen relative overflow-hidden flex flex-col">
        <Watermark />
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-10 bg-white/60 backdrop-blur-md border-b border-navy/5 relative z-30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-center p-0.5 shadow-sm">
              <StateEmblem size={32} variant="karnataka" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-black tracking-tight text-navy capitalize leading-none">
                {getPageTitle()}
              </h2>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#AA7A1E] mt-1">
                ಕರ್ನಾಟಕ ಸರ್ಕಾರ &bull; Govt. of Karnataka
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Bell Icon with Real-time Badge & Quick Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm border transition-all duration-300 relative",
                  showDropdown || unreadCount > 0
                    ? "bg-navy text-gold border-navy/20"
                    : "bg-white text-navy border-navy/5 hover:bg-navy hover:text-gold"
                )}
                title={`${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-md animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Alert Quick Preview Dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-84 sm:w-96 bg-white rounded-3xl shadow-2xl border border-navy/10 p-5 z-50 text-navy"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-serif font-black text-sm tracking-tight">Activity Alerts</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {unreadCount > 0 ? `${unreadCount} New Unread Alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                        </p>
                      </div>

                      {unreadCount > 0 && (
                        <button
                          onClick={async () => {
                            await markAllNotificationsAsRead(notifications as any);
                          }}
                          className="text-[10px] text-blue-700 hover:text-blue-900 font-black uppercase tracking-wider flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg"
                        >
                          <CheckCheck size={12} /> Mark Read
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-slate-50 my-2 max-h-72 overflow-y-auto">
                      {recentNotifications.length > 0 ? (
                        recentNotifications.map((n) => (
                          <div 
                            key={n.id}
                            onClick={async () => {
                              if (n.id && !n.read) await markNotificationAsRead(n.id);
                              setShowDropdown(false);
                              if (n.noticeId) {
                                navigate(`/notice/${n.noticeId}`);
                              } else {
                                navigate('/alerts');
                              }
                            }}
                            className={cn(
                              "p-3 rounded-2xl transition-all cursor-pointer flex items-start gap-3 my-1",
                              n.read ? "opacity-60 hover:opacity-100 hover:bg-slate-50" : "bg-blue-50/40 hover:bg-blue-50/70"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                              n.type === 'deadline' ? "bg-red-500 text-white" :
                              n.type === 'warning' ? "bg-amber-500 text-white" :
                              "bg-navy text-gold"
                            )}>
                              {n.type === 'deadline' ? <Clock size={14} /> :
                               n.type === 'warning' ? <AlertTriangle size={14} /> :
                               <Info size={14} />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs font-bold truncate", !n.read ? "text-navy" : "text-slate-600")}>
                                {n.title}
                              </p>
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                {n.message}
                              </p>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                                {formatDate(n.createdAt, 'MMM d, h:mm a')}
                              </span>
                            </div>

                            {!n.read && (
                              <div className="w-2 h-2 rounded-full bg-navy mt-1.5 shrink-0" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-slate-400">
                          <Bell size={24} className="mx-auto mb-2 opacity-30" />
                          <p className="text-xs font-bold uppercase tracking-wider">No Alerts In Inbox</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate('/alerts');
                        }}
                        className="w-full py-2.5 bg-navy text-gold hover:bg-navy/95 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md"
                      >
                        <span>Open Alerts Center</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button 
              onClick={logout}
              className="w-10 h-10 bg-white border border-navy/5 rounded-xl flex items-center justify-center text-navy shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-300 group"
              title="Logout"
            >
              <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            </button>

            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')}
                className="bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-900/20 hover:scale-[1.03] transition-all flex items-center gap-2 cursor-pointer border border-red-500/40"
                title="Open Karnataka Admin Portal"
              >
                <ShieldAlert size={14} className="text-amber-300" />
                <span>Admin Operations</span>
              </button>
            )}

            <button 
              onClick={() => navigate('/live')}
              className="bg-navy text-gold px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-navy/20 hover:scale-[1.05] transition-all cursor-pointer"
            >
              Live Sessions
            </button>
          </div>
        </header>

        <div className="relative z-10 p-10 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Alert Banner Footer */}
        <div className="h-12 bg-navy flex items-center justify-center gap-6 px-10 z-20 relative overflow-hidden">
          <div className="absolute inset-x-0 h-px bg-gold/30 top-0" />
          <span className="text-gold font-black text-[9px] uppercase tracking-[0.4em] animate-pulse">System Broadcast</span>
          <p className="text-cream text-xs font-medium tracking-wide">Secure Encryption 256-bit Active &bull; Citizen Data Protection Layer 4.0 Engaged</p>
        </div>
      </main>
    </div>
  );
};
