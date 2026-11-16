import { describe, expect, it } from 'vitest';
import { sessionName, sessionRank } from './name';

describe('sessionName', () => {
  it('donne le nom que le coach a choisi, sans le rang devant', () => {
    expect(sessionName({ order: 2, name: 'Haut du corps' })).toBe(
      'Haut du corps'
    );
  });

  it('retombe sur le rang quand rien n’est nommé', () => {
    expect(sessionName({ order: 3 })).toBe('Séance 3');
    // Un nom fait d'espaces n'est pas un nom : « Séance 3 », pas « ».
    expect(sessionName({ order: 3, name: '   ' })).toBe('Séance 3');
  });

  it('ne garde pas les espaces que le champ a laissés', () => {
    expect(sessionName({ order: 1, name: '  Full body A ' })).toBe(
      'Full body A'
    );
  });
});

describe('sessionRank', () => {
  it('dit la place dans le programme', () => {
    expect(sessionRank(4)).toBe('Séance 4');
  });
});
