/**
 * Peut-on écrire une charge en demi-kilos ?
 *
 * Retour du terrain : « les ,5 aussi ne marchent pas, il peut pas écrire 22,5
 * par exemple ».
 *
 * Le champ se réaffichait depuis le nombre enregistré. En tapant « 22 » puis
 * la virgule, `Number('22.')` redonnait 22, donc le champ reprenait la main
 * sur ce qui venait d'être tapé et la virgule s'effaçait : le caractère
 * suivant donnait « 225 ». La virgule était pourtant bien convertie dans ce
 * fichier-là — le défaut n'était pas dans l'analyse, il était dans
 * l'affichage.
 *
 * C'est pour cela que cette suite tape caractère par caractère. Les neuf
 * autres posent leurs valeurs avec `fill()`, qui écrit le champ d'un coup :
 * aucune n'aurait pu voir ce défaut, et c'est pourquoi il a atteint le
 * terrain.
 */
import {
  launch,
  ok,
  failureCount,
  signIn,
  start,
  MOBILE,
  clean,
} from './common.mjs';

const browser = await launch();

const WEIGHT =
  '[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]';

/** Marche jusqu'au bloc classique de la séance 2, où une charge se saisit. */
const reachWeightField = async (p) => {
  await start(p, 'sess2');
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(180);
  }
};

/** Ce que l'enregistrement local de la séance contient, lu dans le
 * navigateur. */
const recordedWeights = (p) =>
  p.evaluate(() => {
    try {
      const raw = localStorage.getItem('kettle-seance-sess2');
      if (!raw) return [];
      const stored = JSON.parse(raw);
      return Object.values(stored.performed ?? {}).flatMap((entry) =>
        (entry.sets ?? []).map((s) => s.weight).filter((w) => w != null)
      );
    } catch {
      return [];
    }
  });

{
  console.log('\n── une charge en demi-kilos se tape, et elle reste');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await reachWeightField(p);

  const field = p.locator(WEIGHT).first();
  ok('le champ de charge est là', (await field.count()) === 1);

  await field.click();
  // Caractère par caractère : c'est le seul geste qui reproduit le défaut.
  await field.pressSequentially('22,5', { delay: 60 });
  await p.waitForTimeout(300);

  const shown = clean(await field.inputValue());
  ok(
    'le champ garde ce qui a été tapé',
    shown === '22,5' || shown === '22.5',
    shown
  );

  // L'affichage ne suffit pas : ce qui compte est ce qui est enregistré.
  const weights = await recordedWeights(p);
  ok(
    'la demi-valeur est enregistrée telle quelle',
    weights.includes(22.5),
    JSON.stringify(weights)
  );

  // Et elle survit à la sortie du champ, qui rend la main à la valeur
  // enregistrée : si le brouillon n'était pas relâché proprement, le champ
  // afficherait autre chose que ce que porte la séance.
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(600);
  const after = await recordedWeights(p);
  ok(
    'elle est toujours là après validation de la série',
    after.includes(22.5),
    JSON.stringify(after)
  );

  await ctx.close();
}

{
  console.log('\n── un entier continue de se taper sans rien perdre');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await reachWeightField(p);

  const field = p.locator(WEIGHT).first();
  await field.click();
  await field.pressSequentially('26', { delay: 60 });
  await p.waitForTimeout(300);

  ok('le champ montre 26', clean(await field.inputValue()) === '26');
  ok(
    '26 est enregistré',
    (await recordedWeights(p)).includes(26),
    JSON.stringify(await recordedWeights(p))
  );

  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
