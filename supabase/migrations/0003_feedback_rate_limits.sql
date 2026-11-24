
-- Shared rate limiting for public feedback submissions.
-- The raw visitor IP is never stored.

create schema if not exists private;

revoke all on schema private
from public, anon, authenticated;

create table if not exists private.feedback_rate_limits (
  key_hash text primary key
    check (key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null default 1
    check (request_count >= 1),
  updated_at timestamptz not null default now()
);

create index if not exists feedback_rate_limits_updated_idx
  on private.feedback_rate_limits (updated_at);

alter table private.feedback_rate_limits
  enable row level security;

revoke all privileges
on table private.feedback_rate_limits
from public, anon, authenticated;

-- Atomic rate-limit operation.
-- Only the server-side service_role can execute this function.
create or replace function public.consume_feedback_rate_limit(
  p_key_hash text,
  p_limit integer default 5,
  p_window_seconds integer default 600
)
returns table (
  allowed boolean,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_window_started_at timestamptz;
  v_now timestamptz := clock_timestamp();
begin
  if p_key_hash is null
     or p_key_hash !~ '^[0-9a-f]{64}$'
     or p_limit < 1
     or p_limit > 100
     or p_window_seconds < 1
     or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit parameters.';
  end if;

  insert into private.feedback_rate_limits as current_limit (
    key_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values (
    p_key_hash,
    v_now,
    1,
    v_now
  )
  on conflict (key_hash)
  do update set
    window_started_at = case
      when current_limit.window_started_at
        <= v_now - make_interval(secs => p_window_seconds)
      then v_now
      else current_limit.window_started_at
    end,
    request_count = case
      when current_limit.window_started_at
        <= v_now - make_interval(secs => p_window_seconds)
      then 1
      else least(current_limit.request_count + 1, p_limit + 1)
    end,
    updated_at = v_now
  returning
    current_limit.request_count,
    current_limit.window_started_at
  into
    v_count,
    v_window_started_at;

  return query
  select
    v_count <= p_limit,
    case
      when v_count <= p_limit then 0
      else greatest(
        1,
        ceil(
          extract(
            epoch from (
              v_window_started_at
              + make_interval(secs => p_window_seconds)
              - v_now
            )
          )
        )::integer
      )
    end;
end;
$$;

-- Do not expose this function to public visitors.
revoke all on function public.consume_feedback_rate_limit(
  text, integer, integer
) from public, anon, authenticated;

grant execute on function public.consume_feedback_rate_limit(
  text, integer, integer
) to service_role;
