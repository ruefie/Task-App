-- Ensure required columns exist
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Trigger: set completed_at when milestone becomes 'done' (case-insensitive)
CREATE OR REPLACE FUNCTION public.set_completed_at_on_milestone()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF lower(NEW.milestone) = 'done' AND NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF lower(NEW.milestone) = 'done' AND lower(COALESCE(OLD.milestone, '')) <> 'done' THEN
      NEW.completed_at := COALESCE(NEW.completed_at, now());
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_set_completed_at_on_milestone ON public.tasks;
CREATE TRIGGER trg_set_completed_at_on_milestone
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_completed_at_on_milestone();

-- Backfill completed_at for existing done tasks (case-insensitive), prefer updated_at then created_at
UPDATE public.tasks
SET completed_at = COALESCE(completed_at, updated_at, created_at, now())
WHERE lower(milestone) = 'done'
  AND completed_at IS NULL;

-- Helpful index for archiving
CREATE INDEX IF NOT EXISTS tasks_archive_idx
  ON public.tasks(user_id, milestone, archived_at, completed_at);

-- Archiver function: archive "done" tasks older than user_settings.auto_archive_days
CREATE OR REPLACE FUNCTION public.archive_old_completed_tasks(p_user_id uuid DEFAULT auth.uid())
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days  integer;
  v_count integer := 0;
BEGIN
  SELECT auto_archive_days INTO v_days
  FROM public.user_settings
  WHERE user_id = p_user_id;

  IF v_days IS NULL OR v_days <= 0 THEN
    RETURN 0;
  END IF;

  UPDATE public.tasks t
  SET archived_at = now()
  WHERE t.user_id = p_user_id
    AND t.archived_at IS NULL
    AND lower(t.milestone) = 'done'
    AND COALESCE(t.completed_at, t.updated_at, t.created_at) <=
        now() - (v_days || ' days')::interval;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END$$;

GRANT EXECUTE ON FUNCTION public.archive_old_completed_tasks(uuid) TO authenticated;

-- Make sure owner can update tasks (needed to set archived_at under RLS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='tasks' AND policyname='Owner can update tasks'
  ) THEN
    CREATE POLICY "Owner can update tasks"
      ON public.tasks
      FOR UPDATE
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;
