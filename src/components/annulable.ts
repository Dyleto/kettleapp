import { toaster } from '@/components/ui/toasterInstance';

/**
 * Le filet d'annulation : l'action part, et on peut la reprendre.
 *
 * Kettle protégeait ses suppressions en demandant avant — « Supprimer la
 * séance 3 ? ». C'est une question posée cent fois pour les deux fois où l'on
 * s'était trompé, et elle ne couvre que ce à quoi on a pensé : retirer un
 * exercice, le geste le plus fréquent de l'atelier, ne demandait rien du tout.
 *
 * Le filet inverse la logique. L'action a lieu tout de suite, et un bandeau
 * reste quelques secondes avec de quoi la reprendre. Gratuit quand on avait
 * raison, rattrapable quand on avait tort.
 *
 * Ce n'est pas une suppression en attente, et la différence compte : dans
 * l'atelier, une suppression est un changement de structure, donc partie au
 * serveur dans la seconde. Fermer l'application ne laisse rien en suspens — la
 * suppression tient, ce que le geste disait. « Annuler » n'attend pas, il
 * repose l'état d'avant, et l'enregistrement automatique le renvoie comme
 * n'importe quelle autre modification.
 *
 * D'où la seule règle à respecter pour s'en servir : faire l'action d'abord,
 * appeler ceci ensuite, et donner de quoi reconstruire — jamais de quoi
 * « confirmer ».
 */
export const annulable = ({
  titre,
  description,
  annuler,
}: {
  /** Ce qui vient d'arriver, au passé : « Corde à sauter retiré ». */
  titre: string;
  description?: string;
  /** Repose l'état d'avant. Appelé au plus une fois. */
  annuler: () => void;
}) => {
  let repris = false;
  toaster.create({
    title: titre,
    description,
    // Plus long qu'un message ordinaire : on ne lit pas un bandeau au moment
    // où on l'affiche, on le lit à la seconde où l'on réalise son erreur.
    duration: 8000,
    action: {
      label: 'Annuler',
      onClick: () => {
        // Chakra referme le bandeau au clic, et le clic sur le fond le referme
        // aussi : sans ce verrou, un doigt malheureux pourrait rejouer la
        // reprise et reposer deux fois l'exercice retiré.
        if (repris) return;
        repris = true;
        annuler();
      },
    },
  });
};
