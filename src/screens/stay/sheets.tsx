import { useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import { ActivityIndicator, View, type ScrollViewInstance } from "react-native";

import { Bullet, PolicyBody } from "@/components/policy-body";
import { SheetFrame, SheetSection as Section } from "@/components/sheet";
import { Alert, Button, Text } from "@/components/ui";
import { to12h } from "@/lib/ask/topics";
import { useStayDetails } from "@/lib/content/use-stays";
import { colors } from "@/theme/tokens";

import { HostPhoto } from "./host-row";

function useDetailsOrState(id: string) {
  const { details, error, loading, reload } = useStayDetails(id);
  if (details) return { details };
  const state =
    details === null ? (
      <Text variant="body">We couldn&apos;t find that stay.</Text>
    ) : error ? (
      <View className="gap-md">
        <Alert tone="error" message="We couldn't load this. Check your connection and try again." />
        <Button title="Retry" variant="secondary" loading={loading} onPress={reload} />
      </View>
    ) : (
      <ActivityIndicator color={colors.ink} accessibilityLabel="Loading" />
    );
  return { state };
}

/**
 * The stay's policies, word for word from Sanity: check-in/out, pets, house rules and the full
 * cancellation policy. Opened from the cancellation card and the Ask chat's source labels
 * (`section=cancellation` scrolls there).
 */
export function PoliciesSheet() {
  const { id, section } = useLocalSearchParams<{ id: string; section?: string }>();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrolled = useRef(false);
  const { details, state } = useDetailsOrState(id);

  if (!details) return <SheetFrame title="Policies">{state}</SheetFrame>;

  const scrollToCancellation = (y: number) => {
    if (section !== "cancellation" || scrolled.current) return;
    scrolled.current = true;
    scrollRef.current?.scrollTo({ y, animated: false });
  };

  return (
    <SheetFrame title="Policies" scrollRef={scrollRef}>
      <Section icon="clock" title="Check-in and checkout">
        <View className="gap-xs">
          <Text variant="body">{`Check-in after ${to12h(details.checkInTime)}`}</Text>
          <Text variant="body">{`Checkout before ${to12h(details.checkOutTime)}`}</Text>
        </View>
      </Section>
      <Section icon="paw" title="Pets">
        <Text variant="body">{details.petsAllowed ? "Pets allowed" : "No pets"}</Text>
      </Section>
      {details.houseRules.length > 0 && (
        <Section icon="list" title="House rules">
          <View className="gap-xs" accessibilityRole="list">
            {details.houseRules.map((rule) => (
              <Bullet key={rule}>
                <Text variant="body">{rule}</Text>
              </Bullet>
            ))}
          </View>
        </Section>
      )}
      {details.cancellation && (
        <Section icon="document" title={details.cancellation.title} onLayoutY={scrollToCancellation}>
          <Text variant="body" tone="default" emphasis>
            {details.cancellation.summary}
          </Text>
          <PolicyBody blocks={details.cancellation.body} />
        </Section>
      )}
    </SheetFrame>
  );
}

/** The host: photo, name, hosting since, languages and bio, all as stored. */
export function HostSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { details, state } = useDetailsOrState(id);
  if (!details) return <SheetFrame title="Your host">{state}</SheetFrame>;
  const host = details.host;
  if (!host) return <SheetFrame title="Your host"><Text variant="body">No host details yet.</Text></SheetFrame>;

  return (
    <SheetFrame title="Your host">
      <View className="flex-row items-center gap-lg">
        <HostPhoto host={host} />
        <View className="flex-1 gap-xs">
          <Text variant="title">{host.name}</Text>
          {host.hostingSince && (
            <Text variant="caption" tone="muted">
              {`Hosting since ${host.hostingSince}`}
            </Text>
          )}
        </View>
      </View>
      {host.languages.length > 0 && (
        <Section icon="chat" title="Languages">
          <Text variant="body">{host.languages.join(", ")}</Text>
        </Section>
      )}
      {host.bio && (
        <Section icon="user" title={`About ${host.name.split(/\s+/)[0]}`}>
          <Text variant="body">{host.bio}</Text>
        </Section>
      )}
    </SheetFrame>
  );
}
