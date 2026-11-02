/**
 * Parcours complet d'onboarding, en navigateur mobile :
 * bienvenue → deck → tirage (toucher maintenu) → conversation → 2 messages →
 * mur d'inscription → compte → carte supplémentaire → paywall.
 *
 *   node scripts/e2e-onboarding.mjs [url]   (captures dans /tmp/mc-e2e)
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire("/opt/card/package.json");
const { chromium, devices } = require("playwright");

const BASE = process.argv[2] ?? "https://morningcards.vaya.rip";
const OUT = process.env.OUT ?? "/tmp/mc-e2e";
mkdirSync(OUT, { recursive: true });
const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png` });
const step = (s) => console.log(`→ ${s}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("  [pageerror]", e.message));

step("bienvenue");
await page.goto(BASE);
await page.waitForURL(/bienvenue/);
await shot(page, "01-bienvenue");

step("choix du deck");
await page.locator("ul button").first().click();
await page.waitForTimeout(600);
await shot(page, "02-deck-sheet");
await page.getByRole("button", { name: /tirer avec ce deck/i }).click();
await page.waitForURL(/tirage/);
await page.waitForTimeout(800);
await shot(page, "03-tirage");

step("toucher maintenu sur la carte");
const card = page.locator(".tarot.relative.z-10");
const box = await card.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.waitForTimeout(700);
await shot(page, "04-revelation");
await page.waitForTimeout(1500);
await page.mouse.up();
await page.waitForTimeout(500);
await shot(page, "05-revelee");

step("révèle son message");
await page.getByRole("button", { name: /révèle son message/i }).click();
await page.waitForTimeout(400);
await shot(page, "06-transition");
await page.waitForURL(/\/c\//, { timeout: 10000 });

step("texte d'accueil de la carte");
await page.waitForSelector("p.display", { timeout: 60000 });
await page.waitForFunction(() => !document.querySelector("svg g[style*='picto']"), null, { timeout: 60000 });
await page.waitForTimeout(4000);
await shot(page, "07-conversation");

for (const [i, msg] of ["J'ai du mal à me décider pour un nouveau travail, je tourne en rond.", "Oui, j'ai peur de quitter ce que je connais."].entries()) {
  step(`message ${i + 1}`);
  await page.locator("textarea").fill(msg);
  await page.getByRole("button", { name: "Envoyer" }).click();
  await page.waitForTimeout(1000);
  await page.waitForFunction(() => document.querySelectorAll("main p.whitespace-pre-line").length > 0);
  await page.waitForTimeout(6000);
}
await shot(page, "08-mur");

step("inscription");
const email = `e2e-${Date.now()}@example.com`;
await page.getByPlaceholder("Prénom").fill("Camille");
await page.getByPlaceholder("Email").fill(email);
await page.getByPlaceholder("Mot de passe").fill("motdepasse-e2e");
await page.locator('input[type="date"]').fill("1996-04-12");
await page.locator('input[type="checkbox"]').check();
await page.getByRole("button", { name: "Continuer" }).click();
await page.waitForSelector("text=ton offre exploration est activée", { timeout: 15000 });
await shot(page, "09-offre");
await page.getByRole("button", { name: /reprendre ma conversation/i }).click();
await page.waitForTimeout(800);
await shot(page, "10-apres-inscription");

step("carte supplémentaire → paywall attendu (Exploration = 1 carte)");
await page.getByRole("button", { name: /tirer une carte/i }).first().click();
await page.waitForTimeout(600);
await shot(page, "11-choix-carte");
await page.locator('[role=dialog] button.tarot').nth(2).click();
await page.waitForSelector("text=va plus loin", { timeout: 10000 });
await page.waitForTimeout(600);
await shot(page, "12-paywall");

step("journal, decks, profil");
for (const [path, name] of [["/journal", "13-journal"], ["/decks", "14-decks"], ["/decks/kort", "15-deck"], ["/decks/kort/17", "16-carte"], ["/moi", "17-moi"], ["/tirage", "18-accueil-quota"]]) {
  await page.goto(BASE + path);
  await page.waitForTimeout(1200);
  await shot(page, name);
}

console.log(`OK — compte de test ${email}, captures dans ${OUT}`);
await browser.close();
