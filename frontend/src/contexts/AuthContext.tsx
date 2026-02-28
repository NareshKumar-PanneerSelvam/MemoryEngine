import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AxiosError } from "axios";
import {
  authApi,
  clearStoredTokens,
  getStoredTokens,
  storeAccessToken,
  storeTokens,
  type AuthUser,
} from "../services/api";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function parseApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data as { detail?: string } | undefined;
    if (typeof detail?.detail === "string") {
      return detail.detail;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message || "Authentication request failed";
  }
  return "Authentication request failed";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    () => getStoredTokens().accessToken,
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    () => getStoredTokens().refreshToken,
  );
  const [isLoading, setIsLoading] = useState(true);

  const saveTokens = useCallback((nextAccessToken: string, nextRefreshToken: string) => {
    storeTokens(nextAccessToken, nextRefreshToken);
    setAccessToken(nextAccessToken);
    setRefreshToken(nextRefreshToken);
  }, []);

  const clearSession = useCallback(() => {
    clearStoredTokens();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const fetchMe = useCallback(async (token: string): Promise<AuthUser> => {
    return authApi.me(token);
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!refreshToken) {
      return null;
    }

    try {
      const data = await authApi.refresh({ refresh_token: refreshToken });
      storeAccessToken(data.access_token);
      setAccessToken(data.access_token);
      return data.access_token;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession, refreshToken]);

  const authenticate = useCallback(
    async (path: "/api/auth/login" | "/api/auth/register", email: string, password: string) => {
      const data =
        path === "/api/auth/login"
          ? await authApi.login({ email, password })
          : await authApi.register({ email, password });
      saveTokens(data.access_token, data.refresh_token);
      setUser(data.user);
    },
    [saveTokens],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      await authenticate("/api/auth/login", email, password);
    },
    [authenticate],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      await authenticate("/api/auth/register", email, password);
    },
    [authenticate],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        if (!accessToken) {
          setIsLoading(false);
          return;
        }

        try {
          const me = await fetchMe(accessToken);
          setUser(me);
          return;
        } catch {
          const refreshedToken = await refreshAccessToken();
          if (!refreshedToken) {
            return;
          }
          const me = await fetchMe(refreshedToken);
          setUser(me);
        }
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, [accessToken, clearSession, fetchMe, refreshAccessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      login,
      register,
      logout,
      refreshAccessToken,
    }),
    [
      accessToken,
      isLoading,
      login,
      logout,
      refreshAccessToken,
      refreshToken,
      register,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { parseApiError };
