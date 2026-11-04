"use client";

import { useSyncExternalStore } from "react";
import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  magicLinkClient,
} from "better-auth/client/plugins";

import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), magicLinkClient()],
});

const subscribeToNothing = () => () => {};

// Better Auth's useSession uses the live client value as its server snapshot,
// so if the session fetch resolves before hydration the client renders
// signed-in markup over signed-out server HTML and React throws a hydration
// error (re-rendering the whole tree and dropping clicks). Report no session
// until hydration finishes so the first client render matches the server.
export function useHydratedSession() {
  const result = authClient.useSession();
  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  return isHydrated ? result : { ...result, data: null, isPending: true };
}
