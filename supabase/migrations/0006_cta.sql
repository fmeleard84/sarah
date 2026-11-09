-- Clics sur les appels à l'action de la landing (brief de Sarah : mesurer chaque CTA
-- « early adopter »). path = emplacement du bouton (hero, bandeau, art, rejoindre).
alter table public.events drop constraint if exists events_name_check;
alter table public.events add constraint events_name_check check (name in ('visit', 'draw', 'signup', 'cta'));

create or replace function public.landing_ctas(since timestamptz)
returns table (place text, clicks bigint, visitors bigint)
language sql stable as $$
  select coalesce(path, 'inconnu'), count(*), count(distinct visitor_id)
  from public.events
  where name = 'cta' and created_at >= since
  group by 1
  order by 2 desc;
$$;
revoke execute on function public.landing_ctas(timestamptz) from public, anon, authenticated;
grant execute on function public.landing_ctas(timestamptz) to service_role;
