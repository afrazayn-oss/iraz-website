-- Eras Consultancy app — Supabase schema
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It creates the tables, row-level security (RLS) policies and the private
-- storage bucket the app needs. Safe to re-run on an empty project only.

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

-- Create a profile automatically when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by the policies below.
create function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Consultation bookings
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  service text not null,
  scheduled_at timestamptz not null,
  mode text not null default 'video' check (mode in ('in_person', 'video', 'phone')),
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);

-- A slot can only be held by one active booking.
create unique index bookings_active_slot
  on public.bookings (scheduled_at)
  where status in ('pending', 'confirmed');

-- Lets clients see which slots are taken without seeing other clients' bookings.
create function public.booked_slots(from_ts timestamptz, to_ts timestamptz)
returns setof timestamptz
language sql
stable
security definer set search_path = ''
as $$
  select scheduled_at from public.bookings
  where status in ('pending', 'confirmed')
    and scheduled_at >= from_ts and scheduled_at < to_ts;
$$;

-- ---------------------------------------------------------------------------
-- Cases and their status history
-- ---------------------------------------------------------------------------
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  reference text not null unique,
  title text not null,
  service text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'awaiting_client', 'submitted', 'completed', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.case_updates (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  status text not null
    check (status in ('open', 'in_progress', 'awaiting_client', 'submitted', 'completed', 'closed')),
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Adding an update moves the case to that status.
create function public.apply_case_update()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.cases
  set status = new.status, updated_at = new.created_at
  where id = new.case_id;
  return new;
end;
$$;

create trigger on_case_update
  after insert on public.case_updates
  for each row execute function public.apply_case_update();

-- ---------------------------------------------------------------------------
-- Documents (file metadata; the files live in the "documents" storage bucket)
-- ---------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  case_id uuid references public.cases (id) on delete set null,
  name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Enquiries
-- ---------------------------------------------------------------------------
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'replied', 'closed')),
  reply text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.cases enable row level security;
alter table public.case_updates enable row level security;
alter table public.documents enable row level security;
alter table public.enquiries enable row level security;

-- Profiles: users see and edit their own; admins see everyone.
create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
-- Users may only change these columns, so nobody can make themselves an admin.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone) on public.profiles to authenticated;

-- Bookings: clients create and cancel their own; admins manage all.
create policy "bookings: read own or admin" on public.bookings
  for select using (client_id = auth.uid() or public.is_admin());
create policy "bookings: client creates pending" on public.bookings
  for insert with check (client_id = auth.uid() and status = 'pending' and scheduled_at > now());
create policy "bookings: client cancels own" on public.bookings
  for update using (client_id = auth.uid() and status in ('pending', 'confirmed'))
  with check (client_id = auth.uid() and status = 'cancelled');
create policy "bookings: admin manages" on public.bookings
  for all using (public.is_admin()) with check (public.is_admin());

-- Cases: clients read their own; only admins create or change them.
create policy "cases: read own or admin" on public.cases
  for select using (client_id = auth.uid() or public.is_admin());
create policy "cases: admin manages" on public.cases
  for all using (public.is_admin()) with check (public.is_admin());

create policy "case_updates: read own or admin" on public.case_updates
  for select using (
    public.is_admin()
    or exists (select 1 from public.cases c where c.id = case_id and c.client_id = auth.uid())
  );
create policy "case_updates: admin adds" on public.case_updates
  for insert with check (public.is_admin());

-- Documents: clients read and upload their own; admins manage all.
create policy "documents: read own or admin" on public.documents
  for select using (client_id = auth.uid() or public.is_admin());
create policy "documents: client uploads own" on public.documents
  for insert with check (client_id = auth.uid() and uploaded_by = auth.uid());
create policy "documents: admin manages" on public.documents
  for all using (public.is_admin()) with check (public.is_admin());

-- Enquiries: clients send and read their own; admins reply.
create policy "enquiries: read own or admin" on public.enquiries
  for select using (client_id = auth.uid() or public.is_admin());
create policy "enquiries: client sends" on public.enquiries
  for insert with check (client_id = auth.uid() and status = 'new' and reply is null);
create policy "enquiries: admin manages" on public.enquiries
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: private "documents" bucket, one folder per client (<client_id>/...)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 26214400) -- 25 MB per file
on conflict (id) do nothing;

create policy "storage: read own folder or admin" on storage.objects
  for select using (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
create policy "storage: upload to own folder or admin" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
-- Clients can delete their own folder only so in-app account deletion can remove their files.
create policy "storage: delete own folder or admin" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- Account deletion (required by the App Store for apps with sign-up)
-- ---------------------------------------------------------------------------
create function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  -- Removing the auth user cascades to the profile and all of the user's rows.
  -- Their uploaded files are removed by the app before this is called.
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from anon;

-- ---------------------------------------------------------------------------
-- After you create your own account in the app, make it an admin with:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ---------------------------------------------------------------------------
