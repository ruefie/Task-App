// src/lib/notifications.js
import iziToast from 'izitoast';
import { urlBase64ToUint8Array } from './push-utils';  
const PUBLIC_VAPID_KEY = import.meta.env.VITE_PUSH_PUBLIC_KEY;

// —————— 1) In-app toast (exactly your old code) ——————
export function showNotification(title, message, options = {}) {
  const toastConfig = {
    title,
    message,
    position: 'topRight',
    timeout: options.timeout || 10000,
    close: true,
    closeOnClick: true,
    progressBar: true,
    theme: 'light',
    icon: 'icon-bell',
    iconColor: '#3b82f6',
    class: 'calendar-notification',
    buttons: [],
    ...options
  };

  if (options.onSnooze) {
    toastConfig.buttons.push([
      '<button>Snooze 5m</button>',
      (instance, toast) => {
        instance.hide({ transitionOut: 'fadeOut' }, toast);
        options.onSnooze(5);
      }
    ]);
    toastConfig.buttons.push([
      '<button>Snooze 15m</button>',
      (instance, toast) => {
        instance.hide({ transitionOut: 'fadeOut' }, toast);
        options.onSnooze(15);
      }
    ]);
  }

  toastConfig.buttons.push([
    '<button>Dismiss</button>',
    (instance, toast) => instance.hide({ transitionOut: 'fadeOut' }, toast)
  ]);

  // const toast = iziToast.show(toastConfig);
  // requestAnimationFrame(() => {
  //   const bell = document.querySelector(`#${toast.id} .icon-bell`);
  //   if (bell) bell.classList.add('ringing');
  // });
  // return toast;

  iziToast.show(toastConfig);
// add ringing animation to the newest toast's bell:
requestAnimationFrame(() => {
const bells = document.querySelectorAll('.calendar-notification .icon-bell');
   const lastBell = bells[bells.length - 1];
   if (lastBell) lastBell.classList.add('ringing');
 });
// iziToast.show()



}

// —————— 2) Service-worker / desktop scheduling ——————
// src/lib/notifications.js
async function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered');
      // await Notification.requestPermission();
    } catch (e) {
      console.warn('SW registration failed', e);
    }
  }
}
initServiceWorker();

export async function scheduleNotification(title, message, timestamp, tag) {
  // if showTrigger is supported, let SW fire it when the OS reaches `timestamp`
  if ('showTrigger' in Notification.prototype) {
    const reg = await navigator.serviceWorker.ready;
    return reg.showNotification(title, {
      body: message,
      tag,
      showTrigger: new TimestampTrigger(timestamp),
      icon: '/notification-icon.png',
      badge: '/notification-badge.png',
    });
  }

  // fallback: fire a Notification via setTimeout (will fire even if tab is in background)
  const delay = Math.max(0, timestamp - Date.now());
  setTimeout(() => {
    new Notification(title, { body: message, tag, icon: '/notification-icon.png' });
  }, delay);
}




