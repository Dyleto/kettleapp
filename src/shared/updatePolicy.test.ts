import { describe, it, expect } from 'vitest';
import { decideUpdate } from './updatePolicy';

// Le cas courant : rien n'attend.
const calm = { needRefresh: false, unsaved: false, visible: true };

describe('decideUpdate', () => {
  it("ne fait rien quand aucune version n'attend", () => {
    expect(decideUpdate(calm)).toBe('wait');
  });

  // Même si une frappe est en cours : il n'y a rien à prendre, donc rien à
  // demander. Un bandeau ici serait une alerte sans objet.
  it("ne demande rien quand aucune version n'attend, frappe en cours ou pas", () => {
    expect(decideUpdate({ ...calm, unsaved: true })).toBe('wait');
  });

  it('recharge quand une version attend et que rien ne risque de se perdre', () => {
    expect(decideUpdate({ ...calm, needRefresh: true })).toBe('reload');
  });

  // Le cas qui justifie tout ce module : recharger coûterait les dernières
  // secondes de saisie du coach.
  it("demande au lieu de recharger quand du travail n'est pas enregistré", () => {
    expect(
      decideUpdate({ needRefresh: true, unsaved: true, visible: true })
    ).toBe('ask');
  });

  // Recharger un onglet caché ferait retrouver au retour une page remise à
  // zéro, sans que rien n'explique pourquoi.
  it('attend le retour sur l’onglet plutôt que de recharger en arrière-plan', () => {
    expect(
      decideUpdate({ needRefresh: true, unsaved: false, visible: false })
    ).toBe('wait');
  });

  // Le travail non enregistré passe avant la visibilité : la personne doit
  // trouver le bandeau en revenant, pas un rechargement déjà fait.
  it('demande aussi sur un onglet caché quand il reste quelque chose à perdre', () => {
    expect(
      decideUpdate({ needRefresh: true, unsaved: true, visible: false })
    ).toBe('ask');
  });
});
