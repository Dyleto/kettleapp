/**
 * The identifying details that appear in the legal documents.
 *
 * They live here rather than in the body of the pages: a host's address
 * changes, a company name evolves, and nobody should have to reread a privacy
 * policy to correct one line.
 *
 * `À COMPLÉTER` shows prominently on the page. That is deliberate: an
 * incomplete legal document must be visible, not guessed at.
 */
export const A_COMPLETER = 'À COMPLÉTER';

/**
 * Les informations que les deux documents légaux citent.
 *
 * Une seule source pour la politique de confidentialité et les mentions
 * légales : les deux nomment l'éditeur et l'hébergeur, et deux copies
 * divergent dès la première correction.
 */
export const LEGAL = {
  /** La date de dernière révision des deux documents. */
  majLe: '14 septembre 2026',

  editeur: {
    /**
     * Le nom et le prénom de l'éditeur — une personne physique, activité non
     * commerciale.
     *
     * La LCEN permet à un éditeur non professionnel de taire son identité.
     * Le RGPD, lui, exige que le responsable de traitement soit identifiable
     * (art. 13.1.a) : c'est pour cela que le nom figure ici.
     */
    nom: 'Corentin Le Moullec',
    contactEmail: 'contact@kettleapp.fr',
  },

  /**
   * Tout hébergeur doit être nommé avec son adresse (LCEN, art. 6 III). Les
   * raisons sociales sont certaines — elles viennent du code et des
   * dépendances. Les adresses sont à recopier depuis les mentions légales de
   * chaque prestataire, pour qu'aucune ne soit inventée.
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
      /** Le service tourne à Francfort : le traitement reste dans l'UE. */
      region: 'Francfort (Allemagne)',
    },
    base: {
      role: 'Hébergement de la base de données',
      nom: 'MongoDB, Inc. — MongoDB Atlas',
      adresse: '1633 Broadway, 38th Floor, New York, NY 10019, États-Unis',
      /** The cluster runs on AWS in Paris: the data rests in France. */
      region: 'Amazon Web Services, région Paris (France)',
    },
  },

  /** Durées de conservation, à tenir cohérentes avec ce que le code fait. */
  conservation: {
    compteInactif: '3 ans sans connexion',
    /**
     * Ce que l'hébergeur garde réellement des journaux serveur. Annoncer une
     * durée plus longue que la sienne serait une promesse qu'on ne tient pas ;
     * plus courte, une fausse déclaration. À revoir si l'offre change.
     */
    journaux: '7 jours, la durée de rétention de notre hébergeur',
  },
} as const;

/** Les deux documents, servis par l'application elle-même. */
export const LEGAL_ROUTES = {
  confidentialite: '/confidentialite',
  mentions: '/mentions-legales',
} as const;
