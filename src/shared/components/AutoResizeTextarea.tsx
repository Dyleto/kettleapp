import { useLayoutEffect, useRef } from 'react';
import { Textarea } from '@chakra-ui/react';
import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof Textarea>;

export const AutoResizeTextarea = ({ value, onChange, ...props }: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <Textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={1}
      resize="none"
      overflow="hidden"
      {...props}
    />
  );
};
