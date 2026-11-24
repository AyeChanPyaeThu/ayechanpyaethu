-- Extend achievements to preserve the existing card subtitle and certificate galleries.

alter table public.achievements
  add column if not exists summary text not null default '';

create table if not exists public.achievement_images (
  id uuid primary key default gen_random_uuid(),
  achievement_id uuid not null
    references public.achievements (id) on delete cascade,
  image_url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists achievement_images_parent_order_idx
  on public.achievement_images (achievement_id, sort_order);

alter table public.achievement_images enable row level security;

create policy "Public can read images for published achievements"
  on public.achievement_images for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.achievements
      where achievements.id = achievement_images.achievement_id
        and (
          achievements.status = 'published'
          or (select public.is_admin())
        )
    )
  );

create policy "Admins manage achievement images"
  on public.achievement_images for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.achievement_images to anon, authenticated;
grant insert, update, delete on public.achievement_images to authenticated;
