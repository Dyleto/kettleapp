import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { NavLink } from 'react-router';
import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { Mascot } from './Mascot';
import { countLabel } from './count';

/** Une destination de la navigation. */
export interface NavEntry {
  to: string;
  label: string;
  icon: IconType;
  /** Pour la route qui préfixe toutes les autres : sans lui, l'onglet
   * resterait allumé partout. */
  end?: boolean;
  /** Un compteur sur l'entrée : rien à zéro, « 99+ » au-delà. */
  count?: number;
}

/**
 * Le nom que l'entrée annonce : le libellé, et son compteur quand il y en a
 * un. Porté par le lien lui-même, parce que le libellé visible disparaît
 * quand le rail se replie en icônes.
 */
const accessibleName = ({ label, count }: NavEntry): string => {
  const badge = countLabel(count);
  return badge ? `${label} (${badge})` : label;
};

/**
 * Le rail de navigation, à gauche, à partir de 768 px.
 *
 * Deux largeurs, comme la maquette : 76 px d'icônes jusqu'à 1 279 px, puis
 * 232 px avec les libellés. Il était à 200 px partout, et mangeait un quart
 * d'une tablette debout pour des mots qu'une icône dit aussi bien.
 *
 * `collapsed` le garde en icônes à toutes les largeurs : l'atelier du coach
 * a besoin de la place pour ses séances, son éditeur et son aperçu.
 *
 * Une seule pièce pour le client et pour le coach : un compte qui porte les
 * deux rôles change d'espace sans changer de repères, et deux copies avaient
 * déjà divergé d'une marge.
 */
export const NavRail = ({
  items,
  collapsed = false,
  footer,
}: {
  items: readonly NavEntry[];
  collapsed?: boolean;
  /** Le compte, en pied : on y va rarement, et ce qui sert souvent doit se
   * trouver là où le regard entre. */
  footer?: ReactNode;
}) => {
  // Les libellés n'existent qu'au rail large, et jamais replié.
  const wide = collapsed ? 'none' : 'inline';
  return (
    <Flex
      as="nav"
      aria-label="Navigation principale"
      data-rail={collapsed ? 'collapsed' : 'full'}
      display={{ base: 'none', md: 'flex' }}
      direction="column"
      gap="6px"
      w={{ md: '76px', xl: collapsed ? '76px' : '232px' }}
      flexShrink={0}
      h="100vh"
      position="sticky"
      top={0}
      bg="bg.rail"
      borderRightWidth="1px"
      borderColor="line"
      pt="26px"
      pb="18px"
      px={{ md: '12px', xl: collapsed ? '12px' : '16px' }}
    >
      <Flex
        align="center"
        justify={{ md: 'center', xl: collapsed ? 'center' : 'flex-start' }}
        gap="10px"
        px={{ md: 0, xl: collapsed ? 0 : '10px' }}
        pb="22px"
      >
        <Mascot mood="hello" size={30} />
        <Text
          display={{ base: 'none', xl: wide }}
          fontFamily="heading"
          fontWeight="800"
          fontSize="20px"
          letterSpacing="0.06em"
          lineHeight={1}
        >
          KETTLE
        </Text>
      </Flex>
      {items.map((item) => {
        const { to, label, icon: Icon, end } = item;
        const badge = countLabel(item.count);
        return (
          <NavLink key={to} to={to} end={end} aria-label={accessibleName(item)}>
            {({ isActive }) => (
              <Flex
                align="center"
                justify={{
                  md: 'center',
                  xl: collapsed ? 'center' : 'flex-start',
                }}
                gap="12px"
                position="relative"
                /* 44 px : le plancher de cible tactile, tablette comprise. */
                minH="44px"
                px="12px"
                py="11px"
                borderRadius="14px"
                fontWeight="600"
                color={isActive ? 'app.primary.fg' : 'fg.muted'}
                bg={isActive ? 'app.primary.bg' : 'transparent'}
                _hover={{ color: 'app.primary.fg' }}
                transition="color 0.15s"
              >
                <Icon size={20} aria-hidden />
                <Text as="span" display={{ base: 'none', xl: wide }}>
                  {label}
                </Text>
                {badge && (
                  <Box
                    as="span"
                    aria-hidden
                    data-count
                    // Replié, la pastille se pose sur l'icône ; déplié, elle
                    // part au bout de la ligne, comme dans la maquette.
                    position={{
                      base: 'absolute',
                      xl: collapsed ? 'absolute' : 'static',
                    }}
                    top="4px"
                    right="4px"
                    ml={{ xl: collapsed ? 0 : 'auto' }}
                    minW="22px"
                    h="22px"
                    px="6px"
                    borderRadius="11px"
                    bg="app.primary"
                    color="bg.canvas"
                    fontSize="11.5px"
                    fontWeight="800"
                    lineHeight="22px"
                    textAlign="center"
                  >
                    {badge}
                  </Box>
                )}
              </Flex>
            )}
          </NavLink>
        );
      })}
      <Box mt="auto">{footer}</Box>
    </Flex>
  );
};

/**
 * La barre d'onglets, en bas, sous 768 px : là où tombe le pouce.
 *
 * `env(safe-area-inset-bottom)` et non une marge fixe : sur un iPhone à
 * encoche, la barre de gestes du système mange les derniers pixels, et les
 * cibles y devenaient inatteignables sans que rien ne le montre en
 * simulateur.
 */
export const TabBar = ({ items }: { items: readonly NavEntry[] }) => (
  <Grid
    as="nav"
    aria-label="Navigation principale"
    display={{ base: 'grid', md: 'none' }}
    gridAutoFlow="column"
    gridAutoColumns="1fr"
    position="fixed"
    bottom={0}
    left={0}
    right={0}
    bg="surface.card"
    borderTopWidth="1px"
    borderColor="line"
    pt="10px"
    px="8px"
    pb="calc(env(safe-area-inset-bottom, 0px) + 10px)"
    zIndex={30}
  >
    {items.map((item) => {
      const { to, label, icon: Icon, end } = item;
      const badge = countLabel(item.count);
      return (
        <NavLink key={to} to={to} end={end} aria-label={accessibleName(item)}>
          {({ isActive }) => (
            <Flex
              direction="column"
              align="center"
              gap="4px"
              position="relative"
              minH="44px"
              justify="center"
              color={isActive ? 'app.primary' : 'fg.muted'}
            >
              <Icon size={24} aria-hidden />
              <Text as="span" fontSize="11.5px" fontWeight="600" lineHeight={1}>
                {label}
              </Text>
              {badge && (
                <Box
                  as="span"
                  aria-hidden
                  data-count
                  position="absolute"
                  top="-3px"
                  left="calc(50% + 8px)"
                  minW="17px"
                  h="17px"
                  px="4px"
                  borderRadius="9px"
                  bg="app.primary"
                  color="bg.canvas"
                  fontSize="10px"
                  fontWeight="800"
                  lineHeight="17px"
                  textAlign="center"
                >
                  {badge}
                </Box>
              )}
            </Flex>
          )}
        </NavLink>
      );
    })}
  </Grid>
);
