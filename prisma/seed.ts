import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  await db.messageInterne.deleteMany();
  await db.litige.deleteMany();
  await db.signalement.deleteMany();
  await db.verification.deleteMany();
  await db.mouvementSolde.deleteMany();
  await db.retrait.deleteMany();
  await db.solde.deleteMany();
  await db.paiement.deleteMany();
  await db.candidature.deleteMany();
  await db.mission.deleteMany();
  await db.entreprise.deleteMany();
  await db.profilCandidat.deleteMany();
  await db.virementCommission.deleteMany();
  await db.compteBancaireAdmin.deleteMany();
  await db.user.deleteMany();
  await db.configCommission.deleteMany();
  await db.pays.deleteMany();

  const mali = await db.pays.create({
    data: {
      code: "ML",
      nom: "Mali",
      devise: "FCFA",
      actif: true,
      moyensPaiementDisponibles: "orange_money,wave,moov_money,virement",
    },
  });

  // Pays préparés pour l'extension régionale, non activés au lancement.
  await db.pays.createMany({
    data: [
      { code: "SN", nom: "Sénégal", devise: "FCFA", actif: false, moyensPaiementDisponibles: "orange_money,wave,virement" },
      { code: "CI", nom: "Côte d'Ivoire", devise: "FCFA", actif: false, moyensPaiementDisponibles: "orange_money,moov_money,virement" },
    ],
  });

  // Taux fixe à 5%, quelle que soit la durée — voir src/lib/commissionConfig.ts.
  await db.configCommission.createMany({
    data: [
      { paysId: mali.id, dureeType: "courte", taux: 5 },
      { paysId: mali.id, dureeType: "longue", taux: 5 },
    ],
  });

  const motDePasseHash = await bcrypt.hash("password123", 10);

  const entreprisesData = [
    {
      email: "entreprise1@koro.test",
      nomEntreprise: "Bamako Fret Logistique",
      adresse: "Sotuba, Bamako",
      mission: {
        titre: "Préparateur de commandes",
        description:
          "Préparation de commandes en entrepôt, port de charges légères, horaires en journée du lundi au vendredi.",
        mode: "sur_site" as const,
        lieu: "Sotuba, Bamako",
        dureeType: "courte" as const,
        typeTarif: "horaire" as const,
        montantBrut: 1200,
      },
    },
    {
      email: "entreprise2@koro.test",
      nomEntreprise: "Djiguiya Services",
      adresse: "100% télétravail",
      mission: {
        titre: "Support technique niveau 1",
        description: "Support technique niveau 1 en télétravail, mission longue durée renouvelable.",
        mode: "distance" as const,
        lieu: "100% télétravail",
        dureeType: "longue" as const,
        typeTarif: "mensuel" as const,
        montantBrut: 180000,
      },
    },
    {
      email: "entreprise3@koro.test",
      nomEntreprise: "Bamako Kola Tech",
      adresse: "ACI 2000, Bamako",
      mission: {
        titre: "Développeur front-end junior",
        description: "Développement front-end sur une application web, mission de 2 mois.",
        mode: "distance" as const,
        lieu: "Bamako / distance",
        dureeType: "courte" as const,
        typeTarif: "forfait" as const,
        montantBrut: 450000,
      },
    },
    {
      email: "entreprise4@koro.test",
      nomEntreprise: "Sahel Transit",
      adresse: "Faladié, Bamako",
      mission: {
        titre: "Agent de quai",
        description: "Chargement/déchargement de quai, mission à la semaine.",
        mode: "sur_site" as const,
        lieu: "Faladié, Bamako",
        dureeType: "courte" as const,
        typeTarif: "horaire" as const,
        montantBrut: 1300,
      },
    },
    {
      email: "entreprise5@koro.test",
      nomEntreprise: "Orion Bâtiment Mali",
      adresse: "Hamdallaye, Bamako",
      mission: {
        titre: "Assistant administratif",
        description: "Assistance administrative pour un chantier, mission de 8 mois.",
        mode: "sur_site" as const,
        lieu: "Hamdallaye, Bamako",
        dureeType: "longue" as const,
        typeTarif: "mensuel" as const,
        montantBrut: 160000,
      },
    },
    {
      email: "entreprise6@koro.test",
      nomEntreprise: "Segou Digital",
      adresse: "100% télétravail",
      mission: {
        titre: "Modérateur de contenu",
        description: "Modération de contenu en télétravail, mission longue durée.",
        mode: "distance" as const,
        lieu: "100% télétravail",
        dureeType: "longue" as const,
        typeTarif: "forfait" as const,
        montantBrut: 380000,
      },
    },
  ];

  const TAUX_COMMISSION = 5; // Taux fixe, quelle que soit la durée — voir lib/commissionConfig.ts.

  let firstMissionId: string | null = null;

  for (const e of entreprisesData) {
    const user = await db.user.create({
      data: {
        role: "entreprise",
        email: e.email,
        motDePasseHash,
        paysId: mali.id,
        entreprise: {
          create: { nomEntreprise: e.nomEntreprise, adresse: e.adresse, paysId: mali.id },
        },
      },
    });

    await db.verification.create({
      data: {
        entrepriseId: user.id,
        type: "identite_entreprise",
        statut: "validee",
        documentReference: "démo",
        dateVerification: new Date(),
      },
    });

    const mission = await db.mission.create({
      data: {
        entrepriseId: user.id,
        paysId: mali.id,
        devise: "FCFA",
        ...e.mission,
        tauxCommission: TAUX_COMMISSION,
        statut: "publiee",
      },
    });

    if (!firstMissionId) firstMissionId = mission.id;
  }

  const candidat = await db.user.create({
    data: {
      role: "candidat",
      email: "candidat1@koro.test",
      motDePasseHash,
      paysId: mali.id,
      profilCandidat: {
        create: {
          nom: "Diarra",
          prenom: "Aïssata",
          disponibilite: "les_deux",
          localisation: "Bamako",
          moyenPaiementPrefere: "orange_money",
          identifiantPaiement: "+223 70 00 00 00",
        },
      },
    },
  });

  if (firstMissionId) {
    await db.candidature.create({
      data: {
        missionId: firstMissionId,
        candidatId: candidat.id,
        message: "Bonjour, je suis disponible dès la semaine prochaine.",
      },
    });
  }

  await db.user.create({
    data: {
      role: "admin",
      email: "admin@koro.test",
      motDePasseHash,
      paysId: mali.id,
    },
  });

  await db.compteBancaireAdmin.create({
    data: {
      paysId: mali.id,
      devise: "FCFA",
      ibanOuEquivalent: "ML00 KORO 0000 0000 0000 0001",
      nomTitulaire: "Kôrô SARL",
    },
  });

  console.log("Seed terminé : Mali actif (+ SN/CI inactifs), 6 entreprises, 6 missions, 1 candidat, 1 candidature, 1 admin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
