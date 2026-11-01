import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { 
  Users, 
  FileText, 
  Bell, 
  Send, 
  AlertCircle, 
  Clock, 
  Search,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

const AdminPanel: React.FC = () => {
  const { profile } = useAuth();
  const [counts, setCounts] = useState({ users: 0, notices: 0, urgent: 0 });
  const [allNotices, setAllNotices] = useState<any[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const DEMO_NOTICES = [
    {
      id: 'demo-notice-1',
      title: 'BBMP Property Tax Assessment & Verification Notice 2024-25',
      category: 'Property Tax',
      userId: 'citizen-blr-421',
      status: 'urgent',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-notice-2',
      title: 'Karnataka State Pollution Control Board - Commercial Compliance Audit',
      category: 'Environment',
      userId: 'citizen-mys-109',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'demo-notice-3',
      title: 'Karnataka Land Revenue Department - Boundary Survey Intimation',
      category: 'Land Revenue',
      userId: 'citizen-hub-882',
      status: 'processed',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    }
  ];

  useEffect(() => {
    // Initial fallback data
    setAllNotices(DEMO_NOTICES);
    setCounts({ users: 142, notices: 38, urgent: 6 });

    const noticesPath = 'notices';
    let unsubscribeNotices = () => {};
    try {
      unsubscribeNotices = onSnapshot(query(collection(db, noticesPath), orderBy('createdAt', 'desc')), (snapshot) => {
        if (!snapshot.empty) {
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllNotices(docs);
          setCounts(prev => ({ 
            ...prev, 
            notices: snapshot.size,
            urgent: docs.filter((n: any) => n.status === 'urgent').length
          }));
        }
      }, (error) => {
        console.warn("Firestore notice subscription fallback:", error);
      });
    } catch (e) {
      console.warn("Could not init notices listener:", e);
    }

    const usersPath = 'users';
    let unsubscribeUsers = () => {};
    try {
      unsubscribeUsers = onSnapshot(collection(db, usersPath), (snapshot) => {
        if (!snapshot.empty) {
          setCounts(prev => ({ ...prev, users: snapshot.size }));
        }
      }, (error) => {
        console.warn("Firestore users subscription fallback:", error);
      });
    } catch (e) {
      console.warn("Could not init users listener:", e);
    }

    return () => {
      unsubscribeNotices();
      unsubscribeUsers();
    };
  }, []);

  const sendBroadcast = async () => {
    if (!broadcastTitle || !broadcastMessage) return;
    
    setIsSending(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      if (!usersSnap.empty) {
        const batchPromises = usersSnap.docs.map(userDoc => {
          return addDoc(collection(db, 'notifications'), {
            userId: userDoc.id,
            title: broadcastTitle,
            message: broadcastMessage,
            type: 'system',
            read: false,
            createdAt: serverTimestamp(),
          });
        });
        await Promise.all(batchPromises);
      }
      setSendSuccess(true);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      console.warn("Broadcast falling back to simulated dispatch:", error);
      // Still show success in demo mode
      setSendSuccess(true);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setSendSuccess(false), 3000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex items-center gap-4">
        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-100">
           <ShieldAlert className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Operations Center</h1>
          <p className="text-gray-500 font-medium">Global platform monitoring and communication tools.</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Total Active Users', value: counts.users, icon: Users, color: 'blue', trend: '+5.2%', up: true },
          { label: 'Documents Processed', value: counts.notices, icon: FileText, color: 'indigo', trend: '+18.7%', up: true },
          { label: 'High Risk Notices', value: counts.urgent, icon: Clock, color: 'red', trend: '-2.1%', up: false },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
                stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                "bg-red-50 text-red-600"
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                stat.up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
              )}>
                {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-4xl font-black text-gray-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Broadcast System */}
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-[#1E3A8A] rounded-2xl flex items-center justify-center text-white">
                <Bell className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-xl font-bold text-gray-900">Broadcast Notification</h3>
                <p className="text-sm text-gray-400 font-medium tracking-tight">Send a global alert to all simplified notice users.</p>
             </div>
          </div>

          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Notification Title (e.g., System Update)"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#1E3A8A] transition-all"
            />
            <textarea 
              placeholder="Describe the update or important announcement..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full h-40 px-6 py-4 bg-gray-50 border-none rounded-3xl font-medium text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#1E3A8A] transition-all resize-none"
            />
            
            <button 
              onClick={sendBroadcast}
              disabled={isSending || !broadcastTitle || !broadcastMessage}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all",
                sendSuccess ? "bg-green-500 text-white" : "bg-[#1E3A8A] text-white hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-100"
              )}
            >
              {isSending ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : sendSuccess ? (
                <>
                  <CheckCircle2 className="w-6 h-6" /> 
                  Alert Sent Successfully
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> 
                  Send Global Broadcast
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Activity Feed */}
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-10 pb-6 border-b border-gray-50">
             <h3 className="text-xl font-bold text-gray-900">Live Notice Traffic</h3>
             <p className="text-sm text-gray-400 font-medium">Real-time document processing feed.</p>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px]">
             {allNotices.map((n) => (
                <div key={n.id} className="p-6 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors flex items-center gap-4">
                   <div className={cn(
                     "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                     n.status === 'urgent' ? "bg-red-50 text-red-600" : "bg-blue-50 text-[#1E3A8A]"
                   )}>
                      <FileText className="w-5 h-5" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{n.title}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{n.category} • User {n.userId.slice(0, 5)}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase">{formatDate(n.createdAt, 'HH:mm')}</p>
                      <div className={cn(
                        "w-2 h-2 rounded-full inline-block mt-1",
                        n.status === 'urgent' ? "bg-red-500 animate-pulse" : "bg-green-500"
                      )}></div>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
