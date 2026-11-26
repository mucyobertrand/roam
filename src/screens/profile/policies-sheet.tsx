import { ActivityIndicator, View } from "react-native";

import { PolicyBody } from "@/components/policy-body";
import { SheetFrame, SheetSection } from "@/components/sheet";
import { Alert, Button, Text } from "@/components/ui";
import { usePolicies } from "@/lib/content/use-stays";
import { colors } from "@/theme/tokens";

const TITLE = "Cancellation policies";

/** Roam's cancellation policies, word for word from Sanity. Opened from the Profile's policy card. */
export function RoamPoliciesSheet() {
  const { policies, error, loading, reload } = usePolicies("cancellation");

  if (policies === undefined) {
    return (
      <SheetFrame title={TITLE}>
        {error ? (
          <View className="gap-md">
            <Alert tone="error" message="We couldn't load the policies. Check your connection and try again." />
            <Button title="Retry" variant="secondary" loading={loading} onPress={reload} />
          </View>
        ) : (
          <ActivityIndicator color={colors.ink} accessibilityLabel="Loading" />
        )}
      </SheetFrame>
    );
  }

  return (
    <SheetFrame title={TITLE}>
      {policies.length === 0 ? (
        <Text variant="body">No policies yet.</Text>
      ) : (
        policies.map((policy) => (
          <SheetSection key={policy.key ?? policy.title} icon="document" title={policy.title}>
            <Text variant="body" tone="default" emphasis>
              {policy.summary}
            </Text>
            <PolicyBody blocks={policy.body} />
          </SheetSection>
        ))
      )}
    </SheetFrame>
  );
}
