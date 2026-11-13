import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { isNotFound, isRefusal, isUnavailable } from './queryState';

/** Une erreur telle qu'axios la lève quand le serveur a répondu `status`. */
const answered = (status: number) =>
  new AxiosError('refus', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    data: {},
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

/** Une coupure : la requête est partie, rien n'est revenu. */
const networkCut = () => new AxiosError('Network Error', 'ERR_NETWORK');

describe('isUnavailable', () => {
  it("vaut pour une requête en échec qui n'a jamais rien reçu", () => {
    expect(isUnavailable({ data: undefined, isLoading: false })).toBe(true);
  });

  it('ne vaut pas pendant le premier chargement', () => {
    expect(isUnavailable({ data: undefined, isLoading: true })).toBe(false);
  });

  it("ne vaut pas quand une relecture échoue mais qu'une donnée reste", () => {
    // Le cas qui interdit de se fier à `isError` : il est vrai ici, et il y
    // a pourtant de quoi afficher.
    expect(isUnavailable({ data: [], isLoading: false })).toBe(false);
  });

  it('tient une liste vide pour une réponse, pas pour une absence', () => {
    // C'est toute la différence entre « ton coach n'a rien écrit » et « le
    // serveur n'a pas répondu ».
    expect(isUnavailable({ data: { sessions: [] }, isLoading: false })).toBe(
      false
    );
  });
});

describe('isNotFound', () => {
  it('reconnaît un 404', () => {
    expect(isNotFound(answered(404))).toBe(true);
  });

  it('ne confond pas une coupure de réseau avec une absence', () => {
    expect(isNotFound(networkCut())).toBe(false);
  });

  it('ne confond pas un autre refus avec une absence', () => {
    expect(isNotFound(answered(403))).toBe(false);
    expect(isNotFound(answered(500))).toBe(false);
  });

  it("ne lève pas sur ce qui n'est pas une erreur HTTP", () => {
    expect(isNotFound(new Error('autre chose'))).toBe(false);
    expect(isNotFound(null)).toBe(false);
  });
});

describe('isRefusal', () => {
  it('vaut pour toute la plage 400–499', () => {
    expect(isRefusal(answered(400))).toBe(true);
    expect(isRefusal(answered(404))).toBe(true);
    expect(isRefusal(answered(499))).toBe(true);
  });

  it('ne vaut pas pour une erreur du serveur, qui peut passer', () => {
    expect(isRefusal(answered(500))).toBe(false);
    expect(isRefusal(answered(503))).toBe(false);
  });

  it('ne vaut pas pour une coupure de réseau, qui doit être retentée', () => {
    expect(isRefusal(networkCut())).toBe(false);
  });
});
