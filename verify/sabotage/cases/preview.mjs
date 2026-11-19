/** Les sabotages de `verify_preview.mjs`. Voir `../run.mjs`. */
const PREVIEW = 'src/features/coach/preview/SessionPreview.tsx';
const FRAME = 'src/features/coach/preview/SessionPreviewFrame.tsx';
const PAGE = 'src/features/coach/pages/ClientDetails.tsx';

const SHOWS =
  'l’aperçu montre la séance guidée, telle que le client l’aura devant lui';
const PHONE = '→ à la taille d’un téléphone, et non d’un écran large';
const INERT = '→ rien ne s’y touche : il est inerte';
const FOLLOWS = 'il suit le bloc que le coach touche';
const TYPED = '→ et ce qu’il écrit, à la frappe';
const TOGGLE =
  'la bascule « Ressentis » montre les passages ; « Aperçu » rend l’aperçu';
const TEMPLATE = 'un modèle a son aperçu, vu par le client';
const NARROW = 'pas de colonne, pas d’aperçu';

export default {
  suite: 'verify_preview.mjs',
  cases: [
    {
      // Une fenêtre d'écran large : les scènes prennent leur mise en page
      // large, celle que le client ne voit jamais sur son téléphone.
      name: 'l’aperçu a la largeur d’une tablette',
      edits: [
        {
          file: PREVIEW,
          from: '              width: PHONE.width,',
          to: '              width: 1024,',
        },
      ],
      falls: [PHONE],
    },
    {
      name: 'l’aperçu se clique',
      edits: [
        {
          file: PREVIEW,
          from: "    boxRef.current?.setAttribute('inert', '');",
          to: '    void boxRef;',
        },
      ],
      falls: [INERT],
    },
    {
      name: 'l’aperçu reste sur le premier bloc',
      edits: [
        {
          file: PAGE,
          from: '                  onFocusBlock={setPreviewBlockId}\n',
          to: '',
        },
      ],
      falls: [FOLLOWS, TYPED],
    },
    {
      // Le premier envoi part avant que l'iframe écoute, et rien ne le
      // renvoie : l'aperçu reste vide.
      name: 'l’aperçu ne dit pas qu’il écoute',
      edits: [
        {
          file: FRAME,
          from: '    window.parent.postMessage(ready, window.location.origin);\n',
          to: '',
        },
      ],
      falls: [SHOWS, FOLLOWS, TYPED, TEMPLATE],
    },
    {
      name: 'l’aperçu ne suit plus la frappe',
      edits: [
        {
          file: PREVIEW,
          from: '  }, [ready, session, blockOrder]);',
          to: '  }, [ready, blockOrder]);',
        },
      ],
      falls: [TYPED],
    },
    {
      name: 'l’aperçu ouvre toujours la séance au début',
      edits: [
        {
          file: 'src/features/client/guided/session.ts',
          from: '    index: Math.max(0, index),',
          to: '    index: 0,',
        },
      ],
      falls: [FOLLOWS, TYPED],
    },
    {
      name: '« Ressentis » ne bascule plus',
      edits: [
        {
          file: PAGE,
          from: "                      onClick={() => setAsideView('feedback')}",
          to: '                      onClick={() => undefined}',
        },
      ],
      falls: [TOGGLE],
    },
    {
      name: 'un modèle n’a plus d’aperçu',
      edits: [
        {
          file: 'src/features/template/pages/TemplateDetails.tsx',
          from: '        {isWide && activeSession && (',
          to: '        {false && activeSession && (',
        },
      ],
      falls: [TEMPLATE],
    },
    {
      name: 'la colonne s’ouvre sous 1 280 px',
      edits: [
        {
          file: PAGE,
          from: '          {isWide && activeSession && (',
          to: '          {activeSession && (',
        },
      ],
      falls: [NARROW],
    },
  ],
};
