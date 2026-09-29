/**
 * À quoi ressemble une pastille de jour, partagée entre l'atelier du coach —
 * où on la coche — et les écrans du client — où on la lit.
 *
 * Les deux vues montrent la même chose ; les laisser diverger suggérerait
 * deux données différentes.
 */
export const dayChipStyle = (active: boolean) =>
  ({
    px: 2,
    py: 1,
    minW: '34px',
    textAlign: 'center',
    borderRadius: 'md',
    borderWidth: '1px',
    borderColor: active ? 'app.primary' : 'whiteAlpha.200',
    bg: active ? 'app.primary/16' : 'transparent',
    color: active ? 'app.primary' : 'fg.muted',
    fontSize: 'xs',
    fontWeight: active ? 'bold' : 'normal',
  }) as const;
