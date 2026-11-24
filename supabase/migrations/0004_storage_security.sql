-- Ensure the portfolio media bucket configuration is reproducible.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Recreate policies safely if this migration is reapplied.
drop policy if exists "Admins can upload portfolio media"
on storage.objects;

drop policy if exists "Admins can update portfolio media"
on storage.objects;

drop policy if exists "Admins can delete portfolio media"
on storage.objects;

create policy "Admins can upload portfolio media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-media'
  and public.is_admin()
  and (auth.jwt() ->> 'aal') = 'aal2'
  and (storage.foldername(name))[1] in (
    'projects', 'achievements', 'profile'
  )
);

create policy "Admins can update portfolio media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-media'
  and public.is_admin()
  and (auth.jwt() ->> 'aal') = 'aal2'
)
with check (
  bucket_id = 'portfolio-media'
  and public.is_admin()
  and (auth.jwt() ->> 'aal') = 'aal2'
  and (storage.foldername(name))[1] in (
    'projects', 'achievements', 'profile'
  )
);

create policy "Admins can delete portfolio media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-media'
  and public.is_admin()
  and (auth.jwt() ->> 'aal') = 'aal2'
);