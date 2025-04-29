// supabase/functions/send-push/index.ts
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import webpush from "https://esm.sh/web-push@3.5.0";

// VAPID keys come from your env
webpush.setVapidDetails(
  'mailto:dj_ruchie@yahoo.com.ph',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
);

serve(async req => {
  const { subscription, payload } = await req.json();
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
