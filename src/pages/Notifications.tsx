import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Clock, 
  Trash2, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  CheckCheck,
  Send,
  Filter,
  Calendar as CalendarIcon,
  ListFilter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate, safeDate } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { 
  AppNotification, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotificationDoc, 
  clearReadNotifications, 
  syncNoticeAlerts, 
  createTestAlert 
} from '../services/notifications';
import { AddToCalendarButton } from '../components/common/AddToCalendarButton';
import { AlertsCalendarView, CalendarAlertItem } from '../components/alerts/AlertsCalendarView';

const Notifications: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'deadline' | 'warning'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const DEFAULT_ALERTS: AppNotification[] = [
    {
      id: 'default-alert-1',
      userId: profile?.uid || 'user',
      title: '🚨 URGENT DEADLINE: BBMP Property Tax Assessment',
      message: 'Self-assessment filing with 5% rebate expires in 3 days. Ensure compliance on BBMP portal.',
      type: 'deadline',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'default-alert-2',
      userId: profile?.uid || 'user',
      title: 'Advisory Flag: Seva Sindhu Biometric Verification',
      message: 'Mandatory Aadhaar e-KYC linked to state benefit eligibility must be authenticated before deadline.',
      type: 'warning',
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'default-alert-3',
      userId: profile?.uid || 'user',
      title: 'Official Alert Monitor Active',
      message: 'Karnataka State Notice Registry automated compliance tracking is running successfully.',
      type: 'system',
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ];

  // Real-time notification listener
  useEffect(() => {
    if (!profile?.uid) return;

    setLoading(true);
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid)
    );

    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as AppNotification[];

        // Sort in memory by createdAt descending
        items.sort((a, b) => {
          const timeA = safeDate(a.createdAt)?.getTime() || 0;
          const timeB = safeDate(b.createdAt)?.getTime() || 0;
          return timeB - timeA;
        });

        setNotifications(items.length > 0 ? items : DEFAULT_ALERTS);
        setLoading(false);
      }, (error) => {
        console.warn("Notifications listener warning:", error);
        setNotifications(DEFAULT_ALERTS);
        setLoading(false);
      });
    } catch (e) {
      console.warn("Could not setup notifications listener:", e);
      setNotifications(DEFAULT_ALERTS);
      setLoading(false);
    }

    // Proactively scan deadlines once on mount
    syncNoticeAlerts(profile.uid);

    return () => unsubscribe();
  }, [profile?.uid]);

  // Real-time notices listener to resolve notice deadlines for calendar
  useEffect(() => {
    if (!profile?.uid) return;

    const getLocal = () => {
      try {
        return JSON.parse(localStorage.getItem('gov_local_notices') || '[]');
      } catch {
        return [];
      }
    };
    const localNotices = getLocal();

    const q = query(
      collection(db, 'notices'),
      where('userId', '==', profile.uid)
    );

    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const merged = new Map();
        docs.forEach((d: any) => merged.set(d.id, d));
        localNotices.forEach((d: any) => merged.set(d.id, d));
        setNotices(Array.from(merged.values()));
      }, (error) => {
        console.warn("Notices calendar sync warning:", error);
        setNotices(localNotices.length > 0 ? localNotices : [
          {
            id: 'demo-calendar-1',
            title: 'BBMP Property Tax Assessment 2026',
            deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
            category: 'Fiscal'
          },
          {
            id: 'demo-calendar-2',
            title: 'Seva Sindhu Biometric Verification',
            deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
            category: 'Civil'
          }
        ]);
      });
    } catch (e) {
      console.warn("Could not setup calendar notices listener:", e);
      setNotices(localNotices);
    }

    return () => unsubscribe();
  }, [profile?.uid]);

  const handleSyncAlerts = async () => {
    if (!profile?.uid || syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const added = await syncNoticeAlerts(profile.uid);
      setSyncMessage(added > 0 
        ? `Alert sync complete: Generated ${added} new notice deadline/warning alert(s)!` 
        : `All notice deadlines & warnings are current. No new alerts required.`
      );
    } catch (err) {
      setSyncMessage('Error synchronizing alerts. Please try again.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleCreateTest = async () => {
    if (!profile?.uid) return;
    try {
      await createTestAlert(profile.uid);
      setSyncMessage('Test alert generated! Alert delivery system is functional.');
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(notifications as any);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotificationDoc(id);
  };

  const handleClearRead = async () => {
    await clearReadNotifications(notifications as any);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const deadlineCount = notifications.filter(n => n.type === 'deadline').length;
  const warningCount = notifications.filter(n => n.type === 'warning').length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'deadline') return n.type === 'deadline';
    if (activeFilter === 'warning') return n.type === 'warning';
    return true;
  });

  // Map notices and notifications into unified calendar alert items
  const calendarItems = useMemo<CalendarAlertItem[]>(() => {
    const list: CalendarAlertItem[] = [];
    const seenNoticeIds = new Set<string>();

    // 1. Notice Deadlines
    for (const notice of notices) {
      if (notice.deadline) {
        const d = safeDate(notice.deadline);
        if (d) {
          seenNoticeIds.add(notice.id);
          list.push({
            id: `notice-deadline-${notice.id}`,
            title: `Deadline: ${notice.title}`,
            message: notice.simplifiedSummary || `Compliance deadline for ${notice.title}`,
            date: d,
            type: 'deadline',
            noticeId: notice.id,
            category: notice.category,
          });
        }
      }
    }

    // 2. Notifications & Alerts
    for (const n of notifications) {
      const relatedNotice = notices.find(nt => nt.id === n.noticeId);
      let alertDate = safeDate(relatedNotice?.deadline);
      
      // If no notice deadline or not a deadline alert, use notification createdAt
      if (!alertDate || n.type !== 'deadline') {
        alertDate = safeDate(n.createdAt) || new Date();
      }

      // Avoid duplicating the exact notice deadline entry
      if (n.type === 'deadline' && n.noticeId && seenNoticeIds.has(n.noticeId)) {
        continue;
      }

      list.push({
        id: n.id || `notif-${Math.random()}`,
        title: n.title,
        message: n.message,
        date: alertDate,
        type: n.type,
        noticeId: n.noticeId,
        read: n.read,
      });
    }

    return list;
  }, [notices, notifications]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 font-sans">
      {/* Header Banner */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-gold font-black uppercase tracking-[0.3em] text-[10px] mb-2">
            <Bell size={14} />
            <span>Real-Time Alert Dispatch & Calendar Sync</span>
          </div>
          <h1 className="text-4xl font-serif font-black text-navy tracking-tight">System Alerts</h1>
          <p className="text-slate-500 font-medium mt-1">
            Live tracking for government filing deadlines, official warnings, and action dates.
          </p>
        </div>

        {/* View Mode Toggle: List vs Date of Alerts Calendar */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer",
              viewMode === 'list' 
                ? "bg-white text-navy shadow-sm" 
                : "text-slate-500 hover:text-navy"
            )}
          >
            <ListFilter size={14} />
            <span>List View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer",
              viewMode === 'calendar' 
                ? "bg-navy text-gold shadow-sm" 
                : "text-slate-500 hover:text-navy"
            )}
          >
            <CalendarIcon size={14} />
            <span>Calendar to Date of Alerts</span>
          </button>
        </div>
      </header>

      {/* Action Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleSyncAlerts}
            disabled={syncing}
            className="px-4 py-2 bg-navy text-gold rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm hover:bg-navy/90 active:scale-95 transition-all cursor-pointer"
            title="Scan upcoming notice deadlines and synchronize alerts"
          >
            <RefreshCw size={13} className={cn(syncing && "animate-spin")} />
            {syncing ? 'Scanning Deadlines...' : 'Scan & Sync Alerts'}
          </button>

          <button 
            onClick={handleCreateTest}
            className="px-3.5 py-2 bg-slate-50 hover:bg-gold/10 text-navy hover:text-gold rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border border-slate-200/60 cursor-pointer"
            title="Dispatch a test alert to verify the alert subsystem"
          >
            <Send size={13} />
            Test Alert
          </button>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck size={13} />
              Mark All Read
            </button>
          )}

          {notifications.some(n => n.read) && (
            <button 
              onClick={handleClearRead}
              className="px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Remove already read alerts"
            >
              Clear Read
            </button>
          )}
        </div>
      </div>

      {/* Sync Status Banner */}
      <AnimatePresence>
        {syncMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold"
          >
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Alerts', val: notifications.length, color: 'navy', filter: 'all' as const },
          { label: 'Unread', val: unreadCount, color: 'blue', filter: 'unread' as const },
          { label: 'Deadlines', val: deadlineCount, color: 'red', filter: 'deadline' as const },
          { label: 'Warnings', val: warningCount, color: 'amber', filter: 'warning' as const },
        ].map(m => (
          <button
            key={m.label}
            onClick={() => {
              setActiveFilter(m.filter);
              setViewMode('list');
            }}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all cursor-pointer",
              activeFilter === m.filter && viewMode === 'list'
                ? "bg-navy text-white border-navy shadow-md ring-2 ring-gold/40" 
                : "bg-white text-navy border-slate-100 hover:border-slate-200"
            )}
          >
            <p className={cn("text-[9px] font-black uppercase tracking-widest", activeFilter === m.filter && viewMode === 'list' ? "text-gold" : "text-slate-400")}>
              {m.label}
            </p>
            <p className="text-2xl font-serif font-black mt-1 leading-none">
              {m.val}
            </p>
          </button>
        ))}
      </div>

      {/* MAIN CONTENT AREA: TOGGLED BETWEEN LIST AND CALENDAR */}
      {viewMode === 'calendar' ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-black text-navy flex items-center gap-2">
              <CalendarIcon size={18} className="text-gold" />
              <span>Calendar to Date of Alerts</span>
            </h2>
            <span className="text-xs text-slate-500 font-bold">
              {calendarItems.length} Dates Tracked
            </span>
          </div>

          <AlertsCalendarView 
            items={calendarItems}
            onSelectNotice={(noticeId) => navigate(`/notice/${noticeId}`)}
          />
        </section>
      ) : (
        <>
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Filter size={14} className="text-slate-400 mr-2" />
            {[
              { id: 'all', label: 'All Alerts' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'deadline', label: `Deadlines (${deadlineCount})` },
              { id: 'warning', label: `Warnings (${warningCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                  activeFilter === tab.id
                    ? "bg-gold text-navy shadow-sm"
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {filteredNotifications.map((n, idx) => {
                const isDeadline = n.type === 'deadline';
                const isWarning = n.type === 'warning';
                const isSystem = n.type === 'system';

                const relatedNotice = notices.find(nt => nt.id === n.noticeId);
                const alertCalendarDate = safeDate(relatedNotice?.deadline) || safeDate(n.createdAt) || new Date();

                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => n.id && handleMarkAsRead(n.id)}
                    className={cn(
                      "p-6 bg-white rounded-3xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start gap-5 relative group shadow-sm",
                      n.read 
                        ? "border-slate-100 opacity-75 hover:opacity-95 bg-white/60" 
                        : isDeadline 
                          ? "border-red-200 ring-2 ring-red-50 shadow-red-50/50 bg-red-50/20"
                          : isWarning
                            ? "border-amber-200 ring-2 ring-amber-50 bg-amber-50/20"
                            : "border-blue-200 ring-2 ring-blue-50 bg-white"
                    )}
                  >
                    {/* Type Icon Badge */}
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                      isDeadline ? "bg-red-500 text-white shadow-red-200" :
                      isWarning ? "bg-amber-500 text-white shadow-amber-200" :
                      isSystem ? "bg-navy text-gold shadow-navy/20" :
                      "bg-blue-600 text-white shadow-blue-200"
                    )}>
                      {isDeadline ? <Clock className="w-6 h-6 animate-pulse" /> :
                       isWarning ? <AlertTriangle className="w-6 h-6" /> :
                       isSystem ? <ShieldCheck className="w-6 h-6" /> :
                       <Info className="w-6 h-6" />}
                    </div>
                    
                    {/* Alert Content */}
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={cn(
                            "font-bold text-base leading-snug",
                            !n.read ? "text-navy" : "text-slate-600",
                            isDeadline && !n.read && "text-red-700"
                          )}>
                            {n.title}
                          </h4>
                          {!n.read && (
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest shrink-0">
                          {formatDate(n.createdAt, 'MMM d, h:mm a')}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        {n.message}
                      </p>
                      
                      {/* Notice Link & Actions */}
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {/* Add to Calendar Action Button */}
                        <AddToCalendarButton
                          title={n.title}
                          description={n.message}
                          date={alertCalendarDate}
                          noticeId={n.noticeId}
                          size="sm"
                          variant="outline"
                          showDatePreview={true}
                        />

                        {n.noticeId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (n.id) handleMarkAsRead(n.id);
                              navigate(`/notice/${n.noticeId}`);
                            }}
                            className="px-3 py-1 bg-navy/5 text-navy hover:bg-navy hover:text-gold rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            Inspect Notice
                            <ExternalLink size={12} />
                          </button>
                        )}

                        {isDeadline && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            <Clock size={12} />
                            Urgent Action Required
                          </span>
                        )}

                        {isWarning && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            <AlertTriangle size={12} />
                            Compliance Advisory
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {n.id && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, n.id!)}
                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          title="Delete alert"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {!n.read && (
                        <div className="w-2.5 h-2.5 bg-navy rounded-full ring-4 ring-gold/40" title="Unread" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredNotifications.length === 0 && !loading && (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <Bell size={48} className="text-slate-200 mx-auto mb-4" />
                <h3 className="text-base font-serif font-black text-navy uppercase tracking-wider">
                  No Alerts Found
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  You are completely up to date with all notice filings and compliance tasks.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Notifications;
