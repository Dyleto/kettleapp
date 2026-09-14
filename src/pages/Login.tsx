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
import { useEffect } from 'react';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import { LuListChecks, LuActivity, LuLibrary } from 'react-icons/lu';

const FEATURES = [
  { label: 'Programmes sur mesure', icon: LuListChecks },
  { label: 'Suivi séance par séance', icon: LuActivity },
  { label: "Bibliothèque d'exercices partagée", icon: LuLibrary },
];

const Login: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

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
            <Heading
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

          {/* Fonctionnalités */}
          <VStack gap={2.5} w="100%">
            {FEATURES.map(({ label, icon: FeatureIcon }) => (
              <HStack
                key={label}
                gap={3}
                w="100%"
                bg="bg.surface"
                borderWidth="1px"
                borderColor="whiteAlpha.100"
                borderRadius="lg"
                px={3.5}
                py={3}
              >
                <Box color="app.primary" flexShrink={0} display="flex">
                  <FeatureIcon size={16} />
                </Box>
                <Text fontSize="xs" color="fg.muted" textAlign="left">
                  {label}
                </Text>
              </HStack>
            ))}
          </VStack>

          {/* Bouton Google + note coach */}
          <VStack gap={3} w="100%">
            <GoogleLoginButton text="Continuer avec Google" />
            <Text fontSize="xs" color="fg.muted" textAlign="center" maxW="32ch">
              Vous êtes coach ? Ce compte devient votre espace pour gérer vos
              clients.
            </Text>
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
