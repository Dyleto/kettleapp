/** Les sabotages de `verify_workshop.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_workshop.mjs',
  cases: [
    {
      name: "l'échelle n'a pas de limite à régler",
      edits: [
        {
          file: 'src/features/workshop/components/BlockConfigInline.tsx',
          from: '              ariaLabel="Limite de temps en minutes"\n              min={1}\n              clearable\n            />\n            {block.durationMinutes !== undefined && <Sep>max</Sep>}\n          </HStack>\n        </Flex>',
          to: '              ariaLabel="Limite de temps"\n              min={1}\n              clearable\n            />\n            {block.durationMinutes !== undefined && <Sep>max</Sep>}\n          </HStack>\n        </Flex>',
        },
      ],
      falls: [
        "l'en-tête de l'échelle propose une limite, vide d'abord",
        '→ douze minutes, enregistrées sur le bloc',
      ],
    },
    {
      name: "la limite saisie n'est pas enregistrée",
      edits: [
        {
          file: 'src/features/workshop/components/BlockConfigInline.tsx',
          from: '              value={block.durationMinutes}\n              onChange={(v) => onUpdate({ durationMinutes: v })}\n              suffix="min"\n              format={inMinutes}\n              emptyLabel="sans limite"\n              ariaLabel="Limite de temps en minutes"\n              min={1}\n              clearable\n            />\n            {block.durationMinutes !== undefined && <Sep>max</Sep>}\n          </HStack>\n        </Flex>',
          to: '              value={block.durationMinutes}\n              onChange={() => {}}\n              suffix="min"\n              format={inMinutes}\n              emptyLabel="sans limite"\n              ariaLabel="Limite de temps en minutes"\n              min={1}\n              clearable\n            />\n            {block.durationMinutes !== undefined && <Sep>max</Sep>}\n          </HStack>\n        </Flex>',
        },
      ],
      falls: ['→ douze minutes, enregistrées sur le bloc'],
    },
  ],
};
