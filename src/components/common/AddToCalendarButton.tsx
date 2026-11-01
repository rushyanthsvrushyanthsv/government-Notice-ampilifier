import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  CalendarPlus, 
  Download, 
  ExternalLink, 
  Check, 
  ChevronDown, 
  Clock, 
  BellRing
} from 'lucide-react';
import { 
  CalendarEventPayload, 
  createGoogleCalendarUrl, 
  downloadIcsFile, 
  openGoogleCalendar 
} from '../../lib/calendar';
import { safeDate, formatDate, cn } from '../../lib/utils';

interface AddToCalendarButtonProps {
  title: string;
  description?: string;
  date: Date | string | any;
  endDate?: Date | string | any;
  noticeId?: string;
  location?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  showDatePreview?: boolean;
}

export const AddToCalendarButton: React.FC<AddToCalendarButtonProps> = ({
  title,
  description,
  date,
  endDate,
  noticeId,
  location,
  size = 'md',
  variant = 'outline',
  className = '',
  showDatePreview = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const eventDate = safeDate(date);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!eventDate) {
    return null;
  }

  const payload: CalendarEventPayload = {
    title: `[GovNotice] ${title}`,
    description: description || `Government Notice Compliance Alert.\nPortal: Karnataka Digital Citizen Platform\nNotice ID: ${noticeId || 'N/A'}\nScheduled Deadline: ${formatDate(eventDate, 'PPP')}`,
    startDate: eventDate,
    endDate: endDate || new Date(eventDate.getTime() + 60 * 60 * 1000),
    location: location || 'Government of Karnataka Digital Portal',
    noticeId,
  };

  const handleGoogleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    openGoogleCalendar(payload);
    setIsOpen(false);
  };

  const handleIcsDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadIcsFile(payload);
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      setIsOpen(false);
    }, 1200);
  };

  // Button sizes
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg',
    md: 'px-3.5 py-2 text-xs font-bold gap-2 rounded-xl',
    lg: 'px-5 py-2.5 text-sm font-bold gap-2.5 rounded-2xl',
  };

  // Button style variants
  const variantClasses = {
    primary: 'bg-navy text-gold hover:bg-navy/90 border border-gold/30 shadow-sm',
    secondary: 'bg-gold text-navy hover:bg-gold/90 font-black shadow-sm',
    outline: 'bg-white border border-slate-200 text-slate-700 hover:border-gold hover:text-navy hover:bg-amber-50/30 shadow-xs',
    ghost: 'bg-transparent text-slate-600 hover:text-navy hover:bg-slate-100',
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "inline-flex items-center justify-center font-sans tracking-wide transition-all active:scale-95 select-none cursor-pointer",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        title="Add deadline to Calendar"
      >
        <CalendarPlus size={size === 'sm' ? 13 : 15} className="text-gold shrink-0" />
        <span>Add to Calendar</span>
        {showDatePreview && (
          <span className="text-[10px] text-slate-400 font-normal">
            ({formatDate(eventDate, 'MMM d')})
          </span>
        )}
        <ChevronDown size={12} className={cn("transition-transform duration-200 opacity-60", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header Summary */}
          <div className="px-3 py-2 border-b border-slate-100 mb-1.5">
            <div className="flex items-center gap-1.5 text-navy font-bold text-xs">
              <Clock size={13} className="text-gold shrink-0" />
              <span className="truncate">Alert Date: {formatDate(eventDate, 'MMM d, yyyy')}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate font-medium">
              Sync to your mobile or desktop calendar
            </p>
          </div>

          {/* Option 1: Google Calendar */}
          <button
            type="button"
            onClick={handleGoogleCalendar}
            className="w-full px-3 py-2.5 rounded-xl text-left hover:bg-blue-50/70 text-slate-700 hover:text-blue-900 flex items-center justify-between transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Calendar size={14} />
              </div>
              <div>
                <span className="text-xs font-bold block leading-tight">Google Calendar</span>
                <span className="text-[9px] text-slate-400 font-medium">Opens in web browser</span>
              </div>
            </div>
            <ExternalLink size={13} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
          </button>

          {/* Option 2: Apple Calendar / Outlook / iCal */}
          <button
            type="button"
            onClick={handleIcsDownload}
            className="w-full px-3 py-2.5 rounded-xl text-left hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-900 flex items-center justify-between transition-colors group mt-1 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                {downloadSuccess ? <Check size={14} /> : <Download size={14} />}
              </div>
              <div>
                <span className="text-xs font-bold block leading-tight">
                  {downloadSuccess ? 'Downloaded .ics!' : 'Apple / Outlook / iCal'}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">
                  Includes 24h & 2h alarm reminders
                </span>
              </div>
            </div>
            {downloadSuccess ? (
              <Check size={13} className="text-emerald-600 shrink-0" />
            ) : (
              <BellRing size={13} className="text-slate-400 group-hover:text-emerald-600 shrink-0" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AddToCalendarButton;
