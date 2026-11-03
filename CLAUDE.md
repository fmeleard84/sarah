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
- `web/src/app/admin/` : espace d'administration (`/admin`, réservé aux profils `is_admin`, 404 sinon). Decks et images des cartes (bucket Storage public `decks`), noms des arcanes, textes de l'interface (table `ui_texts`, qui surcharge `i18n.ts` clé par clé), offres des comptes. Traduction par le LLM.

## Infra (serveur partagé : ne rien casser)
- **Ne jamais modifier `/opt/traefik`.** L'app est exposée uniquement par les labels de son conteneur (`docker-compose.yml`).
- Supabase auto-hébergé : `/opt/supabase/morningcards` (conteneurs `morningcards-*`, Kong sur 127.0.0.1:8114, Studio en local seulement). Pas de route publique : l'app le sert sous `/sb` (réécriture dans `next.config.ts`).
- Auth : connexion anonyme pour l'onboarding sans compte, convertie à l'inscription (`/api/account/signup`). SMTP Brevo pour les emails d'auth.
- LLM : Gemma (vLLM, machine GPU Trooper) via `https://llm-dev.mamifute.fr/v1`, compatible OpenAI. Voir `/opt/traefik/TROOPER-ACCESS-RUNBOOK.md`.
- Emails transactionnels : API Brevo, expéditeur `bonjour@vaya.rip` (domaine authentifié). L'API refuse l'IPv6 du serveur : forcer l'IPv4.
- Secrets : `.env.local` (app) et `.env` (argument de build), jamais versionnés.

## Commandes
- Déployer : `docker compose build && docker compose up -d` (depuis /opt/sarah)
- Migrations : `node scripts/migrate.mjs`
- Recette : `node scripts/e2e-onboarding.mjs` (supprimer ensuite les comptes `e2e-%@example.com`)
- Dev local : `cd web && npm run dev` (port 3210, avec un `.env.local` dans web/)

## Règles produit et design
- Textes FR et EN dans `web/src/lib/i18n.ts` (valeurs par défaut ; l'admin peut les surcharger). Côté client `useDict(locale)`, côté serveur `await getDict(locale)`, jamais `DICTS` directement. Règles de casse en tête du fichier. Jamais de tiret cadratin, pas d'emoji.
- Offres et quotas : uniquement dans `web/src/lib/plans.ts` (côté serveur). Seul le serveur écrit tirages et messages (RLS en lecture seule).
- Prompt de l'IA : `web/src/lib/prompt.ts` (META-PROMPT de Sarah, version du 1er juin).
- Couleurs : canvas #FEFCFA, surface #FAF3EF, encre #2C2825, ardoise #558BBB (action), vieux rose #C16780 (une fois par écran), bronze #957E45 (cadre des cartes uniquement). CTA sans arrondi.
- Répondre à l'utilisateur en français.
