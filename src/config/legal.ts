/**
 * Les données d'identification qui figurent dans les documents légaux.
 *
 * Elles vivent ici plutôt que dans le corps des pages : une adresse
 * d'hébergeur change, une raison sociale évolue, et il ne faut pas avoir à
 * relire une politique de confidentialité pour corriger une ligne.
 *
 * `À COMPLÉTER` s'affiche en évidence sur la page. C'est volontaire : un
 * document légal incomplet doit se voir, pas se deviner.
 */
export const A_COMPLETER = 'À COMPLÉTER';

export const LEGAL = {
  /** Date de la dernière révision des deux documents. */
  majLe: '14 septembre 2026',

  editeur: {
    /** Prénom et nom de l'éditeur — personne physique, activité non professionnelle. */
    nom: A_COMPLETER,
    contactEmail: 'contact@kettleapp.fr',
  },

  /**
   * Chaque hébergeur doit être nommé avec son adresse (LCEN, art. 6 III).
   * Les raisons sociales sont sûres — elles viennent du code et des
   * dépendances. Les adresses sont à recopier depuis les pages légales de
   * chaque prestataire, pour ne pas en inventer une.
   */
  hebergeurs: {
    site: {
      role: 'Hébergement du site et de l’application',
      nom: 'Vercel Inc.',
      adresse: A_COMPLETER,
    },
    api: {
      role: 'Hébergement du serveur applicatif',
      nom: A_COMPLETER,
      adresse: A_COMPLETER,
    },
    base: {
      role: 'Hébergement de la base de données',
      nom: 'MongoDB, Inc. — MongoDB Atlas',
      adresse: A_COMPLETER,
      /** Région du cluster : « Europe (Irlande) », « Europe (Francfort) »… */
      region: A_COMPLETER,
    },
  },

  /** Durées de conservation, à tenir en cohérence avec ce que fait le code. */
  conservation: {
    compteInactif: '3 ans sans connexion',
    journaux: '6 mois',
  },
} as const;

/** Les deux documents, servis par l'application elle-même. */
export const LEGAL_ROUTES = {
  confidentialite: '/confidentialite',
  mentions: '/mentions-legales',
} as const;
