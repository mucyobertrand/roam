import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, KeyboardAvoidingView, ScrollView, View, type ScrollViewInstance } from "react-native";
import Animated, { FadeIn, FadeInDown, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Alert, Button, Icon, IconButton, Text } from "@/components/ui";
import { availableTopics, replyTo, type Answer, type Reply } from "@/lib/ask/topics";
import { useStay, useStayDetails } from "@/lib/content/use-stays";
import { colors, spacing } from "@/theme/tokens";
import { duration, EASE_OUT } from "@/theme/motion";

import { AnswerCard, NoAnswerCard } from "./answer-card";
import { Composer } from "./composer";

type Message = { id: number; question: string; reply: Reply };

function goBack(id: string) {
  if (router.canGoBack()) router.back();
  else router.replace({ pathname: "/stay/[id]", params: { id } });
}

/**
 * "Ask about this stay": a guest taps a topic chip or types a question, and each reply is one
 * answer card per topic with the stay's stored text, word for word, and its source. Topics are
 * picked by a keyword matcher in code (src/lib/ask/topics.ts) until Jev does it behind an API
 * route; no text is generated. The thread lives only while the screen is open.
 */
export function AskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { stay } = useStay(id);
  const { details, error, loading, reload } = useStayDetails(id);
  const [messages, setMessages] = useState<Message[]>([]);
  const nextId = useRef(0);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const entering = reduced ? FadeIn.duration(duration.enter) : FadeInDown.duration(duration.enter).easing(EASE_OUT);
  const title = details?.title ?? stay?.title;

  const send = (question: string) => {
    if (!details) return;
    const reply = replyTo(question, details);
    setMessages((m) => [...m, { id: nextId.current++, question, reply }]);
    AccessibilityInfo.announceForAccessibility(
      reply.answers.length ? `Answered: ${reply.answers.map((a) => a.title).join(", ")}` : "No answer in this stay's details",
    );
  };

  const openSource = (target: NonNullable<Answer["source"]["target"]>) => {
    if (target === "host") router.push({ pathname: "/stay-host", params: { id } });
    else router.push({ pathname: "/stay-policies", params: { id, section: target === "cancellation" ? "cancellation" : undefined } });
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-surface">
      <View className="flex-row items-center gap-md border-b border-border px-xl pb-md" style={{ paddingTop: insets.top + spacing.sm }}>
        <IconButton icon="chevron-left" variant="outline" accessibilityLabel="Back" onPress={() => goBack(id)} />
        <View className="flex-1">
          <Text variant="title" accessibilityRole="header">
            Ask about this stay
          </Text>
          {title && (
            <Text variant="caption" tone="muted">
              {title}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="gap-xl px-xl py-lg"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => {
          if (messages.length) scrollRef.current?.scrollToEnd({ animated: !reduced });
        }}
      >
        <View className="flex-row gap-md rounded-lg bg-lavender-soft p-lg" style={{ borderCurve: "continuous" }} accessible>
          <Icon name="sparkles" tone="accent" />
          <Text variant="caption" tone="muted" className="flex-1">
            Answers come straight from this stay&apos;s details and Roam&apos;s policies, word for word.
          </Text>
        </View>

        {details === null ? (
          <View className="gap-md">
            <Text variant="body">We couldn&apos;t find that stay.</Text>
            <Button title="Back" variant="secondary" onPress={() => goBack(id)} />
          </View>
        ) : details === undefined ? (
          error ? (
            <View className="gap-md">
              <Alert tone="error" message="We couldn't load this stay's details. Check your connection and try again." />
              <Button title="Retry" variant="secondary" loading={loading} onPress={reload} />
            </View>
          ) : (
            <ActivityIndicator color={colors.ink} accessibilityLabel="Loading this stay's details" />
          )
        ) : (
          messages.map((m) => (
            <Animated.View key={m.id} entering={entering} className="gap-md">
              <View className="max-w-[80%] self-end rounded-xl bg-primary px-lg py-md" style={{ borderCurve: "continuous" }} accessible accessibilityLabel={`You asked: ${m.question}`}>
                <Text variant="body" tone="default">
                  {m.question}
                </Text>
              </View>
              {m.reply.answers.map((a) => (
                <AnswerCard key={a.topic} answer={a} onOpenSource={openSource} />
              ))}
              {m.reply.unanswered && <NoAnswerCard />}
            </Animated.View>
          ))
        )}
      </ScrollView>

      <Composer topics={details ? availableTopics(details).map((t) => t.id) : []} disabled={!details} onSend={send} />
    </KeyboardAvoidingView>
  );
}
