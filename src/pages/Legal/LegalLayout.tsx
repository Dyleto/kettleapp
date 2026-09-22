import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { LuArrowLeft } from 'react-icons/lu';
import { A_COMPLETER, LEGAL } from '@/config/legal';
import { hitArea } from '@/components/hitArea';

/**
 * A legal document is read end to end, often on a phone, and sometimes by
 * someone who does not have an account yet. Hence a narrow column, generous
 * line height, and no dependency on the signed-in state.
 */
export const LegalLayout = ({
  title,
  intro,
  children,
}: {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) => {
  const navigate = useNavigate();

  return (
    <Box bg="bg.canvas" minH="100dvh" color="fg">
      <Box
        maxW="720px"
        mx="auto"
        px={{ base: 5, md: 8 }}
        pt={{ base: 5, md: 10 }}
        pb={{ base: 'calc(env(safe-area-inset-bottom, 0px) + 56px)', md: 16 }}
      >
        <VStack align="stretch" gap={7}>
          <VStack align="stretch" gap={3}>
            <Box
              as="button"
              onClick={() => navigate(-1)}
              w="fit-content"
              color="fg.muted"
              _hover={{ color: 'app.primary' }}
              css={hitArea(32)}
            >
              <HStack gap={1.5}>
                <LuArrowLeft size={13} />
                <Text fontSize="xs" fontWeight="medium">
                  Retour
                </Text>
              </HStack>
            </Box>

            <VStack align="stretch" gap={1}>
              <Text
                fontSize="xs"
                fontWeight="900"
                letterSpacing="wider"
                color="fg.muted"
              >
                KETTLE
              </Text>
              <Heading as="h1" size="xl" fontWeight="bold" lineHeight="1.2">
                {title}
              </Heading>
              <Text fontSize="xs" color="fg.muted">
                Dernière mise à jour :{' '}
                <Text as="span" fontFamily="mono">
                  {LEGAL.majLe}
                </Text>
              </Text>
            </VStack>
          </VStack>

          <Box
            bg="surface.card"
            borderWidth="1px"
            borderColor="whiteAlpha.100"
            borderRadius="xl"
            p={4}
          >
            <Text fontSize="sm" color="fg" lineHeight="1.7">
              {intro}
            </Text>
          </Box>

          <VStack align="stretch" gap={8}>
            {children}
          </VStack>
        </VStack>
      </Box>
    </Box>
  );
};

/** A numbered section of the document. */
export const Article = ({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) => (
  <VStack align="stretch" gap={3} as="section">
    <Heading as="h2" size="md" fontWeight="bold" lineHeight="1.3">
      <Text as="span" color="app.primary" fontFamily="mono" mr={2}>
        {n}.
      </Text>
      {title}
    </Heading>
    <VStack align="stretch" gap={3}>
      {children}
    </VStack>
  </VStack>
);

export const SousTitre = ({ children }: { children: ReactNode }) => (
  <Heading as="h3" size="sm" fontWeight="semibold" color="fg" mt={1}>
    {children}
  </Heading>
);

export const P = ({ children }: { children: ReactNode }) => (
  <Text fontSize="sm" color="fg.muted" lineHeight="1.75">
    {children}
  </Text>
);

/** A bulleted list, readable on a phone. */
export const Liste = ({ items }: { items: ReactNode[] }) => (
  <VStack as="ul" align="stretch" gap={2} listStyleType="none" pl={0}>
    {items.map((item, i) => (
      <HStack as="li" key={i} gap={2.5} align="baseline">
        <Text as="span" color="app.primary" flexShrink={0} fontSize="xs">
          —
        </Text>
        <Text as="span" fontSize="sm" color="fg.muted" lineHeight="1.75">
          {item}
        </Text>
      </HStack>
    ))}
  </VStack>
);

/** A "what we do / why / on what legal basis" block. */
export const Base = ({
  quoi,
  pourquoi,
  fondement,
}: {
  quoi: string;
  pourquoi: string;
  fondement: string;
}) => (
  <VStack
    align="stretch"
    gap={1}
    borderLeftWidth="2px"
    borderColor="app.primary.border"
    pl={3}
    py={0.5}
  >
    <Text fontSize="sm" fontWeight="semibold" color="fg">
      {quoi}
    </Text>
    <Text fontSize="xs" color="fg.muted" lineHeight="1.6">
      {pourquoi}
    </Text>
    <Text fontSize="xs" color="app.primary">
      {fondement}
    </Text>
  </VStack>
);

/**
 * A value that is still missing. It shows in red rather than blending into
 * the text: an incomplete legal document has to be visible as such.
 */
export const AComplete = ({ valeur }: { valeur: string }) =>
  valeur === A_COMPLETER ? (
    <Text
      as="span"
      bg="app.error/16"
      color="app.error"
      px={1.5}
      py={0.5}
      borderRadius="sm"
      fontSize="xs"
      fontWeight="bold"
      fontFamily="mono"
    >
      {A_COMPLETER}
    </Text>
  ) : (
    <Text as="span">{valeur}</Text>
  );
