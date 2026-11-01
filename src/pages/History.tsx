import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  FileText, 
  Search, 
  Filter, 
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatDate, safeDate } from '../lib/utils';

const History: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const FALLBACK_HISTORY = [
    {
      id: 'bbmp-tax-notice-2026',
      title: 'BBMP Property Tax Assessment & 5% Rebate Notice 2026',
      category: 'Fiscal',
      status: 'urgent',
      deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'seva-sindhu-kyc-2026',
      title: 'Seva Sindhu Aadhaar E-KYC Verification Directive',
      category: 'Civil',
      status: 'pending',
      deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'gst-compliance-advisory',
      title: 'Commercial Taxes Department GSTR-3B Advisory',
      category: 'Fiscal',
      status: 'completed',
      deadline: new Date(Date.now() - 86400000 * 4).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
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
        FALLBACK_HISTORY.forEach((d: any) => {
          if (!mergedMap.has(d.id)) mergedMap.set(d.id, d);
        });

        const allDocs = Array.from(mergedMap.values());
        allDocs.sort((a: any, b: any) => {
          const timeA = safeDate(a.createdAt)?.getTime() || 0;
          const timeB = safeDate(b.createdAt)?.getTime() || 0;
          return timeB - timeA;
        });
        setNotices(allDocs);
      }, (error) => {
        console.warn("History fetch warning:", error);
        setNotices([...localList, ...FALLBACK_HISTORY]);
      });
    } catch (e) {
      console.warn("Could not setup history listener:", e);
      setNotices([...localList, ...FALLBACK_HISTORY]);
    }

    return () => unsubscribe();
  }, [profile, isAdmin]);

  const filteredNotices = notices.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || n.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(notices.map(n => n.category))).filter((c): c is string => !!c)];

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Notice History</h1>
        <p className="text-gray-500 font-medium">Access and track all your processed government notices.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search notices by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#1E3A8A] transition-all font-medium"
          />
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto whitespace-nowrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                filterCategory === cat ? "bg-[#1E3A8A] text-white shadow-md shadow-blue-100" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotices.map((notice, idx) => (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link 
              to={`/notice/${notice.id}`}
              className="block bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden"
            >
              <div className="p-8 pb-0 flex items-start justify-between">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                  notice.status === 'urgent' ? "bg-red-50 text-red-600" : 
                  notice.status === 'completed' ? "bg-green-50 text-green-600" : 
                  "bg-blue-50 text-[#1E3A8A]"
                )}>
                  <FileText className="w-6 h-6" />
                </div>
                <div className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {notice.category}
                </div>
              </div>

              <div className="p-8 pt-6">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#1E3A8A] transition-colors line-clamp-2 min-h-[3.5rem]">
                  {notice.title}
                </h3>
                <p className="text-sm text-gray-400 font-medium mt-1">
                  Simplified on {formatDate(notice.createdAt, 'MMM d, yyyy')}
                </p>
                
                <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-6">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <span className={cn(
                      "text-xs font-black uppercase",
                      notice.status === 'urgent' ? "text-red-500" : 
                      notice.status === 'completed' ? "text-green-500" : 
                      "text-blue-500"
                    )}>
                      {notice.status}
                    </span>
                  </div>
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-[#1E3A8A] group-hover:text-white transition-all">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {filteredNotices.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-gray-200" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">No notices found</h2>
          <p className="text-gray-500 mt-2 font-medium">Try adjusting your search or category filters.</p>
        </div>
      )}
    </div>
  );
};

export default History;
