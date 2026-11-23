export { ClientPreview } from './components/ClientPreview';
export { COACH_CONTENT_MAX_W, COACH_GRID_MAX_W } from './constants';
export { ClientProgramTab } from './components/ClientProgramTab';
export { SessionRail } from './components/SessionRail';
export { useSessionMenu } from './hooks/useSessionMenu';
export { SessionPreview } from './preview/SessionPreview';
// Le menu d'une chose qu'on ne fait pas ouvrir : une séance du rail, une
// carte de modèle.
export { SessionMenu } from './components/SessionMenu';
// La liste des clients et son champ de recherche, pour la feuille « Utiliser
// pour un client » d'un modèle : le même champ, la même règle.
export { useClients } from './hooks/useClients';
export { ClientSearch } from './clients/ClientSearch';
// Le compteur « À lire », pour le menu du compte côté client : un compte à
// deux rôles y voit ce qui l'attend de l'autre côté.
export { useInbox } from './hooks/useInbox';
