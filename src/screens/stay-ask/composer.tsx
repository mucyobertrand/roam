import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Chip, IconButton, TextField } from "@/components/ui";
import { TOPICS, type TopicId } from "@/lib/ask/topics";
import { spacing } from "@/theme/tokens";

type ComposerProps = {
  /** Topics this stay can answer; their chips show. */
  topics: TopicId[];
  disabled: boolean;
  onSend: (question: string) => void;
};

/**
 * Pinned to the bottom: a row of topic chips (a tap sends that topic's question at once) and the
 * message field with a chat icon and a send button.
 */
export function Composer({ topics, disabled, onSend }: ComposerProps) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const canSend = !disabled && text.trim().length > 0;
  const send = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <View className="gap-md border-t border-border bg-surface pt-md" style={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerClassName="gap-sm px-xl">
        {TOPICS.filter((t) => topics.includes(t.id)).map((t) => (
          <Chip
            key={t.id}
            size="filter"
            icon={t.icon}
            label={t.label}
            disabled={disabled}
            accessibilityHint={`Asks: ${t.question}`}
            onPress={() => onSend(t.question)}
          />
        ))}
      </ScrollView>
      <TextField
        className="px-xl"
        icon="chat"
        value={text}
        onChangeText={setText}
        placeholder="Ask about check-in, pets, rules…"
        accessibilityLabel="Ask a question about this stay"
        returnKeyType="send"
        submitBehavior="submit"
        onSubmitEditing={send}
        disabled={disabled}
        trailing={
          <IconButton icon="send" variant="surface" size="sm" tone="accent" accessibilityLabel="Send" disabled={!canSend} onPress={send} />
        }
      />
    </View>
  );
}
