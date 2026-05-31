import { useState, useEffect } from "react";
import { toast } from "sonner";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from "firebase/auth";

// Environment variable or local fallback config if file is removed
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "dummy-app-id",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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
    return () => {
      listeners.delete(callback);
    };
  }, []);

  const updateCache = (newToken: string | null, newUser: { email: string; displayName: string } | null) => {
    cachedToken = newToken;
    cachedUser = newUser;
    listeners.forEach((listener) => listener(newToken, newUser));
  };

  const handleSignIn = async (extraScopes: string[] = []): Promise<string | null> => {
    if (cachedToken) {
      return cachedToken;
    }

    setIsAuthenticating(true);
    try {
      const provider = new GoogleAuthProvider();
      
      const scopes = [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/tasks",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/presentations",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/chat",
        ...extraScopes
      ];

      scopes.forEach((scope) => provider.addScope(scope));

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!credential?.accessToken) {
        throw new Error("Failed to retrieve access token from Google Sign-In.");
      }

      const accessToken = credential.accessToken;
      const userProfile = {
        email: result.user.email || "",
        displayName: result.user.displayName || "Google User"
      };

      updateCache(accessToken, userProfile);
      toast.success("Successfully synchronized with Google Account!");
      return accessToken;

    } catch (err) {
      const error = err as Error;
      console.error("Authentication error:", error);
      toast.error(error?.message || "Failed to authenticate with Google");
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn("Firebase sign out failed", err);
    }
    updateCache(null, null);
    toast.success("Disconnected from Google Accounts.");
  };

  return {
    token,
    googleUser,
    isAuthenticating,
    signIn: handleSignIn,
    signOut: handleSignOut
  };
}
