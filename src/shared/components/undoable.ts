import { toaster } from '@/shared/components/ui/toasterInstance';

/**
 * Le filet d'annulation : l'action passe, et peut être reprise.
 *
 * Kettle protégeait ses suppressions en demandant d'abord — « Supprimer la
 * séance 3 ? ». C'est une question posée cent fois pour les deux occasions où
 * quelqu'un s'est trompé, et elle ne couvre que ce à quoi on a pensé : retirer
 * un exercice, le geste le plus fréquent de l'éditeur, ne demandait rien du
 * tout.
 *
 * Le filet inverse la logique. L'action a lieu aussitôt, et une bannière reste
 * quelques secondes avec de quoi la reprendre. Gratuit quand on avait raison,
 * rattrapable quand on avait tort.
 *
 * Ce n'est pas une suppression en attente, et la différence compte : dans
 * l'éditeur, une suppression est un changement structurel, elle part donc au
 * serveur dans la seconde. Fermer l'application ne laisse rien en suspens — la
 * suppression tient, ce que le geste disait. « Annuler » n'attend pas, il
 * remet l'état précédent, et l'enregistrement automatique l'envoie comme tout
 * autre changement.
 *
 * D'où la seule règle à respecter en s'en servant : faire l'action d'abord,
 * appeler ceci ensuite, et fournir de quoi reconstruire — jamais de quoi
 * « confirmer ».
 */
export const undoable = ({
  title,
  description,
  undo,
}: {
  /** Ce qui vient de se passer, au passé : « Corde à sauter retiré ». */
  title: string;
  description?: string;
  /** Remet l'état précédent. Appelé au plus une fois. */
  undo: () => void;
}) => {
  let taken = false;
  toaster.create({
    title: title,
    description,
    // Plus long qu'un message ordinaire : on ne lit pas un bandeau au moment
    // où il apparaît, on le lit à la seconde où l'on réalise son erreur.
    duration: 8000,
    action: {
      label: 'Annuler',
      onClick: () => {
        // Chakra ferme la bannière au clic, et un clic sur le fond la ferme
        // aussi : sans ce verrou, un doigt malchanceux pourrait rejouer
        // l'annulation et remettre deux fois l'exercice retiré.
        if (taken) return;
        taken = true;
        undo();
      },
    },
  });
};
