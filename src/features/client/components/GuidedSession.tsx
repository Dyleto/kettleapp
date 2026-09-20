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
  BLOCK_ACCENT_COLOR,
  blockDefinesOwnMetrics,
  blockHasClock,
  getBlockAccent,
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
/**
 * Un téléphone couché.
 *
 * On ne vise pas « paysage » tout court : une tablette couchée a 800 px de
 * haut et n'a besoin de rien. C'est la hauteur qui manque, pas la largeur —
 * 390 px sur un iPhone, dont l'habillage du mode guidé prenait 186, soit
 * presque la moitié de l'écran pour trois barres et deux boutons.
 */
const PAYSAGE = '@media (orientation: landscape) and (max-height: 520px)';

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
 * Ce qu'une étape pèse dans la barre : le temps qu'elle demande.
 *
 * Elle pesait des pages, et elle mentait d'un facteur dix. Mesuré sur la
 * séance d'essai : l'AMRAP de douze minutes recevait 24 px, l'EMOM 239 — la
 * barre annonçait que la séance était à 85 % de l'EMOM, alors qu'en temps
 * vécu les deux blocs font jeu égal. Un client qui la regardait après l'EMOM
 * croyait avoir fini.
 *
 * Le coach donne la durée là où elle fait partie du format : l'intervalle
 * d'un tour, la durée d'un AMRAP. On la prend telle quelle. Ailleurs — une
 * série, un palier — il ne la donne pas, et on compte une minute par effort.
 * C'est une approximation, et elle est assumée : l'intervalle d'un EMOM EST
 * une minute, une série avec son repos en fait à peu près autant. Elle vaut
 * infiniment mieux que compter les fois où l'on tape « Suivant ».
 */
const poidsDe = (step: GuidedStep): number => {
  if (step.type === 'rest') return step.duration / 60;
  if (step.type === 'round')
    return (step.workSeconds ?? 60) / 60 + (step.restSeconds ?? 0) / 60;
  // Une boucle porte sa durée ; une liste, ses efforts.
  if (step.forme === 'boucle')
    return Math.max(1, step.block.durationMinutes ?? step.efforts.length);
  return Math.max(1, step.efforts.length);
};

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
    <VStack
      flex={1}
      align="stretch"
      gap={4}
      px={5}
      py={2}
      overflowY="auto"
      // Couché, ces gouttières valent 16 px chacune sur 360 px de haut. Les
      // cibles gardent leurs 44 px — on ne rétrécit pas ce qu'on touche en
      // sueur —, c'est le vide qui cède.
      css={{ [PAYSAGE]: { gap: '10px', paddingTop: 0, paddingBottom: 0 } }}
    >
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
              bg="surface.card"
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
  /**
   * A-t-on déjà commencé cette séance ?
   *
   * La position ne suffit pas à le dire : sur un bloc-liste, cocher des
   * efforts ne fait pas avancer l'étape. Quelqu'un qui coche quatre lignes
   * d'échauffement puis ferme l'application a bel et bien commencé, et lui
   * remontrer la consigne d'ouverture serait lui dire qu'il n'a rien fait.
   */
  // L'heure de début, posée une fois pour toutes : elle sert à dire, à la
  // fin, combien de temps la séance a réellement pris.
  useEffect(() => {
    if (lireSeance(session._id)?.debutLe === undefined) {
      ecrireSeance(session._id, { debutLe: Date.now() });
    }
  }, [session._id]);

  const [dejaCommence] = useState(() => {
    const garde = lireSeance(session._id);
    return (garde?.etape ?? 0) > 0 || (garde?.faits.length ?? 0) > 0;
  });
  const [showResume, setShowResume] = useState(() => dejaCommence);
  /**
   * L'écran d'ouverture ne paraît qu'au début.
   *
   * Reprendre une séance entamée, c'est savoir ce qu'on fait : on ne
   * rappelle pas la consigne à quelqu'un qui revient de sa douzième série.
   */
  const [showOuverture, setShowOuverture] = useState(() => !dejaCommence);

  /** Ce qui attend le client : un aperçu des blocs, et le total à fournir. */
  const apercuDesBlocs = useMemo(
    () =>
      steps.reduce<
        { debut: number; label: string; couleur: string; detail: string }[]
      >((acc, step, i) => {
        if (step.type === 'rest') return acc;
        const dernier = acc[acc.length - 1];
        if (dernier?.label === step.blockLabel) return acc;
        acc.push({
          debut: i,
          label: step.blockLabel,
          couleur: BLOCK_ACCENT_COLOR[getBlockAccent(step.block.type)],
          detail:
            step.type === 'round'
              ? `${step.rounds} tours`
              : step.forme === 'boucle'
                ? `${step.block.durationMinutes ?? '?'} min`
                : `${step.efforts.length} efforts`,
        });
        return acc;
      }, []),
    [steps]
  );

  const totalEfforts = useMemo(
    () =>
      steps.reduce(
        (n, step) =>
          n +
          (step.type === 'round'
            ? 1
            : step.type === 'block'
              ? step.efforts.length
              : 0),
        0
      ),
    [steps]
  );
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
        role="dialog"
        aria-modal="true"
        aria-label="Aucun exercice à suivre"
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="safe center"
        overflowY="auto"
        py={6}
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

  // L'écran d'ouverture.
  //
  // La note que le coach a écrite pour cette séance-là était inaccessible
  // depuis le mode guidé : s'il écrivait « aujourd'hui on garde 2 reps en
  // réserve sur tout », le client ne pouvait pas la relire pendant l'effort.
  // Elle ouvre donc le parcours — on lit la consigne au moment où elle sert,
  // avant de commencer.
  //
  // C'est aussi le seul endroit qui rappelle qu'un humain a écrit cette
  // séance. Aucune application de fitness générique ne peut en dire autant,
  // et le mode guidé ne s'en servait nulle part.
  if (showOuverture) {
    return overlay(
      <Box
        role="dialog"
        aria-modal="true"
        aria-label="Avant de commencer"
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
      >
        <HStack justify="flex-end" p={4}>
          <Button
            variant="ghost"
            size="sm"
            minH="44px"
            onClick={onExit}
            color="fg.muted"
          >
            Quitter
          </Button>
        </HStack>

        {/* `flex: 1` sans `min-height: 0` ne rétrécit jamais en dessous de
            son contenu : sur un écran couché, le corps poussait « Commencer »
            hors de l'écran — le bouton existait, se voyait dans l'arbre, et
            ne se touchait pas. `safe center` centre tant qu'il y a la place
            et repart du haut quand il n'y en a plus, au lieu de couper des
            deux côtés. */}
        <VStack
          flex={1}
          minH={0}
          overflowY="auto"
          justifyContent="safe center"
          align="stretch"
          gap={7}
          px={7}
          pb={6}
        >
          <VStack align="start" gap={1.5}>
            <Text
              fontSize="xs"
              fontWeight="800"
              letterSpacing="2px"
              color="fg.muted"
            >
              SÉANCE {session.order}
            </Text>
            {session.name?.trim() && (
              <Text fontSize="3xl" fontWeight="800" lineHeight="1.15">
                {session.name.trim()}
              </Text>
            )}
            {/* Ce qui attend le client, avant qu'il s'engage. Aucun écran ne
                le disait : on démarrait sans savoir si c'était dix minutes ou
                quarante. */}
            <Text fontSize="sm" color="fg.muted">
              {session.blocks.length} bloc
              {session.blocks.length > 1 ? 's' : ''} · {totalEfforts} effort
              {totalEfforts > 1 ? 's' : ''}
            </Text>
          </VStack>

          {session.notes?.trim() && (
            <Box
              bg="surface.card"
              borderLeftWidth="3px"
              borderLeftColor="app.primary"
              borderRadius="lg"
              p={4}
            >
              <Text fontSize="xs" color="fg.muted" mb={2}>
                Ton coach te dit&nbsp;:
              </Text>
              <Text fontSize="lg" lineHeight="1.5" whiteSpace="pre-wrap">
                {session.notes}
              </Text>
            </Box>
          )}

          <VStack align="stretch" gap={2.5}>
            {apercuDesBlocs.map((b) => (
              <HStack key={b.debut} gap={3}>
                <Box
                  w="10px"
                  h="10px"
                  borderRadius="sm"
                  bg={b.couleur}
                  flexShrink={0}
                />
                <Text fontSize="sm" flex={1} minW={0} lineClamp={1}>
                  {b.label}
                </Text>
                <Text
                  fontSize="xs"
                  color="fg.muted"
                  fontFamily="mono"
                  flexShrink={0}
                >
                  {b.detail}
                </Text>
              </HStack>
            ))}
          </VStack>
        </VStack>

        <Box p={4}>
          <Button
            w="full"
            minH="56px"
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            fontSize="lg"
            _hover={{ bg: 'app.primary.hover' }}
            onClick={() => setShowOuverture(false)}
          >
            Commencer
          </Button>
        </Box>
      </Box>
    );
  }

  if (showResume) {
    return overlay(
      <Box
        role="dialog"
        aria-modal="true"
        aria-label="Reprendre où tu en étais ?"
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="safe center"
        overflowY="auto"
        py={6}
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
        role="dialog"
        aria-modal="true"
        aria-label="Quitter le mode guidé ?"
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="safe center"
        overflowY="auto"
        py={6}
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

  // Écrit une fois, monté à deux endroits selon l'orientation — jamais les
  // deux en même temps. Deux boutons identiques dans l'arbre diraient au
  // lecteur d'écran qu'il y a deux sorties.
  const boutonQuitter = (
    <Button
      variant="ghost"
      size="sm"
      minH="44px"
      onClick={handleExitClick}
      color={isRest ? 'bg.canvas' : 'fg.muted'}
    >
      Quitter
    </Button>
  );

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
      // Un iPhone couché fait 844 px de large : il franchit le seuil `md` et
      // recevait la mise en page de bureau — une carte flottante de 560 px
      // sur fond assombri, haute de 90 % d'un écran qui n'en a déjà pas. Le
      // seuil regarde la largeur ; ici c'est la hauteur qui décide.
      css={{
        [PAYSAGE]: { justifyContent: 'stretch', background: 'transparent' },
      }}
    >
      <Box
        w="full"
        maxW={{ base: 'full', md: '560px' }}
        h={{ base: 'full', md: '90vh' }}
        maxH={{ base: 'full', md: '720px' }}
        css={{
          [PAYSAGE]: {
            maxWidth: '100%',
            height: '100%',
            maxHeight: '100%',
            borderRadius: 0,
            boxShadow: 'none',
          },
        }}
        bg={isRest ? 'session.rest' : 'bg.canvas'}
        borderRadius={{ base: 0, md: '2xl' }}
        boxShadow={{ md: '0 24px 64px rgba(0,0,0,0.5)' }}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        position="relative"
      >
        {/* En portrait, « Quitter » a sa ligne : c'est la maquette validée,
            et elle ne change pas. Couché, cette ligne coûte 76 px sur 390 —
            un cinquième de l'écran pour un mot — alors le bouton rejoint la
            barre d'avancement, qui a de la place à revendre en largeur.
            Un seul des deux est monté à la fois : l'autre est retiré de
            l'arbre, pas seulement masqué. */}
        <HStack
          justify="flex-end"
          p={4}
          css={{ [PAYSAGE]: { display: 'none' } }}
        >
          {boutonQuitter}
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
              const encours =
                index >= bloc.debut && index < bloc.debut + bloc.taille;
              // Combien de ce bloc est derrière soi, entre 0 et 1.
              //
              // Le compte d'étapes ne suffit plus : un bloc-liste n'en fait
              // qu'une, et le remplissage sautait donc de rien à tout alors
              // qu'on y coche sept efforts. Quand le bloc en cours en a, c'est
              // eux qui parlent.
              const part =
                encours && efforts.length > 0
                  ? faitsDuBloc / efforts.length
                  : Math.max(0, Math.min(bloc.taille, index - bloc.debut)) /
                    bloc.taille;
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
                    w={`${part * 100}%`}
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
          <Box
            display="none"
            flexShrink={0}
            mt={-1}
            css={{ [PAYSAGE]: { display: 'block' } }}
          >
            {boutonQuitter}
          </Box>
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

        {/* Les cibles gardent leurs 52 px — on ne rétrécit pas ce qu'on
            touche en sueur. C'est la marge qui cède, pas le bouton. */}
        <HStack p={4} gap={3} css={{ [PAYSAGE]: { padding: '8px 12px' } }}>
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
