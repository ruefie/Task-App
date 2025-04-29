// export function urlBase64ToUint8Array(base64String) {
//   // boilerplate from MDN/web-push docs
//   const padding = '='.repeat((4 - base64String.length % 4) % 4);
//   const raw   = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
//   const bin   = atob(raw);
//   const arr   = new Uint8Array(bin.length);
//   for (let i = 0; i < bin.length; i++) {
//     arr[i] = bin.charCodeAt(i);
//   }
//   return arr;
// }


// src/lib/push-utils.js
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const b64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
