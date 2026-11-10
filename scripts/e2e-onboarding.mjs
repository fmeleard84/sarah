/**
 * Parcours complet d'onboarding, en navigateur mobile :
 * bienvenue → deck → tirage (toucher maintenu) → conversation → 2 messages lus
 * en entier → 3e message → mur d'inscription → compte → réponse au 3e message →
 * carte supplémentaire → paywall, puis contrôle de chaque écran à 360 px.
 *
 *   node scripts/e2e-onboarding.mjs [url]   (captures dans /tmp/mc-e2e)
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
const require = createRequire("/opt/card/package.json");
const { chromium, devices } = require("playwright");

const BASE = process.argv[2] ?? "https://morningcards.vaya.rip";
const OUT = process.env.OUT ?? "/tmp/mc-e2e";
mkdirSync(OUT, { recursive: true });
const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png` });
const step = (s) => console.log(`→ ${s}`);
const sql = (q) => execFileSync("docker", ["exec", "-i", "morningcards-db-1", "psql", "-U", "postgres", "-tAc", q], { encoding: "utf8" }).trim();
const failures = [];
const check = (ok, label) => {
  console.log(`  ${ok ? "ok " : "ÉCHEC"} ${label}`);
  if (!ok) failures.push(label);
};
const PICTO = "main svg g[style*='picto']";

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
// La recette ne compte pas dans la mesure A/B/C (voir web/src/lib/track.ts).
if (!process.env.E2E_TRACK) await ctx.addCookies([{ name: "mc_notrack", value: "1", url: BASE }]);
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("  [pageerror]", e.message));

step("bienvenue");
await page.goto(BASE);
// Première visite : la landing, dont le CTA mène au premier tirage.
await page.locator('[data-cta="hero"]').click();
await page.waitForURL(/bienvenue/);
await shot(page, "01-bienvenue");

step("choix du deck");
await page.locator("ul button").first().click();
await page.waitForTimeout(600);
await shot(page, "02-deck-sheet");
const deckName = (await page.locator("[role=dialog]").first().innerText()).split("\n").find((l) => l.trim().length > 1)?.trim() ?? "";
console.log(`  deck : ${deckName}`);
await page.getByRole("button", { name: /tirer avec ce deck/i }).click();
await page.waitForURL(/tirage/);
await page.waitForTimeout(800);
await shot(page, "03-tirage");

step("toucher la carte : apparition, l'arche prend la couleur de la carte");
const arch = page.locator("main div[aria-hidden=true]").first();
const archBefore = await arch.evaluate((e) => getComputedStyle(e).backgroundColor);
await page.getByRole("button", { name: /tirer la carte/i }).click({ force: true }); // la carte flotte
await page.waitForTimeout(900);
await shot(page, "04-revelation");
await page.waitForTimeout(1800);
await shot(page, "05-revelee");
const archAfter = await arch.evaluate((e) => getComputedStyle(e).backgroundColor);
console.log(`  arche : ${archBefore} → ${archAfter}`);

step("révéler le message");
await page.getByRole("button", { name: /révéler le message/i }).click();
await page.waitForURL(/\/c\//, { timeout: 10000 });

step("texte d'accueil de la carte");
await page.waitForSelector("p[data-role=reveal]", { timeout: 60000 });
await page.waitForFunction((s) => !document.querySelector(s), PICTO, { timeout: 90000 });
await page.waitForTimeout(1000);
await shot(page, "07-conversation");
const intro = await page.locator("main p[data-role=reveal]").first().innerText();
console.log(`  accueil : ${intro}`);
check(!/\bdeck\b/i.test(intro) && (!deckName || !intro.toLowerCase().includes(deckName.toLowerCase())), "l'accueil ne parle pas du deck");

const LONG = "J'ai du mal à me décider pour un nouveau travail, je tourne en rond depuis des semaines. Raconte-moi longuement ce que cette carte éclaire pour moi, avec plusieurs idées.";
for (const [i, msg] of [LONG, "Oui, j'ai peur de quitter ce que je connais."].entries()) {
  step(`message ${i + 1}`);
  await page.locator("textarea").fill(msg);
  await page.getByRole("button", { name: "Envoyer" }).click();

  // Le picto reste visible sous le texte pendant que la réponse s'écrit.
  const both = await page
    .waitForFunction(
      (s) => {
        const g = document.querySelector(s);
        const p = [...(g?.closest("[data-role=streaming]")?.querySelectorAll("p") ?? [])].pop();
        return Boolean(g && p && p.textContent.length > 20 && p.getBoundingClientRect().bottom <= g.getBoundingClientRect().top + 1);
      },
      PICTO,
      { timeout: 90000, polling: 50 },
    )
    .then(() => true, () => false);
  check(both, "picto visible sous le texte pendant l'écriture");
  await shot(page, `07-ecriture-${i + 1}`);
  await page.waitForTimeout(700);
  const during = await page.evaluate(() => document.querySelector("main").scrollTop);
  await page.waitForFunction((s) => !document.querySelector(s), PICTO, { timeout: 120000 });
  await page.waitForTimeout(1500);
  const pos = await page.evaluate(() => {
    const main = document.querySelector("main");
    const mine = [...main.querySelectorAll("[data-role=user]")].pop();
    return { scrollTop: main.scrollTop, offset: mine.getBoundingClientRect().top - main.getBoundingClientRect().top };
  });
  check(Math.abs(pos.scrollTop - during) <= 2, `pas de saut à la fin de la réponse (${during} puis ${pos.scrollTop})`);
  // L'en-tête replié (70 px) recouvre le haut du fil : le tour commence juste dessous.
  check(pos.offset >= 60 && pos.offset < 140, `début du tour ancré sous l'en-tête replié (${Math.round(pos.offset)} px)`);
  await shot(page, `08-reponse-${i + 1}`);
}

step("3e message : le mur arrive à l'envoi, pas avant");
check((await page.locator("[class*=blur]").count()) === 0, "aucune réponse floutée");
check(await page.locator('[role=dialog] input[type="email"]').evaluate((e) => e.closest('[aria-hidden="true"]') !== null), "pas de mur avant le 3e message");
const third = "Tu penses que je devrais en parler à quelqu'un de proche ?";
await page.locator("textarea").fill(third);
await page.getByRole("button", { name: "Envoyer" }).click();
await page.waitForTimeout(900);
await shot(page, "08-mur");
await page.getByPlaceholder("Prénom").waitFor({ state: "visible", timeout: 5000 });

step("inscription");
const email = `e2e-${Date.now()}@example.com`;
await page.getByPlaceholder("Prénom").fill("Camille");
await page.getByPlaceholder("Email").fill(email);
await page.getByPlaceholder("Mot de passe").fill("motdepasse-e2e");
await page.locator('input[type="date"]').fill("1996-04-12");
await page.locator('input[type="checkbox"]').check();
await page.getByRole("button", { name: "Continuer" }).click();
// Les cent premiers comptes reçoivent Early adopter, les suivants Exploration.
const offerTitle = page.locator("div[aria-hidden=false] [role=dialog]").getByText(/tu fais partie des cent premières|ton offre exploration est activée/);
await offerTitle.waitFor({ state: "visible", timeout: 15000 });
const early = /cent premières/.test(await offerTitle.innerText());
console.log(`  offre : ${early ? "Early adopter" : "Exploration"}`);
await shot(page, "09-offre");
await page.getByRole("button", { name: /reprendre ma conversation/i }).click();
await page.waitForFunction(
  () => document.querySelectorAll("[data-role=assistant]").length >= 3 && !document.querySelector("main svg g[style*='picto']") && !/Réessayer/i.test(document.querySelector("main").innerText),
  null,
  { timeout: 120000, polling: 500 },
).catch(() => {});
await page.waitForTimeout(2500);
await shot(page, "10-apres-inscription");
const state = await page.evaluate(async () => {
  const id = location.pathname.split("/").pop();
  return (await fetch(`/api/conversations/${id}`).then((r) => r.json())).messages;
});
const mine = state.filter((m) => m.role === "user" && m.content === third).length;
const last = state[state.length - 1];
check(mine === 1 && last.role === "assistant", "le 3e message part une seule fois et reçoit sa réponse après l'inscription");

if (early) {
  step("Early adopter : une carte supplémentaire est tirée sans paywall");
  await page.getByRole("button", { name: /tirer une carte/i }).first().click();
  await page.waitForFunction(() => document.querySelectorAll("main figure").length === 1, null, { timeout: 15000 }).catch(() => {});
  check(await page.locator("main figure").count() === 1, "deuxième carte ajoutée au fil (planche hors texte)");
  await page.waitForFunction(() => document.querySelectorAll("p[data-role=reveal]").length === 2, null, { timeout: 90000 }).catch(() => {});
  check(await page.locator("p[data-role=reveal]").count() === 2, "texte de la deuxième carte");
  await shot(page, "11-early-carte");
  // Pour vérifier le paywall, la suite repasse ce compte en Exploration.
  sql(`delete from early_adopters where user_id=(select id from auth.users where email='${email}'); update profiles set plan='exploration' where id=(select id from auth.users where email='${email}')`);
  await page.reload();
  await page.waitForTimeout(3000);
}

step("carte supplémentaire → paywall attendu (Exploration = 1 carte)");
await page.getByRole("button", { name: /tirer une carte/i }).first().click();
await page.waitForSelector("text=va plus loin", { timeout: 10000 });
await page.waitForTimeout(600);
await shot(page, "12-paywall");
await page.locator('[role=dialog] button:has-text("Choisir")').first().click();
await page.waitForTimeout(600);
const notice = page.locator("[role=dialog] p[role=status]").filter({ hasText: /bientôt|n'a pas pu/ });
check(await notice.count() === 1 && await notice.evaluate((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), "message du paiement visible à l'écran");
await shot(page, "12-paywall-bientot");

step("journal, decks, profil");
for (const [path, name] of [["/journal", "13-journal"], ["/decks", "14-decks"], ["/decks/kort", "15-deck"], ["/decks/kort/17", "16-carte"], ["/moi", "17-moi"], ["/tirage", "18-accueil-quota"]]) {
  await page.goto(BASE + path);
  await page.waitForTimeout(1200);
  await shot(page, name);
}

step("petit mobile : 360 px, aucun débordement");
await page.setViewportSize({ width: 360, height: 740 });
for (const path of ["/journal", "/decks", "/moi", "/offres", "/tirage"]) {
  await page.goto(BASE + path);
  await page.waitForTimeout(1000);
  if (path === "/journal") {
    await page.locator("li span.italic").first().evaluate((e) => (e.textContent = "Thème : un titre vraiment très long qui ne tient pas sur une seule ligne"));
  }
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  check(m.sw <= m.cw, `${path} sans débordement (${m.sw}/${m.cw})`);
  await shot(page, `20${path.replaceAll("/", "-")}-360`);
}
await page.goto(BASE + "/decks");
const tile = await page.locator("a .tarot").first().boundingBox();
check(tile.width > 150, `visuels de decks agrandis (${Math.round(tile.width)} px de large à 360 px)`);
const order = await page.locator("nav a").evaluateAll((l) => l.map((a) => a.getAttribute("href")));
check(order.join() === "/tirage,/journal,/decks,/moi", `ordre du menu : ${order.join(" ")}`);
const label = await page.locator("a .tarot").first().locator("xpath=../p").evaluate((e) => getComputedStyle(e).fontSize);
check(label === "12px", `nom du deck discret (${label})`);
await page.goto(BASE + "/moi");
await page.getByRole("tab", { name: "Réglages" }).click();
const a = await page.getByRole("button", { name: /voir les offres/i }).boundingBox();
const planName = await page.locator("section p.title").last().boundingBox();
check(Math.abs(a.y + a.height / 2 - (planName.y + planName.height / 2)) < 14, "« Voir les offres » aligné avec le nom de l'offre");
await shot(page, "21-moi-reglages");

await browser.close();
console.log(`compte de test ${email}, captures dans ${OUT}`);
if (failures.length) {
  console.log(`ÉCHECS (${failures.length}) :\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("OK");
