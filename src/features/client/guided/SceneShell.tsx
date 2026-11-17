import type { ReactNode } from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuPause } from 'react-icons/lu';
import { LANDSCAPE } from '@/kit';
import { SoundToggle } from '@/features/client/guided/SoundToggle';

interface SceneShellProps {
  /** « Bloc 2 sur 3 ». */
  rank: string;
  /** Le nom du bloc : celui que le coach a donné, sinon son format. */
  title: string;
  /** La part faite de chaque bloc, de 0 à 1. */
  parts: number[];
  /** Le bloc en cours, parmi `parts`. */
  current: number;
  /** Ce que la barre dit à un lecteur d'écran : « Série 3 sur 4 — Classique ». */
  valuetext: string;
  onPause: () => void;
  /** La place, en haut, où une scène peut poser une puce — le temps d'un
   * AMRAP. */
  onHeaderSlot: (element: HTMLElement | null) => void;
  /** Un mot posé quelques secondes sous la barre : « Reprise au bloc 2 ». */
  notice?: string;
  /**
   * Le haut se tait : l'écran « Bloc suivant » porte déjà le rang et le nom
   * du bloc, en grand, juste dessous. Les deux boutons restent.
   */
  quietHeading?: boolean;
  children: ReactNode;
}

/**
 * Ce qui entoure toutes les scènes : le cadre, le haut, la barre des blocs.
 *
 * Le haut dit dans quel bloc on est — son rang et son nom — avec le son et
 * la pause à droite. Il disait « 9 / 12 » : un compteur d'écrans, qui
 * annonçait « 9 / 9 » en entrant dans un bloc où il restait sept séries. On
 * compte en blocs.
 *
 * Posé à plat, ce haut coûterait un cinquième des 390 px de haut : il
 * disparaît, le titre du bloc se lit dans la scène et les deux boutons
 * rejoignent la barre. Un seul exemplaire de chaque bouton est monté à la
 * fois : deux boutons identiques dans l'arbre annonceraient deux sorties à
 * un lecteur d'écran.
 */
export const SceneShell = ({
  rank,
  title,
  parts,
  current,
  valuetext,
  onPause,
  onHeaderSlot,
  notice,
  quietHeading = false,
  children,
}: SceneShellProps) => {
  // Le son se coupe là où il s'entend, à côté de la pause.
  const soundToggle = <SoundToggle color="fg.muted" />;
  const pauseButton = (
    <Box
      as="button"
      // « la séance », pour ne pas se confondre avec l'horloge d'un tour, qui
      // porte déjà « Mettre en pause — 57 s restant » : deux commandes au
      // même nom, l'une figeant tout et l'autre une seule horloge.
      aria-label="Mettre la séance en pause"
      display="grid"
      placeItems="center"
      w="44px"
      h="44px"
      flexShrink={0}
      borderRadius="full"
      bg="bg.surface"
      color="fg"
      onClick={onPause}
    >
      <LuPause size={20} />
    </Box>
  );

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Séance guidée"
      position="fixed"
      inset={0}
      zIndex={50}
      bg={{ base: 'bg.canvas', md: 'blackAlpha.800' }}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent={{ base: 'stretch', md: 'center' }}
      // Un iPhone posé à plat fait 844 px de large : il franchit le seuil `md`
      // et recevait la mise en page de bureau — une carte flottante de 560 px
      // sur un fond assombri, haute comme 90 % d'un écran qui n'a déjà pas
      // beaucoup de hauteur. Le seuil regarde la largeur ; ici c'est la
      // hauteur qui décide.
      css={{
        [LANDSCAPE]: { justifyContent: 'stretch', background: 'transparent' },
      }}
    >
      <Box
        w="full"
        maxW={{ base: 'full', md: '560px' }}
        h={{ base: 'full', md: '90vh' }}
        maxH={{ base: 'full', md: '720px' }}
        css={{
          [LANDSCAPE]: {
            maxWidth: '100%',
            height: '100%',
            maxHeight: '100%',
            borderRadius: 0,
            boxShadow: 'none',
          },
        }}
        bg="bg.canvas"
        borderRadius={{ base: 0, md: '2xl' }}
        boxShadow={{ md: '0 24px 64px rgba(0,0,0,0.5)' }}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        position="relative"
        // Le fond d'une phase de Tabata se pose derrière la scène : sans
        // contexte d'empilement propre, il passerait aussi derrière le fond
        // de cette carte, donc hors de vue.
        isolation="isolate"
      >
        <HStack
          px={5}
          pt="18px"
          pb={3}
          minH="66px"
          gap={2.5}
          css={{ [LANDSCAPE]: { display: 'none' } }}
        >
          <VStack
            align="start"
            gap="6px"
            flex={1}
            minW={0}
            visibility={quietHeading ? 'hidden' : undefined}
          >
            <Text
              fontSize="11px"
              fontWeight="800"
              letterSpacing="0.14em"
              textTransform="uppercase"
              lineHeight="1"
              color="fg.muted"
            >
              {rank}
            </Text>
            <Text
              as="h2"
              fontSize="18px"
              fontWeight="bold"
              lineHeight="1.1"
              lineClamp={1}
              color="fg"
            >
              {title}
            </Text>
          </VStack>
          {/* La place d'une puce que la scène y pose : le temps d'un AMRAP.
              Vide ailleurs. */}
          <Box ref={onHeaderSlot} display="contents" />
          {soundToggle}
          {pauseButton}
        </HStack>

        <HStack
          gap={3}
          px={5}
          align="center"
          css={{ [LANDSCAPE]: { paddingTop: '10px' } }}
        >
          {/* Un segment par bloc, tous de la même largeur : la barre dit
              « bloc 2 sur 3 », pas la durée de chacun. Fait : sarcelle. En
              cours : ambre, rempli au prorata des séries cochées ou des tours
              passés. Le reste : la piste. */}
          <HStack
            gap="5px"
            flex={1}
            role="progressbar"
            aria-label="Avancement de la séance"
            aria-valuemin={0}
            aria-valuemax={parts.length}
            aria-valuenow={current}
            aria-valuetext={valuetext}
          >
            {parts.map((part, i) => (
              <Box
                key={i}
                flex={1}
                h="6px"
                borderRadius="3px"
                bg="bg.surface"
                overflow="hidden"
              >
                <Box
                  h="100%"
                  borderRadius="3px"
                  w={`${part * 100}%`}
                  bg={i < current ? 'session.rest' : 'app.primary'}
                  transition="width 0.25s"
                  _motionReduce={{ transition: 'none' }}
                />
              </Box>
            ))}
          </HStack>
          <Box
            display="none"
            flexShrink={0}
            mt={-1}
            css={{ [LANDSCAPE]: { display: 'block' } }}
          >
            <HStack gap={0}>
              {soundToggle}
              {pauseButton}
            </HStack>
          </Box>
        </HStack>

        {/* Posé par-dessus et non dans le flux : la série ne doit pas
            descendre de cinquante pixels puis remonter quand il part. Un
            `status` : un lecteur d'écran l'annonce sans voler le focus. */}
        {notice && (
          <Box
            role="status"
            position="absolute"
            top="96px"
            left={5}
            right={5}
            zIndex={2}
            px={4}
            py={3}
            borderRadius="16px"
            bg="bg.raised"
            boxShadow="0 12px 32px rgba(0, 0, 0, 0.45)"
            fontWeight="bold"
            fontSize="15px"
            textAlign="center"
            css={{ [LANDSCAPE]: { top: '44px' } }}
            data-resume-notice
          >
            {notice}
          </Box>
        )}

        {children}
      </Box>
    </Box>
  );
};
