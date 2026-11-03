"use client";

import { createContext, useContext, useMemo } from "react";
import { DICTS, NO_OVERRIDES, withOverrides, type Dict, type Locale, type TextOverrides } from "@/lib/i18n";

const Ctx = createContext<TextOverrides>(NO_OVERRIDES);

/** Transmet aux composants client les textes modifiés depuis l'admin. */
export function I18nProvider({ overrides, children }: { overrides: TextOverrides; children: React.ReactNode }) {
  return <Ctx.Provider value={overrides}>{children}</Ctx.Provider>;
}

/** Les deux dictionnaires, textes de l'admin compris. */
export function useDicts(): Record<Locale, Dict> {
  const o = useContext(Ctx);
  return useMemo(() => ({ fr: withOverrides(DICTS.fr, o.fr), en: withOverrides(DICTS.en, o.en) }), [o]);
}

export function useDict(locale: Locale): Dict {
  return useDicts()[locale];
}
