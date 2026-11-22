/**
 * Ce que les modèles prêtent aux autres fonctionnalités : « Enregistrer
 * comme modèle », que le menu d'une séance appelle depuis le programme d'un
 * client, et ce qu'il faut pour l'inverse — la liste des modèles,
 * l'import de l'un d'eux chez un client, et la boîte qui dit ce qu'il
 * remplace.
 */
export {
  useImportTemplate,
  useSaveAsTemplate,
} from './hooks/useTemplateMutations';
export { useTemplates } from './hooks/useTemplates';
export { ReplaceOutcome } from './components/ReplaceOutcome';
