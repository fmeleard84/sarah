-- Images du Magazine (couvertures et images de corps), servies sous /sb comme les cartes.
insert into storage.buckets (id, name, public) values ('magazine', 'magazine', true) on conflict (id) do nothing;
