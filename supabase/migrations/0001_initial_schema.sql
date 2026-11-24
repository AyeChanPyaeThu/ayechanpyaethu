-- Portfolio CMS foundation
-- Apply this migration to the Supabase project's SQL Editor or through Supabase CLI.
-- Public visitors can read published portfolio content and submit contact messages.
-- Only users explicitly assigned the admin role can manage content.

create extension if not exists pgcrypto;

create type public.content_status as enum ('draft', 'published', 'archived');
create type public.message_status as enum ('unread', 'read', 'archived');
create type public.app_role as enum ('admin');

create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'admin',
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER avoids an RLS recursion loop when policies check admin status.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'::public.app_role
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  is_singleton boolean not null default true unique check (is_singleton),
  display_name text not null default '',
  headline text not null default '',
  biography text not null default '',
  location text,
  public_email text,
  avatar_url text,
  resume_url text,
  social_links jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  proficiency_label text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  description text not null default '',
  role text,
  technologies text[] not null default '{}',
  github_url text,
  live_demo_url text,
  cover_image_url text,
  status public.content_status not null default 'draft',
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  image_url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text,
  description text,
  achieved_on date,
  credential_url text,
  image_url text,
  image_urls text[] not null default '{}',
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  icon text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  sender_name text,
  sender_email text,
  subject text,
  message text not null,
  status public.message_status not null default 'unread',
  created_at timestamptz not null default now()
);

-- Helpful indexes for public listing and dashboard queries.
create index skills_public_order_idx
  on public.skills (is_published, sort_order);
create index projects_public_order_idx
  on public.projects (status, is_featured desc, sort_order);
create index project_images_project_order_idx
  on public.project_images (project_id, sort_order);
create index achievements_public_order_idx
  on public.achievements (status, achieved_on desc, sort_order);
create index interests_public_order_idx
  on public.interests (is_published, sort_order);
create index contact_messages_status_created_idx
  on public.contact_messages (status, created_at desc);

-- Keep updated_at current on editable records.
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger skills_set_updated_at
  before update on public.skills
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
create trigger achievements_set_updated_at
  before update on public.achievements
  for each row execute function public.set_updated_at();
create trigger interests_set_updated_at
  before update on public.interests
  for each row execute function public.set_updated_at();
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- Enable Row Level Security on every application table.
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.achievements enable row level security;
alter table public.interests enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_messages enable row level security;

-- A signed-in user may inspect their own role, but cannot grant or change roles.
create policy "Users can read their own role"
  on public.user_roles for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Public read access is limited to content explicitly marked as public.
create policy "Public can read visible profile"
  on public.profiles for select
  to anon, authenticated
  using (is_public or (select public.is_admin()));

create policy "Public can read published skills"
  on public.skills for select
  to anon, authenticated
  using (is_published or (select public.is_admin()));

create policy "Public can read published projects"
  on public.projects for select
  to anon, authenticated
  using (status = 'published' or (select public.is_admin()));

create policy "Public can read images for visible projects"
  on public.project_images for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = project_images.project_id
        and (projects.status = 'published' or (select public.is_admin()))
    )
  );

create policy "Public can read published achievements"
  on public.achievements for select
  to anon, authenticated
  using (status = 'published' or (select public.is_admin()));

create policy "Public can read published interests"
  on public.interests for select
  to anon, authenticated
  using (is_published or (select public.is_admin()));

create policy "Public can read public site settings"
  on public.site_settings for select
  to anon, authenticated
  using (is_public or (select public.is_admin()));

-- Only the explicitly assigned administrator can create, edit or delete CMS content.
create policy "Admins manage profiles"
  on public.profiles for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage skills"
  on public.skills for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage projects"
  on public.projects for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage project images"
  on public.project_images for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage achievements"
  on public.achievements for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage interests"
  on public.interests for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage site settings"
  on public.site_settings for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- The public contact form may submit messages, but only an admin can read or manage them.
create policy "Anyone can submit a valid contact message"
  on public.contact_messages for insert
  to anon, authenticated
  with check (
    char_length(trim(message)) between 1 and 3000
    and (sender_name is null or char_length(sender_name) <= 120)
    and (sender_email is null or char_length(sender_email) <= 254)
    and (subject is null or char_length(subject) <= 200)
  );

create policy "Admins can read contact messages"
  on public.contact_messages for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can update contact messages"
  on public.contact_messages for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete contact messages"
  on public.contact_messages for delete
  to authenticated
  using ((select public.is_admin()));

-- Explicit table privileges; RLS remains the authorization boundary.
grant usage on schema public to anon, authenticated;
grant select on
  public.profiles,
  public.skills,
  public.projects,
  public.project_images,
  public.achievements,
  public.interests,
  public.site_settings
to anon, authenticated;

grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant select on public.user_roles to authenticated;

grant insert, update, delete on
  public.profiles,
  public.skills,
  public.projects,
  public.project_images,
  public.achievements,
  public.interests,
  public.site_settings
to authenticated;

-- After creating your own account in Supabase Auth, assign it as the administrator
-- by running this statement in the SQL Editor with your Auth user UUID:
-- insert into public.user_roles (user_id, role)
-- values ('YOUR-AUTH-USER-UUID', 'admin');
