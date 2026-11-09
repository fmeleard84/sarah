-- Mesure du test marché (décembre à février) :
--   A = visiteurs, B = visiteurs qui tirent une carte, C = visiteurs qui créent un compte.
-- Un visiteur est un navigateur (cookie mc_vid, un an), pas une personne.
-- Écrit et lu uniquement par le serveur (clé de service) : aucune politique RLS.

create table public.events (
  id            bigint generated always as identity primary key,
  visitor_id    uuid not null,
  user_id       uuid references auth.users(id) on delete set null,
  name          text not null check (name in ('visit', 'draw', 'signup')),
  path          text,
  referrer      text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  created_at    timestamptz not null default now()
);
create index events_name_created on public.events (name, created_at);
create index events_visitor on public.events (visitor_id, created_at);
alter table public.events enable row level security;

-- Source d'un visiteur : utm_source, sinon le domaine du référent, sinon « direct ».
create or replace function public.event_source(e public.events) returns text
language sql immutable as $$
  select coalesce(
    nullif(lower(e.utm_source), ''),
    nullif(regexp_replace(lower(coalesce(e.referrer, '')), '^https?://(www\.)?([^/:]+).*$', '\2'), ''),
    'direct'
  );
$$;

-- A, B, C depuis une date, ventilés par source (celle de la première visite de la période).
create or replace function public.funnel_by_source(since timestamptz)
returns table (source text, visitors bigint, drawers bigint, signups bigint)
language sql stable as $$
  with period as (
    select * from public.events where created_at >= since
  ),
  first_visit as (
    select distinct on (visitor_id) visitor_id, public.event_source(period) as source
    from period where name = 'visit'
    order by visitor_id, created_at
  ),
  visitors as (
    select distinct visitor_id from period
  )
  select
    coalesce(f.source, 'inconnue') as source,
    count(*) filter (where exists (select 1 from period p where p.visitor_id = v.visitor_id and p.name = 'visit')),
    count(*) filter (where exists (select 1 from period p where p.visitor_id = v.visitor_id and p.name = 'draw')),
    count(*) filter (where exists (select 1 from period p where p.visitor_id = v.visitor_id and p.name = 'signup'))
  from visitors v
  left join first_visit f using (visitor_id)
  group by 1
  order by 2 desc, 1;
$$;

-- A, B, C jour par jour (heure de Paris).
create or replace function public.funnel_daily(since timestamptz)
returns table (day date, visitors bigint, drawers bigint, signups bigint)
language sql stable as $$
  select
    (created_at at time zone 'Europe/Paris')::date as day,
    count(distinct visitor_id) filter (where name = 'visit'),
    count(distinct visitor_id) filter (where name = 'draw'),
    count(distinct visitor_id) filter (where name = 'signup')
  from public.events
  where created_at >= since
  group by 1
  order by 1 desc;
$$;

revoke all on function public.funnel_by_source(timestamptz) from public, anon, authenticated;
revoke all on function public.funnel_daily(timestamptz) from public, anon, authenticated;
grant execute on function public.funnel_by_source(timestamptz) to service_role;
grant execute on function public.funnel_daily(timestamptz) to service_role;
