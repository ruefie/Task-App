// src/components/Settings.jsx
import { useEffect, useState } from 'react';
import styles from '../styles/Settings.module.scss';
import { supabase } from '../lib/supabaseClient';

const DEFAULTS = {
  preferred_view: 'kanban',   // 'kanban' | 'list'
  theme: 'system',            // 'system' | 'light' | 'dark'
  auto_archive_days: 0,       // 0 = never
  task_reminders_enabled: true,
};

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [settings, setSettings] = useState(DEFAULTS);
  const [userId, setUserId] = useState(null);

  // Load current user + settings (DB or localStorage)
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } = {} } = await supabase.auth.getUser();
        setUserId(user?.id ?? null);

        let loaded = null;
        if (user?.id) {
          const { data, error } = await supabase
            .from('user_settings')
            .select('preferred_view, theme, auto_archive_days, task_reminders_enabled')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            console.warn('user_settings fetch:', error.message);
          }

          if (data) {
            loaded = { ...DEFAULTS, ...data };
          } else {
            const toInsert = { user_id: user.id, ...DEFAULTS, updated_at: new Date().toISOString() };
            await supabase.from('user_settings').upsert(toInsert, { onConflict: 'user_id' });
            loaded = { ...DEFAULTS };
          }
        }

        if (!loaded) {
          const ls = localStorage.getItem('taskapp.settings');
          loaded = ls ? { ...DEFAULTS, ...JSON.parse(ls) } : { ...DEFAULTS };
        }

        setSettings(loaded);

        // apply theme immediately and broadcast preferred view for Tasks.jsx
        applyTheme(loaded.theme);
        broadcastView(loaded.preferred_view);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Persist to DB (upsert) or localStorage
  const persist = async (patch) => {
    setSaving(true);
    try {
      const next = { ...settings, ...patch };
      setSettings(next);

      if (userId) {
        const payload = { user_id: userId, ...next, updated_at: new Date().toISOString() };
        await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' });
      } else {
        const legacy = next.preferred_view ? { default_view: next.preferred_view } : {};
        localStorage.setItem('taskapp.settings', JSON.stringify({ ...next, ...legacy }) );
      }

      if (patch.theme) applyTheme(patch.theme);
      if (patch.preferred_view) broadcastView(patch.preferred_view);
    } catch (e) {
      console.error('Save settings failed:', e);
    } finally {
      setSaving(false);
    }
  };

  // --- Theme + view helpers --------------------------------------------------
  function applyTheme(mode) {
    const root = document.documentElement;
    if (!mode || mode === 'system') {
      root.removeAttribute('data-theme'); // let prefers-color-scheme win
    } else {
      root.setAttribute('data-theme', mode); // 'light' | 'dark'
    }
    localStorage.setItem('ui.theme', mode);
  }

  function broadcastView(view) {
    localStorage.setItem('ui.default_view', view);
    try {
      window.dispatchEvent(new CustomEvent('user_settings:preferred_view', { detail: view }));
    } catch {}
  }

  if (loading) return <div className={styles.container}><p>Loading settings…</p></div>;

  return (
    <div className={styles.container}>
      <h1>Settings</h1>

      <section className={styles.card}>
        <h2>Preferences</h2>

        {/* Default task view */}
        <div className={styles.row}>
          <div>
            <div className={styles.label}>Default task view</div>
            <div className={styles.help}>Used when opening Tasks.</div>
          </div>
          <select
            value={settings.preferred_view}
            onChange={(e) => persist({ preferred_view: e.target.value })}
            className={styles.select}
          >
            <option value="kanban">Kanban</option>
            <option value="list">List</option>
          </select>
        </div>

        {/* Theme */}
        <div className={styles.row}>
          <div>
            <div className={styles.label}>Theme</div>
            <div className={styles.help}>Choose light/dark or follow system.</div>
          </div>
          <select
            value={settings.theme}
            onChange={(e) => persist({ theme: e.target.value })}
            className={styles.select}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        {/* Auto-archive completed tasks */}
        <div className={styles.row}>
          <div>
            <div className={styles.label}>Auto-archive completed tasks</div>
            <div className={styles.help}>Move completed tasks to Archive after this many days. 0 = never.</div>
          </div>
          <select
            value={settings.auto_archive_days ?? 0}
            onChange={(e) => persist({ auto_archive_days: Number(e.target.value) })}
            className={styles.select}
          >
            {[0, 7, 14, 30, 90].map((d) => (
              <option key={d} value={d}>{d === 0 ? 'Never' : `${d} days`}</option>
            ))}
          </select>
        </div>

        {/* Task reminders master switch */}
        <div className={styles.row}>
          <div>
            <div className={styles.label}>Task reminders</div>
            <div className={styles.help}>Allow tasks to use reminders (e.g., before due). You can add the picker in Task form.</div>
          </div>
          <button
            className={`${styles.btn} ${settings.task_reminders_enabled ? styles.btnOn : ''}`}
            onClick={() => persist({ task_reminders_enabled: !settings.task_reminders_enabled })}
          >
            {settings.task_reminders_enabled ? 'On' : 'Off'}
          </button>
        </div>
      </section>

      <div className={styles.footer}>
        <span className={styles.dim}>{saving ? 'Saving…' : 'All changes saved'}</span>
      </div>
    </div>
  );
}
