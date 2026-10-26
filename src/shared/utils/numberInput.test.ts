import { describe, it, expect } from 'vitest';
import { parseNumberInput } from './numberInput';

describe('parseNumberInput', () => {
  it('lit un entier', () => {
    expect(parseNumberInput('22')).toBe(22);
  });

  // Le cas du terrain : « il peut pas écrire 22,5 ». `Number('22,5')` vaut
  // `NaN`, donc la valeur était purement rejetée.
  it('lit la virgule comme séparateur décimal', () => {
    expect(parseNumberInput('22,5', { decimals: true })).toBe(22.5);
  });

  it('lit aussi le point', () => {
    expect(parseNumberInput('22.5', { decimals: true })).toBe(22.5);
  });

  // Les frappes intermédiaires doivent donner un nombre, sinon la valeur
  // disparaîtrait le temps d'un caractère.
  it('lit une virgule finale comme le nombre qui la précède', () => {
    expect(parseNumberInput('22,', { decimals: true })).toBe(22);
  });

  it('lit une décimale sans partie entière', () => {
    expect(parseNumberInput(',5', { decimals: true })).toBe(0.5);
  });

  // La frontière est au contrat : l'API déclare `reps`, `sets` et `rounds`
  // en entiers. Envoyer 12,5 donnerait un 400 que le coach lirait comme
  // « ça n'enregistre pas ».
  it('arrondit quand les décimales ne sont pas permises', () => {
    expect(parseNumberInput('12,5')).toBe(13);
    expect(parseNumberInput('12,4')).toBe(12);
  });

  it('ne permet pas les décimales par défaut', () => {
    expect(parseNumberInput('22,5')).toBe(23);
  });

  // « Rien ici » n'est pas « zéro », et c'est la distinction que tient tout
  // le reste de l'application, jusqu'à ce qu'on envoie à l'API.
  it('rend `undefined` sur un champ vide', () => {
    expect(parseNumberInput('')).toBeUndefined();
    expect(parseNumberInput('   ')).toBeUndefined();
  });

  it('rend `undefined` sur un séparateur seul', () => {
    expect(parseNumberInput(',')).toBeUndefined();
  });

  it("rend `undefined` sur ce qui n'est pas un nombre", () => {
    expect(parseNumberInput('abc')).toBeUndefined();
    expect(parseNumberInput('12kg')).toBeUndefined();
  });

  // Aucun de ces champs ne reçoit de négatif — une charge, des répétitions,
  // une durée. Le refuser ici évite de le refuser dans chacun d'eux.
  it('refuse un nombre négatif', () => {
    expect(parseNumberInput('-5')).toBeUndefined();
  });

  it('refuse deux séparateurs', () => {
    expect(parseNumberInput('1.2.3', { decimals: true })).toBeUndefined();
  });

  it('refuse une notation exponentielle', () => {
    expect(parseNumberInput('1e3')).toBeUndefined();
  });
});
