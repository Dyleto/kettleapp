import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { CompletedSession, Session } from '@/types';
import { hitArea } from '@/components/hitArea';
import { EFFORT_ZONE_COLOR } from '../constants';
import { getEffortSummary } from '../format';
import { dayKey, mondayIndex, WEEKDAY_LETTERS } from '../sessionDates';
import { WeekDayPlan } from '../weekPlan';

interface WeekStripProps {
  days: WeekDayPlan[];
  /** Ouvre le détail d'une séance déjà faite. */
  onOpenCompleted: (completed: CompletedSession) => void;
  /** Ouvre une séance conseillée mais pas encore faite. */
  onOpenSession: (session: Session) => void;
}

/**
 * La semaine en cours, lundi à dimanche : ce qui est prévu, ce qui est fait.
 *
 * L'accueil disait ce qu'il restait à faire et ce qui venait d'être fait,
 * jamais où on en était de sa semaine. « J'y suis allé deux fois » se compte
 * autrement quand on le voit — et un lundi vide en fin de journée n'est pas
 * la même information qu'un lundi vide le matin.
 *
 * Chaque jour qui porte quelque chose est un bouton : la bande avait l'air
 * cliquable et ne l'était pas. Elle ne filtre rien — filtrer trois séances
 * récentes sur sept jours vide l'écran cinq fois sur sept, et l'historique
 * fait déjà ça sur un mois entier. Elle mène à ce que le jour contient : le
 * le détail pour un jour fait, la séance pour un jour conseillé.
 */
export const WeekStrip = ({
  days,
  onOpenCompleted,
  onOpenSession,
}: WeekStripProps) => {
  const todayKey = dayKey(new Date());
  const count = days.reduce((sum, d) => sum + d.done.length, 0);

  return (
    <VStack align="stretch" gap={2}>
      <HStack justify="space-between" align="baseline" maxW="420px">
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          Cette semaine
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {count === 0
            ? 'aucune séance'
            : `${count} séance${count > 1 ? 's' : ''}`}
        </Text>
      </HStack>

      {/* Plafonnée : sept cases d'une lettre et deux chiffres n'ont pas besoin
          de 600 px. Au-delà, la bande se lit comme un ruban vide. */}
      {/* `role="group"` et non `list` : les jours qui portent quelque chose
          sont des boutons, et un `role="listitem"` posé dessus leur retirerait
          leur sémantique de commande. */}
      <HStack
        gap={1}
        maxW="420px"
        role="group"
        aria-label="Séances de la semaine"
      >
        {days.map(({ date, key, done, suggested }) => {
          const isToday = key === todayKey;
          const isFuture = key > todayKey;
          const effort = done.length > 0 ? getEffortSummary(done[0]) : null;
          const letter = WEEKDAY_LETTERS[mondayIndex(date)];

          // Une séance conseillée qu'on a faite ce jour-là n'a plus à
          // s'annoncer. Mais une autre, conseillée le même jour et pas encore
          // faite, si : un dimanche où l'on a fait la 4 ne rend pas la 3
          // inexistante.
          const pending = suggested.filter(
            (s) => !done.some((d) => d.originalSessionId === s._id)
          );

          const target =
            done.length > 0
              ? 'completed'
              : pending.length > 0
                ? 'session'
                : null;
          const label = `${letter} ${date.getDate()} — ${
            done.length > 0
              ? `${done.length} séance${done.length > 1 ? 's' : ''} faite${done.length > 1 ? 's' : ''}, voir le détail`
              : pending.length > 0
                ? `séance ${pending[0].order} conseillée, l'ouvrir`
                : 'aucune séance'
          }`;

          const content = (
            <>
              <Text fontSize="xs" color="fg.muted" aria-hidden>
                {letter}
              </Text>
              <Text
                fontSize="xs"
                fontFamily="mono"
                color={done.length > 0 ? 'fg' : 'whiteAlpha.600'}
                fontWeight={isToday ? 'bold' : 'normal'}
                aria-hidden
              >
                {date.getDate()}
              </Text>
              {/* Trois états sur la même ligne de pastilles : plein pour ce
                  qui est fait — couleur du ressenti, comme le calendrier de
                  l'historique —, creux pour ce qui est conseillé et pas
                  encore fait, rien du tout sinon.

                  Ni l'un ni l'autre n'est en ambre : une pastille de semaine
                  ne se clique pas et ne dit pas où l'on est. C'est le plein
                  contre le creux qui distingue fait de prévu — la couleur n'a
                  jamais rien ajouté là-dessus. */}
              <HStack gap="2px" h="5px" justify="center" aria-hidden>
                {done.map((s) => (
                  <Box
                    key={s._id}
                    w="5px"
                    h="5px"
                    borderRadius="full"
                    bg={effort ? EFFORT_ZONE_COLOR[effort.zone] : 'fg.muted'}
                  />
                ))}
                {pending.map((s) => (
                  <Box
                    key={s._id}
                    w="5px"
                    h="5px"
                    borderRadius="full"
                    borderWidth="1px"
                    borderColor="fg.muted"
                  />
                ))}
              </HStack>
            </>
          );

          const shared = {
            flex: 1,
            minW: 0,
            gap: 1,
            py: 2,
            borderRadius: 'md',
            borderWidth: '1px',
            borderColor: isToday ? 'app.primary' : 'transparent',
            bg: done.length > 0 ? 'whiteAlpha.50' : 'transparent',
          } as const;

          // Un jour vide ne prétend pas être une commande : pas de bouton, pas
          // de survol, pas de tabulation. Un état désactivé honnête vaut mieux
          // qu'un clic qui ne fait rien.
          if (!target) {
            return (
              <VStack
                key={key}
                aria-label={label}
                {...shared}
                opacity={isFuture ? 0.45 : 1}
              >
                {content}
              </VStack>
            );
          }

          return (
            <VStack
              key={key}
              as="button"
              aria-label={label}
              onClick={() =>
                target === 'completed'
                  ? onOpenCompleted(done[0])
                  : onOpenSession(pending[0])
              }
              {...shared}
              opacity={isFuture ? 0.45 : 1}
              cursor="pointer"
              css={hitArea(44)}
              _hover={{ bg: 'app.primary/12' }}
              transition="background-color 0.15s"
            >
              {content}
            </VStack>
          );
        })}
      </HStack>
    </VStack>
  );
};
