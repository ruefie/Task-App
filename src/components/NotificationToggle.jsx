// src/components/NotificationToggle.jsx
import { urlBase64ToUint8Array } from '../lib/push-utils';
import { subscribeUserToPush } from '../lib/push-subscribe';
import { supabase } from '../lib/supabaseClient';

export default function NotificationToggle() {
  const VAPID_PUBLIC_KEY = import.meta.env.VITE_PUSH_PUBLIC_KEY;

  const handleEnable = async () => {
    console.log('🔔 handleEnable clicked');

    if (!('serviceWorker' in navigator)) {
      console.error('Service Workers not supported');
      return;
    }

    try {
      // 1️⃣ Make sure the SW is registered (you can do this on load instead)
      await navigator.serviceWorker.register('/sw.js');
      console.log('📄 SW registered or update queued');

      // 2️⃣ Wait for the *controlling* SW registration
      const registration = await navigator.serviceWorker.ready;
      console.log('📄 Using SW registration from ready()', registration);

      // 3️⃣ Permission prompt must be in direct response to click
      if (Notification.permission === 'default') {
        const p = await Notification.requestPermission();
        console.log('📝 requestPermission =>', p);
        if (p !== 'granted') {
          console.log('❌ User denied notifications');
          return;
        }
      }
      if (Notification.permission !== 'granted') {
        console.log('🚫 Notifications have been blocked');
        return;
      }

      // 4️⃣ Subscribe on that *ready* registration
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('✅ subscription:', subscription);

      // 5️⃣ Store it in your DB
      await subscribeUserToPush(supabase, subscription);
      console.log('🎉 Push subscription saved to DB');
    } catch (err) {
      console.error('🏗️ Subscription flow error:', err);
    }
  };

  return <button onClick={handleEnable}>Enable Notifications</button>;
}
