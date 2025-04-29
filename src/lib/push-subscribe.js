// src/lib/push-subscribe.js
import { urlBase64ToUint8Array } from './push-utils';


const VAPID_PUBLIC_KEY = import.meta.env.VITE_PUSH_PUBLIC_KEY;

export async function subscribeUserToPush(supabase) {
  // 1) Make sure we have a signed-in user
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();
  if (userErr || !user) {
     return console.error('No authenticated user:', userErr);
    
  }

  // 2) Wait for SW to be ready + ask permission
  const reg = await navigator.serviceWorker.ready;
  // const permission = await Notification.requestPermission();
  // if (permission !== 'granted') {
  //   console.warn('Push permission not granted');
  //   return;
  // }

  // 3) Subscribe via PushManager
  let subscription;
  try {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
  } catch (err) {
    return console.error('Push subscription failed:', err);
  
  }

  // 4) Store in your table (user_id must match auth.uid())
  const { error: dbErr } = await supabase
    .from('push_subscriptions')
    .insert({
      user_id: user.id,
      subscription
    });

  if (dbErr) {
    console.error('Push subscription save error:', dbErr);
  } else {
    console.log('Push subscription saved');
  }
}
