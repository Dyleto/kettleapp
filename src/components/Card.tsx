import { Box, BoxProps, SystemStyleObject, Text } from '@chakra-ui/react';
import { ReactNode, KeyboardEvent } from 'react';

interface CardProps extends Omit<BoxProps, 'onClick'> {
  children: ReactNode;
  withGlow?: boolean;
  accentColor?: string;
  onClick?: () => void;
  hoverEffect?: 'lift' | 'border' | 'both' | 'none';
  footerText?: string;
  contentPadding?: number;
}

export const Card = ({
  children,
  withGlow = true,
  accentColor,
  onClick,
  hoverEffect = 'both',
  footerText,
  contentPadding,
  p,
  ...props
}: CardProps) => {
  const usesInnerPadding = contentPadding !== undefined || !!footerText;
  const pad = contentPadding ?? 8;

  const getHoverStyles = (): SystemStyleObject => {
    const styles: SystemStyleObject = {};

    if (hoverEffect === 'lift' || hoverEffect === 'both') {
      styles.transform = 'translateY(-2px)';
      styles.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.5)';
    }

    if (hoverEffect === 'border' || hoverEffect === 'both') {
      styles.borderTopColor = accentColor;
    }

    return styles;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // évite que Espace fasse scroller la page
      onClick();
    }
  };

  return (
    <Box
      p={usesInnerPadding ? 0 : p}
      borderTopWidth="3px"
      borderTopColor="transparent"
      borderRadius="xl"
      bg="surface.card"
      boxShadow="0 8px 24px rgba(0, 0, 0, 0.4)"
      position="relative"
      overflow="hidden"
      cursor={onClick ? 'pointer' : 'default'}
      /* Jamais `all` : cela animait aussi l'anneau de focus, qui mettait
         300 ms à apparaître. Un anneau qui se fait attendre est un anneau
         qu'on ne voit pas — c'est ce qui le faisait passer pour absent. */
      transition="transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      /* Une carte est un `div` porteur de `role="button"` : `:focus-visible`
         l'atteint bien — mesuré —, mais quelque chose remet son épaisseur à
         zéro, ce qui n'arrive à aucun vrai `<button>`. L'anneau se pose donc
         ici, et il lit les variables du thème plutôt que de redire ses
         valeurs : changer l'anneau une fois le change aussi sur les cartes. */
      _focusVisible={
        onClick
          ? {
              outlineStyle: 'var(--focus-ring-style, solid)',
              outlineWidth: 'var(--focus-ring-width, 2px)',
              outlineColor: 'var(--focus-ring-color, currentColor)',
              outlineOffset: 'var(--focus-ring-offset, 2px)',
            }
          : undefined
      }
      _hover={hoverEffect !== 'none' ? getHoverStyles() : undefined}
      {...props}
    >
      {withGlow && (
        <Box
          position="absolute"
          top="-50px"
          right="-50px"
          w="150px"
          h="150px"
          bg={accentColor}
          opacity={0.1}
          borderRadius="full"
          filter="blur(40px)"
          pointerEvents="none"
        />
      )}
      <Box position="relative" zIndex={1}>
        {usesInnerPadding ? (
          <>
            <Box pt={pad} px={pad} pb={footerText ? 4 : pad}>
              {children}
            </Box>
            {footerText && (
              <Box
                bg={accentColor}
                px={3}
                py={1.5}
                textAlign="center"
                borderRadius="0 0 11px 11px"
              >
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="white"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  {footerText}
                </Text>
              </Box>
            )}
          </>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
};
