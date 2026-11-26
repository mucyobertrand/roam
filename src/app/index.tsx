import { Redirect } from "expo-router";

import { useAuth } from "@/lib/auth";

/** Entry route: signed-in users go home, everyone else starts on onboarding. */
export default function Index() {
  const { isSignedIn } = useAuth();
  return <Redirect href={isSignedIn ? "/home" : "/onboarding"} />;
}
