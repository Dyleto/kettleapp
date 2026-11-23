import { useEffect, useId, useState } from 'react';
import { chakra, HStack, Text, VStack } from '@chakra-ui/react';
import { LuCheck, LuCopy } from 'react-icons/lu';
import { hitArea } from './hitArea';

/**
 * Une adresse à recopier : affichée, et copiée d'une touche.
 *
 * Née dans la feuille « Je suis coach » de la connexion (F9a), elle sert
 * aussi « Recevoir une copie de mes données » dans « Mon compte » : deux
 * endroits qui donnent la même adresse, et qui la donnaient l'un en lien
 * `mailto:` — qui n'ouvre rien sur un téléphone sans messagerie
 * configurée —, l'autre pas du tout.
 *
 * Une copie que le navigateur refuse sélectionne l'adresse et le dit,
 * comme le lien d'invitation du coach (F5a) : on peut alors la copier à la
 * main. « copiée » s'efface au bout de deux secondes.
 */
export const CopyField = ({
  value,
  label = "Copier l'adresse",
}: {
  value: string;
  /** Le nom du bouton de copie pour un lecteur d'écran. */
  label?: string;
}) => {
  const id = useId();
  const [copy, setCopy] = useState<'idle' | 'copied' | 'refused'>('idle');

  useEffect(() => {
    if (copy !== 'copied') return;
    const timer = setTimeout(() => setCopy('idle'), 2000);
    return () => clearTimeout(timer);
  }, [copy]);

  const copyValue = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopy('copied');
    } catch {
      const field = document.getElementById(id);
      if (field) window.getSelection()?.selectAllChildren(field);
      setCopy('refused');
    }
  };

  return (
    <VStack align="stretch" gap="8px">
      <HStack
        minH="50px"
        pl="16px"
        pr="6px"
        borderRadius="17px"
        bg="surface.card"
        boxShadow="inset 0 0 0 1.5px {colors.line}"
      >
        <Text id={id} flex={1} minW={0} truncate data-copy-value>
          {value}
        </Text>
        <chakra.button
          type="button"
          aria-label={label}
          onClick={() => void copyValue()}
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
    </VStack>
  );
};
