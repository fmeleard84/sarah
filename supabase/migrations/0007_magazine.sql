-- Magazine (brief de Sarah) : articles éditoriaux, rédigés dans l'admin.
-- Lecture publique des seuls articles publiés passée par le serveur (clé de service) :
-- aucune politique RLS, comme pour les autres tables écrites par l'admin.
create table public.articles (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  locale        text not null default 'fr' check (locale in ('fr', 'en')),
  rubric        text not null default 'Morning Sessions',
  title         text not null,
  excerpt       text not null default '',
  cover_path    text,
  cover_alt     text not null default '',
  news          text not null default '',
  body          text not null default '',
  deck_id       uuid references public.decks(id) on delete set null,
  is_published  boolean not null default false,
  published_at  date not null default current_date,
  updated_on    date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index articles_published on public.articles (is_published, published_at desc);
alter table public.articles enable row level security;
