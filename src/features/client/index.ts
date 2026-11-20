/**
 * Ce que l'espace client prête aux autres : rien de plus.
 *
 * Il réexportait trente-cinq noms, dont onze venaient de `domain/` et que le
 * coach allait chercher ici — l'espace client servait de passage vers une
 * logique qui n'était pas la sienne. Le coach lit `domain/` directement, et
 * l'espace client se lit lui-même par ses tranches.
 *
 * Le coach montre l'historique d'un client tel que le client le voit : la
 * carte, le tiroir et le filtre du calendrier sont les mêmes pièces.
 *
 * Le dossier se lit par écran, parce que c'est par écran qu'on cherche :
 * `home` (Aujourd'hui), `program`, `sheet` (la fiche d'une séance), `guided`
 * (la séance guidée), `end` (de « Séance terminée » au ressenti), `progress`
 * (Progrès). Autour : `shell`, la disposition et la porte qui charge le
 * programme ; `common`, les données et la voix du coach, que tous lisent.
 * Le son et les vibrations sont dans `shared/feedback`. Il
 * alignait vingt et un modules et vingt tests à plat, et deux dossiers
 * `guided`.
 */
export { SessionHistoryCard } from './progress/SessionHistoryCard';
export { SessionCalendarFilter } from './progress/SessionCalendarFilter';
// L'aperçu « vu par le client » de l'atelier : la scène guidée elle-même.
export { ScenePreview } from './guided/ScenePreview';
