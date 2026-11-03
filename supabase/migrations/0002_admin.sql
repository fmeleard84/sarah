-- Espace d'administration : rôle admin, textes de l'interface modifiables,
-- stockage des images de cartes remplacées depuis l'admin.

-- Le rôle ne se pose que côté serveur (service_role) : la politique de
-- profiles n'autorise que la lecture de son propre profil.
alter table public.profiles add column is_admin boolean not null default false;

-- Textes de l'interface modifiés depuis l'admin. Les valeurs par défaut restent
-- dans web/src/lib/i18n.ts : une ligne ici remplace une clé (« home.hold »)
-- dans une langue. Supprimer la ligne rétablit le texte d'origine.
create table public.ui_texts (
  key         text not null,
  locale      text not null check (locale in ('fr', 'en')),
  value       text not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null,
  primary key (key, locale)
);

-- Lu et écrit uniquement par le serveur.
alter table public.ui_texts enable row level security;

-- Images des cartes envoyées depuis l'admin (les decks d'origine restent dans
-- web/public/decks). Bucket public : les cartes s'affichent sans session.
insert into storage.buckets (id, name, public)
values ('decks', 'decks', true)
on conflict (id) do update set public = true;
