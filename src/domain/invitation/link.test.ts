/** Le lien d'invitation collé à la main : ce qu'on en tire, ce qu'on refuse. */
import { describe, expect, it } from 'vitest';
import { invitationTokenFrom } from './link';

const TOKEN = 'a3f9'.repeat(16);

describe('un lien d’invitation collé', () => {
  it('donne son jeton, avec ou sans https, d’où qu’il vienne', () => {
    expect(
      invitationTokenFrom(`https://kettleapp.fr/join?token=${TOKEN}`)
    ).toBe(TOKEN);
    expect(invitationTokenFrom(`  kettleapp.fr/join?token=${TOKEN} `)).toBe(
      TOKEN
    );
    expect(
      invitationTokenFrom(`http://localhost:5173/join/?token=${TOKEN}`)
    ).toBe(TOKEN);
  });

  it('laisse passer un jeton coupé : l’écran d’invitation dira quoi faire', () => {
    expect(
      invitationTokenFrom(`kettleapp.fr/join?token=${TOKEN.slice(0, 20)}`)
    ).toBe(TOKEN.slice(0, 20));
  });

  it('refuse ce qui n’en a pas l’air', () => {
    expect(invitationTokenFrom('')).toBeNull();
    expect(invitationTokenFrom('bonjour')).toBeNull();
    expect(invitationTokenFrom('kettleapp.fr/join')).toBeNull();
    expect(invitationTokenFrom('kettleapp.fr/join?token=abc')).toBeNull();
    expect(invitationTokenFrom(`kettleapp.fr/login?token=${TOKEN}`)).toBeNull();
    expect(
      invitationTokenFrom(`voici le lien kettleapp.fr/join?token=${TOKEN}`)
    ).toBeNull();
  });
});
