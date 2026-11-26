import { router } from "expo-router";
import { useRef, useState, type ComponentRef } from "react";
import { TextInput } from "react-native";

import { Alert, Button, TextField } from "@/components/ui";
import { useAuth } from "@/lib/auth";

import { AuthScreen } from "./auth-screen";
import { DevTestHint } from "./dev-test-hint";
import { SocialButtons } from "./social-buttons";
import { useForm } from "./use-form";
import { goHome, showAuthError, validators } from "./validation";

type InputRef = ComponentRef<typeof TextInput>;

export function SignInScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const [googleBusy, setGoogleBusy] = useState(false);
  const form = useForm({ email: "", password: "" }, { email: validators.email, password: validators.password });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const passwordRef = useRef<InputRef>(null);

  const submit = async () => {
    setFormError(null);
    if (submitting || googleBusy || !form.validate()) return;
    setSubmitting(true);
    try {
      const result = await signIn(form.values);
      if (result === "complete") goHome();
      else {
        // Clerk wants a new-device check: it emailed a code to confirm this sign-in.
        router.push({
          pathname: "/verify-email",
          params: { mode: "sign-in", email: form.values.email.trim().toLowerCase() },
        });
      }
    } catch (error) {
      showAuthError(
        error,
        (field, message) =>
          field in form.values ? form.setError(field as keyof typeof form.values, message) : setFormError(message),
        setFormError,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const google = async () => {
    setFormError(null);
    setGoogleBusy(true);
    try {
      if ((await signInWithGoogle()) === "complete") goHome();
    } catch (error) {
      // No form field belongs to Google, so every message shows above the buttons.
      showAuthError(error, (_field, message) => setFormError(message), setFormError);
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <AuthScreen
      title={"Welcome\nback"}
      subtitle="Sign in to see your saved stays and pick up where you left off."
      footer={{ prompt: "New to roam?", label: "Create account", href: "/sign-up" }}
    >
      <TextField
        label="Email address"
        icon="mail"
        placeholder="you@example.com"
        value={form.values.email}
        onChangeText={(v) => form.setValue("email", v)}
        error={form.errors.email}
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        icon="lock"
        placeholder="Your password"
        secure
        value={form.values.password}
        onChangeText={(v) => form.setValue("password", v)}
        error={form.errors.password}
        autoComplete="current-password"
        textContentType="password"
        autoCapitalize="none"
        returnKeyType="done"
        onSubmitEditing={submit}
      />

      {formError && <Alert tone="error" message={formError} onDismiss={() => setFormError(null)} />}
      {/* <DevTestHint /> */}

      <Button
        title="Sign in"
        trailingIcon="arrow-right"
        loading={submitting}
        disabled={googleBusy}
        onPress={submit}
        className="mt-sm"
      />
      <SocialButtons onPress={google} disabled={submitting} />
    </AuthScreen>
  );
}
