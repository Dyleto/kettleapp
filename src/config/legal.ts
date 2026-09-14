/**
 * Les documents légaux et le contact de protection des données.
 *
 * Ils vivent sur le site, pas dans l'application : les écrire ici en dur
 * obligerait à redéployer le front pour corriger une virgule dans une
 * politique de confidentialité. L'écran « Mon compte » n'affiche un lien que
 * si son adresse est renseignée.
 */
export const LEGAL = {
  privacyUrl: 'https://kettleapp.fr/confidentialite',
  termsUrl: 'https://kettleapp.fr/mentions-legales',
  /** Où écrire pour exercer ses droits — accès, copie, rectification. */
  contactEmail: 'contact@kettleapp.fr',
} as const;
