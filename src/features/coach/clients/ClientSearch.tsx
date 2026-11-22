import type { ClientSort } from '@/domain/clients/roster';
import { SearchField, SortMenu } from '@/kit';

/**
 * Le champ de recherche des clients : celui du kit, nommé pour eux.
 *
 * Il filtre à la frappe ; la règle — chaque mot, sans accent ni casse — est
 * celle du domaine (`matchesQuery`).
 */
export const ClientSearch = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <SearchField value={value} onChange={onChange} label="Chercher un client" />
);

const SORTS: { value: ClientSort; label: string }[] = [
  { value: 'triage', label: 'À traiter' },
  { value: 'recent', label: 'Activité' },
  { value: 'alpha', label: 'A → Z' },
];

/**
 * Le tri des clients : « À traiter » par défaut, « Activité » et « A → Z »
 * à la demande.
 *
 * Trois pastilles vivaient en permanence sous la recherche ; la maquette
 * les range dans un menu, parce que l'ordre par défaut suffit presque
 * toujours et que la ligne de tête porte déjà les tuiles.
 */
export const ClientSortMenu = ({
  sort,
  onSort,
}: {
  sort: ClientSort;
  onSort: (sort: ClientSort) => void;
}) => <SortMenu value={sort} options={SORTS} onChange={onSort} />;
