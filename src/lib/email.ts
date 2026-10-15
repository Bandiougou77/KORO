import "server-only";
import { Resend } from "resend";

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY manquant dans l'environnement");
  return new Resend(apiKey);
}

// Expéditeur de test Resend — ne fonctionne que pour envoyer vers l'adresse email
// du compte Resend lui-même tant qu'aucun domaine n'est vérifié. Voir koro-reset-mot-de-passe.
const FROM = "Kôrô <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const client = getClient();
  await client.emails.send({
    from: FROM,
    to,
    subject: "Réinitialisation de votre mot de passe Kôrô",
    html: `
      <p>Vous avez demandé à réinitialiser votre mot de passe Kôrô.</p>
      <p><a href="${resetUrl}">Cliquez ici pour choisir un nouveau mot de passe</a></p>
      <p>Ce lien expire dans 30 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `,
  });
}
