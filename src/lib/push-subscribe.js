// src/lib/push-subscribe.js
import { supabase } from './supabaseClient';

export async function subscribeUserToPush(supabaseClient, subscription) {
  const {
    data: { user },
    error: userErr
  } = await supabaseClient.auth.getUser();
  if (userErr || !user) {
    console.error('No authenticated user', userErr);
    return;
  }

  const { error: dbErr } = await supabaseClient
    .from('push_subscriptions')
    .insert({ user_id: user.id, subscription });

  if (dbErr) console.error('DB insert error:', dbErr);
}
