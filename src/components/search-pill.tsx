import { useState } from "react";
import { TextInput, View } from "react-native";

import { Icon, PressableScale } from "@/components/ui";
import { cn } from "@/lib/cn";

export const SEARCH_EXAMPLE = "quiet pet friendly cabin with hot tub";

export type SearchPillProps = {
  /** Called with the trimmed sentence on the keyboard's search key or the arrow button. */
  onSubmit: (text: string) => void;
  initialValue?: string;
  autoFocus?: boolean;
  /** Layout only. */
  className?: string;
};

/**
 * The lavender one-sentence search field from home.png: sparkles, the sentence, and a white
 * arrow button. Used by Home and Search. The placeholder is drawn in ink, as in the design.
 */
export function SearchPill({ onSubmit, initialValue = "", autoFocus, className }: SearchPillProps) {
  const [text, setText] = useState(initialValue);
  const submit = () => onSubmit(text.trim());

  return (
    <View className={cn("h-field flex-row items-center gap-xs rounded-full bg-lavender pl-md pr-sm", className)}>
      <Icon name="sparkles" size="sm" />
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        placeholder={SEARCH_EXAMPLE}
        accessibilityLabel="Describe your stay"
        accessibilityHint="Type a sentence, then search"
        returnKeyType="search"
        submitBehavior="blurAndSubmit"
        autoFocus={autoFocus}
        autoCorrect={false}
        className="flex-1 self-stretch font-jakarta-medium text-caption text-ink placeholder:text-ink caret-ink outline-none"
      />
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Search"
        onPress={submit}
        hitSlop={4}
        className="size-icon-button items-center justify-center rounded-full bg-surface"
      >
        <Icon name="arrow-up-right" />
      </PressableScale>
    </View>
  );
}
