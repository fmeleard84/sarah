-- Offre des 100 premières (décision du 9 novembre) : les premiers comptes créés
-- reçoivent 7 jours d'Early adopter (droits de Clarity), puis Intention.
-- Le nombre de places vit dans web/src/lib/plans.ts (EARLY_ADOPTER_SPOTS).

alter type public.plan_id add value if not exists 'early';

-- Une ligne par place prise. Un compte supprimé (recette, RGPD) libère sa place.
create table public.early_adopters (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);
alter table public.early_adopters enable row level security;

-- Prend une place si elle existe encore. Verrou exclusif : deux inscriptions
-- simultanées ne peuvent pas prendre la 100e place toutes les deux.
create or replace function public.claim_early_spot(uid uuid, cap int) returns boolean
language plpgsql as $$
begin
  lock table public.early_adopters in exclusive mode;
  if exists (select 1 from public.early_adopters where user_id = uid) then
    return true;
  end if;
  if (select count(*) from public.early_adopters) >= cap then
    return false;
  end if;
  insert into public.early_adopters (user_id) values (uid);
  return true;
end;
$$;

revoke all on function public.claim_early_spot(uuid, int) from public, anon, authenticated;
grant execute on function public.claim_early_spot(uuid, int) to service_role;
