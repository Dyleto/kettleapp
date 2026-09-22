/**
 * How a day chip looks, shared between the coach's editor — where it is
 * ticked — and the client's screens — where it is read.
 *
 * Both views show the same thing; letting them drift apart would suggest two
 * different pieces of data.
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
