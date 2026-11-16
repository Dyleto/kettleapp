import { PerformedSet, PerformedValues } from '@/shared/types';

/** Une série sans aucune valeur : ni charge, ni répétitions, ni durée. */
export const isEmptySet = (set: PerformedSet): boolean =>
  set.weight === undefined &&
  set.reps === undefined &&
  set.duration === undefined;

/** Deux séries identiques champ à champ — ce qui permet d'écrire
 * « 3 × 12 reps · 26 kg » au lieu de les énumérer. */
export const sameSet = (a: PerformedSet, b: PerformedSet): boolean =>
  a.weight === b.weight && a.reps === b.reps && a.duration === b.duration;

/**
 * Une série laissée vide veut dire que l'exercice s'est arrêté là : les
 * suivantes n'ont pas eu lieu. Une série vide tronque donc la liste, elle
 * n'est pas sautée — la même règle que celle qu'applique le serveur.
 */
export const truncateAtFirstEmpty = (sets: PerformedSet[]): PerformedSet[] => {
  const stop = sets.findIndex(isEmptySet);
  return stop === -1 ? sets : sets.slice(0, stop);
};

/** La série commune à toutes, ou `null` si elles diffèrent. */
export const uniformSet = (sets: PerformedSet[]): PerformedSet | null =>
  sets.length > 0 && sets.every((s) => sameSet(s, sets[0])) ? sets[0] : null;

/** Le travail fait — des répétitions, ou du temps. `null` quand ni l'un ni
 * l'autre n'a été noté. */
const workOf = (set: PerformedSet): string | null => {
  const parts: string[] = [];
  if (set.reps !== undefined) parts.push(`${set.reps} reps`);
  if (set.duration !== undefined) parts.push(`${set.duration}s`);
  return parts.length > 0 ? parts.join(' · ') : null;
};

/** La charge. `null` quand aucune n'a été notée. */
const loadOf = (set: PerformedSet): string | null =>
  set.weight !== undefined ? `${set.weight} kg` : null;

/**
 * Ce qui a été réalisé, en une ligne. `null` quand il n'y a rien à dire.
 *
 * Le travail d'abord, la charge ensuite — « 9 reps · 12 kg », comme on le dit
 * à voix haute. La charge menait, ce qui se lisait « 12 kg × 9 » : le nombre
 * qu'on a réellement fait arrivait en dernier, derrière celui qu'on a choisi.
 *
 * Quatre formes, de la plus courante à la plus rare :
 *   une série                      « 12 reps · 26 kg »
 *   plusieurs séries identiques    « 3 × 12 reps · 26 kg »
 *   même charge, moins de reps     « 12 + 10 + 8 reps · 26 kg »
 *   tout le reste                  « 12 × 26 kg · 10 × 24 kg »
 *
 * Les trois premières couvrent ce qu'on note d'habitude ; la dernière ne
 * cherche pas à être courte, elle cherche à rester sans ambiguïté.
 *
 * C'est le mot « reps » qui l'y tient. Maintenant qu'un nombre devant la
 * charge veut dire des répétitions, un compte nu devant elle entrerait en
 * collision avec le compte de séries : « 3 × 26 kg » pourrait être trois
 * séries ou trois répétitions. Écrire l'unité coûte cinq caractères et lève le
 * doute partout d'un coup.
 */
export const formatPerformedSets = (sets: PerformedSet[]): string | null => {
  const kept = truncateAtFirstEmpty(sets);
  if (kept.length === 0) return null;

  const uniform = uniformSet(kept);
  if (uniform) {
    const work = workOf(uniform);
    const load = loadOf(uniform);
    if (!work && !load) return null;
    if (kept.length === 1) return [work, load].filter(Boolean).join(' · ');
    // Sans travail à compter, le compte doit nommer sa propre unité :
    // « 3 × 26 kg » se lirait trois répétitions à 26 kg, ce qui n'est pas ce
    // qui s'est passé.
    if (!work) return `${kept.length} séries · ${load}`;
    return [`${kept.length} × ${work}`, load].filter(Boolean).join(' · ');
  }

  const weights = kept.map((s) => s.weight);
  const sameWeight =
    weights[0] !== undefined && weights.every((w) => w === weights[0]);
  if (sameWeight && kept.every((s) => s.duration === undefined)) {
    const reps = kept.map((s) => (s.reps === undefined ? '—' : String(s.reps)));
    return `${reps.join(' + ')} reps · ${weights[0]} kg`;
  }

  // Dans une liste de séries, le « × » dit déjà qu'il s'agit de répétitions :
  // répéter le mot sur chacune n'ajoute rien et allonge tout.
  return kept
    .map((set) => {
      const work = [
        set.reps !== undefined ? String(set.reps) : null,
        set.duration !== undefined ? `${set.duration}s` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      const load = loadOf(set);
      if (!load) return work || '—';
      return work ? `${work} × ${load}` : load;
    })
    .join(' · ');
};

/**
 * Ce qui a été fait, écrit comme on le dit : le travail, puis la charge.
 *
 * Retour du terrain : « c'est plus naturel de mettre 9 × 12 kg plutôt que
 * 12 kg × 9 ». On dit « douze répétitions à vingt-six kilos », dans cet
 * ordre. Le mot « reps » reste écrit pour qu'un nombre nu ne se confonde pas
 * avec le compteur de séries qui le précède parfois.
 */
export const formatPerformed = (performed?: PerformedValues): string | null =>
  performed ? formatPerformedSets(performed.sets) : null;
