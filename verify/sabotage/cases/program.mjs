/** Les sabotages de `verify_program.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_program.mjs',
  cases: [
    {
      name: 'la prochaine séance a le fond des autres',
      edits: [
        {
          file: 'src/features/client/pages/Program.tsx',
          from: "    bg={isNext ? 'bg.surface' : undefined}",
          to: '    bg={undefined}',
        },
      ],
      falls: ['la prochaine séance se distingue toujours des autres'],
    },
    {
      name: 'une séance faite redevient « Jamais faite »',
      edits: [
        {
          file: 'src/features/client/pages/Program.tsx',
          from: '          {matchLabel(match)}',
          to: "          {match.state === 'done' ? 'Jamais faite' : matchLabel(match)}",
        },
      ],
      falls: [
        "une séance faite telle qu'elle est aujourd'hui porte sa date",
        "→ et l'autre aussi",
        '→ et porte maintenant la date à laquelle elle a été faite',
      ],
    },
  ],
};
