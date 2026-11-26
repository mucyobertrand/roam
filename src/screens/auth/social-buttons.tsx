import { Image } from "expo-image";
import { useState } from "react";
import { View } from "react-native";

import { Button, Divider } from "@/components/ui";

/** Apple joins once Sign in with Apple is configured in Clerk. */
export type Provider = "google";

const googleMark = require("@/assets/images/brand/google-g.png");

export type SocialButtonsProps = {
  onPress: (provider: Provider) => Promise<void>;
  /** Disables both while the email form is submitting. */
  disabled?: boolean;
};

/** "or" divider plus Continue with Google (Clerk OAuth). */
export function SocialButtons({ onPress, disabled = false }: SocialButtonsProps) {
  const [pending, setPending] = useState<Provider | null>(null);

  const press = async (provider: Provider) => {
    setPending(provider);
    try {
      await onPress(provider);
    } finally {
      setPending(null);
    }
  };

  const busy = disabled || pending !== null;

  return (
    <View className="gap-md">
      <Divider label="or" className="my-xs" />
      <Button
        title="Continue with Google"
        variant="secondary"
        leading={
          <View className="size-icon-md">
            <Image source={googleMark} accessible={false} style={{ width: "100%", height: "100%" }} />
          </View>
        }
        loading={pending === "google"}
        disabled={busy && pending !== "google"}
        onPress={() => press("google")}
      />
    </View>
  );
}
