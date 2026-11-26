import { View } from "react-native";

import { Text } from "@/components/ui";
import type { PolicyBlock } from "@/lib/content/stays";

/** One block's spans, with `strong` marks bold. Text is shown word for word. */
function Spans({ block }: { block: PolicyBlock }) {
  return (
    <Text variant="body">
      {block.children.map((span) =>
        span.marks?.includes("strong") ? (
          <Text key={span._key} variant="body" tone="default" emphasis>
            {span.text}
          </Text>
        ) : (
          span.text
        ),
      )}
    </Text>
  );
}

/**
 * Renders a policy's Portable Text (paragraphs, bullets, bold: all the schema allows).
 * Consecutive bullets form one list.
 */
export function PolicyBody({ blocks }: { blocks: PolicyBlock[] }) {
  const groups: PolicyBlock[][] = [];
  for (const block of blocks) {
    const last = groups.at(-1);
    if (block.listItem === "bullet" && last?.[0].listItem === "bullet") last.push(block);
    else groups.push([block]);
  }
  return (
    <View className="gap-md">
      {groups.map((group) =>
        group[0].listItem === "bullet" ? (
          <View key={group[0]._key} className="gap-xs" accessibilityRole="list">
            {group.map((block) => (
              <Bullet key={block._key}>
                <Spans block={block} />
              </Bullet>
            ))}
          </View>
        ) : (
          <Spans key={group[0]._key} block={group[0]} />
        ),
      )}
    </View>
  );
}

export function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row gap-sm">
      <Text variant="body" importantForAccessibility="no">
        •
      </Text>
      <View className="flex-1">{children}</View>
    </View>
  );
}
