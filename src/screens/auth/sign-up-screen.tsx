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

export function SignUpScreen() {
  const { signUp, signInWithGoogle } = useAuth();
  const [googleBusy, setGoogleBusy] = useState(false);
  const form = useForm(
    { name: "", email: "", password: "" },
    { name: validators.name, email: validators.email, password: validators.newPassword },
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const emailRef = useRef<InputRef>(null);
  const passwordRef = useRef<InputRef>(null);

  const submit = async () => {
    setFormError(null);
    if (submitting || googleBusy || !form.validate()) return;
    setSubmitting(true);
    try {
      await signUp(form.values);
      router.push({
        pathname: "/verify-email",
        params: { mode: "sign-up", email: form.values.email.trim().toLowerCase() },
      });
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
      title={"Create\nyour account"}
      subtitle="Join roam to save your stays, get personalized recommendations and access them across all your devices."
      footer={{ prompt: "Already have an account?", label: "Sign in", href: "/sign-in" }}
    >
      <TextField
        label="Full name"
        icon="user"
        placeholder="e.g. Adrian Hajdin"
        value={form.values.name}
        onChangeText={(v) => form.setValue("name", v)}
        error={form.errors.name}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
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
        placeholder="At least 8 characters"
        secure
        value={form.values.password}
        onChangeText={(v) => form.setValue("password", v)}
        error={form.errors.password}
        autoComplete="new-password"
        textContentType="newPassword"
        autoCapitalize="none"
        returnKeyType="done"
        onSubmitEditing={submit}
      />

      {formError && <Alert tone="error" message={formError} onDismiss={() => setFormError(null)} />}
      {/* <DevTestHint /> */}

      <Button
        title="Create account"
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
