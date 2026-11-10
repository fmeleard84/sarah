-- Arche de la home (DA de Sarah du 9 novembre) : chaque carte a sa couleur,
-- prise dans l'image, mélangée au faux blanc selon une intensité.
-- Suggérée automatiquement (k-means, voir web/src/lib/archColor.ts), modifiable dans l'admin.
alter table public.cards
  add column arch_color text check (arch_color ~ '^#[0-9A-Fa-f]{6}$'),
  add column arch_intensity real not null default 0.30 check (arch_intensity between 0 and 0.6);
