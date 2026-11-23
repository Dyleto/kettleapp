import { useEffect, useState } from 'react';
import {
  Box,
  chakra,
  HStack,
  Portal,
  Spinner,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { LuCheck, LuChevronRight, LuCopy } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { useAuth } from '@/shared/contexts/useAuth';
import { LegalFooter } from '@/shared/components/LegalFooter';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import GoogleLoginButton from '@/features/auth/components/GoogleLoginButton';
import { useGoogleOAuth } from '@/features/auth/hooks/useGoogleOAuth';
import { useSheetDismiss } from '@/features/workshop';
import { ActionButton, hitArea, Mascot, Sheet } from '@/kit';
import { LEGAL } from '@/shared/config/legal';
import { invitationTokenFrom } from '@/domain/invitation/link';

/**
 * La promesse, en une phrase.
 *
 * Elle remplace trois puces — « Programmes sur mesure », « Suivi séance par
 * séance », « Bibliothèque d'exercices partagée » — qui décrivaient des
 * fonctions et non ce qui se passe. La maquette finit par « Il ajuste » :
 * un accord sur un coach dont on ne connaît pas le genre, que Kettle
 * n'écrit plus nulle part (F8a). C'est le ressenti qui règle la suite, et
 * c'est ce que la phrase dit.
 */
const PROMISE =
  'Ton coach écrit ta séance. Tu la suis pas à pas. Ton ressenti règle la suite.';

/** Une rangée de la carte des deux chemins : un nom et son chevron. */
const PathRow = ({ label, onOpen }: { label: string; onOpen: () => void }) => (
  <chakra.button
    type="button"
    aria-haspopup="dialog"
    onClick={onOpen}
    display="flex"
    alignItems="center"
    gap="12px"
    w="full"
    minH="56px"
    px="16px"
    textAlign="left"
    borderTopWidth="1px"
    borderColor="line"
    _first={{ borderTopWidth: 0 }}
    _hover={{ bg: 'bg.raised' }}
    _focusVisible={{ outlineOffset: '-2px' }}
  >
    <Text as="span" flex={1} fontWeight="600">
      {label}
    </Text>
    <Box color="fg.muted" aria-hidden>
      <LuChevronRight size={18} />
    </Box>
  </chakra.button>
);

/**
 * « J'ai reçu une invitation » : quoi faire, et de quoi coller le lien.
 *
 * Se connecter ici sans lien crée un compte rattaché à personne : le client
 * n'y voit aucune séance, et c'était la boucle de l'entrée A1. La feuille
 * renvoie donc au lien du coach — l'ouvrir suffit — et accepte qu'on le
 * colle, pour qui ne le retrouve que sous forme de texte. « Continuer »
 * s'active quand le texte en a l'air, et mène à l'écran d'invitation, qui
 * vérifie le jeton.
 */
const InviteSheet = ({ onClose }: { onClose: () => void }) => {
  useSheetDismiss(true, onClose);
  const navigate = useNavigate();
  const [pasted, setPasted] = useState('');
  const token = invitationTokenFrom(pasted);
  const title = 'Tu as reçu un lien ?';
  return (
    <Portal>
      <Sheet label={title} onDismiss={onClose}>
        <Text as="h2" fontWeight="800" fontSize="22px">
          {title}
        </Text>
        <Text color="fg.muted">
          Ouvre-le : il te rattache à ton coach et crée ton compte en même
          temps. Si tu l'as perdu, demande-lui de te le renvoyer.
        </Text>
        <chakra.input
          type="url"
          inputMode="url"
          aria-label="Ton lien d'invitation"
          placeholder="Ou colle ton lien ici"
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && token) navigate(`/join?token=${token}`);
          }}
          minH="50px"
          px="16px"
          borderRadius="17px"
          bg="surface.card"
          border="none"
          outline="none"
          boxShadow="inset 0 0 0 1.5px {colors.line}"
          _focus={{ boxShadow: 'inset 0 0 0 2px {colors.app.primary}' }}
          color="fg"
          _placeholder={{ color: 'fg.muted' }}
        />
        {pasted.trim() && !token && (
          <Text fontSize="sm" color="fg.muted" data-paste-hint>
            Ce n'est pas encore un lien d'invitation : il contient
            «&nbsp;join?token=&nbsp;».
          </Text>
        )}
        <ActionButton
          w="full"
          disabled={!token}
          onClick={() => token && navigate(`/join?token=${token}`)}
        >
          Continuer
        </ActionButton>
      </Sheet>
    </Portal>
  );
};

/**
 * « Je suis coach » : comment obtenir un compte, et l'adresse à copier.
 *
 * L'espace coach ne s'ouvre pas tout seul à l'inscription. L'adresse se
 * copie d'une touche ; une copie refusée la sélectionne et le dit, comme le
 * lien d'invitation du coach (F5a). « J'ai déjà un compte coach » mène à la
 * connexion Google : c'est ce qu'un coach venu par ce chemin cherchait.
 */
const CoachSheet = ({ onClose }: { onClose: () => void }) => {
  useSheetDismiss(true, onClose);
  const { loginWithGoogle } = useGoogleOAuth();
  const [copy, setCopy] = useState<'idle' | 'copied' | 'refused'>('idle');
  const address = LEGAL.publisher.contactEmail;
  const title = 'Tu es coach ?';

  useEffect(() => {
    if (copy !== 'copied') return;
    const timer = setTimeout(() => setCopy('idle'), 2000);
    return () => clearTimeout(timer);
  }, [copy]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopy('copied');
    } catch {
      const field = document.getElementById('coach-address');
      if (field) window.getSelection()?.selectAllChildren(field);
      setCopy('refused');
    }
  };

  return (
    <Portal>
      <Sheet label={title} onDismiss={onClose}>
        <Text as="h2" fontWeight="800" fontSize="22px">
          {title}
        </Text>
        <Text color="fg.muted">
          Les comptes de coach sont ouverts à la main, le temps que Kettle
          grandisse. Écris-nous, on te répond vite.
        </Text>
        <HStack
          minH="50px"
          pl="16px"
          pr="6px"
          borderRadius="17px"
          bg="surface.card"
          boxShadow="inset 0 0 0 1.5px {colors.line}"
        >
          <Text id="coach-address" flex={1} minW={0} truncate>
            {address}
          </Text>
          <chakra.button
            type="button"
            aria-label="Copier l'adresse"
            onClick={() => void copyAddress()}
            color={copy === 'copied' ? 'app.primary' : 'fg.muted'}
            p="8px"
            css={hitArea(44)}
          >
            {copy === 'copied' ? <LuCheck size={18} /> : <LuCopy size={18} />}
          </chakra.button>
        </HStack>
        {copy !== 'idle' && (
          <Text role="status" fontSize="sm" color="fg.muted">
            {copy === 'copied'
              ? 'Adresse copiée.'
              : 'La copie n’est pas permise ici : l’adresse est sélectionnée, copie-la à la main.'}
          </Text>
        )}
        <ActionButton
          tone="ghost"
          size="md"
          w="full"
          onClick={() => loginWithGoogle()}
        >
          J'ai déjà un compte coach
        </ActionButton>
      </Sheet>
    </Portal>
  );
};

/**
 * L'entrée dans Kettle quand on n'a pas de lien. Un client arrive presque
 * toujours par celui de son coach ; cet écran sert à ceux qui reviennent.
 *
 * Sur téléphone, la promesse au milieu et l'action sous le pouce ; sur
 * grand écran, deux volets — la promesse à gauche, l'action à droite. Les
 * deux chemins de qui n'a pas encore de compte, « J'ai reçu une
 * invitation » et « Je suis coach », s'ouvrent dans une feuille : le
 * bouton Google ne sert vraiment qu'à qui en a déjà un.
 */
const Login = () => {
  useDocumentTitle('Connexion');
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const wide = useBreakpointValue({ base: false, lg: true }) ?? false;
  const [path, setPath] = useState<'invite' | 'coach' | null>(null);

  useEffect(() => {
    if (!isLoading && user) navigate('/');
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="100dvh"
      >
        <Spinner size="xl" color="app.primary" />
      </Box>
    );
  }

  const promise = (
    <VStack
      gap={{ base: '18px', lg: '20px' }}
      align={{ base: 'center', lg: 'flex-start' }}
      textAlign={{ base: 'center', lg: 'left' }}
      data-login-promise
    >
      <Mascot mood="hello" size={wide ? 140 : 110} />
      {/* Le nom du produit titre l'écran : sans `h1`, un lecteur d'écran
          n'avait rien pour l'annoncer. */}
      <Text
        as="h1"
        fontWeight="800"
        fontSize={{ base: '46px', lg: '72px' }}
        letterSpacing="0.02em"
        lineHeight="1"
      >
        KETTLE
      </Text>
      <Text
        color="fg.muted"
        fontSize={{ base: '18px', lg: '24px' }}
        maxW={{ base: '300px', lg: '440px' }}
      >
        {PROMISE}
      </Text>
    </VStack>
  );

  const action = (
    <VStack align="stretch" gap="12px" w="full" data-login-action>
      {wide && (
        <Text as="h2" fontWeight="800" fontSize="24px" mb="4px">
          Connexion
        </Text>
      )}
      <GoogleLoginButton text="Continuer avec Google" />
      <Box bg="surface.card" borderRadius="card" overflow="hidden">
        <PathRow
          label="J'ai reçu une invitation"
          onOpen={() => setPath('invite')}
        />
        <PathRow label="Je suis coach" onOpen={() => setPath('coach')} />
      </Box>
      <Box pt="4px">
        <LegalFooter />
      </Box>
    </VStack>
  );

  return (
    <Box as="main" id="contenu" minH="100dvh" bg="bg.canvas">
      {wide ? (
        <HStack align="stretch" gap={0} minH="100dvh">
          <VStack
            flex={1}
            justify="center"
            align="flex-start"
            p="80px"
            bgGradient="to-br"
            gradientFrom="#2B2415"
            gradientVia="bg.canvas"
            gradientTo="bg.canvas"
          >
            {promise}
          </VStack>
          <VStack
            w="480px"
            flexShrink={0}
            justify="center"
            p="60px"
            bg="bg.surface"
            borderLeftWidth="1px"
            borderColor="line"
          >
            {action}
          </VStack>
        </HStack>
      ) : (
        <VStack
          minH="100dvh"
          maxW="440px"
          mx="auto"
          px={5}
          pt={8}
          pb="calc(env(safe-area-inset-bottom, 0px) + 20px)"
          gap={6}
        >
          <VStack flex={1} justify="center">
            {promise}
          </VStack>
          {action}
        </VStack>
      )}
      {path === 'invite' && <InviteSheet onClose={() => setPath(null)} />}
      {path === 'coach' && <CoachSheet onClose={() => setPath(null)} />}
    </Box>
  );
};

export default Login;
