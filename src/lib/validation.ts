import { z } from "zod";

export const registerCandidatSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  telephone: z.string().trim().optional().or(z.literal("")),
  password: z.string().min(8, "8 caractères minimum"),
  nom: z.string().trim().min(1, "Nom requis"),
  prenom: z.string().trim().min(1, "Prénom requis"),
  competences: z.string().trim().optional().or(z.literal("")),
  disponibilite: z.enum(["sur_site", "distance", "les_deux"]),
  localisation: z.string().trim().optional().or(z.literal("")),
  moyenPaiementPrefere: z.enum(["orange_money", "wave", "moov_money", "stripe", "virement"]).optional().or(z.literal("")),
  identifiantPaiement: z.string().trim().optional().or(z.literal("")),
});

export const registerEntrepriseSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  telephone: z.string().trim().optional().or(z.literal("")),
  password: z.string().min(8, "8 caractères minimum"),
  nomEntreprise: z.string().trim().min(1, "Nom d'entreprise requis"),
  identifiantLegal: z.string().trim().optional().or(z.literal("")),
  adresse: z.string().trim().optional().or(z.literal("")),
  pieceIdentiteResponsable: z.string().trim().min(1, "Pièce d'identité requise"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const demanderResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Jeton manquant"),
  password: z.string().min(8, "8 caractères minimum"),
});

export const createMissionSchema = z.object({
  titre: z.string().trim().min(1, "Intitulé requis"),
  description: z.string().trim().min(1, "Description requise"),
  mode: z.enum(["sur_site", "distance", "les_deux"]),
  lieu: z.string().trim().optional().or(z.literal("")),
  dureeType: z.enum(["courte", "longue"]),
  dateDebut: z.string().trim().optional().or(z.literal("")),
  dateFin: z.string().trim().optional().or(z.literal("")),
  typeTarif: z.enum(["horaire", "forfait", "mensuel"]),
  montantBrut: z.coerce.number().positive("Le montant doit être positif"),
});

export const applyCandidatureSchema = z.object({
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const acceptCandidatureSchema = z.object({
  moyenPaiement: z.enum(["orange_money", "wave", "moov_money", "stripe", "virement"]),
});

export const retraitSchema = z.object({
  montant: z.coerce.number().positive("Le montant doit être positif"),
});

export const litigeSchema = z.object({
  motif: z.string().trim().min(1, "Motif requis"),
  description: z.string().trim().min(1, "Description requise").max(2000),
});

export const resolutionLitigeSchema = z.object({
  decision: z.enum(["paiement_candidat", "remboursement_entreprise", "partage", "compte_suspendu"]),
  motifDecision: z.string().trim().min(1, "Le motif de la décision est requis").max(2000),
  // Uniquement pertinent pour "partage" : part versée au prestataire, le reste étant remboursé.
  montantVersePrestataire: z.coerce.number().min(0).optional().or(z.literal("")),
  // Uniquement pertinent pour "compte_suspendu" : lequel des deux comptes de la mission suspendre.
  utilisateurASuspendre: z.string().trim().optional().or(z.literal("")),
});

export const demandeInformationsLitigeSchema = z.object({
  message: z.string().trim().min(1, "Message requis").max(2000),
});

export const signalementSchema = z.object({
  motif: z.enum(["non_paiement", "guet_apens_suspecte", "menace_extorsion", "autre"]),
  description: z.string().trim().min(1, "Description requise").max(2000),
});

export const messageSchema = z.object({
  contenu: z.string().trim().min(1, "Message vide").max(2000),
});

export const virementCommissionSchema = z.object({
  compteBancaireId: z.string().trim().min(1),
  montant: z.coerce.number().positive("Le montant doit être positif"),
});

export const definirFraisPublicationSchema = z.object({
  paysId: z.string().trim().min(1),
  // z.coerce.boolean() serait incorrect ici : Boolean("false") vaut true en JS — on part d'un
  // <select> à valeurs "true"/"false" littérales, pas d'une case à cocher.
  actif: z.enum(["true", "false"]).transform((v) => v === "true"),
  montant: z.coerce.number().min(0, "Le montant ne peut pas être négatif"),
});
