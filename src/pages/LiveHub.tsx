import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Users, 
  Zap, 
  Send, 
  Globe, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Radio
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

const LiveHub: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [globalMessages, setGlobalMessages] = useState<any[]>([]);
  const [activeNotices, setActiveNotices] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'global' | 'notices'>('global');

  const FALLBACK_CHAT = [
    {
      id: 'demo-msg-1',
      userId: 'system',
      userName: 'Karnataka Helpdesk Officer',
      text: 'Welcome to the Karnataka Citizen & Notice Operations Live Hub. Official portal updates are published here.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'demo-msg-2',
      userId: 'citizen-1',
      userName: 'Suresh Kumar (Bengaluru)',
      text: 'Has anyone verified if the BBMP SAS payment portal is accepting UPI without surcharge today?',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'demo-msg-3',
      userId: 'admin-mod',
      userName: 'Karnataka Revenue Desk',
      text: 'Yes, Netbanking and BBMP integrated UPI gateways are operational. 5% rebate active until scheduled deadline.',
      createdAt: new Date(Date.now() - 600000).toISOString(),
    }
  ];

  // Load Global Chat
  useEffect(() => {
    if (!auth.currentUser) {
      setGlobalMessages(FALLBACK_CHAT);
      return;
    }

    const q = query(
      collection(db, 'global_chat'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGlobalMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse());
    }, (error) => {
      console.warn("Global chat listener warning:", error);
      setGlobalMessages(FALLBACK_CHAT);
    });

    return () => unsubscribe();
  }, []);

  // Load Active Notices (Those with messages)
  useEffect(() => {
    if (!auth.currentUser) {
      setActiveNotices([
        {
          id: 'bbmp-tax-notice-2026',
          title: 'BBMP Property Tax Assessment & 5% Rebate Notice 2026',
          category: 'Fiscal',
          status: 'urgent',
        },
        {
          id: 'seva-sindhu-kyc-2026',
          title: 'Seva Sindhu Aadhaar E-KYC Verification Directive',
          category: 'Civil',
          status: 'pending',
        }
      ]);
      return;
    }

    const q = query(
      collection(db, 'notices'),
      orderBy('updatedAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("LiveHub notices warning:", error);
    });

    return () => unsubscribe();
  }, []);

  const sendGlobalMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (!auth.currentUser) {
      // Local demo mode sending
      const mockMsg = {
        id: 'local-' + Date.now(),
        text: newMessage,
        userId: profile?.uid || 'citizen',
        userName: profile?.displayName || 'Karnataka Citizen',
        createdAt: new Date().toISOString()
      };
      setGlobalMessages(prev => [...prev, mockMsg]);
      setNewMessage('');
      return;
    }

    setIsSending(true);
    try {
      await addDoc(collection(db, 'global_chat'), {
        text: newMessage,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || profile?.displayName || 'Karnataka Citizen',
        userPhoto: auth.currentUser.photoURL || '',
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.warn('Could not post global chat message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-12">
      {/* Dynamic Header */}
      <header className="bg-navy p-10 md:p-16 text-white rounded-b-[4rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Globe size={180} />
        </div>
        
        <div className="relative z-10">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gold font-black uppercase tracking-widest text-[10px] mb-8 hover:translate-x-[-4px] transition-transform"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 bg-red-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  Live Session
                </div>
                <span className="text-gold font-black uppercase tracking-[0.3em] text-[10px]">Citizen Communication Hub</span>
              </div>
              <h1 className="text-5xl font-serif font-black tracking-tight italic">
                The Live <span className="text-gold">Square</span>.
              </h1>
              <p className="text-white/40 font-medium mt-4 max-w-xl italic">
                Real-time dialogue between citizens, legal experts, and community members regarding official government notices.
              </p>
            </div>
            
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
              <button 
                onClick={() => setActiveTab('global')}
                className={cn(
                  "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'global' ? "bg-gold text-navy shadow-lg" : "text-white/40 hover:bg-white/5"
                )}
              >
                Global Room
              </button>
              <button 
                onClick={() => setActiveTab('notices')}
                className={cn(
                  "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'notices' ? "bg-gold text-navy shadow-lg" : "text-white/40 hover:bg-white/5"
                )}
              >
                Active Discussions
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 -mt-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar: Live Stats */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-navy/5 shadow-sm">
            <h3 className="text-xs font-black text-navy uppercase tracking-widest mb-6">Live Pulse</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-gold" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Citizens</span>
                </div>
                <span className="text-sm font-black text-navy">1,248</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare size={16} className="text-gold" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Threads</span>
                </div>
                <span className="text-sm font-black text-navy">{activeNotices.length}+</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap size={16} className="text-gold" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Status</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black">
                  SECURE
                </div>
              </div>
            </div>
          </div>

          <div className="bg-navy text-gold p-8 rounded-[2.5rem] relative overflow-hidden group">
            <Radio size={80} className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform" />
            <h3 className="text-xs font-black uppercase tracking-widest mb-4">Expert Broadcast</h3>
            <p className="text-[10px] text-white/60 font-medium leading-relaxed italic mb-4">
              "Tomorrow at 10 AM: Live analysis of the recent GST directive amendments."
            </p>
            <button className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all">
              Add to Calendar <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Center/Content Area */}
        <div className="lg:col-span-6">
          <AnimatePresence mode="wait">
            {activeTab === 'global' ? (
              <motion.div 
                key="global"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-[3rem] border border-navy/5 shadow-xl flex flex-col h-[700px] overflow-hidden"
              >
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold/10 text-gold rounded-xl flex items-center justify-center">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-serif font-black text-navy">Global Citizen Square</h2>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unified live session</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                  {globalMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex flex-col",
                        msg.userId === auth.currentUser?.uid ? "items-end" : "items-start"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1 px-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{msg.userName}</span>
                        {msg.userPhoto && <img src={msg.userPhoto} className="w-4 h-4 rounded-full" alt="" />}
                      </div>
                      <div className={cn(
                        "px-6 py-4 rounded-[1.5rem] text-sm font-medium max-w-[80%] shadow-sm",
                        msg.userId === auth.currentUser?.uid 
                          ? "bg-navy text-white rounded-tr-none" 
                          : "bg-[#FAF9F6] text-navy border border-slate-100 rounded-tl-none"
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {globalMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                      <Radio size={48} className="mb-4 animate-pulse" />
                      <p className="font-serif italic text-lg">The square is quiet. Start the session.</p>
                    </div>
                  )}
                </div>

                <form onSubmit={sendGlobalMessage} className="p-8 border-t border-slate-50 relative">
                  <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Share your thoughts with the community..."
                    className="w-full h-16 pl-8 pr-20 bg-[#FAF9F6] rounded-2xl border border-slate-100 outline-none focus:border-gold transition-all text-sm font-medium shadow-inner"
                  />
                  <button 
                    disabled={isSending || !newMessage.trim()}
                    className="absolute right-10 top-1/2 -translate-y-1/2 w-12 h-12 bg-navy text-gold rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="notices"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {activeNotices.map((notice) => (
                  <Link 
                    key={notice.id} 
                    to={`/notice/${notice.id}`}
                    className="block p-8 bg-white border border-navy/5 rounded-[2.5rem] hover:border-gold/30 hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-navy/5 text-navy rounded-xl flex items-center justify-center group-hover:bg-navy group-hover:text-gold transition-all">
                          <MessageSquare size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{notice.category || 'NOTICE'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active Room</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-serif font-black text-navy group-hover:text-gold transition-colors">{notice.title}</h3>
                    <p className="text-sm text-slate-400 font-medium mt-3 italic line-clamp-2">
                      {notice.simplifiedSummary || 'Discussion in progress regarding this official publication.'}
                    </p>
                    <div className="mt-8 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black">U{i}</div>
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-navy text-gold flex items-center justify-center text-[8px] font-black">+12</div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-navy flex items-center gap-2">
                        Join Discussion <ArrowLeft size={12} className="rotate-180" />
                      </span>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar: Trending Topics */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-navy/5 shadow-sm">
            <h3 className="text-xs font-black text-navy uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp size={14} className="text-gold" />
               Trending Topics
            </h3>
            <div className="space-y-6">
              {[
                { tag: '#WealthTax2024', heat: 98 },
                { tag: '#AadhaarLinking', heat: 84 },
                { tag: '#DigitalPrivacy', heat: 72 },
                { tag: '#ExportDirectives', heat: 65 }
              ].map((topic) => (
                <div key={topic.tag} className="group cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-navy group-hover:text-gold transition-colors">{topic.tag}</span>
                    <span className="text-[10px] font-black text-slate-400">{topic.heat}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.heat}%` }}
                      className="h-full bg-navy/10 group-hover:bg-gold transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gold p-8 rounded-[2.5rem] shadow-xl shadow-gold/20 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-navy text-white rounded-[1.5rem] flex items-center justify-center mb-6 shadow-xl">
              <Zap size={32} />
            </div>
            <h4 className="text-navy font-serif font-black text-lg">Verified Experts</h4>
            <p className="text-[10px] text-navy/60 font-medium mt-2 leading-relaxed italic">
              Our legal AI and human auditors are active in session to clarify your doubts.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
};

export default LiveHub;
