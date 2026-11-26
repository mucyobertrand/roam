import { useState } from "react";
import { TextInput, View } from "react-native";

import { Icon, IconButton } from "@/components/ui";

export type SearchFieldProps = {
  initialValue?: string;
  autoFocus?: boolean;
  /** The keyboard's search key, with the trimmed sentence. */
  onSubmit: (text: string) => void;
  /** The sliders button: opens sort + filters. */
  onOpenFilters: () => void;
};

/** search.png header field: grey pill with a search glyph, the sentence, and a sliders button. */
export function SearchField({ initialValue = "", autoFocus, onSubmit, onOpenFilters }: SearchFieldProps) {
  const [text, setText] = useState(initialValue);
  return (
    <View className="h-control-md flex-1 flex-row items-center gap-sm rounded-full bg-surface-muted pl-lg pr-xs">
      <Icon name="search" />
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={() => onSubmit(text.trim())}
        placeholder="Describe your stay"
        accessibilityLabel="Describe your stay"
        accessibilityHint="Type a sentence, then search"
        returnKeyType="search"
        submitBehavior="blurAndSubmit"
        autoFocus={autoFocus}
        autoCorrect={false}
        numberOfLines={1}
        className="flex-1 self-stretch font-jakarta-medium text-body text-ink placeholder:text-placeholder caret-ink outline-none"
      />
      <IconButton icon="sliders" variant="plain" size="sm" hitSlop={6} accessibilityLabel="Sort and filters" onPress={onOpenFilters} />
    </View>
  );
}
