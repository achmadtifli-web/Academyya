import { query } from '@/lib/db';

export async function listUserNotifications(userId, limit = 20) {
  const res = await query(
    `SELECT id, user_id, title, message, is_read, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return res.rows;
}

export async function markNotificationsRead(userId, notificationId = null) {
  if (notificationId) {
    await query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
  } else {
    await query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
  }
}
