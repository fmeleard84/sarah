import "server-only";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/admin";
import { DICTS, EDITABLE_KEYS, withOverrides, type Dict, type Locale, type TextOverrides } from "@/lib/i18n";

/** Textes modifiés depuis l'admin, lus une fois par requête. */
export const getTextOverrides = cache(async (): Promise<TextOverrides> => {
  const out: TextOverrides = { fr: {}, en: {} };
  const { data, error } = await createServiceClient().from("ui_texts").select("key, locale, value");
  if (error) return out; // la base indisponible ne doit pas casser l'affichage
  for (const row of data ?? []) {
    if (EDITABLE_KEYS.has(row.key) && (row.locale === "fr" || row.locale === "en")) out[row.locale as Locale][row.key] = row.value;
  }
  return out;
});

/** Dictionnaire d'une langue, textes de l'admin compris (composants serveur). */
export async function getDict(locale: Locale): Promise<Dict> {
  const o = await getTextOverrides();
  return withOverrides(DICTS[locale], o[locale]);
}
