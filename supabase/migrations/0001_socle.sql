-- Socle Morning Cards : arcanes, decks, cartes, profils, conversations.
--
-- Les règles d'accès aux offres (combien de tirages, combien de cartes) ne sont
-- pas ici : elles vivent dans l'application (web/src/lib/plans.ts), qui est la
-- seule à écrire les tirages. La base garantit seulement que chacun ne voit que
-- ses propres données.

-- ─── Référentiel ────────────────────────────────────────────────────────────

-- Les 22 Arcanes majeurs du Tarot de Marseille. Les noms anglais suivent la
-- tradition de Marseille validée par Sarah (The Juggler, Fortitude, The House of
-- God…), pas le Rider-Waite.
create table public.arcana (
  number      smallint primary key check (number between 0 and 21),
  numeral     text not null,
  name_fr     text not null,
  name_en     text not null,
  keywords_fr text[] not null default '{}',
  keywords_en text[] not null default '{}'
);

create table public.decks (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  number          smallint not null unique,
  name            text not null,
  description_fr  text not null default '',
  description_en  text not null default '',
  styles          text[] not null default '{}',
  moods           text[] not null default '{}',
  artist          text,
  cover_arcana    smallint not null default 0 references public.arcana(number),
  -- Ouvert pendant l'onboarding et sur les offres gratuites (Exploration, Intention).
  is_open         boolean not null default true,
  is_published    boolean not null default true,
  sort            smallint not null default 0,
  created_at      timestamptz not null default now()
);

create table public.cards (
  id          uuid primary key default gen_random_uuid(),
  deck_id     uuid not null references public.decks(id) on delete cascade,
  arcana      smallint not null references public.arcana(number),
  image_path  text not null,
  unique (deck_id, arcana)
);

-- ─── Utilisatrices ──────────────────────────────────────────────────────────

create type public.plan_id as enum ('exploration', 'intention', 'ritual', 'clarity');

create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  first_name          text,
  birthdate           date,
  locale              text not null default 'fr' check (locale in ('fr', 'en')),
  main_deck_id        uuid references public.decks(id) on delete set null,
  plan                public.plan_id not null default 'exploration',
  plan_started_at     timestamptz not null default now(),
  -- Cartes achetées à l'unité ou en pack, consommées avant le quota de l'offre.
  extra_cards         integer not null default 0 check (extra_cards >= 0),
  onboarded_at        timestamptz,
  notify_email        boolean not null default true,
  created_at          timestamptz not null default now()
);

-- Un profil est créé pour chaque compte, y compris anonyme (onboarding sans compte).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Conversations ──────────────────────────────────────────────────────────

-- Chaque tirage ouvre une conversation séparée ; on peut y tirer d'autres cartes.
create table public.conversations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  deck_id      uuid references public.decks(id) on delete set null,
  spread_size  smallint not null default 1 check (spread_size in (1, 3, 5)),
  title        text,
  favorite     boolean not null default false,
  -- Résumé structuré produit par l'IA (préoccupations, ton, insight clé…),
  -- réinjecté comme mémoire dans les conversations suivantes.
  summary      jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index conversations_user_idx on public.conversations (user_id, created_at desc);

create table public.conversation_cards (
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  position         smallint not null,
  card_id          uuid not null references public.cards(id),
  -- Carte comprise dans le tirage initial, ou tirée en cours de conversation.
  is_extra         boolean not null default false,
  drawn_at         timestamptz not null default now(),
  primary key (conversation_id, position)
);

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  role             text not null check (role in ('user', 'assistant')),
  -- 'reveal' : texte d'accueil d'une carte (affiché en Cormorant italique).
  kind             text not null default 'text' check (kind in ('text', 'reveal')),
  card_position    smallint,
  content          text not null,
  created_at       timestamptz not null default now()
);
create index messages_conv_idx on public.messages (conversation_id, created_at);

-- ─── Sécurité ───────────────────────────────────────────────────────────────

alter table public.arcana enable row level security;
alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_cards enable row level security;
alter table public.messages enable row level security;

create policy "référentiel lisible" on public.arcana for select using (true);
create policy "decks publiés lisibles" on public.decks for select using (is_published);
create policy "cartes lisibles" on public.cards for select using (true);

-- Le plan et les crédits ne se modifient que côté serveur (service_role).
create policy "son profil" on public.profiles for select using (auth.uid() = id);

create policy "ses conversations" on public.conversations for select using (auth.uid() = user_id);
create policy "ses cartes tirées" on public.conversation_cards for select using (
  exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
);
create policy "ses messages" on public.messages for select using (
  exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
);

grant select on public.arcana, public.decks, public.cards to anon, authenticated;
grant select on public.profiles, public.conversations, public.conversation_cards, public.messages to authenticated;
