import { Redirect } from "expo-router";

/**
 * Landing route for Google OAuth (roamapp://sso-callback). The browser sheet hands the result
 * to Clerk's useSSO; if Android also opens the app here, send the guest on from `/`.
 */
export default function SSOCallback() {
  return <Redirect href="/" />;
}
