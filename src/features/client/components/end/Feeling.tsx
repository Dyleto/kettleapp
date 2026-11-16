import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuX } from 'react-icons/lu';
import type { FeedbackTag, SessionFeedback } from '@/shared/types';
import { ActionButton, AutoResizeTextarea, DateInput } from '@/kit';
import { dayKey } from '../../sessionDates';
import { useAuth } from '@/shared/contexts/useAuth';
import { EffortScale } from '../EffortScale';
import { FeedbackTags } from '../FeedbackTags';
import { useCoachVoice } from '../../coach';

interface FeelingProps {
  onSubmit: (
    feedback: SessionFeedback,
    notes: string,
    completedAt?: string
  ) => void;
  /** L'envoi est en cours : le bouton attend la réponse. */
  isSending: boolean;
  /** Le dernier envoi n'est pas parti. */
  failed: boolean;
  /** Quitter sans envoyer : la séance reste « à valider ». */
  onClose: () => void;
  /**
   * La date déjà choisie dans « Je l'ai déjà faite », en `YYYY-MM-DD`. Un
   * autre jour qu'aujourd'hui ouvre la ligne de date sur lui : on ne le
   * redemande pas.
   */
  date?: string;
}

// Le jour local, pas celui de Greenwich : `toISOString` rendait la veille
// entre minuit et une heure du matin en France, et une séance déclarée à
// 0 h 30 partait datée d'hier.
const toDateInputValue = dayKey;

/**
 * Le ressenti : la seule question de la fin de séance.
 *
 * Une touche suffit — un visage — et c'est la seule chose que
 * l'application ne peut pas trouver seule. Les étiquettes et le mot pour le
 * coach sont facultatifs, et ne sont même pas proposés à qui a refusé de
 * partager ses données de santé : on ne demande pas ce qu'on n'a pas le
 * droit d'enregistrer. L'effort reste — c'est une mesure d'entraînement.
 *
 * C'était une boîte de dialogue, la troisième de la fin de séance, posée
 * sur la fiche qui réapparaissait derrière. C'est un écran de la même
 * scène. Et un envoi qui échoue ne ferme plus rien : la boîte se fermait
 * avant la réponse, puis un toast disait « Erreur » sur un écran où le
 * ressenti avait disparu. Ici on reste, on dit ce qui est sauf, et on
 * réessaie d'une touche.
 */
export const Feeling = ({
  onSubmit,
  isSending,
  failed,
  onClose,
  date,
}: FeelingProps) => {
  const coach = useCoachVoice();
  const { user } = useAuth();
  const sharesHealth = user?.healthConsent?.granted === true;

  const [effort, setEffort] = useState<number | undefined>(undefined);
  const [tags, setTags] = useState<FeedbackTag[]>([]);
  const [notes, setNotes] = useState('');
  const [completedAt, setCompletedAt] = useState(
    () => date ?? toDateInputValue(new Date())
  );
  const [isDateOpen, setIsDateOpen] = useState(
    () => !!date && date !== toDateInputValue(new Date())
  );

  const submit = () => {
    if (effort === undefined || isSending) return;
    const today = toDateInputValue(new Date());
    onSubmit(
      { effort, ...(tags.length > 0 ? { tags } : {}) },
      notes,
      completedAt !== today ? completedAt : undefined
    );
  };

  return createPortal(
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Le ressenti"
      position="fixed"
      inset={0}
      zIndex={50}
      bg="bg.canvas"
      display="flex"
      flexDirection="column"
    >
      <HStack justify="flex-end" px={3} pt={3}>
        <Box
          as="button"
          aria-label="Quitter sans envoyer"
          w="44px"
          h="44px"
          display="grid"
          placeItems="center"
          borderRadius="full"
          color="fg.muted"
          onClick={onClose}
        >
          <LuX size={20} />
        </Box>
      </HStack>

      <VStack
        flex={1}
        minH={0}
        overflowY="auto"
        align="stretch"
        gap={4}
        px={5}
        pb={4}
        data-feeling-body=""
      >
        <VStack align="start" gap={2}>
          <Text
            as="h1"
            fontFamily="heading"
            fontSize="38px"
            fontWeight="800"
            lineHeight="1.1"
          >
            Alors, cette séance&nbsp;?
          </Text>
          <Text color="fg.muted">
            Une touche. C’est ce qui permet à {coach.inline} de régler la suite.
          </Text>
        </VStack>

        <EffortScale value={effort} onChange={setEffort} />

        {sharesHealth ? (
          <>
            <Text
              fontSize="11px"
              fontWeight="800"
              letterSpacing="0.14em"
              textTransform="uppercase"
              color="fg.muted"
            >
              Quelque chose à signaler&nbsp;?
            </Text>
            <FeedbackTags value={tags} onChange={setTags} />
            <AutoResizeTextarea
              aria-label={`Un mot pour ${coach.inline}`}
              placeholder={`Un mot pour ${coach.inline}, si tu veux`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              border="1px solid"
              borderColor="line"
              borderRadius="lg"
              _focus={{ borderColor: 'app.primary.border' }}
            />
          </>
        ) : (
          <VStack
            align="start"
            gap={1}
            borderWidth="1px"
            borderColor="line"
            borderRadius="xl"
            px={4}
            py={3.5}
          >
            <Text fontWeight="bold">Seul l’effort est demandé</Text>
            <Text fontSize="sm" color="fg.muted">
              Tu as choisi de ne pas partager de données de santé. Tu peux
              changer d’avis dans Mon compte.
            </Text>
          </VStack>
        )}

        {/* Replié : neuf fois sur dix la séance a eu lieu aujourd'hui. La
            rangée réserve la hauteur du champ, ouverte ou fermée : déplier
            ne fait rien sauter sous le pouce. */}
        <HStack justify="center" gap={2} flexWrap="wrap" minH="44px">
          {isDateOpen ? (
            <>
              <Text fontSize="sm" color="fg.muted" flexShrink={0}>
                Fait le
              </Text>
              <Box maxW="180px">
                <DateInput
                  ariaLabel="Date de réalisation de la séance"
                  value={completedAt}
                  max={toDateInputValue(new Date())}
                  onChange={setCompletedAt}
                />
              </Box>
            </>
          ) : (
            <Box
              as="button"
              aria-expanded={false}
              minH="44px"
              fontSize="sm"
              color="fg.muted"
              onClick={() => setIsDateOpen(true)}
              _hover={{ color: 'fg' }}
            >
              Ce n’était pas aujourd’hui&nbsp;?
            </Box>
          )}
        </HStack>
      </VStack>

      <VStack
        align="stretch"
        gap={2}
        px={4}
        pt={2}
        pb="calc(env(safe-area-inset-bottom, 0px) + 12px)"
      >
        {failed && !isSending && (
          <Text role="alert" textAlign="center" fontSize="sm" color="fg.muted">
            L’envoi n’est pas parti. Ta séance reste sur ce téléphone, rien
            n’est perdu.
          </Text>
        )}
        {/* Le seul champ requis, et il l'est réellement : présélectionner
            un visage enregistrerait une valeur que personne n'a choisie. */}
        <ActionButton
          size="xl"
          w="full"
          onClick={submit}
          disabled={effort === undefined}
          loading={isSending}
        >
          {failed ? 'Réessayer' : `Envoyer à ${coach.inline}`}
        </ActionButton>
      </VStack>
    </Box>,
    document.body
  );
};
