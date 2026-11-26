import { View } from "react-native";

import { Divider, Icon, PressableScale, Text } from "@/components/ui";
import type { Answer, AnswerBody } from "@/lib/ask/topics";
import { Bullet, PolicyBody } from "@/components/policy-body";

/** Screen-reader text for a body, word for word (the Portable Text body is read by its own nodes). */
function spokenBody(body: AnswerBody) {
  switch (body.kind) {
    case "lines":
      return body.lines.join(". ");
    case "bullets":
      return body.items.join(". ");
    case "policy":
      return body.summary;
    case "amenities":
      return body.items.map((i) => i.label).join(", ");
  }
}

function Body({ body }: { body: AnswerBody }) {
  switch (body.kind) {
    case "lines":
      return (
        <View className="gap-xs">
          {body.lines.map((line) => (
            <Text key={line} variant="body" tone="default">
              {line}
            </Text>
          ))}
        </View>
      );
    case "bullets":
      return (
        <View className="gap-xs" accessibilityRole="list">
          {body.items.map((item) => (
            <Bullet key={item}>
              <Text variant="body">{item}</Text>
            </Bullet>
          ))}
        </View>
      );
    case "policy":
      return (
        <View className="gap-md">
          <Text variant="body" tone="default" emphasis>
            {body.summary}
          </Text>
          <PolicyBody blocks={body.blocks} />
        </View>
      );
    case "amenities":
      return (
        <View className="flex-row flex-wrap gap-sm">
          {body.items.map((item) => (
            <View key={item.id} className="flex-row items-center gap-xs rounded-full bg-surface-muted px-md py-xs">
              <Icon name={item.icon} size="xs" />
              <Text variant="caption">{item.label}</Text>
            </View>
          ))}
        </View>
      );
  }
}

/**
 * One topic of a reply: icon tile + title, the stored text, and where it comes from. The source
 * row opens the sheet that shows it in full (Policies or Host), when there is one.
 */
export function AnswerCard({ answer, onOpenSource }: { answer: Answer; onOpenSource: (target: NonNullable<Answer["source"]["target"]>) => void }) {
  const { source } = answer;
  const target = source.target;
  const sourceRow = (
    <View className="flex-row items-center gap-xs">
      <Icon name="document" size="xs" tone="muted" />
      <Text variant="label" tone="muted" className="flex-1">{`Source: ${source.label}`}</Text>
      {target && <Icon name="chevron-right" size="xs" tone="accent" />}
    </View>
  );

  return (
    <View className="gap-md rounded-lg border border-border bg-surface p-lg" style={{ borderCurve: "continuous" }}>
      <View className="gap-md" accessible={answer.body.kind !== "policy"} accessibilityLabel={`${answer.title}. ${spokenBody(answer.body)}`}>
        <View className="flex-row items-center gap-md">
          <View className="size-control-sm items-center justify-center rounded-md bg-lavender-tile" style={{ borderCurve: "continuous" }}>
            <Icon name={answer.icon} size="sm" tone="accent" />
          </View>
          <Text variant="title" accessibilityRole="header" className="flex-1">
            {answer.title}
          </Text>
        </View>
        <Body body={answer.body} />
      </View>
      <Divider />
      {target ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Source: ${source.label}`}
          accessibilityHint={target === "host" ? "Opens more about the host" : "Opens the stay's policies"}
          onPress={() => onOpenSource(target)}
        >
          {sourceRow}
        </PressableScale>
      ) : (
        <View accessible accessibilityLabel={`Source: ${source.label}`}>
          {sourceRow}
        </View>
      )}
    </View>
  );
}

/** The reply when no stored field answers the question. No made-up answer; points to support. */
export function NoAnswerCard() {
  return (
    <View className="flex-row gap-md rounded-lg bg-surface-muted p-lg" style={{ borderCurve: "continuous" }} accessible>
      <Icon name="info" tone="muted" />
      <View className="flex-1 gap-xs">
        <Text variant="body" tone="default" emphasis>
          I can&apos;t answer that from this stay&apos;s details yet.
        </Text>
        <Text variant="caption" tone="muted">
          Try a topic below, or contact Roam support.
        </Text>
      </View>
    </View>
  );
}
