import { ToggleRow } from '@/kit';
import { canVibrate } from '@/shared/feedback/haptics';
import {
  useSoundSetting,
  useVibrationSetting,
} from '@/shared/feedback/settings';
import { unlockSound } from '@/shared/feedback/sound';

/**
 * Les réglages de cet appareil, dans « Mon compte » : les sons et les
 * vibrations de la séance guidée, sous « Pendant la séance ».
 *
 * Ils ne sont pas rangés dans le compte, parce qu'on veut des sons sur le
 * téléphone posé au sol et pas forcément sur l'ordinateur du bureau. Les
 * sons se règlent aussi dans la séance, pour qui les coupe au milieu d'un
 * tour ; les vibrations, ici seulement.
 *
 * « Sons du chronomètre » et non plus « Les bips de la séance guidée »,
 * avec une phrase dessous : la maquette range les deux réglages en deux
 * lignes d'une même carte, et l'intitulé suffit à dire ce qui sonne.
 *
 * Les vibrations ne s'affichent que là où le téléphone sait vibrer : Safari
 * sur iPhone ne le sait pas, et un réglage qui ne règle rien n'a pas sa
 * place.
 */
export const DeviceSettings = () => {
  const [sound, setSound] = useSoundSetting();
  const [vibration, setVibration] = useVibrationSetting();
  return (
    <>
      <ToggleRow
        label="Sons du chronomètre"
        checked={sound}
        onChange={(next) => {
          // Remettre le son est un geste : c'est le moment d'ouvrir la
          // sortie audio, que le navigateur n'ouvre que sur une touche.
          if (next) unlockSound();
          setSound(next);
        }}
      />
      {canVibrate() && (
        <ToggleRow
          label="Vibrations"
          checked={vibration}
          onChange={setVibration}
        />
      )}
    </>
  );
};
