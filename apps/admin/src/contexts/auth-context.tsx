"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api, type User, type Organization } from "@/lib/api";
import { getToken, setToken, removeToken } from "@/lib/auth";

interface AuthContextValue {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api.auth
      .me(token)
      .then(async (me) => {
        if (me.role !== "PLATFORM_ADMIN" && me.role !== "COLLABORATOR") {
          removeToken();
          return;
        }
        setUser(me);
        if (me.role === "COLLABORATOR") {
          const org = await api.organizations.getMine(token).catch(() => null);
          setOrganization(org);
        }
      })
      .catch(() => removeToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { accessToken } = await api.auth.login(email, password);
      const me = await api.auth.me(accessToken);

      if (me.role !== "PLATFORM_ADMIN" && me.role !== "COLLABORATOR") {
        throw new Error("Acesso restrito a administradores e colaboradores.");
      }

      setToken(accessToken);
      setUser(me);

      if (me.role === "COLLABORATOR") {
        const org = await api.organizations.getMine(accessToken).catch(() => null);
        setOrganization(org);
        router.push(`/organizations/${org?.id ?? ""}`);
      } else {
        router.push("/dashboard");
      }
    },
    [router],
  );

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    setOrganization(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext value={{ user, organization, loading, login, logout }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
