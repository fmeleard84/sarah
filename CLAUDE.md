# Morning Cards

Application de tarot « post-mystique » : on tire 1, 3 ou 5 arcanes majeurs du Tarot
de Marseille dans un deck artistique, puis on discute avec une IA miroir. DG : Sarah.
Recette : https://morningcards.vaya.rip (mobile d'abord, web responsive, pas de PWA en V1).

## Arborescence
- `source/` : archives d'origine de Sarah (branding, decks, marketing). Lecture seule, non versionné.
- `assets/` : cartes, dos et logos extraits des archives. Non versionné.
- `web/` : application Next.js 16 (App Router, `src/proxy.ts` remplace le middleware), Tailwind 4.
- `supabase/migrations/` : schéma SQL, appliqué par `node scripts/migrate.mjs`.
- `scripts/import-decks.py` : importe les decks (images dans `web/public/decks`, lignes en base).
- `scripts/e2e-onboarding.mjs` : parcours complet en navigateur mobile (Playwright de /opt/card).
- `docs/DECISIONS.md` : arbitrages par défaut à faire valider par Sarah.
- `web/src/components/landing/` : landing de pré-lancement (brief de Sarah), servie sur `/` aux nouvelles visiteuses. Typographie propre (Cormorant Garamond, DM Sans), styles isolés sous `.lp`, photos dans `web/public/lp`.
- `web/src/app/magazine/` : Magazine et articles (table `articles`, rédaction dans `/admin/magazine`, images dans le bucket `magazine`).
- `web/src/app/admin/` : espace d'administration (`/admin`, réservé aux profils `is_admin`, 404 sinon). Decks et images des cartes (bucket Storage public `decks`), noms des arcanes, textes de l'interface (table `ui_texts`, qui surcharge `i18n.ts` clé par clé), offres des comptes. Traduction par le LLM.

## Infra (serveur partagé : ne rien casser)
- **Ne jamais modifier `/opt/traefik`.** L'app est exposée uniquement par les labels de son conteneur (`docker-compose.yml`).
- Supabase auto-hébergé : `/opt/supabase/morningcards` (conteneurs `morningcards-*`, Kong sur 127.0.0.1:8114, Studio en local seulement). Pas de route publique : l'app le sert sous `/sb` (réécriture dans `next.config.ts`).
- Auth : connexion anonyme pour l'onboarding sans compte, convertie à l'inscription (`/api/account/signup`). SMTP Brevo pour les emails d'auth.
- LLM : Gemma (vLLM, machine GPU Trooper) via `https://llm-dev.mamifute.fr/v1`, compatible OpenAI. Voir `/opt/traefik/TROOPER-ACCESS-RUNBOOK.md`.
- Paiement : Stripe (`web/src/lib/stripe.ts`). Sans `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` dans `.env.local`, le paywall affiche « bientôt ». Le plan et les crédits ne changent que par `/api/stripe/webhook`.
- Emails transactionnels : API Brevo, expéditeur `bonjour@vaya.rip` (domaine authentifié). L'API refuse l'IPv6 du serveur : forcer l'IPv4.
- Secrets : `.env.local` (app) et `.env` (argument de build), jamais versionnés.

## Commandes
- Déployer : `docker compose build && docker compose up -d` (depuis /opt/sarah)
- Migrations : `node scripts/migrate.mjs`
- Recette : `node scripts/e2e-onboarding.mjs` (supprimer ensuite les comptes `e2e-%@example.com`)
- Fonctions (Stripe, My Deck, sombre, profil) : `node scripts/e2e-features.mjs`, sur un serveur local avec des clés Stripe factices (voir l'en-tête du script)
- Dev local : `cd web && npm run dev` (port 3210, avec un `.env.local` dans web/). Le 3210 est pris sur ce serveur : utiliser `next dev -p 3211`.

## Règles produit et design
- Textes FR et EN dans `web/src/lib/i18n.ts` (valeurs par défaut ; l'admin peut les surcharger). Côté client `useDict(locale)`, côté serveur `await getDict(locale)`, jamais `DICTS` directement. Règles de casse en tête du fichier. Jamais de tiret cadratin, pas d'emoji.
- Offres et quotas : uniquement dans `web/src/lib/plans.ts` (côté serveur). Seul le serveur écrit tirages et messages (RLS en lecture seule).
- Prompt de l'IA : `web/src/lib/prompt.ts` (META-PROMPT de Sarah, version du 1er juin).
- DA de Sarah du 9 novembre (Galerie revue, handoff Claude Design « Home + chat » : https://claude.ai/artifact/JzwFXZNgb9EgUsjWrk2Cvi, itérations : https://claude.ai/artifact/3QNdGCF4JZm2vTeC2x3F9k) : Cormorant Garamond et DM Sans. Titres de page `.page-title` (Cormorant italique 40/44, minuscules, sans point), noms d'arcanes `.arcana` (capitales), CTA texte `.cta-text` (Cormorant italique 20 px, filet ardoise), ligne « Nº 12 · DECK X » `.meta`. Jamais de chiffres en Cormorant. Filets `.hair-b` / `.hair-t` en #E5DDD4.
- Arche : chaque carte a `arch_color` et `arch_intensity` (suggérées à l'envoi de l'image, réglables dans l'admin du deck, `node scripts/arch-colors.mjs` pour les cartes sans couleur). Affichage par `archMix` (`lib/arch.ts`) : couleur mélangée au fond. L'en-tête du chat garde la teinte de la première carte. Pas de sélecteur 1 / 3 / 5 : une carte sur la home, les suivantes par « Tirer une carte » dans le chat.
- Couleurs : canvas #FEFCFA (jamais de blanc pur), surface #FAF3EF, encre #2C2825, texte secondaire #5F5852, ardoise #558BBB (action), bronze #957E45 (cadre des cartes uniquement), pas de vieux rose sur les liens et CTA. CTA sans arrondi. Mode sombre bleu marine : tokens surchargés dans `globals.css`, jamais de couleur en dur.
- Menu : en refonte chez Sarah (menu contextuel) ; la pill actuelle reste, invisible à l'arrivée sur la home.
- Répondre à l'utilisateur en français.
