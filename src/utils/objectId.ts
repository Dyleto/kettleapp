/**
 * Un identifiant au format ObjectId, fabriqué côté client.
 *
 * Le format d'ObjectId est conçu pour être généré n'importe où : douze octets,
 * dont un horodatage, une part aléatoire propre au processus et un compteur.
 * Deux navigateurs ne peuvent pas produire le même dans la même seconde.
 *
 * On s'en sert pour qu'une séance ait sa clé définitive dès sa création, avant
 * même d'avoir été enregistrée. L'API peut alors traiter chaque envoi comme un
 * upsert sur cette clé : renvoyer deux fois le même programme donne le même
 * résultat. C'est ce que l'enregistrement automatique exige — il envoie
 * souvent, et parfois deux fois de suite avant la première réponse.
 *
 * Les identifiants temporaires précédents (`temp-<uuid>`) n'étaient pas des
 * ObjectId valides : l'API les ignorait et créait une séance à chaque envoi.
 */

/** Cinq octets tirés une fois par chargement de page, comme le fait le pilote. */
const ALEA = Array.from(crypto.getRandomValues(new Uint8Array(5)))
  .map((octet) => octet.toString(16).padStart(2, '0'))
  .join('');

/** Le compteur démarre au hasard pour que deux onglets ne se suivent pas. */
let compteur = crypto.getRandomValues(new Uint32Array(1))[0] % 0xffffff;

export const newObjectId = (): string => {
  const secondes = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0');
  compteur = (compteur + 1) % 0x1000000;
  return secondes + ALEA + compteur.toString(16).padStart(6, '0');
};
