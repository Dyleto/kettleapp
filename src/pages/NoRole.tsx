import { useAuth } from '@/contexts/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  Box,
  VStack,
  Heading,
  Container,
  Text,
  Button,
} from '@chakra-ui/react';

const NoRole = () => {
  useDocumentTitle('Compte sans coach');
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

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
        <VStack w="100%" maxW="380px">
          <VStack gap={1} textAlign="center">
            <Text
              fontSize="13px"
              fontWeight="800"
              letterSpacing="4px"
              color="fg.muted"
            >
              KETTLE
            </Text>
          </VStack>

          <VStack gap={2.5} w="100%" mt={8} textAlign="center">
            <Heading size="2xl" mb="8" as="h1">
              Votre compte est créé, mais vous n'avez pas encore l'accès à
              l'application.
            </Heading>

            <Text>
              Vous êtes{' '}
              <Text as="span" fontWeight="bold" color="app.primary">
                client
              </Text>{' '}
              ? Contactez votre coach.
            </Text>
            <Text>
              Vous êtes{' '}
              <Text as="span" fontWeight="bold" color="app.primary">
                coach
              </Text>{' '}
              ? Contactez un administrateur.
            </Text>
          </VStack>
          <VStack>
            <Button
              mt={8}
              size="xl"
              bg="fg"
              cursor="pointer"
              onClick={handleLogout}
              _hover={{ bg: 'app.primary' }}
            >
              Revenir à la connexion
            </Button>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default NoRole;
