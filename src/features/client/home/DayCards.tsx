import { Text, VStack } from '@chakra-ui/react';
import { ActionButton, Card, Eyebrow, Mascot } from '@/kit';
import { useCoachVoice } from '@/features/client/common/coach';

/**
 * Un jour sans séance conseillée, quand la semaine en attend encore une.
 *
 * Pas de grand bouton « Démarrer » : ce n'est pas le jour, et la carte le
 * dit. Mais rien ne l'interdit non plus — « La faire aujourd'hui » ouvre la
 * fiche, une touche de plus qu'un jour conseillé, parce que c'est un choix
 * et non le cours normal.
 */
export const RestCard = ({
  doneToday,
  day,
  name,
  detail,
  onOpen,
}: {
  /** Une séance a déjà été faite aujourd'hui : ce n'est plus du repos. */
  doneToday: boolean;
  /** « jeudi ». */
  day: string;
  name: string;
  /** « ≈ 45 min · Échauffement, EMOM, AMRAP ». */
  detail: string;
  onOpen: () => void;
}) => (
  <Card label="Aujourd'hui">
    <Eyebrow tone="teal">
      {doneToday ? "C'est fait pour aujourd'hui" : "Aujourd'hui, repos"}
    </Eyebrow>
    <Text as="h2" fontSize="24px" fontWeight="800" lineHeight="1.15">
      Prochaine séance {day}
    </Text>
    <VStack
      align="stretch"
      gap="6px"
      bg="bg.surface"
      borderRadius="18px"
      px={4}
      py="14px"
    >
      <Text fontSize="17px" fontWeight="bold">
        {name}
      </Text>
      <Text fontSize="sm" color="fg.muted">
        {detail}
      </Text>
    </VStack>
    <ActionButton tone="ghost" size="md" w="full" onClick={onOpen}>
      La faire aujourd&rsquo;hui
    </ActionButton>
  </Card>
);

/**
 * La semaine pleine : il n'y a plus rien à faire, et la carte le dit au
 * lieu de pousser la séance suivante du cycle.
 *
 * « Refaire une séance » reste, en bouton discret : quelqu'un qui veut
 * s'entraîner un dimanche n'a pas à chercher comment.
 */
export const FullCard = ({ onMore }: { onMore: () => void }) => (
  <Card label="Aujourd'hui" align="center" textAlign="center" gap={3}>
    <Mascot mood="bravo" size={96} />
    <Text as="h2" fontSize="24px" fontWeight="800" lineHeight="1.15">
      Tout est fait
    </Text>
    <Text color="fg.muted">
      Repose-toi. La semaine prochaine commence lundi.
    </Text>
    <ActionButton tone="ghost" size="md" onClick={onMore}>
      Refaire une séance
    </ActionButton>
  </Card>
);

/**
 * La toute première fois seulement : ce qui va se passer, en deux phrases.
 *
 * Le coach a écrit un programme à quelqu'un qui n'a jamais ouvert Kettle ;
 * savoir qu'on dira comment c'était à la fin, et que cela sert à régler la
 * suite, change la façon dont on fait la première séance.
 */
export const HowItWorks = () => {
  const coach = useCoachVoice();
  return (
    <VStack
      as="section"
      aria-label="Comment ça marche"
      align="stretch"
      gap="6px"
      borderRadius="card"
      p="18px"
      boxShadow="inset 0 0 0 1.5px {colors.line}"
    >
      <Text fontWeight="bold">Comment ça marche</Text>
      <Text fontSize="sm" color="fg.muted">
        Tu suis la séance pas à pas. À la fin, tu dis comment c&rsquo;était :{' '}
        {coach.inline} s&rsquo;en sert pour régler la suite.
      </Text>
    </VStack>
  );
};
