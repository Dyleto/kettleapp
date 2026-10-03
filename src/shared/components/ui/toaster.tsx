import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
} from '@chakra-ui/react';
import { toaster } from './toasterInstance';

/**
 * Où les toasts s'affichent : en bas, et au-dessus de tout.
 *
 * En bas, parce que l'application se tient à une main : le haut d'un
 * téléphone ne se lit pas sans changer de prise. `pointerEvents="none"` sur
 * le conteneur et non sur les toasts eux-mêmes — il couvre tout l'écran, et
 * sans cela il avalerait les clics destinés à la page.
 */
export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster
        toaster={toaster}
        insetInline={{ mdDown: '0' }}
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={9999}
        pointerEvents="none"
        display="flex"
        flexDirection="column"
        justifyContent="flex-end"
        alignItems={{ base: 'center', md: 'flex-end' }}
        padding={{ base: '0 0 20px 0', md: '0 20px 20px 0' }}
      >
        {(toast) => (
          /* Les jetons du thème, et non la palette par défaut de
             Chakra : un message « Exercice créé » sortait en vert saturé à
             l'instant même où le bouton d'à côté passait au sarcelle
             `app.success`. Deux verts pour le même événement, côte à
             côte. */
          <Toast.Root
            width={{ base: '90vw', md: 'sm' }}
            style={{ pointerEvents: 'auto', marginBottom: '8px' }}
            onClick={() => toaster.dismiss(toast.id)}
            bg="surface.card"
            color="fg"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            borderLeftWidth="3px"
            borderLeftColor={
              toast.type === 'error'
                ? 'app.error'
                : toast.type === 'success'
                  ? 'app.success'
                  : 'app.primary'
            }
            boxShadow="0 8px 24px rgba(0,0,0,0.45)"
          >
            {toast.type === 'loading' ? (
              <Spinner size="sm" color="app.primary" />
            ) : (
              <Toast.Indicator
                color={
                  toast.type === 'error'
                    ? 'app.error'
                    : toast.type === 'success'
                      ? 'app.success'
                      : 'app.primary'
                }
              />
            )}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
              {toast.description && (
                <Toast.Description>{toast.description}</Toast.Description>
              )}
            </Stack>
            {/* « Annuler » doit se voir et se viser : c'est la seule chose
                d'un bandeau sur laquelle on appuie, et c'était du texte
                ordinaire à la taille du message. */}
            {toast.action && (
              <Toast.ActionTrigger
                color="app.primary"
                fontWeight="bold"
                fontSize="sm"
                flexShrink={0}
                minH="44px"
                px={2}
                display="flex"
                alignItems="center"
                _hover={{ color: 'app.primary.hover' }}
              >
                {toast.action.label}
              </Toast.ActionTrigger>
            )}
            {toast.closable && <Toast.CloseTrigger />}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
};
