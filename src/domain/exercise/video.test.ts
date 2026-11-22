/** Le lien vidéo d'un exercice : ce qui se joue, ce qui s'ouvre, ce qui est refusé. */
import { describe, expect, it } from 'vitest';
import { readVideoLink, videoLinkError } from './video';

describe('la lecture d’un lien', () => {
  it('YouTube se joue dans la fiche, Shorts compris', () => {
    expect(
      readVideoLink('https://www.youtube.com/watch?v=sswzD1Q7dTk')
    ).toEqual({ kind: 'youtube', id: 'sswzD1Q7dTk', isShort: false });
    expect(readVideoLink('https://youtube.com/shorts/abc123')).toEqual({
      kind: 'youtube',
      id: 'abc123',
      isShort: true,
    });
  });

  it('une autre adresse s’ouvre ailleurs', () => {
    expect(readVideoLink('  https://vimeo.com/123456 ')).toEqual({
      kind: 'link',
      url: 'https://vimeo.com/123456',
    });
  });

  it('rien à montrer pour un lien vide ou illisible', () => {
    expect(readVideoLink('')).toBeNull();
    expect(readVideoLink(undefined)).toBeNull();
    expect(readVideoLink('vimeo.com/123')).toBeNull();
    expect(readVideoLink('https://localhost')).toBeNull();
    expect(readVideoLink('https://exemple .fr/video')).toBeNull();
  });
});

describe('la saisie d’un lien', () => {
  it('passe s’il se lit, ou s’il est vidé', () => {
    expect(videoLinkError('https://vimeo.com/123456')).toBeNull();
    expect(videoLinkError('   ')).toBeNull();
  });

  it('refuse un lien illisible, en disant pourquoi', () => {
    expect(videoLinkError('pas un lien')).toBe(
      'Ce lien ne ressemble pas à une adresse.'
    );
  });
});
