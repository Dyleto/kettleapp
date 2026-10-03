/**
 * Les informations d'identité qui figurent dans les documents légaux.
 *
 * Elles vivent ici plutôt que dans le corps des pages : l'adresse d'un
 * hébergeur change, une raison sociale évolue, et personne ne devrait avoir à
 * relire une politique de confidentialité pour corriger une ligne.
 *
 * `À COMPLÉTER` s'affiche en évidence sur la page. C'est délibéré : un
 * document légal incomplet doit se voir, pas se deviner.
 */
export const TO_FILL = 'À COMPLÉTER';

/**
 * Les informations que les deux documents légaux citent.
 *
 * Une seule source pour la politique de confidentialité et les mentions
 * légales : les deux nomment l'éditeur et l'hébergeur, et deux copies
 * divergent dès la première correction.
 */
export const LEGAL = {
  /** La date de dernière révision des deux documents. */
  revisedAt: '14 septembre 2026',

  publisher: {
    /**
     * Le nom et le prénom de l'éditeur — une personne physique, activité non
     * commerciale.
     *
     * La LCEN permet à un éditeur non professionnel de taire son identité.
     * Le RGPD, lui, exige que le responsable de traitement soit identifiable
     * (art. 13.1.a) : c'est pour cela que le nom figure ici.
     */
    name: 'Corentin Le Moullec',
    contactEmail: 'contact@kettleapp.fr',
  },

  /**
   * Tout hébergeur doit être nommé avec son adresse (LCEN, art. 6 III). Les
   * raisons sociales sont certaines — elles viennent du code et des
   * dépendances. Les adresses sont à recopier depuis les mentions légales de
   * chaque prestataire, pour qu'aucune ne soit inventée.
   */
  hosts: {
    site: {
      role: 'Hébergement du site et de l’application',
      name: 'Vercel Inc.',
      address: '440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
    },
    api: {
      role: 'Hébergement du serveur applicatif',
      name: 'Render Services, Inc.',
      address:
        '525 Brannan Street, Suite 300, San Francisco, CA 94107, États-Unis',
      /** Le service tourne à Francfort : le traitement reste dans l'UE. */
      region: 'Francfort (Allemagne)',
    },
    base: {
      role: 'Hébergement de la base de données',
      name: 'MongoDB, Inc. — MongoDB Atlas',
      address: '1633 Broadway, 38th Floor, New York, NY 10019, États-Unis',
      /** Le cluster tourne sur AWS à Paris : la donnée repose en France. */
      region: 'Amazon Web Services, région Paris (France)',
    },
  },

  /** Durées de conservation, à tenir cohérentes avec ce que le code fait. */
  retention: {
    inactiveAccount: '3 ans sans connexion',
    /**
     * Ce que l'hébergeur garde réellement des journaux serveur. Annoncer une
     * durée plus longue que la sienne serait une promesse qu'on ne tient pas ;
     * plus courte, une fausse déclaration. À revoir si l'offre change.
     */
    logs: '7 jours, la durée de rétention de notre hébergeur',
  },
} as const;

/** Les deux documents, servis par l'application elle-même. */
export const LEGAL_ROUTES = {
  privacy: '/confidentialite',
  legalNotice: '/mentions-legales',
} as const;
