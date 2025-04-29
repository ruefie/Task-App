// src/components/NotificationToggle.jsx
import { useState, useEffect } from "react";
import { subscribeUserToPush } from "../lib/push-subscribe";
import { useSupabase } from "../contexts/SupabaseContext"; // however you expose your client

export default function NotificationToggle() {
  const supabase = useSupabase();
  const [status, setStatus] = useState(Notification.permission);

  useEffect(() => {
    setStatus(Notification.permission);
  }, []);

  if (status !== "default") return null;

  return (
    <button
      onClick={async () => {
        const p = await Notification.requestPermission();
        setStatus(p);
        if (p === "granted") {
          // now subscribe the user
          await subscribeUserToPush(supabase);
        }
      }}
    >
      Enable Notifications
    </button>
  );
}
