import { stepLoad } from '@/features/client/guided/load';
import { NumberStepper } from './NumberStepper';

interface LoadStepperProps {
  /** La charge affichée — notée, ou proposée. */
  value?: number;
  onChange: (next?: number) => void;
  /** « comme la dernière fois », « + 2 kg sur la dernière fois ». */
  legend?: string;
  /** Le nom du champ pour un lecteur d'écran : le mouvement et la série. */
  label: string;
}

/**
 * La charge d'une série : un kilo par touche, cinq à l'appui long, et
 * « 22,5 » au clavier. Le pas en demi-kilos est celui des plus petits
 * disques ; tout le reste est le sélecteur commun, `NumberStepper`.
 */
export const LoadStepper = (props: LoadStepperProps) => (
  <NumberStepper
    {...props}
    step={stepLoad}
    unit="kg"
    decimals
    stepLabels={['Un kilo de moins', 'Un kilo de plus']}
  />
);
