import { useState } from 'react';
import { Box, chakra, HStack, Portal, Text, VStack } from '@chakra-ui/react';
import { LuCheck, LuPencil, LuPlus, LuTag, LuTrash2 } from 'react-icons/lu';
import type { Client, Tag } from '@/shared/types';
import { ActionButton, Chip, Sheet, hitArea } from '@/kit';
import { useSheetDismiss } from '@/features/workshop';
import {
  canCreateTag,
  matchingTags,
  tagName,
  tagTone,
  tagUsage,
  TAG_NAME_MAX,
} from '@/domain/clients/tags';
import { useTagActions } from '@/features/coach/hooks/useTags';

/** Une étiquette en pastille, à la teinte tirée de son nom. */
export const TagChip = ({ name }: { name: string }) => (
  <Chip tone={tagTone(name)}>{name}</Chip>
);

/** Une pastille qui se touche : celles de la barre de filtre. */
const Toggle = ({
  on,
  onPress,
  children,
  label,
}: {
  on: boolean;
  onPress: () => void;
  children: React.ReactNode;
  label?: string;
}) => (
  <chakra.button
    type="button"
    aria-pressed={on}
    aria-label={label}
    onClick={onPress}
    borderRadius="full"
    boxShadow={on ? 'inset 0 0 0 2px {colors.app.primary}' : undefined}
    css={hitArea(44)}
    data-on={on || undefined}
  >
    {children}
  </chakra.button>
);

/**
 * La barre des étiquettes, sous la recherche : « Tous », puis chaque
 * étiquette, puis « + étiquette ».
 *
 * Plusieurs étiquettes choisies montrent les clients qui en portent au moins
 * une (`hasAnyTag`) : on cherche « mes clients en reprise ou en
 * compétition », rarement les deux à la fois. « Tous » retire le filtre.
 */
export const TagBar = ({
  tags,
  selected,
  onChange,
  onManage,
}: {
  tags: readonly Tag[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  onManage: () => void;
}) => (
  <HStack
    gap="6px"
    wrap="wrap"
    role="group"
    aria-label="Filtrer par étiquette"
    data-tag-bar
  >
    <Toggle on={selected.size === 0} onPress={() => onChange(new Set())}>
      <Chip tone={selected.size === 0 ? 'amber' : 'neutral'}>Tous</Chip>
    </Toggle>
    {tags.map((tag) => {
      const on = selected.has(tag._id);
      return (
        <Toggle
          key={tag._id}
          on={on}
          onPress={() => {
            const next = new Set(selected);
            if (on) next.delete(tag._id);
            else next.add(tag._id);
            onChange(next);
          }}
        >
          <TagChip name={tag.name} />
        </Toggle>
      );
    })}
    <chakra.button
      type="button"
      onClick={onManage}
      borderRadius="full"
      css={hitArea(44)}
    >
      <Chip tone="outline">+ étiquette</Chip>
    </chakra.button>
  </HStack>
);

/** Le champ d'une feuille d'étiquettes : un contour qui passe à l'ambre. */
const TagField = ({
  value,
  onChange,
  onEnter,
  label,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  label: string;
  placeholder: string;
}) => (
  <HStack
    gap="10px"
    minH="50px"
    px="16px"
    borderRadius="17px"
    bg="bg.raised"
    boxShadow="inset 0 0 0 1.5px {colors.line}"
    _focusWithin={{ boxShadow: 'inset 0 0 0 2px {colors.app.primary}' }}
    color="fg.muted"
  >
    <LuTag size={18} aria-hidden />
    <chakra.input
      aria-label={label}
      placeholder={placeholder}
      value={value}
      maxLength={TAG_NAME_MAX}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onEnter();
        }
      }}
      flex={1}
      minW={0}
      bg="transparent"
      border="none"
      outline="none"
      color="fg"
      fontSize="15.5px"
      _placeholder={{ color: 'fg.muted' }}
    />
  </HStack>
);

/**
 * Les étiquettes d'un client : les cocher, ou en créer une à la frappe.
 *
 * Le champ filtre la liste, et « Créer “Sen” » apparaît dès que le texte ne
 * correspond à aucune étiquette ; Entrée crée et coche. Chaque case part
 * tout de suite — la liste derrière la feuille se met à jour sous les
 * yeux —, « C'est bon » ne fait que refermer.
 */
export const ClientTagsSheet = ({
  client,
  tags,
  onClose,
}: {
  client: Client;
  tags: readonly Tag[];
  onClose: () => void;
}) => {
  useSheetDismiss(true, onClose);
  const { create, setForClient } = useTagActions();
  const [query, setQuery] = useState('');
  const mine = client.tagIds;
  const shown = matchingTags(tags, query);
  const creatable = canCreateTag(tags, query);
  const who = client.firstName?.trim();

  const put = (tagIds: string[]) =>
    setForClient.mutate({ clientId: client._id, tagIds, before: mine });
  const toggle = (tag: Tag) =>
    put(
      mine.includes(tag._id)
        ? mine.filter((id) => id !== tag._id)
        : [...mine, tag._id]
    );
  const createAndCheck = () => {
    if (!creatable || create.isPending) return;
    create.mutate(tagName(query), {
      onSuccess: (tag) => {
        put([...mine, tag._id]);
        setQuery('');
      },
    });
  };

  const title = who ? `Étiquettes de ${who}` : 'Ses étiquettes';
  return (
    <Portal>
      <Sheet label={title} onDismiss={onClose}>
        <Text as="h2" fontWeight="800" fontSize="22px">
          {title}
        </Text>
        <TagField
          value={query}
          onChange={setQuery}
          onEnter={createAndCheck}
          label="Chercher ou créer une étiquette"
          placeholder="Chercher ou créer"
        />
        <VStack
          align="stretch"
          gap={0}
          bg="bg.raised"
          borderRadius="18px"
          overflow="hidden"
          data-client-tags
        >
          {shown.map((tag) => {
            const on = mine.includes(tag._id);
            return (
              <chakra.button
                key={tag._id}
                type="button"
                role="checkbox"
                aria-checked={on}
                aria-label={tag.name}
                onClick={() => toggle(tag)}
                display="flex"
                alignItems="center"
                gap="12px"
                px="16px"
                minH="52px"
                borderTopWidth="1px"
                borderColor="line"
                _first={{ borderTopWidth: 0 }}
              >
                <HStack flex={1}>
                  <TagChip name={tag.name} />
                </HStack>
                <Box color="app.primary" w="20px" aria-hidden>
                  {on && <LuCheck size={20} />}
                </Box>
              </chakra.button>
            );
          })}
          {creatable && (
            <chakra.button
              type="button"
              onClick={createAndCheck}
              display="flex"
              alignItems="center"
              gap="10px"
              px="16px"
              minH="52px"
              borderTopWidth={shown.length ? '1px' : 0}
              borderColor="line"
              data-create-tag
            >
              <LuPlus size={18} aria-hidden />
              <Text flex={1} textAlign="left">
                Créer « {tagName(query)} »
              </Text>
              <TagChip name={tagName(query)} />
            </chakra.button>
          )}
          {!creatable && shown.length === 0 && (
            <Text px="16px" py="14px" color="fg.muted" fontSize="sm">
              Écris un nom pour créer ta première étiquette.
            </Text>
          )}
        </VStack>
        <ActionButton size="md" w="full" onClick={onClose}>
          C’est bon
        </ActionButton>
      </Sheet>
    </Portal>
  );
};

/** Une étiquette dans la feuille de gestion : la renommer sur place, la
 * supprimer après avoir dit combien de clients la perdront. */
const ManagedTag = ({
  tag,
  used,
  tags,
}: {
  tag: Tag;
  used: number;
  tags: readonly Tag[];
}) => {
  const { rename, remove } = useTagActions();
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const others = tags.filter((t) => t._id !== tag._id);
  const valid = editing !== null && canCreateTag(others, editing);
  const save = () => {
    if (editing === null) return;
    if (tagName(editing) === tag.name) return setEditing(null);
    if (!valid) return;
    rename.mutate(
      { id: tag._id, name: tagName(editing) },
      { onSuccess: () => setEditing(null) }
    );
  };

  if (confirming)
    return (
      <VStack
        align="stretch"
        gap="10px"
        px="16px"
        py="14px"
        data-confirm-delete
      >
        <Text>
          Supprimer « {tag.name} » ?{' '}
          {used > 0
            ? `Elle sera retirée de ${used} client${used > 1 ? 's' : ''}.`
            : 'Aucun client ne la porte.'}
        </Text>
        <HStack gap="8px">
          <ActionButton
            tone="danger"
            size="sm"
            loading={remove.isPending}
            onClick={() => remove.mutate(tag._id)}
          >
            Supprimer
          </ActionButton>
          <ActionButton
            tone="ghost"
            size="sm"
            onClick={() => setConfirming(false)}
          >
            Garder
          </ActionButton>
        </HStack>
      </VStack>
    );

  return (
    <HStack gap="10px" px="16px" minH="56px" data-managed-tag={tag._id}>
      {editing === null ? (
        <>
          <HStack flex={1} minW={0}>
            <TagChip name={tag.name} />
          </HStack>
          <Text fontSize="sm" color="fg.muted" flexShrink={0}>
            {used > 0 ? `${used} client${used > 1 ? 's' : ''}` : 'aucun client'}
          </Text>
          <chakra.button
            type="button"
            aria-label={`Renommer « ${tag.name} »`}
            onClick={() => setEditing(tag.name)}
            color="fg.muted"
            css={hitArea(44)}
          >
            <LuPencil size={16} />
          </chakra.button>
          <chakra.button
            type="button"
            aria-label={`Supprimer « ${tag.name} »`}
            onClick={() => setConfirming(true)}
            color="fg.muted"
            css={hitArea(44)}
          >
            <LuTrash2 size={16} />
          </chakra.button>
        </>
      ) : (
        <Box flex={1}>
          <TagField
            value={editing}
            onChange={setEditing}
            onEnter={save}
            label={`Nouveau nom de « ${tag.name} »`}
            placeholder={tag.name}
          />
        </Box>
      )}
    </HStack>
  );
};

/**
 * Les étiquettes du coach : en créer, les renommer, les supprimer.
 *
 * Supprimer une étiquette la retire de tous les clients qui la portent :
 * la feuille dit combien avant de le faire, et attend une confirmation.
 */
export const TagsSheet = ({
  tags,
  clients,
  onClose,
}: {
  tags: readonly Tag[];
  clients: readonly Client[];
  onClose: () => void;
}) => {
  useSheetDismiss(true, onClose);
  const { create } = useTagActions();
  const [name, setName] = useState('');
  const creatable = canCreateTag(tags, name);
  const add = () => {
    if (!creatable || create.isPending) return;
    create.mutate(tagName(name), { onSuccess: () => setName('') });
  };

  return (
    <Portal>
      <Sheet label="Tes étiquettes" onDismiss={onClose}>
        <Text as="h2" fontWeight="800" fontSize="22px">
          Tes étiquettes
        </Text>
        <Text color="fg.muted">
          Elles rangent tes clients et filtrent la liste. Elles ne sont visibles
          que par toi.
        </Text>
        <HStack gap="8px" align="stretch">
          <Box flex={1}>
            <TagField
              value={name}
              onChange={setName}
              onEnter={add}
              label="Nouvelle étiquette"
              placeholder="Nouvelle étiquette"
            />
          </Box>
          <ActionButton size="md" onClick={add} disabled={!creatable}>
            Créer
          </ActionButton>
        </HStack>
        {tags.length > 0 && (
          <VStack
            align="stretch"
            gap={0}
            bg="bg.raised"
            borderRadius="18px"
            overflow="hidden"
            css={{ '& > * + *': { borderTop: '1px solid {colors.line}' } }}
            data-managed-tags
          >
            {tags.map((tag) => (
              <ManagedTag
                key={tag._id}
                tag={tag}
                tags={tags}
                used={tagUsage(clients, tag._id)}
              />
            ))}
          </VStack>
        )}
      </Sheet>
    </Portal>
  );
};
