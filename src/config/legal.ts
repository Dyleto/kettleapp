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
    /**
     * Prénom et nom de l'éditeur — personne physique, activité non
     * professionnelle.
     *
     * La LCEN permet à un éditeur non professionnel de ne pas publier son
     * identité. Le RGPD, lui, exige que le responsable du traitement soit
     * identifiable (art. 13.1.a) : c'est à ce titre que le nom figure ici.
     */
    nom: 'Corentin Le Moullec',
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
      adresse: '440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
    },
    api: {
      role: 'Hébergement du serveur applicatif',
      nom: 'Render Services, Inc.',
      adresse:
        '525 Brannan Street, Suite 300, San Francisco, CA 94107, États-Unis',
      /** Le service tourne à Francfort : le traitement reste dans l'Union. */
      region: 'Francfort (Allemagne)',
    },
    base: {
      role: 'Hébergement de la base de données',
      nom: 'MongoDB, Inc. — MongoDB Atlas',
      adresse: '1633 Broadway, 38th Floor, New York, NY 10019, États-Unis',
      /** Le cluster tourne sur AWS à Paris : les données reposent en France. */
      region: 'Amazon Web Services, région Paris (France)',
    },
  },

  /** Durées de conservation, à tenir en cohérence avec ce que fait le code. */
  conservation: {
    compteInactif: '3 ans sans connexion',
    /**
     * Ce que l'hébergeur garde réellement des journaux du serveur. Annoncer
     * une durée plus longue que la sienne serait une promesse qu'on ne tient
     * pas ; plus courte, une affirmation fausse. À revoir si le plan change.
     */
    journaux: '7 jours, la durée de rétention de notre hébergeur',
  },
} as const;

/** Les deux documents, servis par l'application elle-même. */
export const LEGAL_ROUTES = {
  confidentialite: '/confidentialite',
  mentions: '/mentions-legales',
} as const;
