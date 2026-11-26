import { Text } from "@/components/ui";

/** Dev builds only: Clerk test-mode addresses get code 424242 and no real email is sent. */
export function DevTestHint() {
  if (!__DEV__) return null;
  return (
    <Text variant="caption" tone="muted">
      {/* Test email: anything+clerk_test@example.com, code 424242 */}
    </Text>
  );
}
