import { useState, useEffect } from "react";
import { toast } from "sonner";

// Lightweight non-firebase stub for Google auth. This preserves the
// `useGoogleAuth` API so components depending on it keep working, but
// disables the actual Google sign-in flow to avoid requiring firebase.

let cachedToken: string | null = null;
let cachedUser: { email: string; displayName: string } | null = null;
const listeners = new Set<(token: string | null, user: { email: string; displayName: string } | null) => void>();

export function useGoogleAuth() {
  const [token, setToken] = useState<string | null>(cachedToken);
  const [googleUser, setGoogleUser] = useState<{ email: string; displayName: string } | null>(cachedUser);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const callback = (t: string | null, u: { email: string; displayName: string } | null) => {
      setToken(t);
      setGoogleUser(u);
    };
    listeners.add(callback);
    return () => listeners.delete(callback);
  }, []);

  const updateCache = (newToken: string | null, newUser: { email: string; displayName: string } | null) => {
    cachedToken = newToken;
    cachedUser = newUser;
    listeners.forEach((l) => l(newToken, newUser));
  };

  const signIn = async (_extraScopes: string[] = []): Promise<string | null> => {
    setIsAuthenticating(true);
    try {
      // Firebase was removed to avoid unresolved imports. Keep a safe
      // no-op implementation: inform the user and return null so callers
      // handle unauthenticated state gracefully.
      toast.info("Google sync is disabled in this build.");
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOut = async () => {
    updateCache(null, null);
    toast.success("Signed out (no-op)");
  };

  return {
    token,
    googleUser,
    isAuthenticating,
    signIn,
    signOut,
  };
}
