/**
 * Contrôle des fonctions au-delà de l'onboarding : webhooks Stripe signés,
 * My Deck, mode sombre, profil, relance par une nouvelle carte.
 *
 * À lancer sur un serveur local démarré avec STRIPE_SECRET_KEY=sk_test_local et
 * STRIPE_WEBHOOK_SECRET=whsec_local (aucun appel à Stripe : les événements sont
 * fabriqués et signés ici) :
 *
 *   node scripts/e2e-features.mjs http://127.0.0.1:3211
 */
import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire("/opt/card/package.json");
const { chromium, devices } = require("playwright");

const BASE = process.argv[2] ?? "http://127.0.0.1:3211";
const OUT = process.env.OUT ?? "/tmp/mc-e2e-features";
const SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_local";
mkdirSync(OUT, { recursive: true });

const failures = [];
const check = (ok, label) => {
  console.log(`  ${ok ? "ok " : "ÉCHEC"} ${label}`);
  if (!ok) failures.push(label);
};
const step = (s) => console.log(`→ ${s}`);
const sql = (q) => execFileSync("docker", ["exec", "-i", "morningcards-db-1", "psql", "-U", "postgres", "-tAc", q], { encoding: "utf8" }).trim();

async function webhook(event, secret = SECRET) {
  const body = JSON.stringify({ object: "event", api_version: "2024-01-01", created: Math.floor(Date.now() / 1000), livemode: false, ...event });
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  return fetch(`${BASE}/api/stripe/webhook`, { method: "POST", headers: { "stripe-signature": `t=${t},v1=${v1}`, "Content-Type": "application/json" }, body });
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
// La recette ne compte pas dans la mesure A/B/C (voir web/src/lib/track.ts).
if (!process.env.E2E_TRACK) await ctx.addCookies([{ name: "mc_notrack", value: "1", url: BASE }]);
const page = await ctx.newPage();
page.on("pageerror", (e) => check(false, `erreur de page : ${e.message}`));
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
const api = (path, method, body) =>
  page.evaluate(
    async ({ path, method, body }) => {
      const r = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
      return { status: r.status, body: await r.json().catch(() => null) };
    },
    { path, method, body },
  );

step("compte de test");
await page.goto(BASE);
// Première visite : la landing, dont le CTA mène au premier tirage.
await page.locator('[data-cta="hero"]').click();
await page.waitForURL(/bienvenue/);
await page.locator("ul button").first().click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: /tirer avec ce deck/i }).click();
await page.waitForURL(/tirage/);
const email = `e2e-${Date.now()}@example.com`;
const signup = await api("/api/account/signup", "POST", { email, password: "motdepasse-e2e", firstName: "Camille", birthdate: "1996-04-12", consent: true, locale: "fr" });
check(signup.status === 200, "inscription");
const uid = sql(`select id from auth.users where email='${email}'`);
check(["early", "exploration"].includes(signup.body?.plan), `offre de départ : ${signup.body?.plan}`);
// La suite teste les règles de l'offre gratuite ordinaire : on libère la place des cent premières.
sql(`delete from early_adopters where user_id='${uid}'; update profiles set plan='exploration' where id='${uid}'`);

step("My Deck : réservé à Ritual et Clarity pour le tirage");
check((await api("/api/profile", "PATCH", { useMyDeck: true })).status === 402, "offre gratuite : tirage avec son deck refusé");

step("webhooks Stripe");
const stamp = Date.now();
const session = (id, item) => ({ id, type: "checkout.session.completed", data: { object: { object: "checkout.session", metadata: { user_id: uid, item }, customer: `cus_${stamp}`, subscription: item === "ritual" ? `sub_${stamp}` : null } } });
check((await webhook(session(`evt_${stamp}_bad`, "ritual"), "whsec_faux")).status === 400, "signature fausse refusée");
check(sql(`select plan from profiles where id='${uid}'`) === "exploration", "offre inchangée après une signature fausse");
check((await webhook(session(`evt_${stamp}_pack`, "pack3"))).status === 200, "pack de 3 cartes accepté");
check((await webhook(session(`evt_${stamp}_pack`, "pack3"))).status === 200, "événement rejoué accepté");
check(sql(`select extra_cards from profiles where id='${uid}'`) === "3", "pack crédité une seule fois malgré le rejeu");
await webhook(session(`evt_${stamp}_sub`, "ritual"));
check(sql(`select plan from profiles where id='${uid}'`) === "ritual", "abonnement Ritual activé");

step("My Deck : composition");
await page.goto(`${BASE}/decks`);
await page.getByRole("link", { name: /mon deck/i }).click();
await page.waitForURL(/mon-deck/);
await page.waitForTimeout(800);
const slots = page.locator("main li > button, ul.grid > li > button");
check((await slots.count()) === 22, "22 emplacements");
await page.getByRole("button", { name: "Tirer avec mon deck" }).click();
await page.waitForTimeout(400);
check(sql(`select use_my_deck from profiles where id='${uid}'`) === "f", "deck incomplet : tirage refusé");
await slots.first().click();
await page.waitForTimeout(600);
await shot("30-choix-version");
const versions = await page.locator('[role=dialog] [aria-pressed]').count();
check(versions >= 2, `choix entre ${versions} versions`);
await page.locator('[role=dialog] [aria-pressed]').nth(1).click();
await page.waitForTimeout(700);
check(sql(`select count(*) from my_deck_cards where user_id='${uid}'`) === "1", "carte ajoutée");
sql(`insert into my_deck_cards (user_id, arcana, card_id)
     select '${uid}', c.arcana, (array_agg(c.id order by d.sort desc))[1] from cards c join decks d on d.id=c.deck_id
     group by c.arcana on conflict do nothing`);
await page.reload();
await page.waitForTimeout(800);
await shot("31-mon-deck");
await page.getByRole("button", { name: "Tirer avec mon deck" }).click();
await page.waitForTimeout(800);
check(sql(`select use_my_deck from profiles where id='${uid}'`) === "t", "deck complet : tirage activé");

step("My Deck : tirage");
await page.goto(`${BASE}/tirage`);
await page.waitForTimeout(600);
check(await page.getByText("Mon deck", { exact: false }).first().isVisible(), "l'accueil nomme mon deck");
await shot("32-accueil-mon-deck");
const conv = await api("/api/conversations", "POST", { spread: 1 });
check(conv.status === 200 && Boolean(conv.body?.id), "conversation ouverte");
const id = conv.body.id;
check(sql(`select deck_id is null from conversations where id='${id}'`) === "t", "conversation sans deck unique");
check(sql(`select count(*) from conversation_cards cc join my_deck_cards m on m.card_id=cc.card_id and m.user_id='${uid}' where cc.conversation_id='${id}'`) === "1", "la carte vient bien de mon deck");
await page.goto(`${BASE}/c/${id}`);
const PICTO = "main svg g[style*='picto']";
await page.waitForSelector("main p.display", { timeout: 60000 });
await page.waitForFunction((s) => !document.querySelector(s), PICTO, { timeout: 120000 });
await page.waitForTimeout(800);
await shot("33-conversation");

step("relance : conclusion, puis nouveau sujet");
for (const msg of ["Je me sens perdue dans mon travail.", "Oui, c'est exactement ça. Merci, je me sens apaisée, j'ai ma réponse, je sais ce que je vais faire.", "Sinon, rien à voir : je voudrais parler de ma relation avec ma sœur, qui ne me parle plus."]) {
  await page.locator("textarea").fill(msg);
  await page.getByRole("button", { name: "Envoyer" }).click();
  await page.waitForTimeout(1000);
  await page.waitForFunction((s) => !document.querySelector(s), PICTO, { timeout: 120000 });
  await page.waitForTimeout(1200);
}
const last = sql(`select content from messages where conversation_id='${id}' and role='assistant' order by created_at desc limit 1`);
console.log(`  dernière réponse : ${last.slice(0, 200)}`);
check(last.includes("[[DRAW_CARD]]"), "nouveau sujet après conclusion : l'IA propose une carte");
await shot("34-relance");

const extra = await api(`/api/conversations/${id}/cards`, "POST");
check(extra.status === 200, "carte supplémentaire tirée dans mon deck");

step("retrait d'une carte : retour au deck principal");
check((await api("/api/my-deck", "DELETE", { arcana: 0 })).status === 200, "carte retirée");
check(sql(`select use_my_deck from profiles where id='${uid}'`) === "f", "deck incomplet : on repasse au deck principal");

step("fin d'abonnement");
await webhook({ id: `evt_${stamp}_end`, type: "customer.subscription.deleted", data: { object: { object: "subscription", id: `sub_${stamp}` } } });
check(sql(`select plan from profiles where id='${uid}'`) === "intention", "abonnement terminé : retour à Intention");

step("profil");
await page.goto(`${BASE}/moi`);
await page.waitForTimeout(800);
await shot("35-tirages");
check((await page.locator("li a.tarot").count()) >= 1, "cartes les plus tirées");
await page.getByRole("tab", { name: "Toi" }).click();
await page.locator("textarea").first().fill("Je viens de rencontrer quelqu'un.");
await page.waitForTimeout(100);
await shot("36-toi");
await page.getByRole("button", { name: "Enregistrer" }).click();
await page.waitForTimeout(900);
check(sql(`select world->>'love' from profiles where id='${uid}'`) === "Je viens de rencontrer quelqu'un.", "ton monde enregistré");

step("mode sombre");
await page.getByRole("tab", { name: "Réglages" }).click();
await page.getByRole("button", { name: "Sombre" }).click();
await page.waitForTimeout(600);
const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
check((await bg()) === "rgb(13, 23, 39)", "fond bleu marine");
await shot("37-sombre-reglages");
await page.reload();
await page.waitForTimeout(600);
check((await page.evaluate(() => document.documentElement.dataset.theme)) === "dark" && (await bg()) === "rgb(13, 23, 39)", "le choix survit au rechargement");
for (const path of ["/tirage", "/decks", "/journal", `/c/${id}`]) {
  await page.goto(BASE + path);
  await page.waitForTimeout(1000);
  await shot(`38-sombre${path.replaceAll("/", "-").slice(0, 16)}`);
}

await browser.close();
console.log(`compte de test ${email}, captures dans ${OUT}`);
if (failures.length) {
  console.log(`ÉCHECS (${failures.length}) :\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("OK");
