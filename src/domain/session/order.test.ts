import { describe, expect, it } from 'vitest';
import { dragAnnouncement, MOVE_INSTRUCTIONS, moveBy } from './order';

describe('moveBy', () => {
  const ids = ['a', 'b', 'c'];

  it('monte d’un cran', () => {
    expect(moveBy(ids, 'b', -1)).toEqual(['b', 'a', 'c']);
  });

  it('descend d’un cran', () => {
    expect(moveBy(ids, 'b', 1)).toEqual(['a', 'c', 'b']);
  });

  it('ne touche pas à la liste qu’on lui donne', () => {
    moveBy(ids, 'a', 1);
    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('le premier ne monte pas, le dernier ne descend pas', () => {
    expect(moveBy(ids, 'a', -1)).toBeNull();
    expect(moveBy(ids, 'c', 1)).toBeNull();
  });

  it('ce qui n’est pas là ne bouge pas', () => {
    expect(moveBy(ids, 'z', 1)).toBeNull();
  });
});

describe('dragAnnouncement', () => {
  it('dit la position, sans rien accorder', () => {
    expect(dragAnnouncement('start', 'Séance 2', 2, 2, 6)).toBe(
      'Séance 2 : en mouvement, position 2 sur 6.'
    );
    expect(dragAnnouncement('over', 'Séance 2', 2, 4, 6)).toBe(
      'Séance 2 : position 4 sur 6.'
    );
  });

  it('posée ailleurs, dit où ; posée là où elle était, dit que rien n’a bougé', () => {
    expect(dragAnnouncement('end', 'Séance 2', 2, 4, 6)).toBe(
      'Séance 2 : désormais en position 4 sur 6.'
    );
    expect(dragAnnouncement('end', 'Séance 2', 2, 2, 6)).toBe(
      'Séance 2 : rien n’a bougé, toujours en position 2 sur 6.'
    );
  });

  it('rendue, dit sa place de départ, pas celle qu’elle survolait', () => {
    expect(dragAnnouncement('cancel', 'Séance 2', 2, 5, 6)).toBe(
      'Séance 2 : rien n’a bougé, toujours en position 2 sur 6.'
    );
  });
});

describe('MOVE_INSTRUCTIONS', () => {
  it('promet le menu, et ni Espace ni les flèches', () => {
    Object.values(MOVE_INSTRUCTIONS).forEach((line) => {
      expect(line).toMatch(/« Monter » ou « Descendre », dans son menu\.$/);
      expect(line).not.toMatch(/espace|flèche|space|arrow/i);
    });
  });
});
