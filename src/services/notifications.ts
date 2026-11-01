import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { safeDate, formatDate } from '../lib/utils';
import { differenceInDays } from 'date-fns';

export interface AppNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'deadline' | 'system';
  read: boolean;
  noticeId?: string;
  createdAt?: any;
}

/**
 * Creates a validated notification conforming to Firestore security rules
 */
export async function createNotification(
  userId: string,
  payload: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'deadline' | 'system';
    noticeId?: string;
  }
): Promise<string | null> {
  if (!userId || !auth.currentUser) return null;

  try {
    const cleanTitle = (payload.title || 'System Notification').slice(0, 190);
    const cleanMessage = (payload.message || 'No additional details.').slice(0, 950);

    const docData: any = {
      userId,
      title: cleanTitle,
      message: cleanMessage,
      type: payload.type || 'info',
      read: false,
      createdAt: serverTimestamp(),
    };

    if (payload.noticeId) {
      docData.noticeId = payload.noticeId;
    }

    const docRef = await addDoc(collection(db, 'notifications'), docData);
    return docRef.id;
  } catch (error) {
    console.warn('Could not write notification to Firestore:', error);
    return null;
  }
}

/**
 * Proactively scans all user notices and generates relevant deadline & warning alerts
 * Prevents redundant duplicates by checking existing alert history
 */
export async function syncNoticeAlerts(userId: string): Promise<number> {
  if (!userId || !auth.currentUser) return 0;

  try {
    // 1. Fetch user notices
    const noticesSnap = await getDocs(
      query(collection(db, 'notices'), where('userId', '==', userId))
    );
    const notices = noticesSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    // 2. Fetch existing notifications
    const notifsSnap = await getDocs(
      query(collection(db, 'notifications'), where('userId', '==', userId))
    );
    const existingNotifs = notifsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    let createdCount = 0;
    const now = new Date();

    for (const notice of notices) {
      const noticeTitle = notice.title || 'Government Notice';

      // --- A. Deadline Alerts ---
      if (notice.deadline && notice.status !== 'completed') {
        const deadlineDate = safeDate(notice.deadline);
        if (deadlineDate) {
          const daysLeft = differenceInDays(deadlineDate, now);
          const isOverdue = deadlineDate.getTime() < now.getTime();

          // Check if an alert for this deadline already exists
          const hasDeadlineAlert = existingNotifs.some(n => 
            n.noticeId === notice.id && n.type === 'deadline'
          );

          if (!hasDeadlineAlert) {
            let title = '';
            let message = '';

            if (isOverdue) {
              title = `⚠️ Overdue Notice: ${noticeTitle}`;
              message = `The deadline passed on ${formatDate(deadlineDate, 'MMM d, yyyy')}. Immediate compliance or filing may be required.`;
            } else if (daysLeft <= 3) {
              title = `🚨 URGENT DEADLINE: ${noticeTitle}`;
              message = `Action required in ${daysLeft <= 0 ? 'less than 24 hours' : `${daysLeft} days`} (${formatDate(deadlineDate, 'MMM d, yyyy')}).`;
            } else if (daysLeft <= 7) {
              title = `⏰ Upcoming Deadline: ${noticeTitle}`;
              message = `Filing deadline scheduled for ${formatDate(deadlineDate, 'MMM d, yyyy')} (${daysLeft} days remaining).`;
            }

            if (title) {
              await createNotification(userId, {
                title,
                message,
                type: 'deadline',
                noticeId: notice.id,
              });
              createdCount++;
            }
          }
        }
      }

      // --- B. Critical Warnings Alerts ---
      if (notice.warnings && Array.isArray(notice.warnings) && notice.warnings.length > 0) {
        const hasWarningAlert = existingNotifs.some(n => 
          n.noticeId === notice.id && n.type === 'warning'
        );

        if (!hasWarningAlert) {
          const firstWarning = String(notice.warnings[0]);
          await createNotification(userId, {
            title: `Advisory Flag: ${noticeTitle}`,
            message: `Key regulatory notice warning: "${firstWarning.slice(0, 200)}..."`,
            type: 'warning',
            noticeId: notice.id,
          });
          createdCount++;
        }
      }
    }

    return createdCount;
  } catch (error) {
    console.error('Error in syncNoticeAlerts:', error);
    return 0;
  }
}

/**
 * Creates a test alert immediately for testing user alerts
 */
export async function createTestAlert(userId: string): Promise<string | null> {
  return createNotification(userId, {
    title: 'System Alert Verified ✅',
    message: `Alert delivery protocol successfully validated at ${new Date().toLocaleTimeString()}. Live notifications are active and monitoring your notices.`,
    type: 'system',
  });
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
  }
}

/**
 * Mark all user notifications as read
 */
export async function markAllNotificationsAsRead(notifications: { id: string; read?: boolean }[]): Promise<void> {
  const unread = notifications.filter(n => !n.read);
  if (unread.length === 0) return;

  try {
    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'notifications');
  }
}

/**
 * Delete a notification
 */
export async function deleteNotificationDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `notifications/${id}`);
  }
}

/**
 * Clear all read notifications
 */
export async function clearReadNotifications(notifications: { id: string; read?: boolean }[]): Promise<void> {
  const readItems = notifications.filter(n => n.read);
  if (readItems.length === 0) return;

  try {
    const batch = writeBatch(db);
    readItems.forEach(n => {
      batch.delete(doc(db, 'notifications', n.id));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'notifications');
  }
}
