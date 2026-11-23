/** Les sabotages de `verify_moves.mjs`. Voir `../run.mjs`. */
const RAIL = 'src/features/coach/components/SessionRail.tsx';
const BLOCKS = 'src/features/coach/components/ClientProgramTab.tsx';
const SPEECH = 'src/features/coach/components/dragSpeech.ts';
const MENU = 'src/features/coach/hooks/useSessionMenu.tsx';
const WORKSHOP = 'src/features/workshop/hooks/useProgramWorkshop.ts';
const CLIENT_PAGE = 'src/features/coach/pages/ClientDetails.tsx';
const BLOCK = 'src/features/workshop/components/WorkshopBlock.tsx';
const SHEET = 'src/features/workshop/components/BlockSheet.tsx';

const RAIL_SPEECH =
  'une séance du rail se dit bouton, et sa consigne renvoie au menu, en français';
const FIRST_OFFERS = 'la première séance propose « Descendre », pas « Monter »';
const DOWN =
  '« Descendre » la déplace d’un cran, et elle reste ouverte à son nouveau rang';
const RAIL_UP =
  '→ au clic droit sur une autre séance, « Monter » l’échange avec celle qu’on lit, qui reste ouverte';
const RAIL_SAID =
  'glissée à la souris, la séance s’annonce en français à sa nouvelle place';
const HANDLE =
  'la poignée d’un bloc sort de la tabulation, et dit que le menu déplace';
const EDGES = 'le premier bloc ne monte pas, le dernier ne descend pas';
const BLOCK_UP =
  '« Monter » dans le menu d’un bloc l’échange avec celui d’au-dessus';
const BLOCK_SAID =
  'glissé à la souris, le bloc s’annonce en français à sa nouvelle place';
const BAND = 'une carte de la bande se dit bouton, avec la même consigne';
const SHEET_DOWN =
  'la feuille d’un bloc propose « Descendre » au premier, et le déplace';

export default {
  suite: 'verify_moves.mjs',
  cases: [
    {
      // La bibliothèque reprend la parole : en anglais, et Espace promis.
      name: 'le rail parle anglais',
      edits: [
        {
          file: RAIL,
          from: '          onDragEnd={handleDragEnd}\n          accessibility={speech}\n',
          to: '          onDragEnd={handleDragEnd}\n',
        },
      ],
      falls: [RAIL_SPEECH, RAIL_SAID],
    },
    {
      name: 'la bande parle anglais',
      edits: [
        {
          file: RAIL,
          from: '        onDragEnd={handleDragEnd}\n        accessibility={speech}\n',
          to: '        onDragEnd={handleDragEnd}\n',
        },
      ],
      falls: [BAND],
    },
    {
      name: 'une séance du rail redevient « sortable »',
      edits: [
        {
          file: RAIL,
          from: '      aria-roledescription={undefined}\n      aria-disabled={undefined}\n      as="button"\n      onClick={onSelect}\n      // Le rang d\'abord',
          to: '      aria-disabled={undefined}\n      as="button"\n      onClick={onSelect}\n      // Le rang d\'abord',
        },
      ],
      falls: [RAIL_SPEECH],
    },
    {
      name: 'une séance du rail se dit désactivée',
      edits: [
        {
          file: RAIL,
          from: '      aria-disabled={undefined}\n      as="button"\n      onClick={onSelect}\n      // Le rang d\'abord',
          to: '      as="button"\n      onClick={onSelect}\n      // Le rang d\'abord',
        },
      ],
      falls: [RAIL_SPEECH],
    },
    {
      name: 'une carte de la bande redevient « sortable »',
      edits: [
        {
          file: RAIL,
          from: '      aria-roledescription={undefined}\n      aria-disabled={undefined}\n      as="button"\n      onClick={onSelect}\n      // Le même nom',
          to: '      aria-disabled={undefined}\n      as="button"\n      onClick={onSelect}\n      // Le même nom',
        },
      ],
      falls: [BAND],
    },
    {
      name: 'la première séance propose « Monter »',
      edits: [{ file: MENU, from: '        index > 0 && {', to: '        {' }],
      falls: [FIRST_OFFERS],
    },
    {
      name: 'le menu d’une séance ne déplace plus',
      edits: [
        { file: CLIENT_PAGE, from: '    onMove: moveSession,\n', to: '' },
      ],
      falls: [FIRST_OFFERS, DOWN, RAIL_UP],
    },
    {
      // L'adresse garde son rang : la page montre la séance qui a pris la
      // place de celle qu'on lisait.
      name: 'la séance lue ne suit pas son déplacement',
      edits: [
        {
          file: WORKSHOP,
          from: '    if (open >= 0 && open !== currentIndex) goToSession(open + 1);',
          to: '    void open;',
        },
      ],
      falls: [DOWN, RAIL_UP],
    },
    {
      name: 'les annonces disent que rien n’a bougé',
      edits: [
        {
          file: SPEECH,
          from: '          over ? rank(over.id) : rank(active.id),',
          to: '          rank(active.id),',
        },
      ],
      falls: [RAIL_SAID, BLOCK_SAID],
    },
    {
      name: 'les blocs parlent anglais',
      edits: [
        {
          file: BLOCKS,
          from: '          onDragEnd={handleDragEnd}\n          accessibility={speech}\n',
          to: '          onDragEnd={handleDragEnd}\n',
        },
      ],
      falls: [HANDLE, BLOCK_SAID],
    },
    {
      name: 'la poignée d’un bloc reste un arrêt de tabulation',
      edits: [{ file: BLOCK, from: '      tabIndex={-1}\n', to: '' }],
      falls: [HANDLE],
    },
    {
      // La même règle sert au menu et à la feuille du téléphone : les deux
      // proposent alors « Monter » au premier bloc.
      name: 'le premier bloc propose « Monter »',
      edits: [
        {
          file: BLOCKS,
          from: '                          index > 0 ? () => moveBlock(block._id, -1) : undefined',
          to: '                          () => moveBlock(block._id, -1)',
        },
      ],
      falls: [EDGES, SHEET_DOWN],
    },
    {
      name: 'le menu d’un bloc ne propose plus « Monter »',
      edits: [
        {
          file: BLOCK,
          from: '            {onMoveUp && (',
          to: '            {false && (',
        },
      ],
      falls: [EDGES, BLOCK_UP],
    },
    {
      name: 'déplacer un bloc d’un cran n’enregistre rien',
      edits: [
        {
          file: BLOCKS,
          from: '    if (next) onReorderBlocks(next);',
          to: '    void next;',
        },
      ],
      falls: [BLOCK_UP, SHEET_DOWN],
    },
    {
      name: 'la feuille d’un bloc ne déplace pas',
      edits: [
        {
          file: SHEET,
          from: '            {(onMoveUp || onMoveDown) && (',
          to: '            {false && (',
        },
      ],
      falls: [SHEET_DOWN],
    },
  ],
};
