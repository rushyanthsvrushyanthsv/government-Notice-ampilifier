import React, { useEffect, useState } from 'react';
import { collectionGroup, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { ListTodo, CheckCircle2, Circle, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

const ActionChecklist: React.FC = () => {
  const { profile } = useAuth();
  const [actions, setActions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  const FALLBACK_ACTIONS = [
    {
      id: 'act-demo-1',
      text: 'Submit self-assessment property tax declaration on BBMP SAS online system',
      textKn: 'ಬಿಬಿಎಂಪಿ ಆನ್‌ಲೈನ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಸ್ವಯಂ ಮೌಲ್ಯಮಾಪನ ಆಸ್ತಿ ತೆರಿಗೆ ವಿವರ ಸಲ್ಲಿಕೆ',
      completed: false,
    },
    {
      id: 'act-demo-2',
      text: 'Verify Aadhaar biometric credentials on Seva Sindhu official portal',
      textKn: 'ಸೇವಾ ಸಿಂಧು ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಆಧಾರ್ ಬಯೋಮೆಟ್ರಿಕ್ ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಳಿಸಿ',
      completed: true,
    },
    {
      id: 'act-demo-3',
      text: 'Reconcile invoice vouchers against GSTR-2B before filing deadline',
      textKn: 'ದಾಖಲಾತಿ ದಿನಾಂಕದ ಮೊದಲು ಸರಕು ಮತ್ತು ಸೇವಾ ತೆರಿಗೆ ವೋಚರ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ',
      completed: false,
    }
  ];

  useEffect(() => {
    if (!profile?.uid) return;

    const getLocalActions = () => {
      try {
        const notices = JSON.parse(localStorage.getItem('gov_local_notices') || '[]');
        const acts: any[] = [];
        notices.forEach((n: any) => {
          if (n.actionItems && Array.isArray(n.actionItems)) {
            n.actionItems.forEach((act: string, idx: number) => {
              acts.push({
                id: `act-${n.id}-${idx}`,
                text: act,
                textKn: act,
                completed: false,
                noticeTitle: n.title,
                noticeId: n.id
              });
            });
          }
        });
        return acts;
      } catch {
        return [];
      }
    };

    const localActs = getLocalActions();

    // Use collectionGroup to query across all 'actions' subcollections
    const q = query(
      collectionGroup(db, 'actions'),
      where('userId', '==', profile.uid)
    );

    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreDocs = snapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
        const freshLocalActs = getLocalActions();

        const mergedMap = new Map();
        firestoreDocs.forEach((d: any) => mergedMap.set(d.id, d));
        freshLocalActs.forEach((d: any) => {
          if (!mergedMap.has(d.id)) mergedMap.set(d.id, d);
        });
        FALLBACK_ACTIONS.forEach((d: any) => {
          if (!mergedMap.has(d.id)) mergedMap.set(d.id, d);
        });

        setActions(Array.from(mergedMap.values()));
      }, (error) => {
        console.warn("Actions fetch warning:", error);
        setActions([...localActs, ...FALLBACK_ACTIONS]);
      });
    } catch (e) {
      console.warn("Could not setup actions listener:", e);
      setActions([...localActs, ...FALLBACK_ACTIONS]);
    }

    return () => unsubscribe();
  }, [profile]);

  const toggleAction = async (action: any) => {
    if (action.ref) {
      try {
        await updateDoc(action.ref, { completed: !action.completed });
        return;
      } catch (e) {
        console.warn("Could not update remote action:", e);
      }
    }
    // Update local state fallback
    setActions(prev => prev.map(a => a.id === action.id ? { ...a, completed: !a.completed } : a));
  };

  const filteredActions = actions.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !a.completed;
    return a.completed;
  });

  const completionRate = actions.length > 0 ? (actions.filter(a => a.completed).length / actions.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Consolidated Actions</h1>
          <p className="text-gray-500 font-medium">All your government notice steps in one place.</p>
        </div>
        
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 min-w-[240px]">
          <div className="flex-1">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress</span>
                <span className="text-xs font-black text-[#1E3A8A]">{Math.round(completionRate)}%</span>
             </div>
             <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  className="h-full bg-[#1E3A8A]"
                />
             </div>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-[#1E3A8A] rounded-xl flex items-center justify-center">
            <ListTodo className="w-6 h-6" />
          </div>
        </div>
      </header>

      <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
        {['all', 'pending', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest",
              filter === f ? "bg-[#1E3A8A] text-white shadow-md shadow-blue-100" : "text-gray-400 hover:bg-gray-50"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {filteredActions.map((action, idx) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => toggleAction(action)}
              className={cn(
                "group relative p-6 bg-white rounded-[2rem] border transition-all cursor-pointer flex items-center gap-6",
                action.completed ? "border-green-100 bg-green-50/30 opacity-70" : "border-gray-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-0.5"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0 transition-all",
                action.completed ? "bg-green-500 border-green-500 text-white" : "bg-gray-50 border-gray-100 text-transparent group-hover:border-blue-200"
              )}>
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-bold text-gray-900 text-lg leading-tight",
                  action.completed && "text-gray-500 line-through"
                )}>
                  {action.text}
                </p>
                <div className="flex items-center gap-4 mt-2">
                   <Link 
                     to={`/notice/${action.noticeId}`} 
                     onClick={(e) => e.stopPropagation()}
                     className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-widest hover:underline flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded"
                   >
                     View Notice <ArrowRight className="w-3 h-3" />
                   </Link>
                </div>
              </div>

              {!action.completed && (
                <div className="hidden group-hover:flex items-center gap-2 text-blue-500 font-bold text-xs">
                   Complete <Sparkles className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredActions.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <CheckCircle2 className="w-10 h-10 text-gray-200" />
             </div>
             <p className="text-gray-400 font-bold uppercase tracking-widest">No actions match your filter</p>
             <p className="text-sm text-gray-400 mt-1">
               {filter === 'pending' ? "Great job! You've cleared all your tasks." : "Start by uploading a notice."}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionChecklist;
