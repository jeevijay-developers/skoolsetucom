import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

interface UserRole {
  id: string;
  role: AppRole;
  school_id: string | null;
}

interface Subscription {
  id: string;
  status: SubscriptionStatus;
  plan: Database["public"]["Enums"]["subscription_plan"];
  trial_start_date: string;
  trial_end_date: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  student_count: number | null;
  billing_cycle: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  schoolId: string | null;
  subscription: Subscription | null;
  loading: boolean;
  roleLoaded: boolean; // true when role fetch is complete (even if no role found)
  isSubscriptionActive: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; data: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const latestFetchIdRef = useRef(0);

  const fetchUserData = async (userId: string) => {
    const fetchId = ++latestFetchIdRef.current;
    setRoleLoaded(false);

    try {
      let roleData: UserRole | null = null;
      let roleError: Error | null = null;

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { data, error } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        roleData = data;
        roleError = error;

        if (error || data || attempt === 9) {
          break;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 300));
      }

      if (fetchId !== latestFetchIdRef.current) {
        return;
      }

      if (roleError) {
        console.error("Error fetching role:", roleError);
        setRoleLoaded(true);
        return;
      }

      if (roleData) {
        let nextSubscription: Subscription | null = null;

        if (roleData.school_id) {
          const { data: subData, error: subError } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("school_id", roleData.school_id)
            .maybeSingle();

          if (fetchId !== latestFetchIdRef.current) {
            return;
          }

          if (subError) {
            console.error("Error fetching subscription:", subError);
          } else {
            nextSubscription = subData;
          }
        }

        setUserRole(roleData);
        setSchoolId(roleData.school_id);
        setSubscription(nextSubscription);
      } else {
        setUserRole(null);
        setSchoolId(null);
        setSubscription(null);
      }

      setRoleLoaded(true);
    } catch (error) {
      if (fetchId !== latestFetchIdRef.current) {
        return;
      }

      console.error("Error fetching user data:", error);
      setRoleLoaded(true);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer data fetching with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setSchoolId(null);
          setSubscription(null);
          setRoleLoaded(false);
        }

        if (event === "SIGNED_OUT") {
          setUserRole(null);
          setSchoolId(null);
          setSubscription(null);
          setRoleLoaded(false);
        }

        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setRoleLoaded(true);
      }
      setLoading(false);
    });

    return () => authSubscription.unsubscribe();
  }, []);

  const isSubscriptionActive = (): boolean => {
    if (!subscription) return false;
    
    const now = new Date();
    
    if (subscription.status === "trial") {
      const trialEnd = new Date(subscription.trial_end_date);
      return now < trialEnd;
    }
    
    if (subscription.status === "active") {
      if (subscription.subscription_end_date) {
        const subEnd = new Date(subscription.subscription_end_date);
        return now < subEnd;
      }
      return true;
    }
    
    return false;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error, data };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setSchoolId(null);
    setSubscription(null);
    setRoleLoaded(false);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        schoolId,
        subscription,
        loading,
        roleLoaded,
        isSubscriptionActive: isSubscriptionActive(),
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};