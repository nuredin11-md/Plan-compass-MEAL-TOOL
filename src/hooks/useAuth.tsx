import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  display_name: string;
  department: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
  mfaRequired: boolean;
  aalLevel: "aal1" | "aal2";
  refreshAal: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  mfaRequired: false,
  aalLevel: "aal1",
  refreshAal: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [aalLevel, setAalLevel] = useState<"aal1" | "aal2">("aal1");
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const fetchingProfileRef = useRef(false);

  const refreshAal = async () => {
    try {
      const { data: aalData, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!error && aalData) {
        setAalLevel((aalData.currentLevel as "aal1" | "aal2") || "aal1");
      }
    } catch (err) {
      console.error("Error refreshing AAL level:", err);
    }
  };

  const fetchProfile = async (userId: string) => {
    // Prevent concurrent profile fetches
    if (fetchingProfileRef.current) return;
    fetchingProfileRef.current = true;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, department")
        .eq("user_id", userId)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        // PGRST116 = no rows returned, which is expected if profile hasn't been created
        console.error("Error fetching profile:", profileError);
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (roleError && roleError.code !== "PGRST116") {
        console.error("Error fetching role:", roleError);
      }

      // Use fetched data or set defaults
      setProfile(profileData || { display_name: "User", department: "Health System Strengthening" });
      setRole(roleData?.role ?? "viewer");
      await refreshAal();
    } catch (err) {
      console.error("Error fetching profile/role:", err);
      // Set sensible defaults on error
      setProfile({ display_name: "User", department: "Health System Strengthening" });
      setRole("viewer");
    } finally {
      fetchingProfileRef.current = false;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only process meaningful events, skip token refreshes after init
        if (initializedRef.current && event === "TOKEN_REFRESHED") {
          return;
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => fetchProfile(currentUser.id), 0);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Only set if not already initialized by onAuthStateChange
      if (!initializedRef.current) {
        initializedRef.current = true;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchProfile(currentUser.id);
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  const mfaRequired = (role === "admin" || role === "department_head") && aalLevel !== "aal2";

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, mfaRequired, aalLevel, refreshAal, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
