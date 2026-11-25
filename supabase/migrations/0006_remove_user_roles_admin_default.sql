-- Prevent accidental administrator assignment
-- when inserting a user_roles record without an explicit role.

ALTER TABLE public.user_roles
ALTER COLUMN role DROP DEFAULT;