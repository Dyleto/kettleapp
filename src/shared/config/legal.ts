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

export const LEGAL = {
  /** When both documents were last revised. */
  majLe: '14 septembre 2026',

  editeur: {
    /**
     * The publisher's first and last name — a natural person, non-commercial
     * activity.
     *
     * French law (LCEN) lets a non-commercial publisher withhold their
     * identity. The GDPR, on the other hand, requires the data controller to
     * be identifiable (art. 13.1.a): that is why the name appears here.
     */
    nom: 'Corentin Le Moullec',
    contactEmail: 'contact@kettleapp.fr',
  },

  /**
   * Every host must be named with its address (LCEN, art. 6 III). The company
   * names are certain — they come from the code and the dependencies. The
   * addresses are to be copied from each provider's own legal pages, so that
   * none is invented.
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
      /** The service runs in Frankfurt: processing stays within the EU. */
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

  /** Retention periods, to be kept consistent with what the code does. */
  conservation: {
    compteInactif: '3 ans sans connexion',
    /**
     * What the host actually keeps of the server logs. Announcing a longer
     * period than theirs would be a promise we do not keep; a shorter one, a
     * false statement. To be revisited if the plan changes.
     */
    journaux: '7 jours, la durée de rétention de notre hébergeur',
  },
} as const;

/** Both documents, served by the app itself. */
export const LEGAL_ROUTES = {
  confidentialite: '/confidentialite',
  mentions: '/mentions-legales',
} as const;
