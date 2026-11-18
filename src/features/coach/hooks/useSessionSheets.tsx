import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Session } from '@/shared/types';
import { COACH_ROUTES } from '@/shared/config/routes';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { sessionName } from '@/domain/session/name';
import { useSaveAsTemplate } from '@/features/template';
import { CopySessionToClient } from '@/features/coach/components/CopySessionToClient';
import { SaveAsTemplateSheet } from '@/features/coach/components/SaveAsTemplateSheet';

/**
 * Les deux feuilles que le menu d'une séance ouvre chez un client : copier
 * vers un autre client, enregistrer comme modèle.
 *
 * Tenues par la page et non par l'atelier de la séance ouverte : le clic
 * droit sur le rail vise une séance qu'on ne lit pas.
 *
 * Le modèle enregistré s'annonce par son nom, avec de quoi y aller :
 * enregistrer depuis le programme d'un client, c'est souvent pour le
 * retoucher aussitôt avant de le donner à un autre.
 */
export const useSessionSheets = ({
  sessions,
  clientId,
  clientFirstName,
}: {
  sessions: Session[];
  clientId: string;
  clientFirstName?: string;
}) => {
  const navigate = useNavigate();
  const save = useSaveAsTemplate();
  const [copyId, setCopyId] = useState<string | null>(null);
  const [saveId, setSaveId] = useState<string | null>(null);
  const copying = sessions.find((s) => s._id === copyId);
  const saving = sessions.find((s) => s._id === saveId);

  const sheets = (
    <>
      {copying && (
        <CopySessionToClient
          sourceClientId={clientId}
          sourceSessionId={copying._id}
          sessionOrder={copying.order}
          isOpen
          onClose={() => setCopyId(null)}
        />
      )}
      {saving && (
        <SaveAsTemplateSheet
          defaultName={sessionName(saving)}
          clientFirstName={clientFirstName}
          saving={save.isPending}
          onClose={() => setSaveId(null)}
          onSave={(name) =>
            save.mutate(
              { clientId, name, sessionIds: [saving._id] },
              {
                onSuccess: (template) => {
                  setSaveId(null);
                  toaster.create({
                    title: `Modèle « ${template.name} » enregistré`,
                    type: 'success',
                    action: {
                      label: 'Voir le modèle',
                      onClick: () =>
                        navigate(COACH_ROUTES.templateSession(template._id, 1)),
                    },
                  });
                },
              }
            )
          }
        />
      )}
    </>
  );

  return { openCopy: setCopyId, openSaveAsTemplate: setSaveId, sheets };
};
