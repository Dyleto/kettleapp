/** Les sabotages de `verify_zones.mjs`. Voir `../run.mjs`. */
const ACCOUNT_PAGE = 'src/features/account/pages/Account.tsx';
const PREVIEW_PANEL = 'src/features/coach/components/ClientPreview.tsx';
const WORKSHOP_PAGE = 'src/features/coach/pages/ClientDetails.tsx';

const ACCOUNT =
  'la panne dit ce qui manque à sa place, et le reste de l’écran demeure';
const DELETE =
  '→ sans le résumé, la suppression ne s’offre pas : elle ne saurait dire ce qui part';
const RETRY = '→ « Réessayer » relit, et le bloc revient à sa place';
const COACH_SIDE = 'côté coach, c’est son activité qui manque';
const PREVIEW =
  'l’aperçu dit que ses séances n’ont pas chargé, et non qu’il n’en a aucune';
const WORKSHOP =
  'la colonne des ressentis dit la panne, et le rail ne dit plus « jamais faite »';

export default {
  suite: 'verify_zones.mjs',
  cases: [
    {
      // Le défaut réparé : les blocs disparaissaient sans un mot.
      name: '« Mon compte » tait la panne de son résumé',
      edits: [
        {
          file: ACCOUNT_PAGE,
          from: '        {summaryDown && (',
          to: '        {false && (',
        },
      ],
      // Sans la panne, pas de « Réessayer » : le bloc ne revient pas.
      falls: [ACCOUNT, RETRY, COACH_SIDE],
    },
    {
      name: 'la suppression s’offre sans savoir ce qui part',
      edits: [
        {
          file: ACCOUNT_PAGE,
          from: '        {data && (',
          to: '        {true && (',
        },
      ],
      falls: [DELETE],
    },
    {
      name: '« Réessayer » ne relit rien',
      edits: [
        {
          file: ACCOUNT_PAGE,
          from: '              onRetry={() => void accountQuery.refetch()}',
          to: '              onRetry={() => {}}',
        },
      ],
      falls: [RETRY],
    },
    {
      name: 'l’aperçu prend la panne pour un client sans séance',
      edits: [
        {
          file: PREVIEW_PANEL,
          from: '        ) : isUnavailable(historyQuery) ? (',
          to: '        ) : false ? (',
        },
      ],
      falls: [PREVIEW],
    },
    {
      name: 'le rail dit « jamais faite » sur un historique en panne',
      edits: [
        {
          file: WORKSHOP_PAGE,
          from: '            history={historyDown ? undefined : history}',
          to: '            history={history}',
        },
      ],
      falls: [WORKSHOP],
    },
    {
      name: 'la colonne des ressentis prend la panne pour aucun ressenti',
      edits: [
        {
          file: WORKSHOP_PAGE,
          from: '                  ) : historyDown ? (',
          to: '                  ) : false ? (',
        },
      ],
      falls: [WORKSHOP],
    },
  ],
};
