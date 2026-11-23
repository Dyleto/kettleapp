import { useState } from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuPlay, LuWifiOff } from 'react-icons/lu';
import {
  ActionButton,
  AutoResizeTextarea,
  Banner,
  Bubble,
  Card,
  Chip,
  type ChipTone,
  DateInput,
  Dots,
  EmptyState,
  ErrorState,
  Eyebrow,
  HeroCard,
  LinkButton,
  Mascot,
  type MascotMood,
  Ring,
  Segments,
  Sheet,
} from '@/kit';

const TONES: ChipTone[] = [
  'neutral',
  'amber',
  'teal',
  'coral',
  'blue',
  'green',
  'outline',
];
const MOODS: MascotMood[] = ['hello', 'effort', 'bravo', 'sleep', 'oops'];

/** Une pièce de la planche : son nom, ce qu'on en montre. */
const Piece = ({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) => (
  <VStack
    as="section"
    aria-label={name}
    align="stretch"
    gap={3}
    py={5}
    borderTop="1px solid"
    borderColor="line"
    data-piece={name}
  >
    <Text as="h2" fontSize="lg" fontWeight="800">
      {name}
    </Text>
    {children}
  </VStack>
);

/**
 * La planche du kit : chaque pièce, dans chacun de ses états, sur une seule
 * page.
 *
 * Une pièce du kit ne se voit d'ordinaire que dans l'écran qui l'emploie, et
 * dans l'état où cet écran la met : une pastille corail n'existe qu'à la fin
 * d'une séance, une bulle sur fond relevé que dans une feuille. Changer une
 * pièce, c'était aller vérifier dix écrans à la main. Ici, tout est côte à
 * côte, et le banc ouvre la page pour s'assurer qu'aucune ne déborde ni ne
 * casse.
 *
 * Servie en développement seulement : la route n'existe pas dans la
 * version de production, et ce fichier n'y est pas embarqué.
 */
const KitBoard = () => {
  const [sheet, setSheet] = useState(false);
  const [date, setDate] = useState('2026-11-12');
  const [text, setText] = useState('Dur sur la fin.');
  return (
    <Box
      as="main"
      id="contenu"
      maxW="760px"
      mx="auto"
      px={4}
      py={8}
      bg="bg.canvas"
      minH="100dvh"
    >
      <Text as="h1" fontSize="32px" fontWeight="800" mb={2}>
        Le kit
      </Text>
      <Text color="fg.muted" mb={4}>
        Chaque pièce, dans chacun de ses états.
      </Text>

      <Piece name="Boutons">
        <ActionButton size="lg" w="full">
          <LuPlay size={18} fill="currentColor" aria-hidden />
          Démarrer
        </ActionButton>
        <HStack gap={3} wrap="wrap">
          <ActionButton tone="ghost" size="md">
            Contour
          </ActionButton>
          <ActionButton tone="soft" size="md">
            Sombre
          </ActionButton>
          <ActionButton tone="danger" size="md">
            Supprimer
          </ActionButton>
          <ActionButton size="md" disabled>
            Inactif
          </ActionButton>
        </HStack>
        <LinkButton onClick={() => {}}>Un lien discret</LinkButton>
      </Piece>

      <Piece name="Pastilles">
        {(['md', 'lg'] as const).map((size) => (
          <HStack key={size} gap="6px" wrap="wrap" data-chip-row={size}>
            {TONES.map((tone) => (
              <Chip key={tone} tone={tone} size={size}>
                {tone}
              </Chip>
            ))}
          </HStack>
        ))}
      </Piece>

      <Piece name="Bulles">
        <Bubble from="Julie te dit :">
          Focus qualité de mouvement, pas de charge lourde.
        </Bubble>
        <Bubble clamp={2}>
          Un mot long, coupé à deux lignes : on le lit en entier ailleurs, là où
          il a la place. Ce qui dépasse ne s’affiche pas ici, et la bulle garde
          sa hauteur.
        </Bubble>
        <Bubble size="sm">Une consigne de bloc, plus petite.</Bubble>
        <Box bg="bg.surface" p={3} borderRadius="xl">
          <Bubble tone="raised" from="Julie te dit :">
            Dans une feuille, sur un fond relevé.
          </Bubble>
        </Box>
      </Piece>

      <Piece name="Cartes">
        <HeroCard label="Carte mise en avant">
          <Eyebrow tone="amber">À faire aujourd’hui</Eyebrow>
          <Text as="h3" fontSize="28px" fontWeight="800">
            Haut du corps
          </Text>
          <Bubble tone="hero" from="Julie te dit :">
            Sur le dégradé, la bulle s’assombrit.
          </Bubble>
        </HeroCard>
        <Card label="Carte pleine">
          <Eyebrow tone="teal">Aujourd’hui, repos</Eyebrow>
          <Text>Une carte : le fond, l’arrondi, l’espacement.</Text>
        </Card>
        <Card label="Carte à contour" variant="outline">
          <Eyebrow>Comment ça marche</Eyebrow>
          <Text color="fg.muted">Une information, sans action.</Text>
        </Card>
      </Piece>

      <Piece name="Progression">
        <HStack gap={6} wrap="wrap">
          <Ring
            part={2 / 3}
            size={76}
            stroke={13}
            color="var(--chakra-colors-session-rest)"
          >
            <Text fontWeight="800">2/3</Text>
          </Ring>
          <Ring part={0.3} size={120} color="var(--chakra-colors-app-primary)">
            <Text fontWeight="800" fontSize="xl">
              0:42
            </Text>
          </Ring>
        </HStack>
        <Dots marks={['done', 'done', 'now', 'todo', 'todo']} />
        <Segments parts={[1, 0.38, 0]} />
      </Piece>

      <Piece name="Personnage">
        <HStack gap={4} wrap="wrap">
          {MOODS.map((mood) => (
            <VStack key={mood} gap={1}>
              <Mascot mood={mood} size={64} />
              <Text fontSize="xs" color="fg.muted">
                {mood}
              </Text>
            </VStack>
          ))}
        </HStack>
      </Piece>

      <Piece name="États">
        <EmptyState
          mood="sleep"
          title="Ton programme arrive"
          line="Julie prépare tes séances. Tu n’as rien à faire : elles apparaîtront ici."
        />
        <ErrorState onRetry={() => {}} line="Ton programme n’a pas bougé." />
        <Banner
          tone="coral"
          icon={<LuWifiOff size={20} />}
          title="Hors connexion"
          line="Tu peux faire ta séance : elle s’enverra au retour du réseau."
        />
      </Piece>

      <Piece name="Saisie">
        <DateInput ariaLabel="Une date" value={date} onChange={setDate} />
        <AutoResizeTextarea
          aria-label="Un mot"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Piece>

      <Piece name="Feuille">
        <ActionButton tone="ghost" size="md" onClick={() => setSheet(true)}>
          Ouvrir la feuille
        </ActionButton>
        {sheet && (
          <Sheet label="Une feuille" onDismiss={() => setSheet(false)}>
            <Text as="h3" fontSize="22px" fontWeight="800">
              Une feuille
            </Text>
            <Text color="fg.muted">
              Pour régler, choisir, répondre : tout ce qui ne mérite pas un
              écran.
            </Text>
            <ActionButton size="lg" w="full" onClick={() => setSheet(false)}>
              Fermer
            </ActionButton>
          </Sheet>
        )}
      </Piece>
    </Box>
  );
};

export default KitBoard;
