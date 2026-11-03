import { DICTS, flattenTexts } from "@/lib/i18n";
import { getTextOverrides } from "@/lib/texts";
import { TextsEditor, type TextRow } from "./TextsEditor";

export const dynamic = "force-dynamic";

/** Noms lisibles des rubriques du dictionnaire. */
const SECTIONS: Record<string, string> = {
  brand: "Marque",
  signature: "Marque",
  nav: "Barre de navigation",
  welcome: "Bienvenue et choix du deck",
  home: "Accueil et tirage",
  conv: "Conversation",
  wall: "Création de compte (après la 2e réponse)",
  auth: "Connexion et mot de passe",
  decks: "Bibliothèque des decks",
  journal: "Journal",
  me: "Profil",
  plans: "Offres",
  errors: "Erreurs",
};

export default async function AdminTexts() {
  const overrides = await getTextOverrides();
  const en = new Map(flattenTexts(DICTS.en));
  const rows: TextRow[] = flattenTexts(DICTS.fr).map(([key, fr]) => ({
    key,
    section: SECTIONS[key.split(".")[0]] ?? key.split(".")[0],
    defaults: { fr, en: en.get(key) ?? "" },
    current: { fr: overrides.fr[key] ?? fr, en: overrides.en[key] ?? en.get(key) ?? "" },
    modified: { fr: key in overrides.fr, en: key in overrides.en },
  }));

  return (
    <>
      <h1 className="display text-[44px]">textes et traductions.</h1>
      <p className="mt-2 max-w-[72ch] text-[14px] text-ink-2">
        Tous les textes fixes de l&apos;application. Une modification s&apos;affiche dès l&apos;enregistrement, pour toutes les utilisatrices.
        « Rétablir » remet le texte d&apos;origine. Les textes qui contiennent une variable (prénom, nombre de jours…) restent dans le code :
        demande-les au développeur. Rappel des règles : jamais de tiret cadratin, pas d&apos;emoji, titres sans majuscule.
      </p>
      <TextsEditor rows={rows} />
    </>
  );
}
