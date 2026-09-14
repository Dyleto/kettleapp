import { Box, Link, Text, VStack } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { LEGAL, LEGAL_ROUTES } from '@/config/legal';
import { AComplete, Article, LegalLayout, Liste, P } from './LegalLayout';

const Mail = () => (
  <Link
    href={`mailto:${LEGAL.editeur.contactEmail}`}
    color="app.primary"
    textDecoration="underline"
  >
    {LEGAL.editeur.contactEmail}
  </Link>
);

const Hebergeur = ({
  role,
  nom,
  adresse,
}: {
  role: string;
  nom: string;
  adresse: string;
}) => (
  <VStack
    align="stretch"
    gap={0.5}
    borderLeftWidth="2px"
    borderColor="app.primary.border"
    pl={3}
    py={0.5}
  >
    <Text fontSize="xs" color="fg.muted">
      {role}
    </Text>
    <Text fontSize="sm" fontWeight="semibold">
      <AComplete valeur={nom} />
    </Text>
    <Text fontSize="xs" color="fg.muted">
      <AComplete valeur={adresse} />
    </Text>
  </VStack>
);

const MentionsLegales = () => (
  <LegalLayout
    title="Mentions légales"
    intro={
      <>
        Kettle est un service édité à titre non professionnel. Cette page
        indique qui l'édite, qui l'héberge, et dans quelles limites il est
        fourni.
      </>
    }
  >
    <Article n={1} title="Éditeur">
      <P>
        Kettle est édité par <AComplete valeur={LEGAL.editeur.nom} />,
        personne physique agissant à titre non professionnel.
      </P>
      <P>
        Contact : <Mail />
      </P>
      <P>
        Conformément au second alinéa de l'article 6 III de la loi n° 2004-575
        du 21 juin 2004 pour la confiance dans l'économie numérique, l'éditeur
        non professionnel qui souhaite préserver son anonymat peut ne
        communiquer publiquement que les éléments d'identification de son
        hébergeur, sous réserve de lui avoir transmis les siens. Les
        coordonnées complètes de l'éditeur sont détenues par les hébergeurs
        mentionnés ci-dessous et sont communiquées à l'autorité judiciaire sur
        réquisition.
      </P>
    </Article>

    <Article n={2} title="Directeur de la publication">
      <P>
        <AComplete valeur={LEGAL.editeur.nom} />.
      </P>
    </Article>

    <Article n={3} title="Hébergeurs">
      <VStack align="stretch" gap={4}>
        <Hebergeur {...LEGAL.hebergeurs.site} />
        <Hebergeur {...LEGAL.hebergeurs.api} />
        <Hebergeur
          role={LEGAL.hebergeurs.base.role}
          nom={LEGAL.hebergeurs.base.nom}
          adresse={LEGAL.hebergeurs.base.adresse}
        />
      </VStack>
    </Article>

    <Article n={4} title="Données personnelles">
      <P>
        Le traitement des données personnelles est décrit dans la{' '}
        <Link
          as={RouterLink}
          {...{ to: LEGAL_ROUTES.confidentialite }}
          color="app.primary"
          textDecoration="underline"
        >
          politique de confidentialité
        </Link>
        , qui fait partie intégrante des présentes mentions. Les demandes
        d'accès, de rectification ou d'effacement s'adressent à <Mail />.
      </P>
    </Article>

    <Article n={5} title="Propriété intellectuelle">
      <P>
        La structure de l'application, son interface, ses textes et son
        identité visuelle sont la propriété de l'éditeur. Toute reproduction ou
        adaptation, totale ou partielle, sans autorisation écrite préalable est
        interdite.
      </P>
      <P>
        Les contenus créés par les utilisateurs — programmes, exercices,
        consignes, commentaires — restent la propriété de leurs auteurs.
        L'éditeur ne s'en réserve aucun droit d'exploitation et ne les utilise
        que pour fournir le service.
      </P>
    </Article>

    <Article n={6} title="Avertissement sur la pratique sportive">
      <Box
        bg="app.error/10"
        borderLeftWidth="2px"
        borderColor="app.error"
        borderRadius="md"
        p={3.5}
      >
        <Text fontSize="sm" color="fg" lineHeight="1.75">
          Kettle est un outil d'organisation de l'entraînement. Ce n'est pas un
          dispositif médical, et il ne délivre aucun avis médical,
          diagnostic ni traitement. Les programmes qui y figurent sont écrits
          par votre coach, sous sa seule responsabilité.
        </Text>
      </Box>
      <Liste
        items={[
          'Consultez un médecin avant de reprendre ou d’intensifier une activité physique, en particulier en cas d’antécédent cardiaque, de grossesse, de blessure ou de traitement en cours.',
          'Interrompez immédiatement un exercice en cas de douleur, de gêne inhabituelle, de vertige ou d’essoufflement anormal.',
          'Les étiquettes de ressenti — dont « douleur » et « malade » — ne déclenchent aucune alerte automatique. Elles sont lues par votre coach quand il consulte vos séances. Ce n’est en aucun cas un canal d’urgence : en cas d’urgence, appelez le 15 ou le 112.',
        ]}
      />
      <P>
        La responsabilité de l'éditeur ne saurait être engagée à raison des
        conséquences de la pratique sportive, du contenu des programmes établis
        par les coachs, ni de l'usage qui est fait de l'application.
      </P>
    </Article>

    <Article n={7} title="Disponibilité et responsabilité">
      <P>
        Kettle est fourni en l'état, sans garantie de disponibilité
        ininterrompue. L'éditeur peut suspendre le service pour maintenance ou
        pour raison technique, et ne garantit pas l'absence d'erreur ou de
        perte de données. Il est recommandé aux coachs de ne pas faire de
        Kettle leur unique archive de travail.
      </P>
      <P>
        L'éditeur ne peut être tenu responsable des dommages indirects
        résultant de l'accès au service ou de son indisponibilité.
      </P>
    </Article>

    <Article n={8} title="Contenus des utilisateurs">
      <P>
        Les coachs sont responsables des contenus qu'ils publient, y compris
        des liens vidéo qu'ils ajoutent à leur bibliothèque. L'éditeur n'exerce
        aucun contrôle a priori sur ces contenus. Tout contenu manifestement
        illicite peut être signalé à <Mail /> et sera retiré promptement.
      </P>
      <P>
        Les vidéos sont hébergées par YouTube et relèvent des conditions et de
        la politique de confidentialité de cette plateforme. Le lecteur n'est
        sollicité qu'au moment où vous lancez une lecture.
      </P>
    </Article>

    <Article n={9} title="Accès au service">
      <P>
        L'accès à Kettle se fait sur invitation d'un coach. Le service est
        réservé aux personnes majeures. L'éditeur peut suspendre ou supprimer
        un compte en cas d'usage manifestement abusif ou contraire à la loi.
      </P>
    </Article>

    <Article n={10} title="Droit applicable">
      <P>
        Les présentes mentions sont soumises au droit français. À défaut de
        résolution amiable, tout litige relève de la compétence des tribunaux
        français.
      </P>
    </Article>
  </LegalLayout>
);

export default MentionsLegales;
