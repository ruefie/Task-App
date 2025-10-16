-- Add archive & reminders to tasks
alter table public.tasks
  add column if not exists archived_at timestamptz,
  add column if not exists reminder_at timestamptz,
  add column if not exists reminder_sent boolean default false;

-- Add new user settings
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_view text,
  theme text,
  notifications_enabled boolean,          -- legacy; can keep or drop later
  auto_archive_days integer default 0,    -- 0 = never
  task_reminders_enabled boolean default true,
  updated_at timestamptz default now()
);

-- If the table already exists, ensure new columns are present
alter table public.user_settings
  add column if not exists auto_archive_days integer default 0,
  add column if not exists task_reminders_enabled boolean default true,
  add column if not exists updated_at timestamptz default now();

-- Optional: RLS (mirror what you do elsewhere)
alter table public.user_settings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_settings' and policyname='Owner can manage settings'
  ) then
    create policy "Owner can manage settings"
      on public.user_settings
      using ( auth.uid() = user_id )
      with check ( auth.uid() = user_id );
  end if;
end $$;
