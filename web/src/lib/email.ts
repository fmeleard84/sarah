import "server-only";

/**
 * Emails transactionnels via l'API Brevo (même compte que Tonton Gégé,
 * Velosiq, Isoligne). Expéditeur sur vaya.rip, domaine authentifié chez Brevo,
 * en attendant morningcards.life.
 *
 * L'API Brevo n'autorise que l'IPv4 du serveur : l'IPv6 est refusée
 * (« unrecognised IP address »). Node choisit l'IPv4 en premier grâce à
 * NODE_OPTIONS=--dns-result-order=ipv4first (docker-compose.yml).
 */

const SENDER = { email: process.env.MAIL_FROM ?? "bonjour@vaya.rip", name: "Morning Cards" };

async function send(to: string, subject: string, html: string) {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.warn("[email] BREVO_API_KEY absente, envoi ignoré :", subject);
    return;
  }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: SENDER, to: [{ email: to }], subject, htmlContent: html }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
}

function layout(title: string, body: string, cta: { label: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;background:#FEFCFA;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#2C2825">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FEFCFA"><tr><td align="center" style="padding:48px 24px">
<table width="100%" style="max-width:480px" cellpadding="0" cellspacing="0">
<tr><td style="font-family:Georgia,'Cormorant Garamond',serif;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#2C2825;padding-bottom:40px">morning · cards</td></tr>
<tr><td style="font-family:Georgia,'Cormorant Garamond',serif;font-style:italic;font-size:30px;line-height:1.15;padding-bottom:20px">${title}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;color:#2C2825;padding-bottom:32px">${body}</td></tr>
<tr><td><a href="${cta.url}" style="display:inline-block;background:#558BBB;color:#FEFCFA;text-decoration:none;font-size:12px;letter-spacing:.18em;text-transform:uppercase;padding:14px 28px">${cta.label}</a></td></tr>
<tr><td style="font-size:12px;color:#A39A92;padding-top:48px">une carte. une conversation. un insight.</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendWelcomeEmail(to: string, firstName: string, locale: "fr" | "en") {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://morningcards.vaya.rip";
  const name = firstName ? `, ${firstName.toLowerCase()}` : "";
  if (locale === "en") {
    await send(
      to,
      "Welcome to Morning Cards",
      layout(
        `welcome${name}`,
        "Your Exploration offer is on: one card a day for 5 days. Free.<br><br>No magic. Just insight.",
        { label: "Draw a card", url: site },
      ),
    );
  } else {
    await send(
      to,
      "Bienvenue sur Morning Cards",
      layout(
        `bienvenue${name}`,
        "Ton offre Exploration est activée : une carte par jour pendant 5 jours. Gratuit.<br><br>Tu sais déjà. On t'aide à voir.",
        { label: "Tirer une carte", url: site },
      ),
    );
  }
}
