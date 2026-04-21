-- Archiver: completed_at + trigger + archive function + index + policy
alter table public.tasks
  add column if not exists completed_at timestamptz;

create or replace function public.set_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.milestone = 'done' and (old.milestone is distinct from 'done') then
    new.completed_at := coalesce(new.completed_at, now());
  end if;
  return new;
end$$;

drop trigger if exists trg_set_completed_at on public.tasks;
create trigger trg_set_completed_at
before update on public.tasks
for each row
execute function public.set_completed_at();

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='tasks' and policyname='Owner can update tasks'
  ) then
    create policy "Owner can update tasks"
      on public.tasks
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists tasks_archive_idx
  on public.tasks(user_id, milestone, archived_at, completed_at);

create or replace function public.archive_old_completed_tasks(p_user_id uuid default auth.uid())
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days int;
  v_count int := 0;
begin
  select auto_archive_days into v_days
  from public.user_settings
  where user_id = p_user_id;

  if v_days is null or v_days <= 0 then
    return 0;
  end if;

  update public.tasks t
  set archived_at = now()
  where t.user_id = p_user_id
    and t.archived_at is null
    and t.milestone = 'done'
    and coalesce(t.completed_at, t.updated_at, t.inserted_at, t.created_at)
        <= now() - (v_days || ' days')::interval;

  get diagnostics v_count = row_count;
  return v_count;
end $$;

grant execute on function public.archive_old_completed_tasks(uuid) to authenticated;
