-- Paiement Stripe, deck personnalisé (My Deck) et profil complet.

alter table public.profiles
  add column stripe_customer_id      text unique,
  add column stripe_subscription_id  text,
  add column use_my_deck             boolean not null default false,
  -- Champs libres de « ton monde » (amour, travail, famille...), transmis à l'IA.
  add column world                   jsonb not null default '{}';

-- Une version choisie par arcane : un deck complet compte 22 cartes.
create table public.my_deck_cards (
  user_id     uuid not null references auth.users(id) on delete cascade,
  arcana      smallint not null references public.arcana(number),
  card_id     uuid not null references public.cards(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, arcana)
);
alter table public.my_deck_cards enable row level security;
create policy "son deck" on public.my_deck_cards for select using (auth.uid() = user_id);
grant select on public.my_deck_cards to authenticated;

-- Événements Stripe déjà traités : un webhook peut être rejoué.
create table public.stripe_events (
  id          text primary key,
  type        text not null,
  created_at  timestamptz not null default now()
);
alter table public.stripe_events enable row level security;
