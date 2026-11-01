import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { format, isBefore, isAfter, startOfDay } from 'date-fns';
import { motion } from 'motion/react';
import { Calendar, Clock, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, safeDate, formatDate } from '../lib/utils';
import { AddToCalendarButton } from '../components/common/AddToCalendarButton';

const Timeline: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  const FALLBACK_ITEMS = [
    {
      id: 'timeline-item-1',
      title: 'BBMP Property Tax Assessment 2026',
      category: 'Fiscal',
      deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
      status: 'urgent',
      simplifiedSummary: 'Property tax filing with 5% rebate incentive expires soon.',
    },
    {
      id: 'timeline-item-2',
      title: 'Seva Sindhu Biometric Verification',
      category: 'Civil',
      deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
      status: 'pending',
      simplifiedSummary: 'Mandatory Aadhaar e-KYC updating on the Karnataka portal.',
    }
  ];

  useEffect(() => {
    if (!profile?.uid) return;

    const getLocal = () => {
      try {
        return JSON.parse(localStorage.getItem('gov_local_notices') || '[]');
      } catch {
        return [];
      }
    };

    const localList = getLocal();

    const q = isAdmin 
      ? query(collection(db, 'notices'))
      : query(collection(db, 'notices'), where('userId', '==', profile.uid));

    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const freshLocal = getLocal();

        const mergedMap = new Map();
        firestoreDocs.forEach((d: any) => mergedMap.set(d.id, d));
        freshLocal.forEach((d: any) => mergedMap.set(d.id, d));
        FALLBACK_ITEMS.forEach((d: any) => {
          if (!mergedMap.has(d.id)) mergedMap.set(d.id, d);
        });

        const docs = Array.from(mergedMap.values())
          .filter((n: any) => n.deadline)
          .sort((a: any, b: any) => {
            const dateA = safeDate(a.deadline);
            const dateB = safeDate(b.deadline);
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA.getTime() - dateB.getTime();
          });
        
        setItems(docs);
      }, (error) => {
        console.warn("Timeline fetch warning:", error);
        setItems([...localList.filter((n: any) => n.deadline), ...FALLBACK_ITEMS]);
      });
    } catch (e) {
      console.warn("Could not setup timeline listener:", e);
      setItems([...localList.filter((n: any) => n.deadline), ...FALLBACK_ITEMS]);
    }

    return () => unsubscribe();
  }, [profile, isAdmin]);

  const today = startOfDay(new Date());

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="text-center">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Deadline Timeline</h1>
        <p className="text-gray-500 font-medium mt-2">Visually track all upcoming government notice deadlines.</p>
      </header>

      <div className="relative">
        {/* Timeline Center Line */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-100 via-blue-200 to-blue-50 rounded-full"></div>

        <div className="space-y-24 relative z-10">
          {items.map((item, idx) => {
            const deadlineDate = safeDate(item.deadline);
            if (!deadlineDate) return null;
            
            const isPast = isBefore(deadlineDate, today);
            const isSoon = !isPast && isBefore(deadlineDate, startOfDay(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)));

            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={cn(
                  "flex items-center justify-between gap-8",
                  idx % 2 === 0 ? "flex-row" : "flex-row-reverse"
                )}
              >
                {/* Content Side */}
                <div className="flex-1">
                  <div className={cn(
                    "bg-white p-8 rounded-[2.5rem] border shadow-sm relative group",
                    isSoon ? "border-yellow-200 ring-2 ring-yellow-100 shadow-yellow-100" : "border-gray-100",
                    isPast ? "opacity-60 bg-gray-50" : ""
                  )}>
                    <div className="flex items-center gap-2 mb-4">
                      {isPast ? (
                        <CheckCircle2 className="w-5 h-5 text-gray-400" />
                      ) : isSoon ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-500 animate-pulse" />
                      ) : (
                        <Clock className="w-5 h-5 text-blue-500" />
                      )}
                      <span className={cn(
                        "text-xs font-black uppercase tracking-widest",
                        isPast ? "text-gray-400" : isSoon ? "text-yellow-600" : "text-blue-600"
                      )}>
                        {isPast ? 'Past Deadline' : isSoon ? 'Urgent: Due Soon' : 'Upcoming'}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#1E3A8A] transition-colors line-clamp-1">{item.title}</h3>
                    <p className="text-gray-500 text-sm font-medium mt-2 line-clamp-2">Category: {item.category}</p>
                    
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
                      <AddToCalendarButton
                        title={item.title}
                        description={`Notice Category: ${item.category}\nFiling Deadline: ${formatDate(deadlineDate)}`}
                        date={deadlineDate}
                        noticeId={item.id}
                        size="sm"
                        variant="outline"
                      />
                      <Link 
                        to={`/notice/${item.id}`}
                        className="flex items-center text-sm font-bold text-[#1E3A8A] hover:underline gap-1 group/btn"
                      >
                        <span className="group-hover/btn:translate-x-0.5 transition-transform">View Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Center Node */}
                <div className="relative flex flex-col items-center">
                   <div className={cn(
                     "w-12 h-12 rounded-full border-4 border-white shadow-xl flex items-center justify-center relative z-20",
                     isPast ? "bg-gray-200" : isSoon ? "bg-yellow-400 shadow-yellow-200" : "bg-[#1E3A8A] shadow-blue-200"
                   )}>
                     <Calendar className="w-6 h-6 text-white" />
                   </div>
                   <div className="absolute top-14 whitespace-nowrap text-center">
                     <p className="text-sm font-black text-gray-900">{formatDate(deadlineDate, 'MMM d, yyyy')}</p>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Deadline Date</p>
                   </div>
                </div>

                {/* Empty Side for balance */}
                <div className="flex-1"></div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {items.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
           <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
           <p className="text-gray-400 font-bold uppercase tracking-widest">No deadlines found</p>
           <p className="text-sm text-gray-400 mt-1">Upload a notice to start tracking.</p>
        </div>
      )}
    </div>
  );
};

export default Timeline;
