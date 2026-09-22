import { Box, Wrap } from '@chakra-ui/react';
import { FeedbackTag } from '@/types';
import { FEEDBACK_TAGS, FEEDBACK_TAG_LABELS } from '../constants';

interface FeedbackTagsProps {
  value: FeedbackTag[];
  onChange: (tags: FeedbackTag[]) => void;
}

// No tag ticked by default: a tag only exists when it is true, so every tag
// present is signal. The normal case — nothing to report — costs zero taps.
export const FeedbackTags = ({ value, onChange }: FeedbackTagsProps) => {
  const toggle = (tag: FeedbackTag) =>
    onChange(
      value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]
    );

  return (
    <Wrap gap={2}>
      {FEEDBACK_TAGS.map((tag) => {
        const isActive = value.includes(tag);
        return (
          <Box
            key={tag}
            as="button"
            aria-pressed={isActive}
            px={3}
            py={1.5}
            borderRadius="full"
            borderWidth="1px"
            fontSize="xs"
            fontWeight="medium"
            bg={isActive ? 'app.primary/16' : 'transparent'}
            borderColor={isActive ? 'app.primary' : 'whiteAlpha.200'}
            color={isActive ? 'app.primary' : 'fg.muted'}
            onClick={() => toggle(tag)}
            _hover={{
              borderColor: isActive ? 'app.primary' : 'whiteAlpha.400',
            }}
            transition="background-color 0.15s, border-color 0.15s"
          >
            {FEEDBACK_TAG_LABELS[tag]}
          </Box>
        );
      })}
    </Wrap>
  );
};
