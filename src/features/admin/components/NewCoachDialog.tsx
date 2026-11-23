import { useState } from 'react';
import {
  chakra,
  Dialog,
  Grid,
  HStack,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ActionButton } from '@/kit';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { isConflict } from '@/shared/utils/queryState';
import { coachName, isEmailLike } from '@/domain/admin/coaches';
import type { CreatedCoach } from '@/shared/types';
import { useCreateCoach } from '../hooks/useCreateCoach';

type Found = Extract<CreatedCoach, { status: 'exists' }>['account'];

/** Un champ de la boîte : le même dessin que ceux des feuilles du kit. */
const Field = ({
  label,
  value,
  onChange,
  type = 'text',
  autoFocus,
  onEnter,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email';
  autoFocus?: boolean;
  onEnter: () => void;
}) => (
  <chakra.input
    aria-label={label}
    placeholder={label}
    type={type}
    value={value}
    autoFocus={autoFocus}
    autoComplete="off"
    spellCheck={false}
    onChange={(e) => onChange(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onEnter();
      }
    }}
    minW={0}
    minH="50px"
    px="16px"
    borderRadius="17px"
    bg="bg.raised"
    border="none"
    outline="none"
    boxShadow="inset 0 0 0 1.5px {colors.line}"
    _focus={{ boxShadow: 'inset 0 0 0 2px {colors.app.primary}' }}
    color="fg"
    fontSize="16px"
    _placeholder={{ color: 'fg.muted' }}
  />
);

/**
 * « Nouveau coach » : un prénom, un nom, une adresse.
 *
 * Elle vivait dans un tiroir latéral qui exigeait les trois champs et
 * jugeait l'adresse après l'envoi. Seule l'adresse compte — le nom viendra
 * de Google —, et « Créer le compte » ne s'active que quand elle ressemble à
 * une adresse.
 *
 * Une adresse déjà connue ne reçoit plus le rôle en silence : le serveur
 * répond par le nom du compte, et la boîte demande « Ce compte existe
 * déjà ». Donner le rôle à quelqu'un qui a déjà un compte est un geste
 * voulu, pas l'effet d'une faute de frappe.
 *
 * « Il se connectera avec le compte Google de cette adresse », disait la
 * maquette : on ne connaît pas le genre de la personne, la phrase parle
 * donc de la connexion.
 */
export const NewCoachDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const create = useCreateCoach();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [found, setFound] = useState<Found | null>(null);

  const close = () => {
    if (create.isPending) return;
    setFirstName('');
    setLastName('');
    setEmail('');
    setFound(null);
    create.reset();
    onClose();
  };

  const send = (promote: boolean) => {
    if (!isEmailLike(email) || create.isPending) return;
    create.mutate(
      {
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        promote: promote || undefined,
      },
      {
        onSuccess: (result) => {
          if (result.status === 'exists') {
            setFound(result.account);
            return;
          }
          toaster.create({
            type: 'success',
            title:
              result.outcome === 'promoted'
                ? `${coachName(result.coach)} est maintenant coach`
                : `Compte de coach ouvert pour ${coachName(result.coach)}`,
          });
          close();
        },
      }
    );
  };

  const failure = create.isError
    ? isConflict(create.error)
      ? 'Ce compte est déjà coach : il est dans la liste.'
      : "Rien n'a été créé. Réessaie."
    : null;

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && close()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bg="bg.surface"
            borderRadius="card"
            maxW="480px"
            mx={4}
            data-new-coach
          >
            <Dialog.Body pt={6}>
              {found ? (
                <VStack align="stretch" gap="14px" data-new-coach-found>
                  <Dialog.Title asChild>
                    <Text as="h2" fontWeight="800" fontSize="22px">
                      Ce compte existe déjà
                    </Text>
                  </Dialog.Title>
                  <VStack
                    align="start"
                    gap="2px"
                    bg="surface.card"
                    borderRadius="card"
                    p="14px 16px"
                  >
                    <Text fontWeight="700">{coachName(found)}</Text>
                    {coachName(found) !== found.email && (
                      <Text fontSize="sm" color="fg.muted">
                        {found.email}
                      </Text>
                    )}
                  </VStack>
                  <Text color="fg.muted">
                    Lui donner le rôle de coach ? Rien de ce que ce compte
                    contient ne change.
                  </Text>
                  {failure && (
                    <Text role="alert" fontSize="sm" color="fg.muted">
                      {failure}
                    </Text>
                  )}
                  <HStack justify="flex-end" gap="10px" pt="4px">
                    <ActionButton
                      tone="ghost"
                      size="md"
                      disabled={create.isPending}
                      onClick={() => {
                        create.reset();
                        setFound(null);
                      }}
                    >
                      Retour
                    </ActionButton>
                    <ActionButton
                      size="md"
                      loading={create.isPending}
                      onClick={() => send(true)}
                    >
                      Donner le rôle de coach
                    </ActionButton>
                  </HStack>
                </VStack>
              ) : (
                <VStack align="stretch" gap="14px">
                  <Dialog.Title asChild>
                    <Text as="h2" fontWeight="800" fontSize="22px">
                      Nouveau coach
                    </Text>
                  </Dialog.Title>
                  <Grid
                    templateColumns={{ base: '1fr', sm: '1fr 1fr' }}
                    gap="10px"
                  >
                    <Field
                      label="Prénom"
                      value={firstName}
                      onChange={setFirstName}
                      autoFocus
                      onEnter={() => send(false)}
                    />
                    <Field
                      label="Nom"
                      value={lastName}
                      onChange={setLastName}
                      onEnter={() => send(false)}
                    />
                  </Grid>
                  <Field
                    label="Adresse e-mail"
                    type="email"
                    value={email}
                    onChange={(next) => {
                      setEmail(next);
                      if (create.isError) create.reset();
                    }}
                    onEnter={() => send(false)}
                  />
                  <Text fontSize="sm" color="fg.muted">
                    La connexion se fera avec le compte Google de cette adresse.
                  </Text>
                  {failure && (
                    <Text role="alert" fontSize="sm" color="fg.muted">
                      {failure}
                    </Text>
                  )}
                  <HStack justify="flex-end" gap="10px" pt="4px">
                    <ActionButton
                      tone="ghost"
                      size="md"
                      disabled={create.isPending}
                      onClick={close}
                    >
                      Annuler
                    </ActionButton>
                    <ActionButton
                      size="md"
                      disabled={!isEmailLike(email)}
                      loading={create.isPending}
                      onClick={() => send(false)}
                    >
                      Créer le compte
                    </ActionButton>
                  </HStack>
                </VStack>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
