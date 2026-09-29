/**
 * An ObjectId-shaped identifier, made on the client.
 *
 * The ObjectId format is designed to be generated anywhere: twelve bytes,
 * comprising a timestamp, a random part specific to the process, and a
 * counter. Two browsers cannot produce the same one in the same second.
 *
 * We use it so a session has its final key from creation, before it has even
 * been saved. The API can then treat every send as an upsert on that key:
 * sending the same programme twice gives the same result. That is what
 * autosave requires — it sends often, and sometimes twice in a row before the
 * first response.
 *
 * The previous temporary identifiers (`temp-<uuid>`) were not valid
 * ObjectIds: the API ignored them and created a session on every send.
 */

/** Five bytes drawn once per page load, as the driver does. */
const ALEA = Array.from(crypto.getRandomValues(new Uint8Array(5)))
  .map((octet) => octet.toString(16).padStart(2, '0'))
  .join('');

/** The counter starts at random so two tabs do not follow each other. */
let compteur = crypto.getRandomValues(new Uint32Array(1))[0] % 0xffffff;

export const newObjectId = (): string => {
  const secondes = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0');
  compteur = (compteur + 1) % 0x1000000;
  return secondes + ALEA + compteur.toString(16).padStart(6, '0');
};
