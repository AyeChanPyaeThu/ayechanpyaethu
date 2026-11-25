
-- Require completed MFA (aal2) for administrator-only database access.
-- Preserve public access to published content.
-- Keep the is_admin() function unchanged.

-- Achievement images
ALTER POLICY "Admins manage achievement images"
ON public.achievement_images
USING (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'))
WITH CHECK (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'));

ALTER POLICY "Public can read images for published achievements"
ON public.achievement_images
USING (
  EXISTS (
    SELECT 1
    FROM public.achievements
    WHERE achievements.id = achievement_images.achievement_id
      AND (
        achievements.status = 'published'::public.content_status
        OR (
          public.is_admin()
          AND auth.jwt() ->> 'aal' = 'aal2'
        )
      )
  )
);

-- Achievements
ALTER POLICY "Admins manage achievements"
ON public.achievements
USING (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'))
WITH CHECK (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'));

ALTER POLICY "Public can read published achievements"
ON public.achievements
USING (
  status = 'published'::public.content_status
  OR (
    public.is_admin()
    AND auth.jwt() ->> 'aal' = 'aal2'
  )
);

-- Contact messages
ALTER POLICY "Admins can delete contact messages"
ON public.contact_messages
USING (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'));

ALTER POLICY "Admins can read contact messages"
ON public.contact_messages
USING (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'));

ALTER POLICY "Admins can update contact messages"
ON public.contact_messages
USING (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'))
WITH CHECK (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'));

-- Interests
ALTER POLICY "Admins manage interests"
ON public.interests
USING (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'))
WITH CHECK (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'));

ALTER POLICY "Public can read published interests"
ON public.interests
USING (
  is_published
  OR (
    public.is_admin()
    AND auth.jwt() ->> 'aal' = 'aal2'
  )
);

-- Profiles
ALTER POLICY "Admins manage profiles"
ON public.profiles
USING (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'))
WITH CHECK (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'));

ALTER POLICY "Public can read visible profile"
ON public.profiles
USING (
  is_public
  OR (
    public.is_admin()
    AND auth.jwt() ->> 'aal' = 'aal2'
  )
);

-- Project images
ALTER POLICY "Admins manage project images"
ON public.project_images
USING (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'))
WITH CHECK (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'));

ALTER POLICY "Public can read images for visible projects"
ON public.project_images
USING (
  EXISTS (
    SELECT 1
    FROM public.projects
    WHERE projects.id = project_images.project_id
      AND (
        projects.status = 'published'::public.content_status
        OR (
          public.is_admin()
          AND auth.jwt() ->> 'aal' = 'aal2'
        )
      )
  )
);

-- Projects
ALTER POLICY "Admins manage projects"
ON public.projects
USING (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'))
WITH CHECK (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'));

ALTER POLICY "Public can read published projects"
ON public.projects
USING (
  status = 'published'::public.content_status
  OR (
    public.is_admin()
    AND auth.jwt() ->> 'aal' = 'aal2'
  )
);

-- Site settings
ALTER POLICY "Admins manage site settings"
ON public.site_settings
USING (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'))
WITH CHECK (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'));

ALTER POLICY "Public can read public site settings"
ON public.site_settings
USING (
  is_public
  OR (
    public.is_admin()
    AND auth.jwt() ->> 'aal' = 'aal2'
  )
);

-- Skills
ALTER POLICY "Admins manage skills"
ON public.skills
USING (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'))
WITH CHECK (public.is_admin() AND (auth.jwt() ->> 'aal' = 'aal2'));

ALTER POLICY "Public can read published skills"
ON public.skills
USING (
  is_published
  OR (
    public.is_admin()
    AND auth.jwt() ->> 'aal' = 'aal2'
  )
);
