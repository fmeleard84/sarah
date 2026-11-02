"""Importe les decks finalisés dans l'application et la base.

Source : assets/decks/<Deck N - Nom>/<… - NN - Arcane>.webp (extraits des
archives de Sarah, dossier « 2. Decks complets/Format Final »).

Sortie :
  web/public/decks/<slug>/<NN>.webp      carte pleine taille (848×1264)
  web/public/decks/<slug>/<NN>-sm.webp   vignette 360 px de large
  base : arcanes, decks et cartes (idempotent, upsert)

  python3 scripts/import-decks.py
"""

import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "decks"
OUT = ROOT / "web" / "public" / "decks"
DB = "morningcards-db-1"

# Noms anglais : tradition de Marseille validée par Sarah le 7 juillet
# (« Noms de arcanes en anglais.xlsx »), le reste suit l'usage courant.
ARCANA = [
    (0, "0", "Le Mat", "The Fool"),
    (1, "I", "Le Bateleur", "The Juggler"),
    (2, "II", "La Papesse", "The Popess"),
    (3, "III", "L'Impératrice", "The Empress"),
    (4, "IV", "L'Empereur", "The Emperor"),
    (5, "V", "Le Pape", "The Pope"),
    (6, "VI", "L'Amoureux", "The Lover"),
    (7, "VII", "Le Chariot", "The Chariot"),
    (8, "VIII", "La Justice", "Justice"),
    (9, "IX", "L'Hermite", "The Hermit"),
    (10, "X", "La Roue de Fortune", "The Wheel of Fortune"),
    (11, "XI", "La Force", "Fortitude"),
    (12, "XII", "Le Pendu", "The Hanged Man"),
    (13, "XIII", "L'Arcane sans nom", "The Unnamed Arcana"),
    (14, "XIV", "Tempérance", "Temperance"),
    (15, "XV", "Le Diable", "The Devil"),
    (16, "XVI", "La Maison Dieu", "The House of God"),
    (17, "XVII", "L'Étoile", "The Star"),
    (18, "XVIII", "La Lune", "The Moon"),
    (19, "XIX", "Le Soleil", "The Sun"),
    (20, "XX", "Le Jugement", "The Judgment"),
    (21, "XXI", "Le Monde", "The World"),
]

# Fiches du « Catalogue_Decks_Morning_Cards.xlsx ». La mention de Bridgerton
# (marque déposée) est retirée de la description de Chronique.
DECKS = {
    0: dict(
        slug="chronique", name="Chronique", cover=6, sort=1,
        styles=["Gravure", "Vintage", "Figuratif"], moods=["Introspectif"],
        fr="Un univers de secrets de cour et de chroniques de salon, très à propos quand les non-dits s'accumulent et que les jeux relationnels deviennent flous. Gravures nettes, drapés Empire, palette bleu azur et rose poudré du début du XIXe siècle. Puisant dans l'esthétique Regency, il évoque avec élégance les situations humaines les plus piquantes et complexes.",
        en="A world of court secrets and salon chronicles, strikingly relevant when things go unsaid and relationships turn into a game. Sharp engravings, Empire drapes, powder blue and blush pink from the early 19th century. Drawing from Regency aesthetics, it frames even the most complex human situations with elegance and wit.",
    ),
    3: dict(
        slug="hilma-micro", name="Hilma Micro", cover=17, sort=2, artist="Hilma af Klint",
        styles=["Peinture", "Abstrait", "Organique", "Coloré"], moods=["Joyeux", "Méditatif"],
        fr="Et si la réponse venait de l'intérieur ? Formes biomorphiques tourbillonnantes, courbes sans contours, matière dense et vivante. Tout droit venu de l'univers d'Hilma af Klint et de sa fascination pour le vivant invisible, une atmosphère où la beauté organique ouvre un espace de profondeur.",
        en="What if the answer came from within? Swirling biomorphic forms, borderless curves, dense and living matter. Straight from the world of Hilma af Klint and her fascination with the invisible forces of life, an atmosphere where organic beauty opens something deeper.",
    ),
    4: dict(
        slug="hilma-tourbillon", name="Hilma Tourbillon", cover=10, sort=3, artist="Hilma af Klint",
        styles=["Peinture", "Coloré", "Figuratif"], moods=["Joyeux", "Énergisant"],
        fr="Tout change, tout revient, tout se transforme. Figures stylisées, spirales omniprésentes, aplats organiques en perpétuel devenir. Dans l'esprit de la série « The Ten Largest » d'Hilma af Klint, une esthétique du mouvement et du cycle qui accompagne les périodes de transition avec fluidité.",
        en="Everything changes, returns, transforms. Stylised figures, ever-present spirals, organic shapes in perpetual motion. In the spirit of Hilma af Klint's \"The Ten Largest\" series, an aesthetic of movement and cycle that sits with periods of transition, fluidly.",
    ),
    7: dict(
        slug="kort", name="Kort", cover=2, sort=4,
        styles=["Graphique", "Sobre", "Figuratif"], moods=["Froid"],
        fr="Que tu sois maniaque ou que les idées s'emmêlent, ce deck met de l'ordre. Figures allongées, aplats de gris, vieux rose, vert sauge et mauve d'une rigueur absolue. Dans l'esprit du design scandinave contemporain, une esthétique qui suggère à chaque idée de trouver sa place.",
        en="Whether you're naturally methodical or your thoughts are tangled, this deck brings order. Elongated figures, flat washes of grey, dusty rose, sage and mauve of absolute precision. In the spirit of contemporary Scandinavian design, an aesthetic that nudges every idea into place.",
    ),
    12: dict(
        slug="cut", name="Cut", cover=6, sort=5,
        styles=["Collage", "Coloré", "Photo"], moods=["Énergisant"],
        fr="La beauté, comme ta vérité, peut être fragmentée, percutante, inattendue. Figures photographiques tranchées, blocs de couleurs pures et saturées qui bousculent ce qu'on croyait voir. Inspiré du dadaïsme et du graphisme de mode avant-gardiste, il déconstruit l'imagerie du tarot pour faire surgir ce qui était là, caché en pleine vue.",
        en="Beauty, like your truth, can be fragmented, striking, unexpected. Sharp photographic figures, blocks of pure saturated colour that disrupt what you thought you saw. Inspired by Dadaism and avant-garde fashion graphics, it deconstructs tarot imagery to bring out what was always there, hidden in plain sight.",
    ),
    13: dict(
        slug="egon", name="Egon", cover=0, sort=6, artist="Egon Schiele",
        styles=["Figuratif", "Coloré", "Dessin"], moods=["Intense"],
        fr="Quand l'esprit s'agite et cherche un miroir net, ce deck accompagne le tourbillon. Figures au trait nerveux, aplats de rose fuchsia, bleu et orange qui débordent des contours. Inspiré d'Egon Schiele et de l'illustration éditoriale contemporaine, il va à l'essentiel sans jamais s'excuser.",
        en="When the mind races and needs a clear mirror, this deck meets the chaos. Nervous line figures, flat washes of fuchsia, blue and orange spilling past their edges. Inspired by Egon Schiele and contemporary editorial illustration, it goes straight to the point, unapologetically.",
    ),
}


def q(v):
    """Littéral SQL."""
    if v is None:
        return "null"
    if isinstance(v, list):
        return "array[" + ",".join(q(x) for x in v) + "]::text[]" if v else "'{}'::text[]"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def main():
    sql = ["begin;"]
    for n, numeral, fr, en in ARCANA:
        sql.append(
            f"insert into arcana (number, numeral, name_fr, name_en) values ({n},{q(numeral)},{q(fr)},{q(en)}) "
            "on conflict (number) do update set numeral=excluded.numeral, name_fr=excluded.name_fr, name_en=excluded.name_en;"
        )

    for folder in sorted(SRC.iterdir()):
        m = re.match(r"Deck (\d+) - ", folder.name)
        if not m or int(m.group(1)) not in DECKS:
            print(f"  ignoré : {folder.name}", file=sys.stderr)
            continue
        num = int(m.group(1))
        d = DECKS[num]
        files = {}
        for f in folder.glob("*.webp"):
            a = re.search(r" - (\d{2}) - ", f.name)
            if a:
                files[int(a.group(1))] = f
        if sorted(files) != list(range(22)):
            sys.exit(f"{folder.name} : cartes manquantes {sorted(set(range(22)) - set(files))}")

        out = OUT / d["slug"]
        out.mkdir(parents=True, exist_ok=True)
        for n, f in files.items():
            img = Image.open(f).convert("RGB")
            img.save(out / f"{n:02d}.webp", "WEBP", quality=86, method=6)
            sm = img.copy()
            sm.thumbnail((360, 9999), Image.LANCZOS)
            sm.save(out / f"{n:02d}-sm.webp", "WEBP", quality=82, method=6)

        sql.append(
            "insert into decks (slug, number, name, description_fr, description_en, styles, moods, artist, cover_arcana, sort) values ("
            + ",".join(q(x) for x in [d["slug"], num, d["name"], d["fr"], d["en"], d["styles"], d["moods"], d.get("artist"), d["cover"], d["sort"]])
            + ") on conflict (slug) do update set name=excluded.name, description_fr=excluded.description_fr, description_en=excluded.description_en,"
            " styles=excluded.styles, moods=excluded.moods, artist=excluded.artist, cover_arcana=excluded.cover_arcana, sort=excluded.sort;"
        )
        for n in range(22):
            sql.append(
                f"insert into cards (deck_id, arcana, image_path) select id, {n}, {q(f'/decks/{d['slug']}/{n:02d}')} from decks where slug={q(d['slug'])} "
                "on conflict (deck_id, arcana) do update set image_path=excluded.image_path;"
            )
        print(f"  ✓ {d['name']} — 22 cartes")

    sql.append("commit;")
    subprocess.run(
        ["docker", "exec", "-i", DB, "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-q"],
        input="\n".join(sql), text=True, check=True,
    )
    print("Base à jour.")


if __name__ == "__main__":
    main()
