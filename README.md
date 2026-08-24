# Kôrô — Mali

Marketplace de mise en relation entreprises/candidats, lancement pilote au Mali (Bamako). Voir `../koro-cahier-des-charges.md` pour le brief complet et `..\..\..\..\..\..\.claude\plans\fizzy-dreaming-stearns.md` pour le dernier plan d'implémentation.

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · SQLite via Prisma 7 (`@prisma/adapter-libsql`) · auth maison (bcryptjs + jose, cookie httpOnly) · zod · vitest.

Architecture **multi-pays** dès le schéma (table `Pays`, `pays_id` sur User/Entreprise/Mission/ConfigCommission, moyens de paiement mobile money), mais un seul pays actif au lancement : Mali (FCFA). SN et CI sont semés en base, inactifs, pour prouver que l'architecture tient sans exposer de sélecteur de pays dans l'UI.

Paiement **séquestré**, pas payé après coup : dès qu'une entreprise accepte une candidature, `autoriserSequestre` crée un `Paiement` `retenu_en_sequestre` et passe la mission à `paiement_securise` (`src/lib/payment.ts`). Le candidat marque la mission `terminee`, puis l'entreprise confirme (`confirmerEtLibererPaiement`) ou — sans réponse ni litige — le paiement se libère automatiquement 48h après, vérifié "à la consultation" via `liberationsAutomatiquesEnRetard()` (appelée en tête de `entreprise/dashboard` et `moncompte`, pas de vraie tâche planifiée). Une fois libéré, le montant net est crédité sur le **solde interne** du candidat (`Solde`/`MouvementSolde`), retiré à la demande vers Orange Money/Wave/virement depuis `/moncompte/solde` (`src/lib/solde.ts`). Tout est simulé (statuts `effectue`/`recu` immédiats) — pas de vrai Stripe/CinetPay/PayDunya. Les entreprises sont vérifiées à l'inscription (`Verification`, auto-validée), une messagerie interne tracée (`MessageInterne`) accompagne chaque mission active, et signalement (`Signalement`, suspend un candidat automatiquement pour `menace_extorsion`) / litige (`Litige`, gèle le paiement) sont fonctionnels.

Côté admin (`/admin/revenus`, compte `admin@koro.test`) : commission réellement perçue par Kôrô, distincte du GMV (volume total des missions), historique par mission, et un virement simulé vers un compte bancaire pré-enregistré (`CompteBancaireAdmin`/`VirementCommission`, `src/lib/revenus.ts`) — pas de saisie libre d'IBAN au moment du virement. Le compte bancaire est semé en base (pas d'UI de création pour l'instant). Pas de back-office pour traiter les signalements/litiges — c'est la seule pièce encore différée.

## Démarrer

```bash
npm install
npx prisma migrate dev   # crée dev.db si besoin
npx prisma db seed       # Mali actif (+SN/CI inactifs), 6 entreprises, 6 missions, 1 candidat
npm run dev
```

Comptes de test (mot de passe `password123`) : `entreprise1@koro.test` … `entreprise6@koro.test`, `candidat1@koro.test`, `admin@koro.test`.

## Commandes utiles

- `npm run dev` / `npm run build` / `npm start`
- `npm test` — tests unitaires (calcul de commission)
- `npx prisma studio` — explorer la base
- `npx prisma db seed` — réinitialise les données de démo

## Structure

- `src/actions/` — Server Actions (auth, missions, candidatures, paiements, solde/retrait, litiges, signalements, messages)
- `src/lib/` — logique métier : `commission.ts`/`repartition.ts` (calcul, testé), `payment.ts` (séquestre + libération, auto ou à 48h, point d'extension Stripe Connect/CinetPay/PayDunya), `solde.ts` (crédit du solde, retrait), `verification.ts` (vérification entreprise simulée), `pays.ts`/`moyenPaiement.ts` (pays actif, moyens de paiement — split pour rester importable depuis un composant client), `auth.ts` (session), `currency.ts`
- `src/app/` — pages App Router, calquées sur les maquettes HTML d'origine (`../*.html`, `../style.css`)
- `prisma/schema.prisma` — modèle de données multi-pays, `prisma/seed.ts` — données de démo Mali

## Ouvrir un 2e pays (quand ce sera le moment)

Le code ne devrait pas avoir besoin d'être réécrit :
1. Activer le pays dans la table `Pays` (`actif = true`) + y ajouter une `ConfigCommission` par durée.
2. Ajouter un vrai sélecteur de pays à `/inscription` (aujourd'hui `lib/pays.ts::getPaysActif()` assume qu'un seul pays est actif et l'assigne automatiquement).
3. Rédiger des CGU/statut juridique spécifiques à ce pays (`/conditions-utilisation`, `/statut-juridique` sont pour l'instant rédigées pour le Mali uniquement).
