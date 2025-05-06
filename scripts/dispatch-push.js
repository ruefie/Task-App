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
webpush.setVapidDetails('mailto:you@yourdomain.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

(async () => {
  // 1) Find due & unsent notes
  const { data: notes } = await supabase
    .from('calendar_notes')
    .select('id,user_id,title,content')
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
    await supabase
      .from('calendar_notes')
      .update({ notification_sent: true })
      .eq('id', note.id);
  }
})().catch(console.error);
