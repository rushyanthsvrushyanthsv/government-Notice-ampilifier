import React, { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  isBefore,
  startOfDay,
  addDays
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  CalendarPlus,
  Download,
  Info,
  Sparkles
} from 'lucide-react';
import { safeDate, formatDate, cn } from '../../lib/utils';
import { createGoogleCalendarUrl, downloadIcsFile, openGoogleCalendar } from '../../lib/calendar';
import { useNavigate } from 'react-router-dom';

export interface CalendarAlertItem {
  id: string;
  title: string;
  message?: string;
  date: Date;
  type: 'deadline' | 'warning' | 'info' | 'system';
  noticeId?: string;
  category?: string;
  read?: boolean;
}

interface AlertsCalendarViewProps {
  items: CalendarAlertItem[];
  onSelectNotice?: (noticeId: string) => void;
  className?: string;
}

export const AlertsCalendarView: React.FC<AlertsCalendarViewProps> = ({
  items,
  onSelectNotice,
  className = '',
}) => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Group alerts by day string (YYYY-MM-DD)
  const alertsByDate = useMemo(() => {
    const map = new Map<string, CalendarAlertItem[]>();
    for (const item of items) {
      if (!item.date) continue;
      const key = format(item.date, 'yyyy-MM-dd');
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    }
    return map;
  }, [items]);

  // Calendar dates generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const selectedKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateAlerts = alertsByDate.get(selectedKey) || [];

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  };

  const handleAddAllToCalendar = () => {
    // Export all upcoming alerts as a composite .ics or download individual
    if (selectedDateAlerts.length > 0) {
      selectedDateAlerts.forEach(item => {
        downloadIcsFile({
          title: `[GovNotice] ${item.title}`,
          description: item.message || 'Government Notice Deadline Alert',
          startDate: item.date,
          noticeId: item.noticeId,
        });
      });
    }
  };

  const today = startOfDay(new Date());

  return (
    <div className={cn("bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden", className)}>
      {/* Calendar Top Header */}
      <div className="p-6 bg-gradient-to-r from-navy via-navy to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold font-black uppercase tracking-[0.25em] text-[10px] mb-1">
            <CalendarIcon size={14} />
            <span>Official Alert Scheduling</span>
          </div>
          <h2 className="text-2xl font-serif font-black tracking-tight text-white flex items-center gap-2">
            <span>{format(currentMonth, 'MMMM yyyy')}</span>
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Click on any date to inspect scheduled government notice deadlines & alerts
          </p>
        </div>

        {/* Month Navigation & Today Button */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gold rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-white/10 rounded-xl p-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Calendar Grid */}
        <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-slate-100">
          {/* Days of week header */}
          <div className="grid grid-cols-7 mb-3 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <span key={d} className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayAlerts = alertsByDate.get(dayKey) || [];
              const hasAlerts = dayAlerts.length > 0;
              const hasDeadline = dayAlerts.some(a => a.type === 'deadline');
              const hasWarning = dayAlerts.some(a => a.type === 'warning');
              const isSelected = isSameDay(day, selectedDate);
              const inCurrentMonth = isSameMonth(day, currentMonth);
              const isDayToday = isToday(day);
              const isPast = isBefore(day, today);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[58px] sm:min-h-[72px] p-1.5 rounded-2xl flex flex-col justify-between items-start transition-all relative text-left group border cursor-pointer",
                    !inCurrentMonth && "opacity-35 bg-slate-50/50 border-transparent",
                    inCurrentMonth && !isSelected && "bg-white hover:bg-slate-50 border-slate-100",
                    isSelected && "bg-navy text-white border-navy ring-2 ring-gold/40 shadow-md",
                    isDayToday && !isSelected && "border-amber-300 ring-2 ring-amber-100/80 bg-amber-50/20"
                  )}
                >
                  <div className="w-full flex items-center justify-between">
                    <span className={cn(
                      "text-xs sm:text-sm font-black w-6 h-6 flex items-center justify-center rounded-full",
                      isSelected ? "text-gold" : isDayToday ? "text-amber-800 font-extrabold" : "text-slate-700"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {isDayToday && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    )}
                  </div>

                  {/* Badges for Alerts on this Date */}
                  {hasAlerts && (
                    <div className="w-full mt-1 space-y-0.5">
                      {hasDeadline && (
                        <div className={cn(
                          "w-full px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight flex items-center gap-1 truncate",
                          isSelected ? "bg-red-500 text-white" : "bg-red-100 text-red-800"
                        )}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-ping" />
                          <span className="truncate">Deadline ({dayAlerts.filter(a => a.type === 'deadline').length})</span>
                        </div>
                      )}
                      {hasWarning && !hasDeadline && (
                        <div className={cn(
                          "w-full px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight flex items-center gap-1 truncate",
                          isSelected ? "bg-amber-400 text-navy font-bold" : "bg-amber-100 text-amber-900"
                        )}>
                          <span className="truncate">Warning</span>
                        </div>
                      )}
                      {!hasDeadline && !hasWarning && (
                        <div className={cn(
                          "w-full px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1 truncate",
                          isSelected ? "bg-blue-400 text-navy" : "bg-blue-100 text-blue-800"
                        )}>
                          <span className="truncate">{dayAlerts.length} Alert{dayAlerts.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-slate-100 text-[11px] font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Notice Deadline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Warning / Action Item</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Notice Event / Update</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full ring-2 ring-amber-400 bg-amber-100" />
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Date Alerts & Calendar Sync Controls */}
        <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  Date of Alerts
                </span>
                <h3 className="text-xl font-serif font-black text-navy">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>
              </div>
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700">
                {selectedDateAlerts.length} Scheduled
              </span>
            </div>

            {/* List of alerts for this selected date */}
            <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {selectedDateAlerts.length > 0 ? (
                selectedDateAlerts.map(alert => {
                  const isDeadline = alert.type === 'deadline';
                  const isWarning = alert.type === 'warning';

                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-4 rounded-2xl border bg-white shadow-xs transition-all",
                        isDeadline ? "border-red-200 ring-1 ring-red-100" :
                        isWarning ? "border-amber-200 ring-1 ring-amber-100" :
                        "border-slate-200"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                          isDeadline ? "bg-red-500 text-white" :
                          isWarning ? "bg-amber-500 text-white" :
                          "bg-navy text-gold"
                        )}>
                          {isDeadline ? <Clock size={16} /> :
                           isWarning ? <AlertTriangle size={16} /> :
                           <Info size={16} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                              isDeadline ? "bg-red-100 text-red-800" :
                              isWarning ? "bg-amber-100 text-amber-800" :
                              "bg-blue-100 text-blue-800"
                            )}>
                              {isDeadline ? 'Filing Deadline' : isWarning ? 'Warning' : 'Notice Alert'}
                            </span>
                            {alert.category && (
                              <span className="text-[10px] text-slate-400 font-bold">
                                {alert.category}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-navy mt-1.5 leading-snug">
                            {alert.title}
                          </h4>

                          {alert.message && (
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {alert.message}
                            </p>
                          )}

                          {/* Quick Calendar Actions for this specific alert */}
                          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openGoogleCalendar({
                                title: `[GovNotice] ${alert.title}`,
                                description: alert.message || 'Government Notice Compliance Alert',
                                startDate: alert.date,
                                noticeId: alert.noticeId,
                              })}
                              className="px-2.5 py-1 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                              title="Add this alert to Google Calendar"
                            >
                              <CalendarPlus size={11} />
                              <span>Google Cal</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => downloadIcsFile({
                                title: `[GovNotice] ${alert.title}`,
                                description: alert.message || 'Government Notice Compliance Alert',
                                startDate: alert.date,
                                noticeId: alert.noticeId,
                              })}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                              title="Download .ics for Apple / Outlook / iCal"
                            >
                              <Download size={11} />
                              <span>iCal (.ics)</span>
                            </button>

                            {alert.noticeId && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectNotice) onSelectNotice(alert.noticeId!);
                                  else navigate(`/notice/${alert.noticeId}`);
                                }}
                                className="px-2.5 py-1 bg-navy/5 text-navy hover:bg-navy hover:text-gold rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors ml-auto"
                              >
                                <span>Inspect Notice</span>
                                <ExternalLink size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200">
                  <CalendarIcon size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    No Alerts on this Date
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Select a date with a colored badge to inspect its deadlines and sync them directly to your calendar.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Schedule Notice Alert or Export */}
          {selectedDateAlerts.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleAddAllToCalendar}
                className="w-full py-2.5 bg-navy text-gold hover:bg-navy/90 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <CalendarPlus size={14} />
                <span>Sync All Alerts for This Date (.ics)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsCalendarView;
