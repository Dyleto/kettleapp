import { FeedbackTag, SessionFeedback } from '@/shared/types';
import {
  Box,
  Button,
  Dialog,
  HStack,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { AutoResizeTextarea } from '@/shared/components/AutoResizeTextarea';
import { DateInput } from '@/shared/components/DateInput';
import { hitArea } from '@/shared/components/hitArea';
import { LuX } from 'react-icons/lu';
import { EffortScale } from './EffortScale';
import { FeedbackTags } from './FeedbackTags';
import { useAuth } from '@/shared/contexts/useAuth';

interface CompleteSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Le constat qui précède la question.
   *
   * Absent quand la séance n'a pas été menée en mode guidé — il n'y a alors
   * rien à constater, et un récapitulatif vide vaudrait moins que pas de
   * récapitulatif.
   */
  recap?: React.ReactNode;
  /**
   * Vrai quand le client a noté ses charges pendant la séance.
   *
   * On ne lui reposait alors pas la question à la fin — et un écran qu'on
   * saute sans un mot laisse croire que la saisie a été perdue.
   */
  chargesDejaNotees?: boolean;
  onSubmit: (
    feedback: SessionFeedback,
    notes: string,
    completedAt?: string
  ) => void;
  isLoading?: boolean;
}

const toDateInputValue = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Le bilan de fin de séance : le constat, puis la question.
 *
 * Une seule question obligatoire — comment c'était — parce que c'est la seule
 * chose que l'application ne peut pas trouver seule. Les étiquettes et le
 * commentaire sont facultatifs, et ne sont même pas proposés à qui a refusé
 * de partager ses données de santé.
 */
export const CompleteSessionModal = ({
  isOpen,
  onClose,
  recap,
  chargesDejaNotees,
  onSubmit,
  isLoading,
}: CompleteSessionModalProps) => {
  // À qui a refusé de partager ses données de santé, on ne propose ni les
  // étiquettes ni le commentaire : on ne demande pas ce qu'on n'a pas le
  // droit d'enregistrer. La note d'effort reste — c'est une mesure
  // d'entraînement.
  const { user } = useAuth();
  const partageSante = user?.healthConsent?.granted === true;

  const [effort, setEffort] = useState<number | undefined>(undefined);
  const [tags, setTags] = useState<FeedbackTag[]>([]);
  const [notes, setNotes] = useState('');
  const [completedAt, setCompletedAt] = useState(toDateInputValue(new Date()));
  const [isDateOpen, setIsDateOpen] = useState(false);

  const handleClose = () => {
    setEffort(undefined);
    setTags([]);
    setNotes('');
    setCompletedAt(toDateInputValue(new Date()));
    setIsDateOpen(false);
    onClose();
  };

  const handleSubmit = () => {
    if (effort === undefined) return;
    const today = toDateInputValue(new Date());
    onSubmit(
      { effort, ...(tags.length > 0 ? { tags } : {}) },
      notes,
      completedAt !== today ? completedAt : undefined
    );
    handleClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        {/* Le constat, l'échelle, les étiquettes et le commentaire dans une
            seule boîte : sur un petit écran elle déborde, et c'est
            « Valider » qu'on perd en bas. Le corps défile, l'en-tête et le
            pied tiennent.

            La boîte porte 64 px de marge en haut et en bas par défaut, et
            `maxH="90dvh"` n'en savait rien : on lui autorisait 760 px dans
            716 px de place, elle dépassait donc de 44 px sa propre marge — et
            en paysage, où ces 128 px font un tiers de l'écran, « Valider »
            sortait carrément de la fenêtre.

            La marge tombe donc à 16 px là où l'écran est petit, et la hauteur
            est ce qu'il reste réellement plutôt qu'une fraction du tout. Un
            téléphone tenu droit y gagne 52 px de corps. */}
        <Dialog.Content
          bg="bg.canvas"
          borderColor="whiteAlpha.100"
          borderWidth="1px"
          m={{ base: 4, md: 16 }}
          maxH={{
            base: 'calc(100dvh - 2rem)',
            md: 'calc(100dvh - 8rem)',
          }}
          display="flex"
          flexDirection="column"
        >
          {/* Le constat vient avant la question — mais dans le corps, pas
              dans l'en-tête. Un en-tête est du décor : il ne rétrécit pas. Le
              récapitulatif y prenait toute sa place, et sur un téléphone posé
              à plat le corps tombait à 32 px pendant que « Valider »
              terminait 162 px sous l'écran. Ce qui est long appartient à ce
              qui défile. */}
          {!recap && (
            <Dialog.Header>
              <VStack align="start" gap={1}>
                <Dialog.Title>Cette séance, c'était&nbsp;?</Dialog.Title>
                <Text fontSize="sm" color="fg.muted" fontWeight="normal">
                  Ton ressenti aide ton coach à adapter la suite. C'est la seule
                  chose qu'on te demande.
                </Text>
              </VStack>
            </Dialog.Header>
          )}
          <Dialog.CloseTrigger
            aria-label="Fermer"
            display="flex"
            alignItems="center"
            justifyContent="center"
            minW="44px"
            minH="44px"
          >
            <LuX size={16} />
          </Dialog.CloseTrigger>

          <Dialog.Body overflowY="auto" minH={0} pt={recap ? 6 : undefined}>
            <VStack gap={4} align="stretch">
              {recap && (
                <>
                  {recap}
                  {/* Cette phrase appartient à côté du constat qu'elle commente,
                      et elle appartient à ce qui défile. Dans le pied, elle
                      réclamait une ligne à elle — `flexBasis="100%"` — sur
                      une surface qui ne rétrécit jamais, et prenait donc
                      cette ligne au corps à chaque séance. */}
                  {chargesDejaNotees && (
                    <Text fontSize="xs" color="fg.muted" textAlign="center">
                      Tes charges sont déjà enregistrées&nbsp;— rien à
                      ressaisir.
                    </Text>
                  )}
                  <Separator borderColor="whiteAlpha.100" />
                  <Dialog.Title fontSize="lg" fontWeight="800">
                    Cette séance, c'était&nbsp;?
                  </Dialog.Title>
                </>
              )}
              <EffortScale value={effort} onChange={setEffort} />

              {partageSante && (
                <>
                  <Separator borderColor="whiteAlpha.100" />

                  <Box>
                    <Text fontSize="sm" color="fg.muted" mb={2}>
                      Quelque chose à signaler&nbsp;? (facultatif)
                    </Text>
                    <FeedbackTags value={tags} onChange={setTags} />
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="fg.muted" mb={2}>
                      Commentaire (facultatif)
                    </Text>
                    <AutoResizeTextarea
                      aria-label="Commentaire sur la séance"
                      placeholder="Ex : bonne séance, un peu difficile sur les derniers rounds..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      size="sm"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      _focus={{ borderColor: 'app.primary.border' }}
                    />
                  </Box>
                </>
              )}

              <Separator borderColor="whiteAlpha.100" />

              {/* Replié : neuf fois sur dix la séance a eu lieu aujourd'hui, et
                  le champ se tenait entre le commentaire et le bouton de
                  validation pour un cas rare. */}
              {/* La rangée garde sa hauteur, ouverte ou fermée, si bien que
                  déplier ne coûte rien. Deux choses le permettent :
                  l'étiquette se place à côté du champ plutôt qu'au-dessus, et
                  la rangée réserve la hauteur du champ alors qu'elle est
                  encore repliée. Empilée et non réservée, une touche ajoutait
                  48 px à un corps qui défilait déjà — tout le bilan sautait
                  sous le pouce, ce qui se remarque bien plus que la barre de
                  défilement elle-même. */}
              <HStack justify="center" gap={2} flexWrap="wrap" minH="44px">
                {isDateOpen ? (
                  <>
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                      letterSpacing="wide"
                      flexShrink={0}
                    >
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
                    onClick={() => setIsDateOpen(true)}
                    fontSize="xs"
                    color="fg.muted"
                    _hover={{ color: 'app.primary' }}
                    css={hitArea(32)}
                  >
                    Ce n'était pas aujourd'hui&nbsp;?
                  </Box>
                )}
              </HStack>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer gap={3} flexWrap="wrap" flexShrink={0}>
            {/* A greyed-out button with no explanation looks broken. We say
                what is missing, next to what will not go — and short enough
                to share the line with it. "Choisis un cran pour valider."
                wrapped the footer onto a second row at 390 px, and a footer
                does not scroll: that row came straight out of the body. The
                greyed "Valider" beside it carries the rest of the sentence. */}
            {effort === undefined && (
              <Text fontSize="xs" color="fg.muted" mr="auto" flexShrink={0}>
                Choisis un cran.
              </Text>
            )}
            <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
              Annuler
            </Button>
            {/* Le seul champ requis du formulaire, et il l'est
                réellement : présélectionner « 3 » enregistrerait une valeur
                que le client n'a jamais choisie, et elle nourrirait la
                tendance que le coach lit. */}
            <Button
              bg="app.primary"
              color="bg.canvas"
              fontWeight="bold"
              onClick={handleSubmit}
              disabled={effort === undefined}
              loading={isLoading}
            >
              Valider
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};
