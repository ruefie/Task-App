-- === A) push_subscriptions hardening ========================================

-- 1) Ensure table exists (skip if you already have it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'push_subscriptions'
  ) THEN
    CREATE TABLE public.push_subscriptions (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      subscription jsonb NOT NULL,
      endpoint     text,                      -- will be populated below
      created_at   timestamptz NOT NULL DEFAULT now(),
      updated_at   timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
  END IF;
END$$;

-- 2) Add "endpoint" column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='push_subscriptions' AND column_name='endpoint'
  ) THEN
    ALTER TABLE public.push_subscriptions ADD COLUMN endpoint text;
  END IF;
END$$;

-- 3) Backfill "endpoint" from subscription JSON when null
UPDATE public.push_subscriptions
SET endpoint = subscription->>'endpoint'
WHERE endpoint IS NULL AND subscription ? 'endpoint';

-- 3.5) Ensure timestamp columns exist (Option B prerequisite)
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- (optional but recommended) keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_push_subscriptions_touch ON public.push_subscriptions;
CREATE TRIGGER trg_push_subscriptions_touch
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) Deduplicate rows by (user_id, endpoint) keeping the NEWEST row (Option B)
WITH ranked AS (
  SELECT
    ctid,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, endpoint
      ORDER BY COALESCE(updated_at, created_at, now()) DESC, ctid DESC
    ) AS rn
  FROM public.push_subscriptions
  WHERE endpoint IS NOT NULL
)
DELETE FROM public.push_subscriptions p
USING ranked r
WHERE p.ctid = r.ctid
  AND r.rn > 1;

-- 5) Add unique constraint on (user_id, endpoint) if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'push_subscriptions_user_endpoint_key'
  ) THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subscriptions_user_endpoint_key UNIQUE (user_id, endpoint);
  END IF;
END$$;

-- 6) Optional: unique endpoint globally (comment out if you allow same device for multiple users)
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_constraint
--     WHERE conname = 'push_subscriptions_endpoint_key'
--   ) THEN
--     ALTER TABLE public.push_subscriptions
--       ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);
--   END IF;
-- END$$;

-- 7) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);

-- 8) RLS policies (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='push_subscriptions'
      AND policyname='Users can view own subscriptions'
  ) THEN
    CREATE POLICY "Users can view own subscriptions"
      ON public.push_subscriptions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='push_subscriptions'
      AND policyname='Users can upsert own subscriptions'
  ) THEN
    CREATE POLICY "Users can upsert own subscriptions"
      ON public.push_subscriptions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='push_subscriptions'
      AND policyname='Users can delete own subscriptions'
  ) THEN
    CREATE POLICY "Users can delete own subscriptions"
      ON public.push_subscriptions FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END$$;


-- === B) user_settings table ==================================================

-- 1) Create table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='user_settings'
  ) THEN
    CREATE TABLE public.user_settings (
      user_id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      notifications_enabled boolean NOT NULL DEFAULT false,
      preferred_view   text NOT NULL DEFAULT 'kanban' CHECK (preferred_view IN ('kanban','list')),
      theme            text NOT NULL DEFAULT 'system' CHECK (theme IN ('system','light','dark')),
      updated_at       timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
  END IF;
END$$;

-- 2) Indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_view  ON public.user_settings(preferred_view);
CREATE INDEX IF NOT EXISTS idx_user_settings_theme ON public.user_settings(theme);

-- 3) RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_settings'
      AND policyname='Users can select own settings'
  ) THEN
    CREATE POLICY "Users can select own settings"
      ON public.user_settings FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_settings'
      AND policyname='Users can upsert own settings'
  ) THEN
    CREATE POLICY "Users can upsert own settings"
      ON public.user_settings FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_settings'
      AND policyname='Users can update own settings'
  ) THEN
    CREATE POLICY "Users can update own settings"
      ON public.user_settings FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- (Optional) Seed a row on first use is handled in your UI with an UPSERT.
