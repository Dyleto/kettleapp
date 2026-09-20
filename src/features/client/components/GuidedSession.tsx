import { BlockExercise, PerformedValues, Session, SessionBlock } from '@/types';
import {
  buildGuidedSteps,
  doseDuTour,
  type Effort,
  type GuidedStep,
} from '../guidedSteps';
import { useCountdown } from '../useCountdown';
import { BlockCard } from '@/features/program/components/BlockCard';
import {
  blockDefinesOwnMetrics,
  blockHasClock,
  prescribedSetLabels,
  restBetweenSetsOf,
} from '@/features/program/constants';
import { PerformedFields } from './PerformedFields';
import {
  formatLastPerformance,
  LastPerformance,
  performedKey,
} from '../lastPerformance';
import { Box, HStack, Button, Input, VStack, Text } from '@chakra-ui/react';
import VideoPlayer from '@/components/VideoPlayer';
import { hitArea } from '@/components/hitArea';
import { formatCountdown } from '@/utils/formatters';
import { formatDuration } from '@/utils/duration';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuCheck, LuInfo, LuTimer, LuX } from 'react-icons/lu';
import { compterNotes, ecrireSeance, lireSeance } from '../seanceEnCours';

interface GuidedSessionProps {
  session: Session;
  onExit: () => void;
  onFinish: () => void;
  lastPerformance?: Map<string, LastPerformance>;
  /**
   * Ce qui a déjà été noté, et de quoi le compléter — le même état que celui
   * du bilan de fin. Retour du terrain : « dommage de ne pas pouvoir noter
   * les charges pendant. » On note donc là où on est, et le bilan retrouve la
   * saisie déjà faite au lieu de la redemander.
   */
  performed?: Record<string, PerformedValues>;
  onPerformedChange?: (key: string, next: PerformedValues) => void;
}

interface MinuteurProps {
  duration: number;
  /**
   * Fourni quand l'horloge mène — un repos imposé, un tour à cadence : elle
   * enchaîne d'elle-même, c'est le format. Absent quand elle accompagne : un
   * effort chronométré s'arrête et attend, parce que personne n'a envie de
   * voir la page changer sous ses yeux alors qu'il finit sa dernière rep.
   */
  onComplete?: () => void;
  couleur: string;
  /** La piste sous la jauge — plus sombre sur un fond clair. */
  piste?: string;
  /** Ce qui se lit à gauche du temps : le bloc et le tour, « Repos »… */
  titre?: React.ReactNode;
  holdLabel?: string;
  /**
   * Plus petit quand il coiffe une liste : dans un AMRAP, la pendule compte,
   * mais c'est la liste des mouvements qu'on est venu lire.
   */
  compact?: boolean;
}

// C'est le seul écran utilisé pendant l'effort, celui où l'on peut le moins se
// permettre de perdre sa place : un appel entrant ou un écran verrouillé trop
// longtemps ne doit pas renvoyer à l'étape 1 d'une séance qui en compte
// quarante.
//
// La position rejoint les charges dans un seul enregistrement durable — voir
// `seanceEnCours`. Elles étaient séparées, et rangées dans deux mémoires de
// durées différentes : l'application gardait ce qui se retrouve et perdait ce
// qui ne se retrouve pas.
const readSavedIndex = (sessionId: string): number =>
  lireSeance(sessionId)?.etape ?? 0;

const writeSavedIndex = (sessionId: string, index: number) =>
  ecrireSeance(sessionId, { etape: index });

/**
 * Le temps, et la jauge qui se vide.
 *
 * Le décompte vivait dans un anneau. Deux choses le condamnaient. Une
 * longueur se lit plus vite qu'un angle du coin de l'œil — et c'est
 * exactement l'usage : un regard entre deux répétitions, le téléphone posé
 * par terre. Et l'anneau parlait une langue que l'écran n'employait nulle
 * part ailleurs, alors que l'avancement de la séance est déjà une barre, en
 * haut. L'écran n'a plus qu'un vocabulaire.
 *
 * Ce que l'anneau faisait bien est gardé : entre deux secondes, le chiffre ne
 * bouge pas, et un chronomètre dont on ignore s'il tourne est pire que pas de
 * chronomètre. La jauge coule sur une seconde. À l'arrêt, plus de transition —
 * la pause doit se voir tout de suite, pas glisser encore une seconde.
 */
const Minuteur = ({
  duration,
  onComplete,
  couleur,
  piste = 'whiteAlpha.200',
  titre,
  holdLabel,
  compact = false,
}: MinuteurProps) => {
  const { remaining, isRunning, pause, resume } = useCountdown(duration, {
    onComplete,
  });
  const isDone = remaining === 0;

  useEffect(() => {
    if (remaining > 0 && remaining <= 3) {
      navigator.vibrate?.(150);
    }
  }, [remaining]);

  // Le décompte qui ne rend pas la main tout seul se signale une fois,
  // franchement : personne ne regarde l'écran à ce moment-là.
  useEffect(() => {
    if (isDone && !onComplete) {
      navigator.vibrate?.([120, 80, 120]);
    }
  }, [isDone, onComplete]);

  const lu = formatCountdown(remaining);
  const part =
    duration > 0 ? Math.max(0, Math.min(1, remaining / duration)) : 0;

  return (
    <Box
      as="button"
      w="full"
      textAlign="left"
      onClick={isDone ? undefined : () => (isRunning ? pause() : resume())}
      cursor={isDone ? 'default' : 'pointer'}
      // Le temps restant fait partie du nom : sans lui, qui n'a pas l'écran
      // sous les yeux peut mettre en pause sans jamais savoir où il en est.
      aria-label={
        isDone
          ? 'Temps écoulé'
          : `${isRunning ? 'Mettre en pause' : 'Reprendre le décompte'} — ${lu} restant`
      }
    >
      <HStack justify="space-between" align="flex-end" gap={3}>
        <Box minW={0}>{titre}</Box>
        <Text
          fontSize={compact ? '40px' : '72px'}
          fontWeight="800"
          lineHeight="0.85"
          letterSpacing={compact ? '-1px' : '-3px'}
          fontVariantNumeric="tabular-nums"
          color={couleur}
          opacity={isRunning || isDone ? 1 : 0.5}
          flexShrink={0}
        >
          {lu}
        </Text>
      </HStack>

      <Box
        mt={compact ? 2 : 3}
        h={compact ? '6px' : '10px'}
        borderRadius="full"
        bg={piste}
        overflow="hidden"
      >
        <Box
          h="100%"
          borderRadius="full"
          bg={couleur}
          style={{
            width: `${part * 100}%`,
            transition: isRunning ? 'width 1s linear' : 'none',
          }}
        />
      </Box>

      {isDone && holdLabel ? (
        <Text fontSize="sm" color={couleur} opacity={0.75} mt={2}>
          {holdLabel}
        </Text>
      ) : (
        !isRunning && (
          <Text fontSize="xs" color={couleur} opacity={0.75} mt={2}>
            En pause — toucher pour reprendre
          </Text>
        )
      )}
    </Box>
  );
};

/**
 * Les étapes regroupées par bloc, dans l'ordre.
 *
 * Une trentaine de tirets de deux pixels ne se lisent pas : on ne sait ni où
 * l'on en est, ni combien il reste. Trois segments — Échauffement, EMOM,
 * AMRAP — se lisent d'un coup d'œil, et c'est en blocs que le client raisonne,
 * pas en pages.
 *
 * La largeur de chaque segment suit son nombre d'étapes : un EMOM de douze
 * pages est plus large qu'un échauffement de deux. Des segments égaux
 * mentiraient sur ce qu'il reste à faire.
 */
/**
 * Ce qu'une étape pèse dans la barre — pas toujours une page.
 *
 * Un bloc lu d'un coup ne fait qu'une étape, mais un AMRAP de douze minutes
 * n'est pas un douzième de l'effort d'un EMOM de douze pages. Sa largeur suit
 * donc ce qu'il contient, et pas le nombre de fois qu'on tape « Suivant ».
 */
const poidsDe = (step: GuidedStep) =>
  step.type === 'block' ? Math.max(1, step.block.exercises.length) : 1;

const decouperEnBlocs = (steps: GuidedStep[]) => {
  const blocs: {
    label: string;
    debut: number;
    /** Nombre d'étapes — ce qui fait avancer le remplissage. */
    taille: number;
    /** Ce que le bloc représente — ce qui fait la largeur du segment. */
    poids: number;
  }[] = [];
  steps.forEach((step, i) => {
    const dernier = blocs[blocs.length - 1];
    if (dernier && dernier.label === step.blockLabel) {
      dernier.taille += 1;
      dernier.poids += poidsDe(step);
      return;
    }
    blocs.push({
      label: step.blockLabel,
      debut: i,
      taille: 1,
      poids: poidsDe(step),
    });
  });
  return blocs;
};

/**
 * Un décompte proposé plutôt qu'imposé.
 *
 * Le déroulé page à page donnait un chronomètre plein écran à chaque effort
 * chronométré et à chaque repos. C'est cette mise en scène que le retour du
 * terrain refusait — « pas 7 reps back squat, puis 120 s repos, puis
 * 6 reps » —, pas le chronomètre lui-même, qui rendait service. Le supprimer
 * avec l'écran, ce serait jeter la chose utile avec sa mauvaise présentation.
 *
 * Il vit donc sous la ligne qui le prescrit : « 2 min » pour l'effort,
 * « repos 45 s » pour ce qui suit. On le lance quand on y est, et il redevient
 * un bouton une fois fini — parce qu'il reste trois séries à faire.
 */
const MinuteurALaDemande = ({
  duration,
  libelle,
  couleur,
}: {
  duration: number;
  libelle: string;
  couleur: string;
}) => {
  const [enCours, setEnCours] = useState(false);

  if (enCours)
    return (
      <Box pl={4} py={1}>
        <Minuteur
          duration={duration}
          couleur={couleur}
          onComplete={() => {
            // Personne ne regarde l'écran à ce moment-là : on le dit au
            // poignet. `Minuteur` ne le fait lui-même que sans `onComplete`.
            navigator.vibrate?.([120, 80, 120]);
            setEnCours(false);
          }}
          compact
        />
      </Box>
    );

  return (
    <Box pl={4}>
      <Box
        as="button"
        onClick={() => setEnCours(true)}
        aria-label={`Lancer le décompte — ${libelle}`}
        minH="44px"
        display="flex"
        alignItems="center"
        fontSize="xs"
        color={couleur}
        fontWeight="bold"
        _hover={{ opacity: 0.8 }}
      >
        <HStack gap={1.5}>
          <LuTimer size={13} />
          <Text as="span">{libelle}</Text>
        </HStack>
      </Box>
    </Box>
  );
};

/**
 * Un tour, avec son horloge.
 *
 * Trois choses que le déroulé page-par-page ne pouvait pas dire, et qui sont
 * tout ce dont on a besoin au milieu d'un EMOM :
 *
 *   — dans quel tour on est (dix écrans identiques ne le disaient pas),
 *   — combien de temps il reste dans la minute (l'horloge était absente du
 *     seul format qui se définit par elle),
 *   — ce qu'il reste à faire dans ce tour (on ne voyait qu'un mouvement).
 *
 * Le Tabata et l'On-Off imposent en plus leur repos : l'horloge enchaîne
 * alors d'elle-même le travail puis le repos. Sur un EMOM, le repos est ce
 * qu'il reste de l'intervalle — il n'a pas de page, parce qu'il n'a pas de
 * durée propre.
 */
const Tour = ({
  step,
  onDone,
  lastPerformance,
  onOuvrirDetail,
}: {
  step: Extract<GuidedStep, { type: 'round' }>;
  /** Le tour est fini : on enchaîne. */
  onDone: () => void;
  lastPerformance?: Map<string, LastPerformance>;
  onOuvrirDetail: (ex: BlockExercise) => void;
}) => {
  const [phase, setPhase] = useState<'travail' | 'repos'>('travail');
  const enRepos = phase === 'repos';
  const duree = enRepos ? step.restSeconds : step.workSeconds;

  // Le travail fini, on passe au repos s'il en existe un d'imposé — sinon le
  // tour est fini et le suivant part, ce qui est la définition du format.
  const finDePhase = () => {
    if (!enRepos && step.restSeconds) {
      setPhase('repos');
      return;
    }
    navigator.vibrate?.([120, 80, 120]);
    onDone();
  };

  return (
    <VStack flex={1} align="stretch" gap={4} px={5} py={2} overflowY="auto">
      {duree ? (
        <Minuteur
          // La clé porte la phase autant que le tour : sans elle, le décompte
          // du repos reprendrait là où celui du travail s'est arrêté.
          key={`${step.round}-${phase}`}
          duration={duree}
          couleur={enRepos ? 'session.rest' : 'fg'}
          onComplete={finDePhase}
          titre={
            <VStack align="start" gap={0.5}>
              <Text
                fontSize="xs"
                letterSpacing="2px"
                textTransform="uppercase"
                fontWeight="800"
                color={enRepos ? 'session.rest' : 'session.work'}
              >
                {enRepos ? 'Repos' : step.blockLabel}
              </Text>
              {/* Le repère qui manquait. Sans lui, les dix tours d'un EMOM
              s'affichaient à l'identique et rien ne disait lequel on vivait. */}
              <Text fontSize="lg" fontWeight="800" lineHeight="1.1">
                Tour {step.round}&nbsp;/&nbsp;{step.rounds}
              </Text>
            </VStack>
          }
        />
      ) : (
        <VStack align="start" gap={0.5}>
          <Text
            fontSize="xs"
            letterSpacing="2px"
            textTransform="uppercase"
            fontWeight="800"
            color={enRepos ? 'session.rest' : 'session.work'}
          >
            {enRepos ? 'Repos' : step.blockLabel}
          </Text>
          {/* Le repère qui manquait. Sans lui, les dix tours d'un EMOM
              s'affichaient à l'identique et rien ne disait lequel on vivait. */}
          <Text fontSize="lg" fontWeight="800" lineHeight="1.1">
            Tour {step.round}&nbsp;/&nbsp;{step.rounds}
          </Text>
        </VStack>
      )}

      {/* Ce qu'il y a à faire dans ce tour — tout, pas un mouvement à la
          fois. En repos imposé, la liste reste : c'est ce qu'on relit pour
          se préparer au tour suivant. */}
      <VStack align="stretch" gap={0} opacity={enRepos ? 0.6 : 1}>
        {step.exercises.map((ex, i) => {
          const aDuDetail =
            !!ex.note?.trim() ||
            !!ex.exercise.description?.trim() ||
            !!ex.exercise.videoUrl?.trim();
          const derniere = formatLastPerformance(
            lastPerformance?.get(ex.exercise._id)
          );
          return (
            <Box
              key={`${ex.order}-${ex.exercise._id}`}
              borderTopWidth={i === 0 ? 0 : '1px'}
              borderColor="whiteAlpha.100"
              py={3}
            >
              <HStack justify="space-between" align="baseline" gap={3}>
                {aDuDetail ? (
                  <Box
                    as="button"
                    textAlign="left"
                    minW={0}
                    aria-label={`Voir la consigne — ${ex.exercise.name}`}
                    onClick={() => onOuvrirDetail(ex)}
                    css={hitArea(44)}
                  >
                    <HStack gap={1.5} align="center">
                      <Text fontSize="lg" fontWeight="bold">
                        {ex.exercise.name}
                      </Text>
                      <Box color="app.primary" flexShrink={0}>
                        <LuInfo size={15} />
                      </Box>
                    </HStack>
                  </Box>
                ) : (
                  <Text fontSize="lg" fontWeight="bold" minW={0}>
                    {ex.exercise.name}
                  </Text>
                )}
                <Text
                  fontSize="xl"
                  fontWeight="800"
                  fontFamily="mono"
                  flexShrink={0}
                >
                  {doseDuTour(step.block, ex) || '—'}
                </Text>
              </HStack>
              {derniere && (
                <Text fontSize="xs" color="fg.muted">
                  la dernière fois&nbsp;: {derniere}
                </Text>
              )}
            </Box>
          );
        })}
      </VStack>

      {/* Sur le dernier tour seulement : ailleurs, le compteur dit déjà qu'il
          reste des tours, et annoncer « ensuite : tour 4 » n'apprend rien. */}
      {step.nextLabel && (
        <Text fontSize="xs" color="fg.muted" textAlign="center">
          dernier tour — ensuite&nbsp;: {step.nextLabel}
        </Text>
      )}
    </VStack>
  );
};

/**
 * Un bloc qu'on coche, effort par effort.
 *
 * C'était la moitié cassée du mode guidé : la carte de prescription, avec des
 * champs de saisie collés dessus. Rien ne s'y cochait, rien n'y avançait.
 * Mesuré sur une pyramide à sept paliers : une ligne de 14 px et 511 px de
 * noir. Une feuille de papier faisait mieux — on pouvait y barrer.
 *
 * Un seul effort est « en cours ». C'est le seul écrit en grand, et le seul
 * qui porte un champ : la hiérarchie naît de l'état, pas d'un choix
 * typographique arbitraire, et la liste redevient lisible parce qu'un
 * formulaire ne la coupe plus à chaque ligne.
 */
const BlocListe = ({
  bloc,
  efforts,
  faits,
  courant,
  performed,
  onPerformedChange,
  lastPerformance,
  onOuvrirDetail,
}: {
  bloc: SessionBlock;
  efforts: Effort[];
  faits: Set<string>;
  courant: Effort | undefined;
  performed?: Record<string, PerformedValues>;
  onPerformedChange?: (key: string, next: PerformedValues) => void;
  lastPerformance?: Map<string, LastPerformance>;
  onOuvrirDetail: (ex: BlockExercise) => void;
}) => {
  /**
   * Le rang de l'effort dans son exercice, quand il y en a plusieurs.
   *
   * Une pyramide ne fait pas des séries : elle monte et redescend des
   * paliers, et c'est le mot que le coach emploie dans son atelier.
   */
  const rangDe = (e: Effort) =>
    e.total > 1
      ? `${blockDefinesOwnMetrics(bloc.type) ? 'palier' : 'série'} ${e.rang} / ${e.total}`
      : '';

  /** Ce qui a été noté sur cet effort précisément. */
  const valeurDe = (e: Effort) =>
    performed?.[performedKey(e.blockOrder, e.exerciseOrder)]?.sets?.[
      e.rang - 1
    ];

  const ecrire = (e: Effort, champ: 'weight' | 'reps', brut: string) => {
    if (!onPerformedChange) return;
    const cle = performedKey(e.blockOrder, e.exerciseOrder);
    const sets = [...(performed?.[cle]?.sets ?? [])];
    while (sets.length < e.rang) sets.push({});
    const nombre =
      brut.trim() === '' ? undefined : Number(brut.replace(',', '.'));
    sets[e.rang - 1] = {
      ...sets[e.rang - 1],
      [champ]: Number.isFinite(nombre) ? nombre : undefined,
    };
    onPerformedChange(cle, { sets });
  };

  return (
    <VStack align="stretch" gap={1} flex={1} px={5} py={2} overflowY="auto">
      {efforts.map((e) => {
        const fait = faits.has(e.cle);
        const enCours = courant?.cle === e.cle;
        const valeur = valeurDe(e);
        const rang = rangDe(e);

        if (enCours) {
          const derniere = formatLastPerformance(
            lastPerformance?.get(e.exercice.exercise._id)
          );
          const aDuDetail =
            !!e.exercice.note?.trim() ||
            !!e.exercice.exercise.description?.trim() ||
            !!e.exercice.exercise.videoUrl?.trim();
          return (
            <Box
              key={e.cle}
              bg="bg.card"
              borderWidth="1px"
              borderColor="app.primary"
              borderRadius="xl"
              p={4}
              my={1}
            >
              <VStack align="stretch" gap={3}>
                <HStack justify="space-between" align="baseline" gap={3}>
                  {aDuDetail ? (
                    <Box
                      as="button"
                      textAlign="left"
                      minW={0}
                      aria-label={`Voir la consigne — ${e.nom}`}
                      onClick={() => onOuvrirDetail(e.exercice)}
                      css={hitArea(44)}
                    >
                      <HStack gap={1.5} align="center">
                        <Text fontSize="xl" fontWeight="800">
                          {e.nom}
                        </Text>
                        <Box color="app.primary" flexShrink={0}>
                          <LuInfo size={15} />
                        </Box>
                      </HStack>
                    </Box>
                  ) : (
                    <Text fontSize="xl" fontWeight="800" minW={0}>
                      {e.nom}
                    </Text>
                  )}
                  <Text
                    fontSize="2xl"
                    fontWeight="800"
                    fontFamily="mono"
                    flexShrink={0}
                  >
                    {e.dose || '\u2014'}
                  </Text>
                </HStack>

                {(rang || onPerformedChange) && (
                  <HStack justify="space-between" align="center" gap={3}>
                    <Text fontSize="sm" color="fg.muted">
                      {rang}
                    </Text>
                    {onPerformedChange && (
                      <HStack gap={2}>
                        <Text fontSize="sm" color="fg.muted">
                          Fait à
                        </Text>
                        <Input
                          aria-label={`Poids utilisé, en kilos — ${e.nom} ${rang}`}
                          inputMode="decimal"
                          value={valeur?.weight ?? ''}
                          onChange={(ev) =>
                            ecrire(e, 'weight', ev.target.value)
                          }
                          w="76px"
                          minH="44px"
                          textAlign="center"
                          fontFamily="mono"
                          fontWeight="bold"
                          placeholder="—"
                        />
                        <Text fontSize="sm" color="fg.muted">
                          kg
                        </Text>
                      </HStack>
                    )}
                  </HStack>
                )}

                {/* Un effort dont la dose est une durée a besoin d'être
                    chronométré. Le repos automatique couvre le repos, pas le
                    travail : en remplaçant la carte de prescription par les
                    efforts, j'avais retiré le minuteur des « 2 min de corde
                    à sauter » sans m'en apercevoir. Proposé, jamais imposé —
                    on le lance quand on y est. */}
                {e.exercice.duration ? (
                  <Box ml={-4}>
                    <MinuteurALaDemande
                      duration={e.exercice.duration}
                      libelle={formatDuration(e.exercice.duration)}
                      couleur="app.primary"
                    />
                  </Box>
                ) : null}

                <HStack justify="space-between" align="center" gap={3}>
                  {derniere ? (
                    <Text fontSize="xs" color="fg.muted">
                      la dernière fois&nbsp;: {derniere}
                    </Text>
                  ) : (
                    <Box />
                  )}
                  {/* Ce que déclenche « Fait » : sans cette ligne, le repos
                      plein écran arrive par surprise. */}
                  {e.reposApres && (
                    <HStack gap={1.5} color="session.rest" flexShrink={0}>
                      <LuTimer size={13} />
                      <Text fontSize="xs" fontWeight="bold">
                        puis {formatDuration(e.reposApres)} de repos
                      </Text>
                    </HStack>
                  )}
                </HStack>
              </VStack>
            </Box>
          );
        }

        return (
          <HStack
            key={e.cle}
            gap={3}
            minH="44px"
            px={4}
            py={2}
            opacity={fait ? 1 : 0.75}
          >
            <Box
              color={fait ? 'session.rest' : 'whiteAlpha.400'}
              flexShrink={0}
            >
              {fait ? (
                <LuCheck size={16} strokeWidth={3} />
              ) : (
                <Box
                  w="16px"
                  h="16px"
                  borderRadius="full"
                  borderWidth="1.5px"
                  borderColor="whiteAlpha.400"
                />
              )}
            </Box>
            {/* Le nom peut se tronquer, le rang non : c'est lui qui dit où
                l'on en est, et « Fentes marchées · série… » n'apprend rien. */}
            <Text fontSize="sm" color="fg.muted" minW={0} lineClamp={1}>
              {e.nom}
            </Text>
            {rang && (
              <Text fontSize="sm" color="fg.muted" opacity={0.7} flexShrink={0}>
                · {rang}
              </Text>
            )}
            <Box flex={1} />
            {/* Sur ce qui reste à faire, le repos donne le rythme du bloc :
                on voit que les squats sont à 1 min et les fentes à 45 s sans
                avoir à y arriver. Sur ce qui est fait, il n'apprend plus rien
                — c'est la charge qui prend sa place. */}
            {fait ? (
              <Text
                fontSize="sm"
                color="fg.muted"
                fontFamily="mono"
                flexShrink={0}
              >
                {valeur?.weight != null ? `${valeur.weight} kg` : e.dose}
              </Text>
            ) : (
              <>
                {e.reposApres && (
                  <Text
                    fontSize="2xs"
                    color="fg.muted"
                    opacity={0.7}
                    flexShrink={0}
                  >
                    {formatDuration(e.reposApres)}
                  </Text>
                )}
                <Text
                  fontSize="sm"
                  color="fg.muted"
                  fontFamily="mono"
                  flexShrink={0}
                  minW="62px"
                  textAlign="right"
                >
                  {e.dose}
                </Text>
              </>
            )}
          </HStack>
        );
      })}
    </VStack>
  );
};

export const GuidedSession = ({
  session,
  onExit,
  onFinish,
  lastPerformance,
  performed,
  onPerformedChange,
}: GuidedSessionProps) => {
  const [steps] = useState(() => buildGuidedSteps(session));
  // Les blocs ne changent pas pendant la séance : on les découpe une fois.
  const [blocs] = useState(() => decouperEnBlocs(steps));
  const [savedIndex] = useState(() =>
    Math.min(readSavedIndex(session._id), Math.max(0, steps.length - 1))
  );
  const [index, setIndex] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  // La consigne du coach est écrite pour ce moment précis — au milieu de
  // l'effort, mains occupées. Elle était pourtant le seul contenu de la
  // séance inaccessible depuis le plein écran : il fallait en sortir, donc
  // perdre sa place, pour aller la lire.
  //
  // Un tour porte plusieurs mouvements : ce n'est plus « la consigne de
  // l'écran » qu'on ouvre, c'est celle d'un mouvement nommé.
  const [detail, setDetail] = useState<BlockExercise | null>(null);
  // Proposée, jamais imposée : un client qui veut vraiment recommencer ne doit
  // pas se retrouver piégé au milieu de la séance précédente.
  const [showResume, setShowResume] = useState(() => savedIndex > 0);
  // Lu une seule fois, à l'ouverture : c'est l'état d'avant qu'on annonce.
  const [notesGardees] = useState(() =>
    compterNotes(lireSeance(session._id)?.performed ?? {})
  );

  /**
   * Les efforts déjà faits, indépendamment de la position.
   *
   * Remonter lire la consigne du mouvement précédent ne doit rien défaire :
   * où l'on est et ce qu'on a fait sont deux choses, et c'est faute de les
   * distinguer que rien ne se cochait.
   */
  const [faits, setFaits] = useState<string[]>(
    () => lireSeance(session._id)?.faits ?? []
  );
  const faitsSet = useMemo(() => new Set(faits), [faits]);
  // Le repos déclenché par « Fait » : il n'a pas d'étape à lui, il appartient
  // à l'effort qui vient de finir.
  const [repos, setRepos] = useState<{ duree: number; ensuite: string } | null>(
    null
  );

  /**
   * Les tours bouclés, par bloc.
   *
   * Un AMRAP ne se coche pas, il se compte — et ce compte est le score de la
   * séance. Le coach du jeu d'essai le réclame en prose, dans une note libre
   * (« Rythme régulier, viser 5-6 tours »), faute de champ pour le recevoir.
   */
  const [tours, setTours] = useState<Record<string, number>>(
    () => lireSeance(session._id)?.tours ?? {}
  );

  const compterUnTour = (blockOrder: number, delta: number) => {
    const cle = String(blockOrder);
    const suivant = {
      ...tours,
      // Jamais en dessous de zéro : on corrige une erreur de doigt, on ne
      // descend pas dans les négatifs.
      [cle]: Math.max(0, (tours[cle] ?? 0) + delta),
    };
    setTours(suivant);
    ecrireSeance(session._id, { tours: suivant });
    if (delta > 0) navigator.vibrate?.(40);
  };

  const step = steps[index];
  const isLast = index === steps.length - 1;

  // Le premier qui n'est pas fait : on ne force pas l'ordre, on le propose.
  const efforts = step?.type === 'block' ? step.efforts : [];
  const courant = efforts.find((e) => !faitsSet.has(e.cle));
  const blocFini = efforts.length > 0 && !courant;
  const faitsDuBloc = efforts.filter((e) => faitsSet.has(e.cle)).length;
  // Un AMRAP ne se termine pas en cochant : c'est le client qui décide
  // d'arrêter, ou la pendule. Le bouton principal compte, le secondaire sort.
  const estBoucle = step?.type === 'block' && step.forme === 'boucle';

  const marquerFait = () => {
    if (!courant) return;
    const suivant = [...faits, courant.cle];
    setFaits(suivant);
    ecrireSeance(session._id, { faits: suivant });
    navigator.vibrate?.(40);
    // Le repos prescrit part tout seul : c'est le geste que le client ferait
    // de toute façon, et l'oublier coûte la série suivante.
    if (courant.reposApres) {
      const apres = efforts[efforts.indexOf(courant) + 1];
      setRepos({
        duree: courant.reposApres,
        ensuite: apres ? `${apres.nom} · ${apres.dose}` : '',
      });
    }
  };

  const goTo = (next: number) => {
    setIndex(next);
    setDetail(null);
    writeSavedIndex(session._id, next);
  };

  const goNext = () => {
    if (isLast) {
      // On n'efface pas ici : le bilan qui suit se nourrit de ce qui vient
      // d'être noté. L'enregistrement part quand la séance part au serveur.
      onFinish();
      return;
    }
    goTo(index + 1);
  };

  const goPrev = () => goTo(Math.max(0, index - 1));

  // On demande toujours. À la première étape il n'y a rien à perdre, mais on
  // vient d'entrer dans un plein écran : en sortir sans un mot sur un doigt
  // qui glisse, c'est la séance qu'on croit avoir lancée et qui n'est plus là.
  const handleExitClick = () => setShowExitConfirm(true);

  // Quitter n'efface plus rien. Sortir pour répondre au téléphone, ou parce
  // qu'un doigt a glissé, ne doit pas coûter la séance : on retrouve sa place
  // et ses charges en revenant. Pour repartir de zéro, l'écran de reprise
  // propose « Recommencer depuis le début ».
  const confirmExit = () => onExit();

  // Le plein écran se superposait à la page sans la neutraliser : quatre
  // tabulations suffisaient pour en sortir, on se retrouvait dans la barre
  // d'onglets et sur les boutons de la séance en dessous, et un lecteur
  // d'écran annonçait toujours toute la page. `inert` retire d'un coup le
  // focus, le pointeur et l'arbre d'accessibilité de tout ce qui n'est pas
  // la séance guidée.
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    root.setAttribute('inert', '');
    return () => root.removeAttribute('inert');
  }, []);

  // ... ce qui oblige la séance elle-même à sortir de `#root`, sans quoi
  // elle se neutraliserait avec le reste.
  const overlay = (node: React.ReactNode) => createPortal(node, document.body);

  // Empêche l'écran de s'éteindre pendant toute la séance guidée : sans ça,
  // l'écran s'éteint entre deux exercices et il faut le déverrouiller les
  // mains moites.
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const requestLock = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
      } catch {
        // Refusé ou indisponible (hors écran actif, permissions...) : tant pis.
      }
    };

    requestLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !sentinel) {
        requestLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      sentinel?.release().catch(() => {});
    };
  }, []);

  if (steps.length === 0) {
    return overlay(
      <Box
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        px={8}
        gap={4}
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="bold">
          Aucun exercice à suivre
        </Text>
        <Text fontSize="sm" color="fg.muted">
          Cette séance n'a pas d'exercices définis.
        </Text>
        <Button
          bg="app.primary"
          color="bg.canvas"
          fontWeight="bold"
          onClick={onExit}
        >
          Retour
        </Button>
      </Box>
    );
  }

  if (showResume) {
    return overlay(
      <Box
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        px={8}
        gap={6}
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="bold">
          Reprendre où tu en étais&nbsp;?
        </Text>
        <Text fontSize="sm" color="fg.muted">
          Tu t'étais arrêté à l'étape {savedIndex + 1} sur {steps.length}.
          {/* Le dire explicitement : quelqu'un qui a noté ses charges puis
              fermé l'application n'a aucun moyen de savoir ce qui l'attend, et
              « Recommencer » devient un pari. */}
          {notesGardees > 0 &&
            ` Tes charges sur ${notesGardees} exercice${
              notesGardees > 1 ? 's' : ''
            } sont gardées.`}
        </Text>
        <VStack gap={2} w="full" maxW="280px">
          <Button
            w="full"
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            onClick={() => {
              setIndex(savedIndex);
              setShowResume(false);
            }}
          >
            Reprendre
          </Button>
          <Button
            w="full"
            variant="ghost"
            color="fg.muted"
            onClick={() => {
              // La position repart à zéro, pas les charges : effacer ce que
              // quelqu'un a soulevé parce qu'il reprend la séance au début,
              // ce serait exactement la perte qu'on vient de corriger. Elles
              // se laissent réécrire au fil du passage.
              ecrireSeance(session._id, { etape: 0 });
              setIndex(0);
              setShowResume(false);
            }}
          >
            Recommencer depuis le début
          </Button>
        </VStack>
      </Box>
    );
  }

  if (showExitConfirm) {
    return overlay(
      <Box
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        px={8}
        gap={6}
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="bold">
          Quitter le mode guidé ?
        </Text>
        <Text fontSize="sm" color="fg.muted">
          {/* Ce message annonçait une perte qui n'a plus lieu — et qui,
              quand elle avait lieu, était pire que ce qu'il laissait
              entendre : les charges partaient avec. */}
          {index > 0
            ? 'Tu retrouveras ta séance là où tu la laisses, charges comprises.'
            : "Tu n'as pas encore commencé — tu retrouveras la séance telle quelle."}
        </Text>
        <VStack gap={2} w="full" maxW="280px">
          <Button
            w="full"
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            onClick={confirmExit}
          >
            Quitter
          </Button>
          <Button
            w="full"
            variant="ghost"
            color="fg.muted"
            onClick={() => setShowExitConfirm(false)}
          >
            Continuer la séance
          </Button>
        </VStack>
      </Box>
    );
  }

  const isRest = step.type === 'rest';

  return overlay(
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Séance guidée"
      position="fixed"
      inset={0}
      zIndex={50}
      bg={{ base: isRest ? 'session.rest' : 'bg.canvas', md: 'blackAlpha.800' }}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent={{ base: 'stretch', md: 'center' }}
    >
      <Box
        w="full"
        maxW={{ base: 'full', md: '560px' }}
        h={{ base: 'full', md: '90vh' }}
        maxH={{ base: 'full', md: '720px' }}
        bg={isRest ? 'session.rest' : 'bg.canvas'}
        borderRadius={{ base: 0, md: '2xl' }}
        boxShadow={{ md: '0 24px 64px rgba(0,0,0,0.5)' }}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        position="relative"
      >
        <HStack justify="flex-end" p={4}>
          <Button
            variant="ghost"
            size="sm"
            minH="44px"
            onClick={handleExitClick}
            color={isRest ? 'bg.canvas' : 'fg.muted'}
          >
            Quitter
          </Button>
        </HStack>

        <HStack gap={3} px={5} pt={2} align="center">
          <HStack
            gap={1.5}
            flex={1}
            role="progressbar"
            aria-label="Avancement de la séance"
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={index + 1}
            aria-valuetext={`Étape ${index + 1} sur ${steps.length} — ${step.blockLabel}`}
          >
            {blocs.map((bloc) => {
              const fait = Math.max(
                0,
                Math.min(bloc.taille, index - bloc.debut)
              );
              const encours =
                index >= bloc.debut && index < bloc.debut + bloc.taille;
              return (
                <Box
                  key={`${bloc.label}-${bloc.debut}`}
                  flex={bloc.poids}
                  // Proportionnel, mais jamais au point de disparaître : un
                  // échauffement de deux pages dans une séance de trente-cinq
                  // se réduirait à un point.
                  minW="20px"
                  h="4px"
                  borderRadius="full"
                  // La piste du bloc en cours est un peu plus claire : au
                  // premier pas d'un bloc, le remplissage est nul et rien
                  // d'autre ne dirait où l'on se trouve.
                  bg={
                    isRest
                      ? encours
                        ? 'bg.canvas/40'
                        : 'bg.canvas/20'
                      : encours
                        ? 'whiteAlpha.400'
                        : 'whiteAlpha.200'
                  }
                  overflow="hidden"
                >
                  <Box
                    h="100%"
                    borderRadius="full"
                    w={`${(fait / bloc.taille) * 100}%`}
                    bg={
                      isRest
                        ? 'bg.canvas'
                        : encours
                          ? 'app.primary'
                          : 'session.rest'
                    }
                    transition="width 0.25s"
                  />
                </Box>
              );
            })}
          </HStack>
          <Text
            fontSize="xs"
            fontFamily="mono"
            flexShrink={0}
            color={isRest ? 'bg.canvas' : 'fg.muted'}
            opacity={isRest ? 0.75 : 1}
            aria-hidden="true"
          >
            {index + 1} / {steps.length}
          </Text>
        </HStack>

        {step.type === 'block' && step.forme === 'liste' ? (
          <>
            <VStack align="stretch" gap={0.5} px={5} pt={4} pb={1}>
              <Text
                fontSize="xs"
                letterSpacing="2px"
                textTransform="uppercase"
                fontWeight="800"
                color="session.work"
              >
                {step.blockLabel}
                {step.block.label ? ` · ${step.block.label}` : ''}
              </Text>
              <HStack justify="space-between" align="center" gap={3}>
                <Text fontSize="sm" color="fg.muted">
                  {faitsDuBloc} sur {step.efforts.length} faits dans ce bloc
                </Text>
                {/* Le passe-droit.
                    « Suivant » le portait sans le dire, et le remplaçer par
                    « Fait » l'a supprimé sans que je le voie : on se retrouvait
                    coincé sur un échauffement tant qu'on n'avait pas coché ses
                    deux lignes. Un client saute un mouvement, change d'avis,
                    arrive en retard — il doit pouvoir avancer.

                    Discret et à l'écart du geste principal : c'est une sortie
                    de secours, pas une invitation. */}
                <Box
                  as="button"
                  onClick={goNext}
                  color="fg.muted"
                  fontSize="sm"
                  flexShrink={0}
                  css={hitArea(44)}
                  _hover={{ color: 'fg' }}
                >
                  {/* Sur le dernier bloc, « passer » ne veut rien dire : il n'y
                      a rien après. Mais la sortie doit exister quand même — je
                      l'avais cachée là, et il fallait cocher les sept paliers
                      d'une pyramide pour avoir le droit de terminer. */}
                  {isLast ? 'Terminer la séance' : 'Passer ce bloc'}
                </Box>
              </HStack>
            </VStack>
            <BlocListe
              bloc={step.block}
              efforts={step.efforts}
              faits={faitsSet}
              courant={courant}
              performed={performed}
              onPerformedChange={onPerformedChange}
              lastPerformance={lastPerformance}
              onOuvrirDetail={setDetail}
            />
          </>
        ) : step.type === 'block' ? (
          /*
           * Un bloc entier, lu d'un coup.
           *
           * C'est la carte de la fiche — celle que le client lit avant de
           * commencer — reposée ici telle quelle. Une seule écriture pour les
           * deux écrans : ce qu'il a mémorisé en préparant sa séance, il le
           * retrouve pendant. Les consignes et les vidéos s'y déplient déjà,
           * ligne par ligne, ce que le plein écran ne savait faire que pour
           * l'exercice affiché.
           */
          <VStack
            flex={1}
            align="stretch"
            gap={5}
            px={5}
            py={2}
            overflowY="auto"
          >
            {/* La sortie, ici aussi.
                Sur une boucle, le bouton principal compte les tours : plus
                rien ne terminerait la séance sans ça. Troisième endroit où
                j'avais oublié qu'un geste principal qui change de sens
                emporte avec lui celui qu'il remplaçait. */}
            {step.forme === 'boucle' && (
              <HStack justify="flex-end">
                <Box
                  as="button"
                  onClick={goNext}
                  color="fg.muted"
                  fontSize="sm"
                  css={hitArea(44)}
                  _hover={{ color: 'fg' }}
                >
                  {isLast ? 'Terminer la séance' : 'Passer ce bloc'}
                </Box>
              </HStack>
            )}
            {/* La pendule d'un bloc à durée : dans un AMRAP, c'est elle qui
                dit quand s'arrêter. Plus petite qu'en plein écran — on est
                venu lire la liste, pas la pendule. */}
            {blockHasClock(step.block.type) && step.block.durationMinutes ? (
              <Minuteur
                key={index}
                duration={step.block.durationMinutes * 60}
                couleur="fg"
                holdLabel="Temps écoulé"
                // Pas le nom du bloc : la carte juste dessous le porte déjà,
                // et l'écran le disait deux fois. Ce qui manquait, c'est ce
                // que l'horloge mesure — un AMRAP s'arrête à zéro.
                titre={
                  <Text
                    fontSize="xs"
                    letterSpacing="2px"
                    textTransform="uppercase"
                    fontWeight="800"
                    color="fg.muted"
                  >
                    Temps restant
                  </Text>
                }
                compact
              />
            ) : null}
            {/* Le compteur de tours.
                C'est le score de la séance, et il n'avait aucune place : ni à
                l'écran, ni dans le modèle. Le client le tenait de tête ou sur
                un cahier. Gros, sous la pendule, et à côté du bouton qui le
                fait monter — on l'incrémente en s'essoufflant. */}
            {step.forme === 'boucle' && (
              <HStack justify="space-between" align="center" gap={4}>
                <HStack align="baseline" gap={2}>
                  <Text
                    fontSize="54px"
                    fontWeight="800"
                    lineHeight="1"
                    color="app.primary"
                    fontVariantNumeric="tabular-nums"
                  >
                    {tours[String(step.block.order)] ?? 0}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    tour{(tours[String(step.block.order)] ?? 0) > 1 ? 's' : ''}
                    &nbsp;bouclé
                    {(tours[String(step.block.order)] ?? 0) > 1 ? 's' : ''}
                  </Text>
                </HStack>
                {/* Se décompter doit rester possible — un doigt glisse, et
                    perdre un tour qu'on a fait est pire que d'en compter un
                    de trop. Discret : ce n'est pas le geste qu'on répète. */}
                {(tours[String(step.block.order)] ?? 0) > 0 && (
                  <Box
                    as="button"
                    aria-label="Retirer un tour"
                    onClick={() => compterUnTour(step.block.order, -1)}
                    color="fg.muted"
                    fontSize="sm"
                    css={hitArea(44)}
                    _hover={{ color: 'fg' }}
                  >
                    − 1
                  </Box>
                )}
              </HStack>
            )}
            <BlockCard
              block={step.block}
              renderExerciseExtra={({ blockOrder, exerciseOrder }) => {
                const prescrit = step.block.exercises.find(
                  (e) => e.order === exerciseOrder
                );
                if (!prescrit) return null;
                const cle = performedKey(blockOrder, exerciseOrder);
                const repos = restBetweenSetsOf(step.block, prescrit);
                return (
                  <>
                    {performed && onPerformedChange && (
                      <PerformedFields
                        value={performed[cle] ?? { sets: [] }}
                        onChange={(next) => onPerformedChange(cle, next)}
                        setLabels={prescribedSetLabels(step.block, prescrit)}
                        isTimed={prescrit.duration !== undefined}
                      />
                    )}
                    {/* L'effort chronométré d'abord, le repos ensuite :
                        c'est l'ordre dans lequel on les vit. */}
                    {prescrit.duration ? (
                      <MinuteurALaDemande
                        duration={prescrit.duration}
                        libelle={formatDuration(prescrit.duration)}
                        couleur="app.primary"
                      />
                    ) : null}
                    {repos ? (
                      <MinuteurALaDemande
                        duration={repos}
                        libelle={`repos ${formatDuration(repos)}`}
                        couleur="session.rest"
                      />
                    ) : null}
                  </>
                );
              }}
            />
          </VStack>
        ) : step.type === 'round' ? (
          <Tour
            step={step}
            onDone={goNext}
            lastPerformance={lastPerformance}
            onOuvrirDetail={setDetail}
          />
        ) : (
          <VStack
            flex={1}
            justify="center"
            align="center"
            gap={6}
            px={8}
            textAlign="center"
          >
            <Minuteur
              key={index}
              duration={step.duration}
              couleur="bg.canvas"
              // Le fond est ici la couleur du repos : une piste claire y
              // disparaîtrait. C'est le seul écran où la jauge s'inverse.
              piste="blackAlpha.400"
              onComplete={goNext}
              titre={
                <Text
                  fontSize="xs"
                  letterSpacing="2px"
                  textTransform="uppercase"
                  fontWeight="800"
                  color="bg.canvas"
                >
                  Repos
                </Text>
              }
            />
            {step.nextExerciseName && (
              <Text fontSize="sm" color="bg.canvas" opacity={0.75}>
                Ensuite : {step.nextExerciseName}
              </Text>
            )}
          </VStack>
        )}

        {/* Le repos que « Fait » vient de lancer.
            Il se superpose au bloc plutôt que d'être une étape à lui : la
            liste reste dessous, intacte, et on la retrouve telle quelle —
            avec un effort coché de plus. */}
        {repos && (
          <Box
            position="absolute"
            inset={0}
            bg="session.rest"
            zIndex={2}
            display="flex"
            flexDirection="column"
            alignItems="stretch"
            justifyContent="center"
            px={6}
            gap={6}
          >
            <Minuteur
              key={`repos-${faits.length}`}
              duration={repos.duree}
              couleur="bg.canvas"
              piste="blackAlpha.400"
              onComplete={() => setRepos(null)}
              titre={
                <Text
                  fontSize="xs"
                  letterSpacing="2px"
                  textTransform="uppercase"
                  fontWeight="800"
                  color="bg.canvas"
                >
                  Repos
                </Text>
              }
            />
            {repos.ensuite && (
              <Text fontSize="sm" color="bg.canvas" opacity={0.8}>
                Ensuite&nbsp;: {repos.ensuite}
              </Text>
            )}
            <Button
              alignSelf="stretch"
              minH="52px"
              bg="bg.canvas"
              color="fg"
              _hover={{ bg: 'bg.canvas' }}
              onClick={() => setRepos(null)}
            >
              Passer le repos
            </Button>
          </Box>
        )}

        {detail && (
          <Box
            position="absolute"
            inset={0}
            bg="bg.canvas"
            zIndex={1}
            overflowY="auto"
            p={5}
          >
            <HStack justify="space-between" align="flex-start" mb={4}>
              <Text fontSize="xl" fontWeight="800" maxW="20ch">
                {detail.exercise.name}
              </Text>
              <Box
                as="button"
                aria-label="Revenir à la séance"
                onClick={() => setDetail(null)}
                color="fg.muted"
                flexShrink={0}
                css={hitArea(44)}
              >
                <LuX size={20} />
              </Box>
            </HStack>

            {/* Ce que le coach a écrit pour cette séance passe devant, et se
                reconnaît à la barre ambrée. La technique du mouvement, qui
                vient de la bibliothèque, reste du texte nu en dessous. */}
            {detail.note?.trim() && (
              <Box
                p={3}
                bg="whiteAlpha.50"
                borderRadius="md"
                borderLeft="2px solid"
                borderLeftColor="app.primary.border"
                mb={4}
              >
                <Text
                  fontSize="2xs"
                  color="fg.muted"
                  fontWeight="bold"
                  letterSpacing="wide"
                  textTransform="uppercase"
                  mb={1}
                >
                  Consigne du coach
                </Text>
                <Text fontSize="sm" color="fg" whiteSpace="pre-wrap">
                  {detail.note}
                </Text>
              </Box>
            )}
            {detail.exercise.description?.trim() && (
              <>
                {detail.note?.trim() && (
                  <Text
                    fontSize="2xs"
                    color="fg.muted"
                    fontWeight="bold"
                    letterSpacing="wide"
                    textTransform="uppercase"
                    mb={1}
                  >
                    Le mouvement
                  </Text>
                )}
                <Text
                  fontSize="sm"
                  color={detail.note?.trim() ? 'fg.muted' : 'fg'}
                  whiteSpace="pre-wrap"
                  mb={4}
                >
                  {detail.exercise.description}
                </Text>
              </>
            )}
            {detail.exercise.videoUrl?.trim() && (
              <VideoPlayer url={detail.exercise.videoUrl} />
            )}
          </Box>
        )}

        <HStack p={4} gap={3}>
          {/* Un contour, comme en a « J'ai terminé cette séance ».
              Du texte gris sans cadre, face à un « Suivant » ambre plein deux
              fois plus large, se lit « indisponible » : le contraste était
              conforme, la hiérarchie mentait. Secondaire et indisponible
              doivent rester deux choses distinctes — le bouton porte donc son
              cadre, et ne s'efface vraiment que sur la première étape, où il
              est réellement désactivé. */}
          <Button
            variant="outline"
            borderColor={isRest ? 'blackAlpha.400' : 'whiteAlpha.300'}
            onClick={goPrev}
            disabled={index === 0}
            flexShrink={0}
            minH="52px"
            color={isRest ? 'bg.canvas' : 'fg'}
          >
            Précédent
          </Button>
          {/* Un seul bouton principal, toujours à la même place, et c'est la
              forme du bloc qui dit ce qu'il fait : « Fait » tant qu'il reste
              un effort à cocher, puis on passe. Le client n'a jamais à choisir
              où appuyer. */}
          <Button
            flex={1}
            minH="52px"
            bg={isRest ? 'bg.canvas' : 'app.primary'}
            color={isRest ? 'fg' : 'bg.canvas'}
            _hover={{ bg: isRest ? 'bg.canvas' : 'app.primary.hover' }}
            onClick={
              estBoucle && step.type === 'block'
                ? () => compterUnTour(step.block.order, 1)
                : courant
                  ? marquerFait
                  : goNext
            }
          >
            {estBoucle
              ? '+1 tour'
              : courant
                ? 'Fait'
                : isLast
                  ? 'Terminer'
                  : blocFini
                    ? 'Bloc suivant'
                    : step.type === 'rest'
                      ? 'Passer'
                      : 'Suivant'}
          </Button>
        </HStack>
      </Box>
    </Box>
  );
};
