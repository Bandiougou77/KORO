// Stub pour les tests : le vrai package "server-only" lève une erreur hors du bundler
// Next.js (qui définit une condition spéciale pour le neutraliser). Vitest n'étant pas ce
// bundler, on le remplace ici par un no-op — uniquement pour l'environnement de test,
// aucun fichier applicatif n'est modifié.
export {};
