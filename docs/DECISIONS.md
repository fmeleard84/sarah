# Morning Cards V1 : arbitrages à valider par Sarah

Points contradictoires ou non tranchés dans les documents d'origine. Chacun a reçu
une valeur par défaut pour avancer ; un seul endroit à modifier pour changer d'avis.

| Sujet | Contradiction dans les documents | Choix V1 | Où le changer |
|---|---|---|---|
| Durée Exploration | 5 jours (landing du 3 juillet) ou 7 jours (bandeau de l'accueil du 8 juillet) | 5 jours | `web/src/lib/plans.ts` |
| Contenu Exploration | Landing : « tous les decks premium et ton deck perso ». Définition produit : 9 decks, pas de deck perso | Decks ouverts uniquement, pas de deck perso | `plans.ts` + colonne `decks.is_open` |
| Crédits | 50/150/450 crédits par mois, ou 1 carte = 50 échanges, ou des crédits journaliers… | Quota de conversations par jour ou par semaine + cartes max par conversation. Pas de limite de messages (Francis, 5 novembre) : le LLM tourne sur nos serveurs, le modèle reçoit les 60 derniers messages | `plans.ts` |
| Ritual et le tirage à 5 cartes | Ritual : « 3 cartes par tirage » | Ritual : tirages à 1 ou 3 cartes ; 5 cartes réservé à Clarity | `plans.ts` |
| Design system | Mémoire (coins de 14 à 16 px, boutons pilule, retournement de carte) contre les règles de juillet (CTA à 0 px, révélation au toucher) | Règles les plus récentes : brief landing du 23 juin + recette de juillet | `web/src/app/globals.css` |
| Mur d'inscription | « au 3e message de l'IA » | Validé par Sarah le 4 novembre : à l'envoi du 3e message de l'utilisatrice, les deux premières réponses étant lues en entier. Le message part une fois le compte créé | `ANONYMOUS_USER_MESSAGES` dans `plans.ts` |
| Noms anglais des arcanes | Rider-Waite dans les prompts, Marseille dans la liste du 7 juillet | Liste Marseille (The Juggler, Fortitude, The House of God…) | `scripts/import-decks.py` |
| Description de Chronique | Cite Bridgerton (marque déposée) | Mention retirée | `scripts/import-decks.py` |

## Décisions du 5 novembre (Francis, sans attendre le retour de Sarah)
| Sujet | Choix | Où le changer |
|---|---|---|
| Fin de conversation | L'IA ne ferme jamais. Après une conclusion, une relance sur un nouveau sujet appelle une nouvelle carte, et la personne peut continuer sans tirer | Règle 5 dans `web/src/lib/prompt.ts` |
| Identité | Galerie : typographies, cartels et filets. Conservés d'après Sarah : le bleu d'origine, la structure de la home, le prénom, pas de flèche. Fond papier actuel conservé | `web/src/app/globals.css` |
| Mode sombre | Clair par défaut, Sombre ou Auto dans Réglages (cookie `mc_theme`) | `web/src/lib/theme.ts` |
| My Deck | Une version par arcane, 22 cartes. Composition ouverte à tous, tirage réservé à Ritual et Clarity, deck complet exigé | `web/src/lib/mydeck.ts` |
| Paiement | Stripe Checkout, prix créés à la volée depuis `plans.ts`, TVA non gérée à ce stade | `web/src/app/api/checkout/route.ts` |

## Décisions du 9 novembre (Francis) : landing, Magazine et mesure
Source : brief dev de Sarah (doc Claude « Morning Cards · Brief dev », maquettes Claude Design du 6 novembre).
| Sujet | Choix | Où le changer |
|---|---|---|
| Appel à l'action de la landing | Tirage direct : les CTA mènent au premier tirage (`/bienvenue`), pas à une liste d'attente. Le statut « early adopter » devient l'avantage de l'inscription | Landing (à venir) |
| Intégration | Landing et Magazine dans l'app Next existante (même domaine, tokens, mesure, Brevo), pas de site statique séparé | `web/src/app` |
| Article Hilma af Klint | Non repris : son encart (exposition au Grand Palais jusqu'au 30 août 2026) n'est plus à jour | Magazine (à venir) |
| Témoignages (Clara, Emma, Léa) | Réels, conservés | Landing (à venir) |
| Offre des 100 premières | Les 100 premiers comptes créés reçoivent Early adopter : droits de Clarity pendant 7 jours, puis Intention. Ensuite, Exploration. Place réservée à l'inscription (table `early_adopters`), libérée si le compte est supprimé | `EARLY_ADOPTER_SPOTS` et `PLANS.early` dans `plans.ts` |
| Mesure du test marché | A = visiteurs, B = visiteurs qui tirent, C = comptes créés. Cookie `mc_vid`, admin et recette exclus | `web/src/lib/track.ts`, `/admin/mesure` |

| Photos de la landing | Les originaux de Sarah (`source/Mc_Dev&Decks/Mc_Landing Page/Images LP`), convertis en WebP dans `web/public/lp`. Les écrans de téléphone sont recréés en HTML avec les vraies cartes (deck Cut, Les Amoureux) ; le fond de « L'art du tirage » est une carte Egon floutée | `web/src/components/landing` |
| Textes de la landing | Ceux des maquettes, sinon le fichier « TRADUCTIONS LANDING PAGE » (FAQ comprise). Modifiables dans l'admin (clés `landing.*`) | `i18n.ts` |
| Formulaires email des sections 04 et 10 | Remplacés par le CTA du tirage direct ; « Pas de spam… » devient « Tire ta première carte. Ton compte se crée ensuite » et la section 10 affiche les places restantes (« Encore 87 places sur 100 ») | `landing.*` dans `i18n.ts` |
| Adresse de la landing | `/` pour une première visite ; qui a déjà choisi un deck va à `/tirage`. `/?landing` la montre à tout le monde | `web/src/app/page.tsx` |
| Liens Magazine et Instagram | Magazine affiché dès qu'un article est publié ; Instagram dès que `INSTAGRAM_URL` est posé dans `.env.local` | `Landing.tsx` |
| Pages légales | Confidentialité, Mentions légales, Contact non affichées : il faut l'identité de l'éditeur (pas encore de société) | Footer de la landing |
| Magazine | Articles rédigés dans l'admin (`/admin/magazine`) : rubrique, dates, encart actu, corps en texte simple (« > » exergue, « ## » intertitre, images), deck lié. Aucun article publié pour l'instant | `articles`, `web/src/app/magazine` |
| Indexation | Landing et Magazine restent hors des moteurs sur la recette. Sur le domaine définitif : `SITE_INDEXABLE=1` et `NEXT_PUBLIC_SITE_URL` dans `.env.local` | `SITE_ROBOTS` dans `magazine.ts` |
| Mesure des CTA | Chaque clic « early adopter » est compté par emplacement (événement `cta`), visible dans `/admin/mesure` | `track.ts` |


## DA de Sarah du 9 novembre (home, chat, journal), intégrée le 10 novembre

Appliqué tel que spécifié dans son handoff Claude Design. Arbitrages pris là où les specs ne tranchaient pas :
- **Geste** : un toucher simple sur la carte (le maintien de 1,2 s disparaît), comme dans les maquettes.
- **Tirages 3 et 5 cartes** : plus de sélecteur sur la home (specs). Les cartes suivantes se tirent dans le chat par « Tirer une carte », sans le choix parmi cinq cartes de dos. Les quotas de cartes par conversation (`plans.ts`) s'appliquent toujours.
- **Menu** : la pill actuelle reste ; invisible à l'arrivée sur la home, elle apparaît après le tirage ou au bout de 4 secondes, pour ne jamais enfermer la personne.
- **Couleurs d'arche** : suggérées automatiquement pour les 132 cartes, sauf trois réglées d'après les maquettes (Le Pendu de Chronique #9DB4C6 à 0,36 ; La Tempérance et L'Étoile d'Egon). Chronique, deck sépia, donne des arches beiges : à revoir à la main dans l'admin si Sarah veut plus de couleur.
- **En-tête du chat, plusieurs cartes** : « Nº 14 · 2 CARTES CE MATIN » devient « cet après-midi » ou « ce soir » selon l'heure du tirage, et seulement le nombre de cartes pour un tirage d'un autre jour.
- **Mode sombre** : l'arche mélange la couleur de la carte au bleu marine au lieu du faux blanc.
- **Écran de transition** (« un geste. un insight. » sur fond ardoise) : retiré, « Révéler le message. » ouvre directement le chat.

## Hors V1 (prévu ensuite)
- WhatsApp (offre Exploration par numéro de téléphone), notifications : V1.1.
- Cadeaux, partage sur les réseaux, filtres de la bibliothèque, magazine. Dans le profil : FAQ, CGV, WhatsApp.
- Connexion Google et Apple : prête côté Supabase (`GOOGLE_ENABLED` dans `/opt/supabase/morningcards/.env`), il manque les identifiants OAuth.
- 3 decks complets mais pas encore au « Format Final » (Synopsis, Ghosts, Codex) : à sélectionner et exporter, 22 cartes chacun, puis à importer avec `scripts/import-decks.py`.
- Version PWA : temps 2.
