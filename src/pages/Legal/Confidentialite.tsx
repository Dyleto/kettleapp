import { Link, Text, VStack } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { LEGAL, LEGAL_ROUTES } from '@/config/legal';
import {
  AComplete,
  Article,
  Base,
  LegalLayout,
  Liste,
  P,
  SousTitre,
} from './LegalLayout';

const Mail = () => (
  <Link
    href={`mailto:${LEGAL.editeur.contactEmail}`}
    color="app.primary"
    textDecoration="underline"
  >
    {LEGAL.editeur.contactEmail}
  </Link>
);

const Confidentialite = () => (
  <LegalLayout
    title="Politique de confidentialité"
    intro={
      <>
        Kettle est une application de coaching sportif : un coach y construit
        des programmes, ses clients les réalisent et notent ce qu'ils ont fait.
        Cela suppose de traiter des données personnelles, dont certaines
        relèvent de la santé. Ce document dit lesquelles, pourquoi, qui les
        voit, combien de temps elles sont gardées et ce que vous pouvez exiger.
        Il est écrit pour être lu.
      </>
    }
  >
    <Article n={1} title="Qui est responsable">
      <P>
        Le responsable du traitement est{' '}
        <AComplete valeur={LEGAL.editeur.nom} />, éditeur de Kettle, joignable à{' '}
        <Mail />. C'est lui qui décide de ce qui est collecté et de l'usage qui
        en est fait.
      </P>
      <P>
        Les coachs qui utilisent Kettle n'ont pas ce pouvoir. Ils consultent les
        données de leurs clients pour les entraîner, mais ils n'en déterminent
        ni la nature, ni les finalités, ni les moyens : ils ne sont donc pas
        responsables de traitement au sens du RGPD.
      </P>
    </Article>

    <Article n={2} title="Les données traitées">
      <SousTitre>Identité — transmise par Google</SousTitre>
      <P>
        Kettle n'a pas de mot de passe. On s'y connecte avec un compte Google,
        qui nous transmet quatre informations : adresse e-mail, prénom, nom,
        photo de profil. Rien d'autre. Kettle ne reçoit jamais votre mot de
        passe Google, ni vos contacts, ni votre agenda, ni vos fichiers.
      </P>

      <SousTitre>Entraînement</SousTitre>
      <Liste
        items={[
          'Le programme : séances, blocs, exercices, consignes, jours conseillés',
          'Pour un coach : sa bibliothèque d’exercices — nom, description, lien vidéo',
          'Pour un client : son rattachement à un coach, et la date de ce rattachement',
          'Les séances réalisées : la date, la prescription telle qu’elle était ce jour-là, et ce qui a réellement été fait — charges, répétitions, durées, série par série',
        ]}
      />

      <SousTitre>Santé — uniquement avec votre accord explicite</SousTitre>
      <P>Après une séance, un client peut déclarer trois choses :</P>
      <Liste
        items={[
          'un niveau d’effort, de 1 à 5',
          'des étiquettes de ressenti : mal dormi, douleur, stressé, fatigué, malade, en forme',
          'un commentaire libre',
        ]}
      />
      <P>
        Les étiquettes et le commentaire libre sont des données concernant la
        santé, au sens de l'article 9 du RGPD. Elles ne sont collectées que si
        vous y avez consenti explicitement, par la question qui vous est posée
        avant votre première entrée dans l'application.
      </P>
      <P>
        Le niveau d'effort n'en fait pas partie : c'est une mesure
        d'entraînement, au même titre qu'une charge soulevée. Il est collecté
        dans tous les cas.
      </P>
      <P>
        Si vous refusez, ces deux champs ne vous sont plus proposés et rien
        n'est enregistré — ni montré au coach, ni gardé quelque part. Si vous
        retirez un accord déjà donné, les étiquettes et commentaires déjà
        enregistrés sont effacés de toutes vos séances passées.
      </P>
      <P>
        Nous conservons la trace de votre réponse elle-même : accordée ou
        refusée, la date, et la version du texte auquel vous avez répondu. Sans
        cela, nous ne pourrions pas prouver sur quoi porte votre accord, ni vous
        reposer la question si ce texte change.
      </P>

      <SousTitre>Techniques</SousTitre>
      <Liste
        items={[
          <>
            Un cookie de session nommé{' '}
            <Text as="span" fontFamily="mono">
              connect.sid
            </Text>
            , qui vous maintient connecté d'une page à l'autre
          </>,
          'Les journaux du serveur : date, méthode et adresse de la requête, code de réponse, temps de traitement, identifiant du compte et adresse IP',
        ]}
      />
    </Article>

    <Article n={3} title="Pourquoi, et sur quelle base légale">
      <VStack align="stretch" gap={4}>
        <Base
          quoi="Vous connecter et tenir votre compte"
          pourquoi="Sans compte, rien n’est rattachable à personne."
          fondement="Exécution du contrat — art. 6.1.b"
        />
        <Base
          quoi="Construire, afficher et enregistrer les programmes et les séances"
          pourquoi="C’est le service lui-même."
          fondement="Exécution du contrat — art. 6.1.b"
        />
        <Base
          quoi="Enregistrer les étiquettes de ressenti et les commentaires"
          pourquoi="Permettre au coach d’adapter l’entraînement à votre état."
          fondement="Consentement explicite — art. 9.2.a"
        />
        <Base
          quoi="Journaliser les requêtes du serveur"
          pourquoi="Diagnostiquer les pannes, détecter les abus et les tentatives d’intrusion."
          fondement="Intérêt légitime — art. 6.1.f"
        />
      </VStack>
    </Article>

    <Article n={4} title="Qui voit quoi">
      <Liste
        items={[
          'Votre coach voit votre identité, votre programme, vos séances réalisées avec vos charges et votre niveau d’effort — et, si vous l’avez accepté, vos étiquettes de ressenti et vos commentaires.',
          'Les autres clients de votre coach ne voient rien de vous.',
          'Un autre coach ne voit rien tant que vous ne vous êtes pas rattaché à lui, par un lien d’invitation que vous avez vous-même ouvert.',
          'L’administrateur de Kettle voit des comptes agrégés — nombre de coachs, de clients, de séances — et la liste des coachs avec leur nombre de clients. Il ne voit aucun contenu de séance, aucun ressenti, aucun commentaire.',
          'L’éditeur dispose d’un accès technique à la base de données, nécessaire pour l’exploiter et la dépanner. Cet accès n’est pas utilisé pour consulter des séances.',
        ]}
      />
      <P>
        Aucune donnée n'est vendue, louée, échangée, ni transmise à des fins
        publicitaires. Kettle ne contient ni régie publicitaire, ni mesure
        d'audience, ni traceur marketing d'aucune sorte.
      </P>
    </Article>

    <Article n={5} title="Sous-traitants et hébergement">
      <P>
        Kettle s'appuie sur quatre prestataires, et sur eux seuls. Chacun
        n'accède aux données que pour exécuter sa prestation.
      </P>
      <Liste
        items={[
          <>
            <b>Google Ireland Limited</b> — authentification. Google sait que
            vous vous connectez à Kettle, et ne reçoit rien de ce que vous y
            faites.
          </>,
          <>
            <b>{LEGAL.hebergeurs.base.nom}</b> — base de données, région{' '}
            <AComplete valeur={LEGAL.hebergeurs.base.region} />.
          </>,
          <>
            <b>{LEGAL.hebergeurs.site.nom}</b> — hébergement du site et de
            l'application.
          </>,
          <>
            <b>{LEGAL.hebergeurs.api.nom}</b> — hébergement du serveur
            applicatif, région {LEGAL.hebergeurs.api.region}.
          </>,
        ]}
      />
      <P>
        Les vidéos d'exercices sont hébergées par YouTube. Le lecteur ne se
        charge qu'au moment où vous demandez la lecture, et il utilise le
        domaine{' '}
        <Text as="span" fontFamily="mono">
          youtube-nocookie.com
        </Text>{' '}
        : tant que vous ne cliquez pas, aucun cookie YouTube n'est déposé sur
        votre appareil.
      </P>
      <P>
        Une réserve, dite honnêtement : l'image fixe qui annonce la vidéo est
        servie par un domaine de Google, ce qui lui révèle votre adresse IP dès
        l'affichage de la fiche. Cette image ne dépose aucun cookie et ne permet
        pas de vous suivre d'un site à l'autre.
      </P>
      <P>
        Vos données restent dans l'Union européenne. Le cluster de base de
        données tourne sur l'infrastructure d'Amazon Web Services à Paris, et le
        serveur qui les lit et les écrit est hébergé à Francfort. Rien n'est
        répliqué hors de l'Union.
      </P>
      <P>
        Vercel, Render et MongoDB sont en revanche des sociétés de droit
        américain, susceptibles d'accéder aux données depuis les États-Unis pour
        exploiter et maintenir leurs services. Ces accès sont encadrés par les
        clauses contractuelles types de la Commission européenne et, pour les
        prestataires qui y ont adhéré, par le Data Privacy Framework.
      </P>
    </Article>

    <Article n={6} title="Combien de temps">
      <Liste
        items={[
          'Votre compte et tout ce qui s’y rattache : tant que le compte existe. Sa suppression est immédiate et définitive.',
          <>
            Un compte resté inactif {LEGAL.conservation.compteInactif} est
            supprimé.
          </>,
          'Les étiquettes de ressenti et les commentaires : effacés dès que vous retirez votre accord, sans attendre.',
          'La trace de votre réponse au consentement : conservée tant que le compte existe, parce qu’elle est la preuve du fondement de la collecte.',
          'Les sessions de connexion : 7 jours, puis il faut se reconnecter.',
          'Les liens d’invitation : 7 jours, puis ils expirent d’eux-mêmes.',
          <>Les journaux du serveur : {LEGAL.conservation.journaux}.</>,
        ]}
      />
    </Article>

    <Article n={7} title="Cookies et stockage local">
      <P>
        Kettle ne dépose aucun cookie publicitaire ni de mesure d'audience.
        Trois choses seulement sont écrites dans votre navigateur, et toutes
        sont strictement nécessaires au fonctionnement :
      </P>
      <Liste
        items={[
          <>
            <Text as="span" fontFamily="mono">
              connect.sid
            </Text>{' '}
            — le cookie de session, qui vous maintient connecté pendant 7 jours.
            Il est
            <Text as="span" fontFamily="mono">
              {' '}
              httpOnly
            </Text>
            , donc illisible par un script.
          </>,
          'Un jeton anti-rejeu et, le cas échéant, votre lien d’invitation, le temps de la connexion Google.',
          'Votre progression dans une séance guidée, le temps de cette séance, pour que fermer l’onglet ne la fasse pas perdre.',
        ]}
      />
      <P>
        Aucun de ces éléments ne nécessite votre consentement préalable : ils
        sont exemptés au titre de l'article 82 de la loi Informatique et
        Libertés, qui dispense les traceurs strictement nécessaires à la
        fourniture d'un service expressément demandé.
      </P>
    </Article>

    <Article n={8} title="Vos droits">
      <P>
        Le RGPD vous donne des droits sur vos données. Deux d'entre eux
        s'exercent directement depuis l'application, sans rien demander à
        personne :
      </P>
      <Liste
        items={[
          <>
            <b>Retirer votre consentement</b> aux données de santé, depuis « Mon
            compte ». Le retrait est aussi simple que l'accord, et efface ce qui
            avait été collecté.
          </>,
          <>
            <b>Supprimer votre compte</b>, depuis « Mon compte » également. Tout
            part : compte, programme, séances, rattachements.
          </>,
        ]}
      />
      <P>
        Les autres — accès, copie de vos données dans un format lisible,
        rectification, limitation, opposition — s'exercent en écrivant à{' '}
        <Mail />. Nous répondons dans un délai d'un mois, porté à trois mois si
        la demande est complexe, auquel cas nous vous le disons dans le premier
        mois.
      </P>
      <P>
        Vous pouvez aussi définir des directives sur le sort de vos données
        après votre décès, et les adresser à la même adresse.
      </P>
    </Article>

    <Article n={9} title="Sécurité">
      <Liste
        items={[
          'Les échanges entre votre appareil et le serveur sont chiffrés en HTTPS.',
          'Kettle ne stocke aucun mot de passe : l’authentification est déléguée à Google.',
          'Le cookie de session est httpOnly, transmis uniquement en HTTPS, et expire au bout de 7 jours.',
          'Les requêtes sont limitées en débit, et les entrées nettoyées pour prévenir les injections.',
          'Chaque lecture de donnée vérifie le rattachement : un coach qui demande la fiche d’un client qui n’est pas le sien reçoit un refus.',
        ]}
      />
      <P>
        Aucun système n'est inviolable. En cas de violation de données
        susceptible d'engendrer un risque pour vos droits, nous informerons la
        CNIL sous 72 heures et vous préviendrons directement si le risque est
        élevé.
      </P>
    </Article>

    <Article n={10} title="Âge minimum">
      <P>
        Kettle est réservé aux personnes majeures. L'application n'est pas
        destinée aux mineurs et ne prévoit aucun recueil de l'autorisation d'un
        titulaire de l'autorité parentale. Si nous apprenons qu'un compte
        appartient à un mineur, il est supprimé.
      </P>
    </Article>

    <Article n={11} title="Modifications">
      <P>
        Ce document peut évoluer. La date de dernière mise à jour figure en haut
        de la page. Si une modification touche aux données de santé, la question
        du consentement vous est reposée : un accord donné à un texte ne vaut
        pas pour un autre.
      </P>
    </Article>

    <Article n={12} title="Réclamation">
      <P>
        Si une réponse ne vous satisfait pas, vous pouvez saisir la Commission
        nationale de l'informatique et des libertés — CNIL, 3 place de Fontenoy,
        TSA 80715, 75334 Paris Cedex 07, ou{' '}
        <Link
          href="https://www.cnil.fr/fr/plaintes"
          target="_blank"
          rel="noreferrer"
          color="app.primary"
          textDecoration="underline"
        >
          cnil.fr/fr/plaintes
        </Link>
        .
      </P>
      <P>
        Les informations d'édition et d'hébergement figurent dans les{' '}
        <Link
          as={RouterLink}
          {...{ to: LEGAL_ROUTES.mentions }}
          color="app.primary"
          textDecoration="underline"
        >
          mentions légales
        </Link>
        .
      </P>
    </Article>
  </LegalLayout>
);

export default Confidentialite;
