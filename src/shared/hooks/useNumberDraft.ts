import { useState } from 'react';
import { parseNumberInput } from '@/shared/utils/numberInput';

interface Params {
  /** La valeur enregistrée, ou `undefined` quand il n'y a rien. */
  value?: number;
  onChange: (next?: number) => void;
  decimals?: boolean;
}

interface NumberDraft {
  /** Ce que le champ affiche. */
  text: string;
  /** À brancher sur la frappe. */
  onText: (raw: string) => void;
  /** À brancher sur la sortie du champ : rend la main à la valeur
   * enregistrée. */
  onLeave: () => void;
}

/**
 * Un champ numérique garde le texte tapé, pas le nombre analysé.
 *
 * C'est la raison pour laquelle « 22,5 » était inatteignable même là où la
 * virgule était convertie. Le champ se réaffichait depuis le nombre :
 *
 *   on tape « 22 »   → 22    → le champ montre « 22 »
 *   on tape « 22, »  → 22    → le champ montre « 22 », la virgule a disparu
 *   on tape « 5 »    → 225
 *
 * `Number('22.')` vaut 22, donc la frappe intermédiaire ne changeait pas le
 * nombre, et le champ reprenait la main sur ce qui venait d'être tapé. Il
 * n'y avait aucun moyen de passer la virgule.
 *
 * Le texte vit donc ici tant que le champ est touché, et le nombre part à
 * chaque frappe — l'enregistrement automatique attend déjà de son côté, et
 * garder la valeur pour soi jusqu'à la sortie du champ perdait le travail de
 * qui quittait la page sans en sortir.
 *
 * Le brouillon est rendu à la sortie du champ, et c'est nécessaire : gardé
 * pour toujours, il masquerait la valeur enregistrée — un champ touché une
 * fois cesserait de montrer ce qu'une relecture, une reprise de séance ou
 * une correction venue d'ailleurs a écrit.
 */
export const useNumberDraft = ({
  value,
  onChange,
  decimals,
}: Params): NumberDraft => {
  const [draft, setDraft] = useState<string | undefined>(undefined);

  const onText = (raw: string) => {
    setDraft(raw);
    onChange(parseNumberInput(raw, { decimals }));
  };

  return {
    text: draft ?? (value === undefined ? '' : String(value)),
    onText,
    onLeave: () => setDraft(undefined),
  };
};
