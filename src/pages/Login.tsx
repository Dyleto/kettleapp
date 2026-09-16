import {
  Box,
  Container,
  Heading,
  HStack,
  Link,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useAuth } from '@/contexts/useAuth';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { LEGAL_ROUTES } from '@/config/legal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useEffect, useState } from 'react';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import {
  LuListChecks,
  LuActivity,
  LuLibrary,
  LuChevronRight,
} from 'react-icons/lu';
import { LEGAL } from '@/config/legal';

const FEATURES = [
  { label: 'Programmes sur mesure', icon: LuListChecks },
  { label: 'Suivi séance par séance', icon: LuActivity },
  { label: "Bibliothèque d'exercices partagée", icon: LuLibrary },
];

/**
 * Un chemin nommé, replié.
 *
 * Ni l'un ni l'autre ne mène à un bouton : dans les deux cas, ce qu'il faut
 * faire se passe ailleurs — ouvrir le lien de son coach, ou nous écrire. Les
 * déguiser en actions serait promettre une seconde fois ce que la page ne
 * peut pas tenir.
 */
const Chemin = ({
  id,
  titre,
  ouvert,
  onToggle,
  children,
}: {
  id: string;
  titre: string;
  ouvert: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <Box
    w="100%"
    bg="bg.surface"
    borderWidth="1px"
    borderColor="whiteAlpha.100"
    borderRadius="lg"
    overflow="hidden"
  >
    <Box
      as="button"
      w="100%"
      aria-expanded={ouvert}
      aria-controls={id}
      onClick={onToggle}
      px={3.5}
      minH="48px"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      gap={3}
      color="fg"
      _hover={{ bg: 'whiteAlpha.50' }}
      _focusVisible={{
        outlineOffset: '-2px',
      }}
    >
      <Text fontSize="sm" fontWeight="medium" textAlign="left">
        {titre}
      </Text>
      <Box
        color="fg.muted"
        display="flex"
        flexShrink={0}
        transform={ouvert ? 'rotate(90deg)' : 'none'}
        transition="transform 0.15s"
      >
        <LuChevronRight size={15} />
      </Box>
    </Box>
    {ouvert && (
      <Box id={id} px={3.5} pb={3.5} pt={0.5}>
        {children}
      </Box>
    )}
  </Box>
);

const Login: React.FC = () => {
  useDocumentTitle('Connexion');
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [chemin, setChemin] = useState<'client' | 'coach' | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/');
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="100vh"
      >
        <Spinner size="xl" color="app.primary" />
      </Box>
    );
  }

  return (
    <Box
      as="main"
      id="contenu"
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="100vh"
    >
      <Container centerContent py={12}>
        <VStack gap={7} w="100%" maxW="380px">
          {/* Header */}
          <VStack gap={1} textAlign="center">
            {/* Aucun `h1` sur cet écran : un lecteur d'écran n'avait rien
                pour l'annoncer ni pour y naviguer. C'est le nom du produit
                qui le titre — c'est bien ce que la page dit. */}
            <Heading
              as="h1"
              fontSize="42px"
              fontWeight="800"
              letterSpacing="9px"
              style={{
                background:
                  'linear-gradient(180deg, #fff, rgba(255,255,255,0.72))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              KETTLE
            </Heading>
            <Text fontSize="13.5px" color="fg.muted" mt={1}>
              Plateforme de coaching sportif personnalisé
            </Text>
          </VStack>

          {/* Ce que fait le produit — une liste, pas trois boutons.
              Ces trois lignes portaient un fond, une bordure et le même rayon
              que le bouton Google juste dessous, à la même largeur : trois
              fausses cibles au-dessus de la seule vraie, donc trois occasions
              de croire que l'application ne répond pas. Sans fond ni cadre,
              elles se lisent pour ce qu'elles sont. L'icône garde l'accent :
              c'est une puce, elle ne prétend rien. */}
          <VStack gap={2} w="100%" as="ul" listStyleType="none">
            {FEATURES.map(({ label, icon: FeatureIcon }) => (
              <HStack key={label} as="li" gap={3} w="100%" px={1}>
                <Box color="app.primary" flexShrink={0} display="flex">
                  <FeatureIcon size={16} />
                </Box>
                <Text fontSize="xs" color="fg.muted" textAlign="left">
                  {label}
                </Text>
              </HStack>
            ))}
          </VStack>

          <VStack gap={3} w="100%">
            <GoogleLoginButton text="Continuer avec Google" />

            {/* Deux chemins nommés, parce que le bouton ne sert vraiment qu'à
                l'un des trois cas — celui qui a déjà un compte. Un client sans
                invitation et un coach sans espace y aboutissent tous deux à un
                compte rattaché à personne. Autant le dire ici. */}
            <Text fontSize="xs" color="fg.muted" textAlign="center" pt={1}>
              Première fois ici&nbsp;?
            </Text>

            <Chemin
              id="chemin-client"
              titre="J'ai reçu une invitation"
              ouvert={chemin === 'client'}
              onToggle={() => setChemin(chemin === 'client' ? null : 'client')}
            >
              <Text fontSize="xs" color="fg.muted" lineHeight="1.7">
                Ouvre le lien que ton coach t'a envoyé : c'est lui qui te
                rattache à son programme. Te connecter directement ici crée un
                compte qui n'est rattaché à personne, et tu ne verras aucune
                séance.
              </Text>
            </Chemin>

            <Chemin
              id="chemin-coach"
              titre="Je suis coach"
              ouvert={chemin === 'coach'}
              onToggle={() => setChemin(chemin === 'coach' ? null : 'coach')}
            >
              <Text fontSize="xs" color="fg.muted" lineHeight="1.7">
                L'espace coach ne s'ouvre pas tout seul à l'inscription.
                Écrivez-nous à{' '}
                <Link
                  href={`mailto:${LEGAL.editeur.contactEmail}`}
                  color="app.primary"
                  textDecoration="underline"
                >
                  {LEGAL.editeur.contactEmail}
                </Link>{' '}
                et nous l'ouvrons pour votre compte.
              </Text>
            </Chemin>
          </VStack>

          {/* Se connecter, c'est créer un compte. On doit pouvoir lire ce
              qu'on accepte avant, pas après. */}
          <HStack gap={3} justify="center" flexWrap="wrap">
            <Link
              as={RouterLink}
              {...{ to: LEGAL_ROUTES.confidentialite }}
              fontSize="xs"
              color="fg.muted"
              _hover={{ color: 'app.primary' }}
            >
              Politique de confidentialité
            </Link>
            <Text fontSize="xs" color="fg.muted" aria-hidden="true">
              ·
            </Text>
            <Link
              as={RouterLink}
              {...{ to: LEGAL_ROUTES.mentions }}
              fontSize="xs"
              color="fg.muted"
              _hover={{ color: 'app.primary' }}
            >
              Mentions légales
            </Link>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default Login;
