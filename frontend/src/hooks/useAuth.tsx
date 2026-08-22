import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import * as authApi from "@/api/auth";
import { clearToken, getToken, setToken } from "@/api/client";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(() => getToken());

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    function onStorage(): void {
      setTokenState(getToken());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const res = await authApi.login(email, password);
    setToken(res.access_token);
    setTokenState(res.access_token);
    queryClient.setQueryData(["me"], res.user);
  }

  async function register(email: string, password: string, fullName?: string): Promise<void> {
    const res = await authApi.register(email, password, fullName);
    setToken(res.access_token);
    setTokenState(res.access_token);
    queryClient.setQueryData(["me"], res.user);
  }

  function logout(): void {
    clearToken();
    setTokenState(null);
    queryClient.clear();
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user: user ?? null, token, isLoading: Boolean(token) && isLoading, login, register, logout }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
