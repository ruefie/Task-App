// supabase/functions/dispatch-push/index.ts
// @ts-nocheck

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import webpush from "https://esm.sh/web-push@3.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// — your VAPID setup —
webpush.setVapidDetails(
  "mailto:you@yourdomain.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!
);

// supabase client with SERVICE_ROLE key
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  // 1) grab all due, unsent notes
  const { data: dueNotes, error } = await supabase
    .from("calendar_notes")
    .select("id, user_id, title, content")
    .lte("reminder_date", new Date().toISOString().slice(0, 10))
    .lte("reminder_time", new Date().toTimeString().slice(0,5))
    .eq("notification_sent", false);

  if (error) {
    console.error("fetch due notes:", error);
    return new Response("Failed to fetch due notes", { status: 500 });
  }

  // 2) for each note, pull subscriptions and send
  for (const note of dueNotes!) {
    const { data: subs, error: subErr } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", note.user_id);

    if (subErr) {
      console.error("fetch subs:", subErr);
      continue;
    }

    for (const { subscription } of subs!) {
      try {
        await webpush.sendNotification(subscription, JSON.stringify({
          title: `⏰ ${note.title}`,
          body: note.content,
        }));
      } catch (err) {
        console.error("webpush error:", err);
      }
    }

    // 3) mark it sent
    const { error: updErr } = await supabase
      .from("calendar_notes")
      .update({ notification_sent: true })
      .eq("id", note.id);

    if (updErr) {
      console.error("mark sent:", updErr);
    }
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
