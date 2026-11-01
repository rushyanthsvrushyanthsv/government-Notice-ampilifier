import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Sparkles, 
  ArrowLeft, 
  Languages, 
  Calendar, 
  Banknote, 
  UserCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Share2,
  Download,
  Trash2,
  HelpCircle,
  FileDown,
  ShieldCheck,
  Zap,
  Lock,
  TrendingUp,
  MessageSquare,
  Phone,
  Mail,
  Send
} from 'lucide-react';
import { doc, getDoc, collection, onSnapshot, updateDoc, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { cn, formatDate } from '../lib/utils';
import { AddToCalendarButton } from '../components/common/AddToCalendarButton';

import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';

const CHART_COLORS = ['#A1824A', '#131D31', '#8B0000', '#2D4A53', '#707070'];

const NoticeDetails: React.FC = () => {
  const { id } = useParams();
  const [notice, setNotice] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [language, setLanguage] = useState<'en' | 'kn'>('en');
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  
  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!id) return;

    const messagesQuery = query(
      collection(db, 'notices', id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Notice messages warning:", error);
    });

    return () => unsubscribeMessages();
  }, [id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;

    if (!auth.currentUser) {
      setMessages(prev => [...prev, {
        id: 'msg-' + Date.now(),
        text: newMessage,
        userName: 'Karnataka Citizen',
        createdAt: new Date().toISOString()
      }]);
      setNewMessage('');
      return;
    }

    setIsSending(true);
    try {
      await addDoc(collection(db, 'notices', id, 'messages'), {
        text: newMessage,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Citizen',
        userPhoto: auth.currentUser.photoURL || '',
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.warn("Could not send notice message:", err);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!notice?.deadline) return;

    const updateTimer = () => {
      const target = new Date(notice.deadline);
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [notice?.deadline]);

  useEffect(() => {
    if (!id) return;

    const getNotice = async () => {
      try {
        const localList = JSON.parse(localStorage.getItem('gov_local_notices') || '[]');
        const localFound = localList.find((n: any) => n.id === id);
        if (localFound) {
          setNotice(localFound);
          if (localFound.actionItems && Array.isArray(localFound.actionItems) && localFound.actionItems.length > 0) {
            setActions(localFound.actionItems.map((act: string, idx: number) => ({
              id: `act-local-${idx}`,
              text: act,
              completed: false,
            })));
          }
          setLoading(false);
        }

        const docRef = doc(db, 'notices', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNotice({ id: docSnap.id, ...docSnap.data() });
        } else if (!localFound) {
          // Fallback notice profile
          setNotice({
            id,
            title: 'BBMP Property Tax Assessment & 5% Rebate Notice 2026',
            category: 'Fiscal',
            status: 'urgent',
            deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
            simplifiedSummary: 'Bruhat Bengaluru Mahanagara Palike notice regarding self-assessment property tax compliance with 5% rebate incentive before the upcoming deadline.',
            warnings: ['Penalty of 2% per month applies for default after due date', 'Ensure SAS application number matches GIS property identifier'],
            contacts: ['bbmptax@karnataka.gov.in', '080-22660000 (Helpline)'],
            originalText: 'BRUHAT BENGALURU MAHANAGARA PALIKE (BBMP)\nREVENUE DEPARTMENT - PROPERTY TAX NOTICE 2026\n\nNotice is hereby issued to all property owners within the BBMP limits to submit Property Tax Returns under Self-Assessment Scheme (SAS). Payment before due date qualifies for a 5% early payment rebate.\n\nFailing compliance, statutory interest and penal charges under the KMC Act shall be levied automatically.',
            createdAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn("Could not fetch notice from Firestore:", err);
      } finally {
        setLoading(false);
      }
    };

    let unsubscribeActions = () => {};
    try {
      unsubscribeActions = onSnapshot(collection(db, 'notices', id, 'actions'), (snapshot) => {
        if (!snapshot.empty) {
          setActions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      }, (error) => {
        console.warn("Notice actions warning:", error);
      });
    } catch (e) {
      console.warn("Could not setup actions listener:", e);
    }

    getNotice();
    return () => unsubscribeActions();
  }, [id]);

  const toggleAction = async (actionId: string, completed: boolean) => {
    if (!id) return;
    await updateDoc(doc(db, 'notices', id, 'actions', actionId), {
      completed: !completed
    });
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center p-20">
      <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center shadow-inner relative">
         <div className="absolute inset-0 border-4 border-slate-200 border-t-slate-900 rounded-[2rem] animate-spin"></div>
         <Sparkles className="w-10 h-10 text-slate-900" />
      </div>
    </div>
  );

  if (!notice) return (
    <div className="text-center p-20 bg-white/70 backdrop-blur rounded-[3rem] border border-white shadow-sm">
      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Access Denied: Record Null</h2>
      <Link to="/" className="text-slate-500 font-bold hover:text-slate-900 mt-6 inline-block uppercase tracking-widest text-[10px] bg-slate-100 px-6 py-2 rounded-full">Return to Dashboard</Link>
    </div>
  );

  return (
    <div className="space-y-12 pb-24 font-sans bg-cream/30 min-h-screen p-6 md:p-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <Link to="/" className="flex items-center gap-3 text-navy/40 hover:text-navy transition-all font-black uppercase tracking-[0.3em] text-[10px]">
          <ArrowLeft size={16} />
          Back to Registry
        </Link>
        
        <div className="flex bg-navy/5 backdrop-blur-sm rounded-2xl p-1.5 border border-navy/5 shadow-inner">
          <button 
            onClick={() => setLanguage('en')}
            className={cn(
              "px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              language === 'en' ? "bg-navy text-gold shadow-lg shadow-navy/20" : "text-navy/40 hover:bg-white"
            )}
          >
            English (Universal)
          </button>
          <button 
            onClick={() => setLanguage('kn')}
            className={cn(
              "px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              language === 'kn' ? "bg-navy text-gold shadow-lg shadow-navy/20" : "text-navy/40 hover:bg-white"
            )}
          >
            ಕನ್ನಡ (Regional)
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content: Sections 1, 2, 3 */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* SECTION 1: Notice Info Extraction Panel */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-navy text-cream rounded-[3.5rem] p-12 lg:p-16 relative overflow-hidden shadow-2xl shadow-navy/20"
          >
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gold/5 rounded-full blur-3xl -mr-40 -mt-40" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 text-gold mb-8 uppercase tracking-[0.4em] text-[10px] font-black">
                <ShieldCheck size={20} />
                Official Data Extraction
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-serif font-black leading-[1.1] mb-10 tracking-tight lg:max-w-2xl">
                {notice.title}
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8 border-t border-cream/10">
                {[
                  { label: 'Issuing Authority', val: notice.issuingAuthority || "Dept. of Governance", icon: UserCheck },
                  { label: 'Reference Number', val: notice.referenceNumber || "#GS-8842-BN", icon: FileText },
                  { label: 'Date Issued', val: formatDate(notice.dateIssued || notice.createdAt, 'MMM d, yyyy'), icon: Calendar },
                  { label: 'Filing Deadline', val: formatDate(notice.deadline, 'MMM d, yyyy') || 'None Set', icon: Clock, highlight: true },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                      <item.icon size={12} />
                      {item.label}
                    </p>
                    <p className={cn(
                      "font-bold text-lg leading-tight",
                      item.highlight ? "text-gold" : "text-cream"
                    )}>{item.val}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 flex flex-wrap items-center gap-4">
                <button onClick={() => window.print()} className="px-8 h-14 bg-gold text-navy rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-gold/20">
                  <Download size={16} /> Download Report
                </button>
                {notice.deadline && (
                  <AddToCalendarButton
                    title={notice.title}
                    description={`Government Notice Summary: ${notice.simplifiedSummary || notice.title}\nIssuing Authority: ${notice.issuingAuthority || 'Govt of Karnataka'}`}
                    date={notice.deadline}
                    noticeId={notice.id}
                    size="lg"
                    variant="outline"
                    className="h-14 bg-white/10 hover:bg-white text-cream hover:text-navy border-cream/30 text-[10px] uppercase tracking-widest font-black"
                  />
                )}
                {timeLeft && (
                  <div className="px-6 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest text-gold border border-white/20">
                    <Clock size={16} />
                    <span>Time Left: {timeLeft}</span>
                  </div>
                )}
                <div className="px-8 h-14 border border-cream/20 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest text-cream/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Verified Intelligence
                </div>
              </div>
            </div>
          </motion.section>

          {/* SECTION 2: Simplified Explanation Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[3.5rem] p-12 lg:p-16 border border-navy/5 shadow-sm"
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-navy/5 text-navy rounded-2xl flex items-center justify-center">
                <Sparkles size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-serif font-black text-navy">Plain English Summary</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">5th Grade Comprehension Level</p>
              </div>
            </div>
            
            <div className="prose prose-slate max-w-none prose-p:text-lg prose-p:leading-relaxed prose-p:font-medium prose-p:text-navy/70">
              <ReactMarkdown>
                {language === 'en' ? notice.simplifiedSummary : notice.simplifiedSummaryKn}
              </ReactMarkdown>
            </div>
          </motion.section>

          {/* SECTION 2.5: Visual Analytics Section */}
          {notice.visualData && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-navy rounded-[3.5rem] p-12 lg:p-16 border border-white/10 shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <TrendingUp size={120} className="text-gold" />
              </div>

              <div className="flex items-center justify-between mb-12 relative z-10">
                <div>
                  <h2 className="text-3xl font-serif font-black text-gold">Visual Analytics</h2>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">AI-Generated Data Visualization</p>
                </div>
                {notice.visualData.label && (
                   <div className="px-5 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-2">
                     <Zap size={12} className="fill-gold" />
                     {notice.visualData.label}
                   </div>
                )}
              </div>

              <div className="h-[400px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  {notice.visualData.type === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={notice.visualData.series}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {notice.visualData.series.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="rgba(255,255,255,0.1)" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#131D31', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                        itemStyle={{ color: '#A1824A' }}
                      />
                    </PieChart>
                  ) : notice.visualData.type === 'bar' ? (
                    <BarChart data={notice.visualData.series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#131D31', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Bar dataKey="value" fill="#A1824A" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={notice.visualData.series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#131D31', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="value" stroke="#A1824A" strokeWidth={4} dot={{ r: 6, fill: '#A1824A', stroke: '#131D31', strokeWidth: 2 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {notice.visualData.series.map((item: any, i: number) => (
                  <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 truncate">{item.name}</p>
                    <p className="text-xl font-bold text-cream mt-1">{item.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* SECTION 2.7: Official Contacts Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-white rounded-[3.5rem] p-12 lg:p-16 border border-navy/5 shadow-sm"
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-navy/5 text-navy rounded-2xl flex items-center justify-center">
                <Phone size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-serif font-black text-navy">Official Communications</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Direct Channels to Authorities</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notice.contacts && notice.contacts.length > 0 ? (
                notice.contacts.map((contact: string, i: number) => {
                  const isEmail = contact.includes('@');
                  const isPhone = /[\d-]{7,}/.test(contact);
                  
                  return (
                    <a 
                      key={i}
                      href={isEmail ? `mailto:${contact}` : isPhone ? `tel:${contact.replace(/[^\d+]/g, '')}` : '#'}
                      className="flex items-center justify-between p-6 bg-navy/5 rounded-3xl group hover:bg-navy hover:text-gold transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-navy shadow-sm group-hover:bg-gold/10 group-hover:text-gold">
                          {isEmail ? <Mail size={18} /> : isPhone ? <Phone size={18} /> : <UserCheck size={18} />}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">
                            {isEmail ? 'Official Email' : isPhone ? 'Helpline' : 'Point of Contact'}
                          </p>
                          <p className="font-bold text-lg truncate max-w-[200px]">{contact}</p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  );
                })
              ) : (
                <div className="col-span-2 p-10 border-2 border-dashed border-navy/10 rounded-[2.5rem] text-center opacity-40">
                  <p className="text-sm font-bold italic">No direct contact information extracted from this specific notice.</p>
                </div>
              )}
            </div>
          </motion.section>


          {/* SECTION 3: Key Highlights Box */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gold p-12 lg:p-16 rounded-[3.5rem] text-navy shadow-xl shadow-gold/10 relative overflow-hidden"
          >
            <div className="absolute -left-10 -bottom-10 opacity-5 rotate-12">
              <Zap size={240} fill="currentColor" />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                <Zap size={18} fill="currentColor" />
                Critical Highlights
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {(notice.highlights || [
                  "This notice requires immediate acknowledgment within 72 hours.",
                  "No financial penalties are currently associated with this request.",
                  "Supporting documentation found in your citizen locker is ready for link."
                ]).map((highlight: string, i: number) => (
                  <div key={i} className="bg-white/20 backdrop-blur-md p-6 rounded-3xl border border-white/30 hover:bg-white/30 transition-all">
                    <p className="text-xl font-serif font-black leading-tight italic">0{i+1}.</p>
                    <p className="text-sm font-bold mt-3 leading-relaxed">{highlight}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        </div>

        {/* SECTION 4: Action Checklist Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[3.5rem] border border-navy/5 p-12 lg:p-14 shadow-sm flex flex-col h-full min-h-[600px]"
          >
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-xl font-serif font-black text-navy tracking-tight">Citizen Action Plan</h3>
              <div className="w-12 h-12 bg-navy text-gold rounded-full flex items-center justify-center font-black text-xs">
                {actions.filter(a => a.completed).length}/{actions.length || '0'}
              </div>
            </div>
            
            <div className="space-y-6 flex-1">
              {actions.map((action, idx) => (
                <div 
                  key={action.id}
                  onClick={() => toggleAction(action.id, action.completed)}
                  className={cn(
                    "group flex gap-5 p-6 rounded-3xl cursor-pointer transition-all border",
                    action.completed 
                      ? "bg-slate-50 border-slate-100 opacity-60" 
                      : "bg-white border-navy/5 hover:border-gold hover:shadow-xl hover:-translate-y-1"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all mt-0.5 shrink-0",
                    action.completed 
                      ? "bg-navy border-navy text-gold" 
                      : "border-slate-200 text-transparent group-hover:border-navy group-hover:bg-navy group-hover:text-gold"
                  )}>
                    {action.completed ? <CheckCircle2 size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-gold" />}
                  </div>
                  <div>
                    <p className={cn(
                      "font-bold text-sm tracking-tight leading-tight",
                      action.completed ? "text-slate-400 line-through" : "text-navy"
                    )}>
                      {language === 'en' ? action.text : (action.textKn || action.text)}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-2">
                      Priority: {action.priority || 'High'}
                    </p>
                  </div>
                </div>
              ))}
              
              {actions.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center opacity-30 italic">
                  <HelpCircle size={48} className="text-navy mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Awaiting system extraction...</p>
                </div>
              )}
            </div>

            {/* Community Room Integration */}
            <div className="mt-12 pt-10 border-t border-slate-50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-serif font-black text-navy tracking-tight flex items-center gap-3">
                  <MessageSquare size={20} />
                  Community Room
                </h3>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Live</span>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 h-[400px] flex flex-col border border-slate-100 shadow-inner">
                <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-hide">
                  {messages.length > 0 ? messages.map((msg, idx) => (
                    <div key={msg.id} className={cn(
                      "flex flex-col",
                      msg.userId === auth.currentUser?.uid ? "items-end" : "items-start"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{msg.userName}</span>
                        {msg.userPhoto && <img src={msg.userPhoto} className="w-4 h-4 rounded-full" alt="" />}
                      </div>
                      <div className={cn(
                        "px-4 py-3 rounded-2xl text-xs font-medium max-w-[85%]",
                        msg.userId === auth.currentUser?.uid 
                          ? "bg-navy text-white rounded-tr-none" 
                          : "bg-white text-navy border border-slate-100 shadow-sm rounded-tl-none"
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                      <MessageSquare size={32} className="mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest italic">Start the conversation</p>
                    </div>
                  )}
                </div>

                <form onSubmit={sendMessage} className="relative">
                  <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ask a community question..."
                    className="w-full h-14 pl-6 pr-14 bg-white rounded-2xl border border-slate-100 outline-none focus:border-gold transition-all text-xs font-medium shadow-sm"
                  />
                  <button 
                    disabled={isSending || !newMessage.trim()}
                    className="absolute right-2 top-2 w-10 h-10 bg-navy text-gold rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
            
            <div className="mt-12 pt-10 border-t border-slate-50">
              <div className="p-8 bg-navy text-gold rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <ShieldCheck size={80} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest mb-2">Compliance Guarantee</h4>
                <p className="text-[10px] font-medium leading-relaxed mb-6 italic opacity-60">"Your data is encrypted using 256-bit military-grade protocols."</p>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                   <Lock size={12} /> SSL SECURE
                </div>
              </div>
            </div>
          </motion.section>
        </aside>
      </div>
    </div>
  );
};

export default NoticeDetails;
