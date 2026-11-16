import { useState } from 'react';
import { Text } from '@chakra-ui/react';
import { ActionButton } from '@/shared/components/ActionButton';
import { DateInput } from '@/shared/components/DateInput';
import { Sheet } from '@/shared/components/Sheet';
import { dayKey } from '../../sessionDates';

/**
 * « Je l'ai déjà faite » : une séance faite sans l'application.
 *
 * Le bouton « J'ai terminé cette séance » était à côté de « Démarrer », de
 * la même taille : deux chemins présentés comme égaux, quand l'un est le
 * cours normal et l'autre l'exception. Il devient un lien discret, et la
 * feuille qu'il ouvre dit à quoi il sert avant de demander quoi que ce
 * soit.
 *
 * La date d'abord, parce que c'est ce qui manque le plus souvent : on
 * déclare le soir, ou le lendemain, la séance faite à la salle. Jamais dans
 * le futur.
 */
export const DeclareSheet = ({
  onContinue,
  onClose,
}: {
  /** La date choisie, en `YYYY-MM-DD`. */
  onContinue: (date: string) => void;
  onClose: () => void;
}) => {
  const [today] = useState(() => dayKey(new Date()));
  const [date, setDate] = useState(today);
  return (
    <Sheet label="Tu l'as faite sans l'application ?" onDismiss={onClose}>
      <Text as="h2" fontSize="22px" fontWeight="800" lineHeight="1.2">
        Tu l&rsquo;as faite sans l&rsquo;application&nbsp;?
      </Text>
      <Text color="fg.muted">
        Pas besoin de la rejouer. Dis quand, note tes charges si tu veux, puis
        dis comment c&rsquo;était.
      </Text>
      <DateInput
        ariaLabel="Date de la séance"
        value={date}
        max={today}
        onChange={(next) => setDate(next || today)}
      />
      <ActionButton size="lg" w="full" onClick={() => onContinue(date)}>
        Continuer
      </ActionButton>
      <ActionButton tone="ghost" size="md" w="full" onClick={onClose}>
        Annuler
      </ActionButton>
    </Sheet>
  );
};
