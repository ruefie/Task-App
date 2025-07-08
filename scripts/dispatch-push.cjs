// scripts/dispatch-push.js
require('dotenv').config();
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

// Load from .env
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
} = process.env;

// Init Supabase and Web Push
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
webpush.setVapidDetails('mailto:dj_ruchie@yahoo.com.ph', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

(async () => {
  // 1) Find due & unsent notes
  const { data: notes } = await supabase
  .from('calendar_notes')
  .select('id,user_id,title,content,repeat_type,repeat_interval')
  .lte('reminder_date + reminder_time', new Date().toISOString())
  .eq('notification_sent', false);

  for (const note of notes) {
    // 2) Fetch subscriptions
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', note.user_id);

    for (const { subscription } of subs) {
      try {
        // 3) Send the push
        await webpush.sendNotification(
          subscription,
          JSON.stringify({ title: `⏰ ${note.title}`, body: note.content })
        );
      } catch (e) {
        console.error('Push error for note', note.id, e);
      }
    }

    // 4) Mark sent
        // 4) Reschedule (or mark done) in one go  (temporary)
    //    (make sure you selected repeat_type & repeat_interval above)
    let updates = {};
    if (note.repeat_type && note.repeat_type !== 'none') {
      const now = new Date();
      let nextDt;
      switch (note.repeat_type) {
        case 'minutely':
          nextDt = new Date(now.getTime() + (note.repeat_interval || 1) * 60_000);
          break;
        case 'daily':
          nextDt = new Date(now);
          nextDt.setDate(nextDt.getDate() + (note.repeat_interval || 1));
          break;
        case 'weekly':
          nextDt = new Date(now);
          nextDt.setDate(nextDt.getDate() + (note.repeat_interval || 1) * 7);
          break;
        case 'monthly':
          nextDt = new Date(now);
          nextDt.setMonth(nextDt.getMonth() + (note.repeat_interval || 1));
          break;
        case 'yearly':
          nextDt = new Date(now);
          nextDt.setFullYear(nextDt.getFullYear() + (note.repeat_interval || 1));
          break;
      }
      updates = {
        reminder_date: nextDt.toISOString().slice(0,10),
        reminder_time: nextDt.toTimeString().slice(0,5),
        notification_sent: false
      };
    } else {
      updates = { notification_sent: true };
    }

    await supabase
      .from('calendar_notes')
      .update(updates)
      .eq('id', note.id);

  }
})().catch(console.error);
