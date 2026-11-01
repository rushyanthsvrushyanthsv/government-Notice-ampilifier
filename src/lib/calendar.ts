import { safeDate } from './utils';

export interface CalendarEventPayload {
  title: string;
  description?: string;
  startDate: Date | string | any;
  endDate?: Date | string | any;
  location?: string;
  allDay?: boolean;
  noticeId?: string;
}

/**
 * Formats a Date object into Google Calendar UTC string: YYYYMMDDTHHmmssZ
 */
export function formatGoogleCalendarDate(date: Date, allDay: boolean = false): string {
  if (allDay) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

/**
 * Formats a Date object into standard iCalendar UTC format
 */
export function formatIcsDate(date: Date): string {
  return formatGoogleCalendarDate(date, false);
}

/**
 * Generates a Google Calendar Web URL with pre-filled event details
 */
export function createGoogleCalendarUrl(event: CalendarEventPayload): string {
  const start = safeDate(event.startDate) || new Date();
  
  // If no endDate provided, set end to 1 hour after start
  let end = safeDate(event.endDate);
  if (!end) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }

  const datesParam = `${formatGoogleCalendarDate(start, !!event.allDay)}/${formatGoogleCalendarDate(end, !!event.allDay)}`;
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: datesParam,
    details: event.description || 'Government of Karnataka Notice Alert & Compliance Deadline',
    location: event.location || 'Government of Karnataka Digital Portal',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates standard RFC 5545 iCalendar content (.ics)
 * Includes native sound alarms: 1 day prior (-P1D) and 2 hours prior (-PT2H)
 */
export function generateIcsContent(event: CalendarEventPayload): string {
  const start = safeDate(event.startDate) || new Date();
  let end = safeDate(event.endDate);
  if (!end) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }

  const now = new Date();
  const dtStamp = formatIcsDate(now);
  const dtStart = formatIcsDate(start);
  const dtEnd = formatIcsDate(end);
  const uid = `govnotice-${event.noticeId || 'alert'}-${start.getTime()}-${Math.random().toString(36).substring(2, 9)}@karnataka.gov.in`;

  // Escape special characters in text fields
  const cleanSummary = (event.title || 'Government Notice Alert')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');

  const cleanDescription = (event.description || 'Government of Karnataka Notice Deadline Alert')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');

  const cleanLocation = (event.location || 'Government of Karnataka Citizen Portal')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Government of Karnataka//GovNotice AI Portal//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${cleanSummary}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${cleanLocation}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    // Alarm 1: 24 hours prior
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: 1 Day remaining for ${cleanSummary}`,
    'END:VALARM',
    // Alarm 2: 2 hours prior
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Urgent: 2 Hours remaining for ${cleanSummary}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Downloads an .ics file for Apple Calendar, Outlook, and offline iCal clients
 */
export function downloadIcsFile(event: CalendarEventPayload, filename?: string): void {
  const icsData = generateIcsContent(event);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  
  const safeFilename = filename || `${(event.title || 'GovNotice-Alert')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40)}-deadline.ics`;
    
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Opens Google Calendar event in new window/tab safely
 */
export function openGoogleCalendar(event: CalendarEventPayload): void {
  const url = createGoogleCalendarUrl(event);
  window.open(url, '_blank', 'noopener,noreferrer');
}
