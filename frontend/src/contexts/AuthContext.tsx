import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type UserRole = "admin" | "user";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  user: AuthUser;
}

interface RefreshResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

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

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const ACCESS_TOKEN_KEY = "memoryengine.access_token";
const REFRESH_TOKEN_KEY = "memoryengine.refresh_token";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Authentication request failed";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem(ACCESS_TOKEN_KEY),
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    () => localStorage.getItem(REFRESH_TOKEN_KEY),
  );
  const [isLoading, setIsLoading] = useState(true);

  const saveTokens = useCallback((nextAccessToken: string, nextRefreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, nextAccessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
    setAccessToken(nextAccessToken);
    setRefreshToken(nextRefreshToken);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const fetchMe = useCallback(async (token: string): Promise<AuthUser> => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load current user");
    }

    return (await response.json()) as AuthUser;
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!refreshToken) {
      return null;
    }

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearSession();
      return null;
    }

    const data = (await response.json()) as RefreshResponse;
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
    setAccessToken(data.access_token);
    return data.access_token;
  }, [clearSession, refreshToken]);

  const authenticate = useCallback(
    async (path: "/api/auth/login" | "/api/auth/register", email: string, password: string) => {
      const response = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          payload && typeof payload.detail === "string"
            ? payload.detail
            : "Authentication failed";
        throw new Error(message);
      }

      const data = payload as AuthResponse;
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
