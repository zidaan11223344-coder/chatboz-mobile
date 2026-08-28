import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { clearLocalSession, getLocalSessionToken, getLocalSessionUser, type LocalSessionUser, saveLocalSession } from "@/lib/local-session";

type LocalAuthContextValue = {
  user: LocalSessionUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  establish: (token: string, user: LocalSessionUser) => Promise<void>;
  updateUser: (patch: Partial<LocalSessionUser>) => Promise<void>;
  logout: () => Promise<void>;
};

const LocalAuthContext = createContext<LocalAuthContextValue | null>(null);

export function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalSessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLocalSessionToken(), getLocalSessionUser()])
      .then(([token, cachedUser]) => setUser(token && cachedUser ? cachedUser : null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<LocalAuthContextValue>(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    establish: async (token, nextUser) => { await saveLocalSession(token, nextUser); setUser(nextUser); },
    updateUser: async (patch) => { if (!user) return; const token = await getLocalSessionToken(); if (!token) return; const nextUser = { ...user, ...patch }; await saveLocalSession(token, nextUser); setUser(nextUser); },
    logout: async () => { await clearLocalSession(); setUser(null); },
  }), [user, loading]);

  return <LocalAuthContext.Provider value={value}>{children}</LocalAuthContext.Provider>;
}

export function useLocalAuth() {
  const context = useContext(LocalAuthContext);
  if (!context) throw new Error("useLocalAuth must be used inside LocalAuthProvider");
  return context;
}
