import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "./supabase-client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(getSupabase());

  // Refresh session state from Supabase
  const refreshSession = async () => {
    const supabase = supabaseRef.current;
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  };

  useEffect(() => {
    const supabase = supabaseRef.current;

    // Get initial session
    refreshSession();

    // Listen for auth state changes (triggered when background script sets session)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for chrome.storage changes (backup mechanism)
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.supabase_session || changes.session_synced) {
        refreshSession();
      }
    };

    chrome.storage.local.onChanged.addListener(handleStorageChange);

    // Listen for messages from background script
    const handleMessage = (message: any) => {
      if (message.type === "SESSION_UPDATED") {
        if (message.session) {
          // Set session directly
          supabase.auth.setSession({
            access_token: message.session.access_token,
            refresh_token: message.session.refresh_token,
          }).then(() => refreshSession());
        } else {
          // Clear session
          supabase.auth.signOut().then(() => refreshSession());
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      subscription.unsubscribe();
      chrome.storage.local.onChanged.removeListener(handleStorageChange);
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    chrome.storage.local.remove("supabase_session");
    setUser(null);
    setSession(null);
  };

  const getAccessToken = async () => {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signIn, signUp, signOut, getAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
