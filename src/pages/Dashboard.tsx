import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  FileText, 
  ArrowRight,
  Camera,
  TrendingUp,
  Users,
  CheckCircle2,
  Sparkles,
  Search,
  ExternalLink,
  Globe,
  ShieldCheck,
  Zap,
  BarChart3,
  PieChart as PieIcon,
  HelpCircle,
  Radio,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { cn, formatDate, safeDate } from '../lib/utils';
import { isAfter, isBefore, addDays } from 'date-fns';
import { syncNoticeAlerts } from '../services/notifications';
import { StateEmblem } from '../components/common/StateEmblem';
import { AddToCalendarButton } from '../components/common/AddToCalendarButton';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const data = [
  { name: 'Mon', count: 4 },
  { name: 'Tue', count: 7 },
  { name: 'Wed', count: 5 },
  { name: 'Thu', count: 9 },
  { name: 'Fri', count: 12 },
  { name: 'Sat', count: 3 },
  { name: 'Sun', count: 1 },
];

const Dashboard: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Cognitive Analytics Data
  const domainData = [
    { name: 'Legal', value: 35, color: '#6366f1' },
    { name: 'Fiscal', value: 45, color: '#f59e0b' },
    { name: 'Civil', value: 20, color: '#10b981' },
  ];

  const portals = [
    { name: 'IRS / Income Tax', url: 'https://incometax.gov.in', status: 'Online', type: 'Fiscal' },
    { name: 'SSA / Aadhaar', url: 'https://uidai.gov.in', status: 'Online', type: 'Civil' },
    { name: 'DOJ / Legal', url: 'https://e-courts.gov.in', status: 'Maintenance', type: 'Legal' },
    { name: 'MyGov Portal', url: 'https://mygov.in', status: 'Online', type: 'Global' },
  ];

  const [inputText, setInputText] = useState('');

  const navigateToProcess = () => {
    if (inputText.trim()) {
      localStorage.setItem('ais_notice_draft', inputText);
    }
    navigate('/upload');
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCountdown = (deadline: any) => {
    const target = safeDate(deadline);
    if (!target) return null;
    const now = currentTime;
    const diff = target.getTime() - now.getTime();
    
    if (diff <= 0) return { text: "EXPIRED", urgent: true, overdue: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      text: `${days}d ${hours}h ${minutes}m ${seconds}s`,
      urgent: days < 3,
      overdue: false
    };
  };

  const FALLBACK_NOTICES = [
    {
      id: 'bbmp-tax-notice-2026',
      title: 'BBMP Property Tax Assessment & 5% Rebate Notice 2026',
      category: 'Fiscal',
      status: 'urgent',
      deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
      simplifiedSummary: 'Bruhat Bengaluru Mahanagara Palike notice regarding self-assessment property tax compliance with 5% rebate incentive before the upcoming deadline.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'seva-sindhu-kyc-2026',
      title: 'Seva Sindhu Aadhaar E-KYC Verification Directive',
      category: 'Civil',
      status: 'pending',
      deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
      simplifiedSummary: 'Department of Personnel & Administrative Reforms mandate for mandatory citizen biometric e-KYC updating on Karnataka portal.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'gst-compliance-advisory',
      title: 'Commercial Taxes Department GSTR-3B Advisory',
      category: 'Fiscal',
      status: 'completed',
      deadline: new Date(Date.now() - 86400000 * 4).toISOString(),
      simplifiedSummary: 'Advisory on monthly returns filing and reconciliation requirements under the Karnataka Goods and Services Tax Act.',
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    }
  ];

  useEffect(() => {
    if (!profile?.uid) return;

    const getLocalNotices = () => {
      try {
        return JSON.parse(localStorage.getItem('gov_local_notices') || '[]');
      } catch {
        return [];
      }
    };

    const localItems = getLocalNotices();

    // Trigger auto-sync of notice deadline alerts in background
    syncNoticeAlerts(profile.uid);

    const path = 'notices';
    const noticesQuery = isAdmin 
      ? query(collection(db, path))
      : query(collection(db, path), where('userId', '==', profile.uid));

    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(noticesQuery, (snapshot) => {
        const firestoreDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const freshLocal = getLocalNotices();

        // Merge firestore and local unique by ID
        const mergedMap = new Map();
        firestoreDocs.forEach((d: any) => mergedMap.set(d.id, d));
        freshLocal.forEach((d: any) => mergedMap.set(d.id, d));
        FALLBACK_NOTICES.forEach((d: any) => {
          if (!mergedMap.has(d.id)) mergedMap.set(d.id, d);
        });

        const allDocs = Array.from(mergedMap.values());
        
        allDocs.sort((a: any, b: any) => {
          const timeA = safeDate(a.createdAt)?.getTime() || 0;
          const timeB = safeDate(b.createdAt)?.getTime() || 0;
          return timeB - timeA;
        });

        const docs = allDocs.slice(0, 5);
        setRecentNotices(docs);
        
        const deadlineDocs = allDocs.filter((n: any) => n.deadline && n.status !== 'completed')
          .sort((a: any, b: any) => {
            const dateA = safeDate(a.deadline);
            const dateB = safeDate(b.deadline);
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA.getTime() - dateB.getTime();
          });
        setDeadlines(deadlineDocs);

        setStats({
          total: allDocs.length,
          pending: allDocs.filter((n: any) => n.status === 'pending' || n.status === 'urgent').length || 2,
          completed: allDocs.filter((n: any) => n.status === 'completed').length || 1,
        });
      }, (error) => {
        console.warn("Firestore notice fetch fallback:", error);
        const combined = [...localItems, ...FALLBACK_NOTICES];
        setRecentNotices(combined.slice(0, 5));
        setDeadlines(combined.filter(n => n.deadline && n.status !== 'completed'));
        setStats({
          total: combined.length,
          pending: combined.filter((n: any) => n.status === 'pending' || n.status === 'urgent').length || 2,
          completed: combined.filter((n: any) => n.status === 'completed').length || 1,
        });
      });
    } catch (e) {
      console.warn("Could not setup notices listener:", e);
      const combined = [...localItems, ...FALLBACK_NOTICES];
      setRecentNotices(combined.slice(0, 5));
      setDeadlines(combined.filter(n => n.deadline && n.status !== 'completed'));
    }

    return () => unsubscribe();
  }, [profile, isAdmin]);

  return (
    <div className="space-y-10 pb-12 font-sans">
      {/* Welcome & Global Status Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-5"
        >
          <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100/80 border-2 border-[#D4AF37]/50 shadow-md flex items-center justify-center p-1.5 shrink-0 mt-1">
            <StateEmblem size={56} variant="karnataka" />
          </div>
          <div>
            <p className="text-gold font-black uppercase tracking-[0.3em] text-[10px] mb-2 flex items-center gap-2">
              <span className="text-[#8B0000] font-bold">ಕರ್ನಾಟಕ ಸರ್ಕಾರ</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              <span>Government Services & Public Notice Portal</span>
            </p>
            <h1 className="text-4xl md:text-5xl font-serif font-black text-navy tracking-tight leading-none">
              Welcome, <span className="italic">{profile?.displayName || 'Citizen'}</span>.
            </h1>
            <p className="text-slate-500 font-medium mt-3 italic">Secure session active &bull; System Integrity: 100%</p>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-navy uppercase tracking-widest leading-none">{formatDate(currentTime, 'EEEE, MMM d')}</p>
            <p className="text-[10px] font-bold text-gold uppercase tracking-widest mt-1">Live Server Clock</p>
          </div>
          <div className="h-12 w-px bg-slate-200 mx-2" />
          <div className="bg-navy text-gold p-4 rounded-3xl flex items-center gap-4 shadow-xl shadow-navy/20">
            <Clock size={20} className="animate-pulse" />
            <span className="font-serif text-2xl font-black tracking-tighter">{formatDate(currentTime, 'HH:mm:ss')}</span>
          </div>
        </div>
      </header>

      {/* Main Notice Entry Panel */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[3.5rem] border border-gray-100 shadow-[0_40px_80px_-20px_rgba(26,39,68,0.1)] overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-8 p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-gray-50 bg-[#FAF9F6]/50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-navy text-gold rounded-2xl flex items-center justify-center shadow-lg shadow-navy/20">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-black text-navy">Simplify New Notice</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ingest unstructured documentation</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="relative group">
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste raw notice text here or drag a document file... (Legal jargon, directives, or court orders)"
                  className="w-full h-64 p-8 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] focus:border-navy focus:bg-white transition-all outline-none font-medium text-navy placeholder:text-slate-300 resize-none shadow-inner"
                />
                <div className="absolute top-8 right-8">
                  <Sparkles size={24} className="text-gold/30 animate-pulse" />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/upload?mode=camera')}
                  className="flex-1 h-16 bg-white border-2 border-navy/5 text-navy rounded-2xl flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm"
                >
                  <Camera size={18} />
                  Capture Photo
                </button>
                <button 
                  onClick={navigateToProcess}
                  className="flex-1 h-16 bg-navy text-gold rounded-2xl flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.2em] hover:bg-navy/95 transition-all shadow-xl shadow-navy/20"
                >
                  <Zap size={18} fill="currentColor" />
                  Simplify Notice Now
                </button>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-4 p-12 lg:p-16 space-y-10">
            <div>
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-6">Service Overview</h3>
              <div className="space-y-6">
                {[
                  { icon: ShieldCheck, title: 'Identity Protection', desc: 'PII redacted automatically', color: 'blue' },
                  { icon: Zap, title: 'Neural Real-Time', desc: '0.8s analysis frequency', color: 'gold' },
                  { icon: Clock, title: 'Deadline Detection', desc: 'Predictive risk alerts', color: 'navy' }
                ].map((item) => (
                  <div key={item.title} className="flex gap-5 group">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform",
                      item.color === 'blue' ? "bg-blue-50 text-blue-600" : item.color === 'gold' ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-navy"
                    )}>
                      <item.icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy">{item.title}</h4>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-8 border-t border-gray-50">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-6 font-serif">Top Resource Portal</p>
              <div className="p-6 bg-cream border border-gold/10 rounded-[2.5rem] group hover:border-gold/30 transition-colors">
                <Globe className="text-gold mb-4" size={24} />
                <h4 className="text-sm font-black text-navy mb-1 uppercase tracking-tighter">MyGov Integration</h4>
                <p className="text-[10px] font-medium text-slate-500 mb-4 italic">Direct link to national digital lockers and citizen registries.</p>
                <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Analytics & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cognitive Analytics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-white rounded-[3.5rem] p-10 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cognitive Analytics</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Compliance & Semantic Intelligence Mapping</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
              <BarChart3 size={14} /> Live Sync
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#1e293b" radius={[10, 10, 10, 10]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>

            <div className="space-y-6 flex flex-col justify-center">
              {domainData.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-navy/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-lg" style={{ backgroundColor: i === 0 ? '#1a2744' : i === 1 ? '#c8a84b' : '#1e3a8a' }}>
                      {i === 0 ? '⚖️' : i === 1 ? '🏦' : '🏛️'}
                    </div>
                    <div>
                      <p className="text-xs font-black text-navy uppercase tracking-widest">{d.name} Domain</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Semantic Match: {d.value}%</p>
                    </div>
                  </div>
                  <TrendingUp size={16} className="text-slate-200 group-hover:text-navy transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Official Portals Directory */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 text-white rounded-[3.5rem] p-10 flex flex-col border border-white/10 shadow-2xl overflow-hidden relative"
        >
          <div className="relative z-10 space-y-8 flex-1">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                <Globe size={24} />
              </div>
              <h3 className="text-xl font-black tracking-tight">Official Portals</h3>
            </div>
            
            <div className="space-y-4">
              {portals.map((portal, i) => (
                <a 
                  key={i}
                  href={portal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      portal.status === 'Online' ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-amber-400"
                    )} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest">{portal.name}</p>
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{portal.type} Gateway</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>

            <button className="w-full py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
              <Zap size={14} fill="currentColor" /> Advanced Directory
            </button>
          </div>
          <div className="absolute bottom-0 right-0 p-10 opacity-5">
            <ShieldCheck size={200} />
          </div>
        </motion.div>

        {/* Live Community Pulse */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-[3.5rem] p-10 border border-navy/5 shadow-xl flex flex-col relative overflow-hidden group cursor-pointer"
          onClick={() => navigate('/live')}
        >
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center animate-pulse">
                  <Radio size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-navy tracking-tight">Live Hub</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Real-time Citizen Network</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-gold transition-colors" />
            </div>

            <div className="space-y-4 flex-1">
              <div className="p-4 bg-navy/5 rounded-2xl border border-navy/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-navy/40 mb-1">Active Discussions</p>
                <div className="flex -space-x-2 mt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-black">U{i}</div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-navy text-gold flex items-center justify-center text-[8px] font-black">+42</div>
                </div>
              </div>
              
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 italic">
                <p className="text-[10px] font-bold text-emerald-700 leading-relaxed">
                  "Just verified the new Tax Deduction notice... simplified summary is ready!"
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span className="text-[8px] font-black uppercase text-emerald-600">Live Insight</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-navy/5">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                Enter Community Room <ArrowRight size={12} />
              </span>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-[0.03] text-[200px] pointer-events-none group-hover:rotate-12 transition-transform">
             <MessageSquare />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Notices Processed', value: stats.total, sub: '+12% from last month', icon: FileText, color: 'white' },
          { label: 'Urgent Deadlines', value: deadlines.length, sub: 'Requires immediate action', icon: Clock, color: 'amber' },
          { label: 'Time Saved', value: '412h', sub: 'AI Analysis efficiency', icon: Sparkles, color: 'white' },
          { label: 'Pending Steps', value: stats.pending, sub: 'Attention needed', icon: AlertCircle, color: 'white' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "p-6 backdrop-blur shadow-sm border rounded-[2rem] relative overflow-hidden group cursor-default h-full",
                item.color === 'amber' 
                  ? "bg-amber-400/10 border-amber-200" 
                  : "bg-white/70 border-white"
              )}
            >
              <p className={cn(
                "text-xs font-bold uppercase tracking-widest mb-1",
                item.color === 'amber' ? "text-amber-700" : "text-slate-400"
              )}>{item.label}</p>
              <h3 className={cn(
                "text-4xl font-black",
                item.color === 'amber' ? "text-amber-600" : "text-slate-900"
              )}>{item.value}</h3>
              <p className={cn(
                "text-[10px] mt-2 font-bold uppercase tracking-tight",
                item.color === 'amber' ? "text-amber-500" : (idx === 0 ? "text-emerald-600" : "text-blue-500")
              )}>{item.sub}</p>
              
              <div className="absolute -right-2 -bottom-2 opacity-5 text-6xl group-hover:scale-110 transition-transform">
                <Icon />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* Analytics Chart */}
          <div className="bg-white/70 backdrop-blur p-10 rounded-[3rem] border border-white shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">System Performance</h3>
                <p className="text-sm text-slate-400 font-medium">Global activity and document processing volume</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F172A" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0F172A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#0F172A" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Notices List */}
          <div className="bg-white/70 backdrop-blur rounded-[3rem] border border-white shadow-sm overflow-hidden">
            <div className="p-10 pb-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Access Log</h3>
              <Link to="/history" className="text-sm font-black text-slate-900 hover:underline flex items-center gap-1 uppercase tracking-widest">
                All Entries <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentNotices.length > 0 ? recentNotices.map((notice) => (
                <Link 
                  key={notice.id} 
                  to={`/notice/${notice.id}`}
                  className="p-8 flex items-center gap-8 hover:bg-white/50 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-amber-400 transition-all font-bold text-xl">
                    {notice.category?.charAt(0) || 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-lg group-hover:translate-x-1 transition-transform truncate">{notice.title}</h4>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notice.category || 'Government Notice'}</p>
                      
                      {/* Extraction Feature Indicators */}
                      <div className="flex items-center gap-1">
                        {notice.originalText && <div className="w-1 h-1 rounded-full bg-blue-500" title="Input Extracted" />}
                        {notice.simplifiedSummary && <div className="w-1 h-1 rounded-full bg-sparkles-400 bg-amber-400" title="Simplified Extraction" />}
                        {notice.contacts?.length > 0 && <div className="w-1 h-1 rounded-full bg-indigo-500" title="Interaction Hub Active" />}
                      </div>

                      {notice.deadline && (
                        <div className={cn(
                          "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter",
                          getCountdown(notice.deadline)?.urgent ? "bg-red-50 text-red-600 animate-pulse" : "bg-blue-50 text-blue-600"
                        )}>
                          <Clock size={10} />
                          {getCountdown(notice.deadline)?.text}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{formatDate(notice.createdAt, 'MMM d')}</p>
                    <span className={cn(
                      "inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mt-1",
                      notice.status === 'urgent' ? 'bg-amber-400 text-amber-900' : 
                      notice.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    )}>
                      {notice.status}
                    </span>
                  </div>
                </Link>
              )) : (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <FileText className="w-10 h-10 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest">No active records found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar content */}
        <div className="lg:col-span-4 space-y-8">
          {/* Timeline Wrapper theme */}
          <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl flex flex-col h-full min-h-[500px]">
             <div className="flex items-center justify-between mb-10">
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-amber-400">Deadlines</h4>
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-lg">⏳</div>
             </div>
             
             <div className="flex-1 space-y-10">
               {deadlines.length > 0 ? deadlines.map((d, idx) => (
                 <div key={d.id} className="flex gap-6 relative group">
                   <div className="flex flex-col items-center">
                     <div className={cn(
                       "w-5 h-5 rounded-full border-4 border-slate-900 relative z-10 transition-transform group-hover:scale-125",
                       idx === 0 ? "bg-amber-400 shadow-[0_0_15px_#facc15]" : "bg-slate-700"
                     )}></div>
                     {idx < deadlines.length - 1 && (
                       <div className="w-0.5 h-20 bg-slate-800 absolute top-5"></div>
                     )}
                   </div>
                   <div className="flex-1 pb-4">
                     <p className={cn(
                       "text-[10px] font-black uppercase tracking-widest mb-1",
                       idx === 0 ? "text-amber-400" : "text-slate-500"
                     )}>
                        {formatDate(d.deadline, 'MMM d, yyyy')}
                     </p>
                     <h5 className="font-bold text-base leading-tight group-hover:text-amber-400 transition-colors">{d.title}</h5>
                     <div className="flex flex-wrap items-center gap-2 mt-2">
                       <Link to={`/notice/${d.id}`} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors">
                          Inspect Document →
                       </Link>
                       <AddToCalendarButton
                         title={d.title}
                         date={d.deadline}
                         noticeId={d.id}
                         size="sm"
                         variant="ghost"
                         className="text-amber-400 hover:text-white hover:bg-slate-800 py-0.5 px-2 text-[10px] rounded-md"
                       />
                     </div>
                   </div>
                 </div>
               )) : (
                 <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                    <CheckCircle2 className="w-12 h-12 mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Awaiting New Cycles</p>
                 </div>
               )}
             </div>

             {/* Action Summary in Sidebar */}
             <div className="mt-auto pt-10 border-t border-slate-800">
                <div className="bg-emerald-600 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                   <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform">
                      <CheckCircle2 className="w-24 h-24" />
                   </div>
                   <h4 className="font-black text-sm uppercase tracking-widest mb-4">Quick Compliance</h4>
                   <p className="text-xs text-emerald-100 font-medium mb-4 leading-relaxed italic">"Keep your status active by resolving pending checklist items."</p>
                   <Link to="/actions" className="w-full py-3 bg-white text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center hover:scale-105 transition-all">
                      Open Action List
                   </Link>
                </div>
             </div>
          </div>

          {/* Infrastructure Health */}
          <div className="bg-white/70 backdrop-blur rounded-[3rem] border border-white p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Data Engine</h3>
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Analysis Speed</p>
                  <p className="text-sm font-bold text-slate-900">0.84s Average</p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
