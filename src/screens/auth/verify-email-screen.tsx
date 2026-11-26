import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Pressable, TextInput, View } from "react-native";

import { Alert, Button, CodeInput, Text } from "@/components/ui";
import { useAuth, type CodeFlow } from "@/lib/auth";
import { spacing } from "@/theme/tokens";

import { AuthScreen } from "./auth-screen";
import { DevTestHint } from "./dev-test-hint";
import { goHome, showAuthError } from "./validation";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

function formatCountdown(seconds: number) {
  return `0:${String(seconds).padStart(2, "0")}`;
}

export function VerifyEmailScreen() {
  const { email = "", mode } = useLocalSearchParams<{ email?: string; mode?: CodeFlow }>();
  const flow: CodeFlow = mode === "sign-in" ? "sign-in" : "sign-up";
  const auth = useAuth();
  const verify = flow === "sign-up" ? auth.verifySignUp : auth.verifySignIn;
  const resendCode = flow === "sign-up" ? auth.resendSignUpCode : auth.resendSignInCode;
  // Checked once on arrival: after a reload there is no sign-up or sign-in left to finish.
  const [expired] = useState(() => !auth.hasPendingCode(flow));
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  // The code was just sent by sign-up, so the cooldown starts right away.
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const codeRef = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submit = async (value = code) => {
    setNotice(null);
    if (submitting) return;
    if (value.length < CODE_LENGTH) {
      setCodeError(`Enter all ${CODE_LENGTH} digits.`);
      return;
    }
    setSubmitting(true);
    try {
      await verify(value);
      goHome();
    } catch (error) {
      setCode("");
      showAuthError(error, (_field, message) => setCodeError(message), setCodeError);
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setNotice(null);
    setCodeError(null);
    setResending(true);
    try {
      await resendCode();
      setNotice(`We sent a new code to ${email}.`);
      setCooldown(RESEND_SECONDS);
    } catch (error) {
      showAuthError(error, () => {}, setCodeError);
    } finally {
      setResending(false);
    }
  };

  if (expired) {
    return (
      <AuthScreen title={"Check\nyour email"} subtitle="This code screen is no longer active.">
        <Alert
          tone="error"
          message={flow === "sign-up" ? "Your sign-up expired. Please start again." : "Your sign-in expired. Please start again."}
        />
        <Button
          title="Start again"
          trailingIcon="arrow-right"
          onPress={() => router.replace(flow === "sign-up" ? "/sign-up" : "/sign-in")}
          className="mt-sm"
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title={"Check\nyour email"}
      subtitle={
        <>
          We sent a {CODE_LENGTH}-digit code to{" "}
          <Text variant="body" tone="default" emphasis>
            {email}
          </Text>
          . Enter it below to {flow === "sign-up" ? "verify your account" : "finish signing in"}.
        </>
      }
    >
      <CodeInput
        ref={codeRef}
        value={code}
        onChangeText={(v) => {
          // Ignore keys while a check is in flight. The input stays editable: on Android,
          // disabling a focused input drops focus, and focus() can't win it back.
          if (submitting) return;
          setCode(v);
          if (codeError) setCodeError(null);
        }}
        onComplete={(v) => {
          if (!submitting) submit(v);
        }}
        length={CODE_LENGTH}
        error={!!codeError}
        autoFocus
      />

      {codeError && <Alert tone="error" message={codeError} onDismiss={() => setCodeError(null)} />}
      {notice && <Alert tone="success" message={notice} onDismiss={() => setNotice(null)} />}
      {/* <DevTestHint /> */}

      <Button title="Verify" trailingIcon="arrow-right" loading={submitting} onPress={() => submit()} className="mt-sm" />

      <View className="items-center gap-md">
        {cooldown > 0 ? (
          <Text variant="caption" tone="muted" accessibilityLiveRegion="polite">
            Didn&apos;t get a code? Resend in {formatCountdown(cooldown)}
          </Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: resending }}
            disabled={resending}
            onPress={resend}
            hitSlop={spacing.sm}
            className="active:opacity-70"
          >
            <Text variant="caption">
              Didn&apos;t get a code? <Text variant="caption" className="underline">{resending ? "Sending…" : "Resend"}</Text>
            </Text>
          </Pressable>
        )}
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={spacing.sm} className="active:opacity-70">
          <Text variant="caption" tone="muted">
            Wrong email? <Text variant="caption" className="underline">Go back</Text>
          </Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}
