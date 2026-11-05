# Morning Cards V1 : arbitrages à valider par Sarah

Points contradictoires ou non tranchés dans les documents d'origine. Chacun a reçu
une valeur par défaut pour avancer ; un seul endroit à modifier pour changer d'avis.

| Sujet | Contradiction dans les documents | Choix V1 | Où le changer |
|---|---|---|---|
| Durée Exploration | 5 jours (landing du 3 juillet) ou 7 jours (bandeau de l'accueil du 8 juillet) | 5 jours | `web/src/lib/plans.ts` |
| Contenu Exploration | Landing : « tous les decks premium et ton deck perso ». Définition produit : 9 decks, pas de deck perso | Decks ouverts uniquement, pas de deck perso | `plans.ts` + colonne `decks.is_open` |
| Crédits | 50/150/450 crédits par mois, ou 1 carte = 50 échanges, ou des crédits journaliers… | Quota de conversations par jour ou par semaine + cartes max par conversation, garde-fou de 50 messages par carte | `plans.ts` |
| Ritual et le tirage à 5 cartes | Ritual : « 3 cartes par tirage » | Ritual : tirages à 1 ou 3 cartes ; 5 cartes réservé à Clarity | `plans.ts` |
| Design system | Mémoire (coins de 14 à 16 px, boutons pilule, retournement de carte) contre les règles de juillet (CTA à 0 px, révélation au toucher) | Règles les plus récentes : brief landing du 23 juin + recette de juillet | `web/src/app/globals.css` |
| Mur d'inscription | « au 3e message de l'IA » | Validé par Sarah le 4 novembre : à l'envoi du 3e message de l'utilisatrice, les deux premières réponses étant lues en entier. Le message part une fois le compte créé | `ANONYMOUS_USER_MESSAGES` dans `plans.ts` |
| Noms anglais des arcanes | Rider-Waite dans les prompts, Marseille dans la liste du 7 juillet | Liste Marseille (The Juggler, Fortitude, The House of God…) | `scripts/import-decks.py` |
| Description de Chronique | Cite Bridgerton (marque déposée) | Mention retirée | `scripts/import-decks.py` |

## Hors V1 (prévu ensuite)
- Paiement : prestataire à choisir (Stripe par défaut). Le paywall est en place et affiche « bientôt » (`/api/checkout` renvoie 501).
- WhatsApp (offre Exploration par numéro de téléphone), notifications : V1.1.
- Deck personnalisé (My Deck), cadeaux, partage sur les réseaux, filtres de la bibliothèque, magazine.
- Connexion Google et Apple : prête côté Supabase (`GOOGLE_ENABLED` dans `/opt/supabase/morningcards/.env`), il manque les identifiants OAuth.
- 3 decks complets mais pas encore au « Format Final » (Synopsis, Ghosts, Codex) : à sélectionner et exporter, 22 cartes chacun, puis à importer avec `scripts/import-decks.py`.
- Version PWA : temps 2.
