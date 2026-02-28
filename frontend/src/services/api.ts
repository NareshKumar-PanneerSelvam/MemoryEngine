import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
export const ACCESS_TOKEN_KEY = "memoryengine.access_token";
export const REFRESH_TOKEN_KEY = "memoryengine.refresh_token";

export type UserRole = "admin" | "user";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  role: UserRole;
}

export interface RegisterRequest {
  email: string;
  name: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface UpdateProfileRequest {
  name?: string;
  username?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  user: AuthUser;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

type PendingRequest = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function storeAccessToken(accessToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let pendingRequests: PendingRequest[] = [];

function resolvePendingRequests(error: unknown, token: string | null = null) {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    if (token) {
      resolve(token);
      return;
    }

    reject(new Error("No token received"));
  });
  pendingRequests = [];
}

async function refreshAccessTokenRequest(
  refreshToken: string,
): Promise<AccessTokenResponse> {
  const response = await refreshClient.post<AccessTokenResponse>(
    "/api/auth/refresh",
    { refresh_token: refreshToken } satisfies RefreshTokenRequest,
  );
  return response.data;
}

api.interceptors.request.use((config) => {
  const { accessToken } = getStoredTokens();
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    if (!originalRequest || !error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry || originalRequest.url?.includes("/api/auth/refresh")) {
      clearStoredTokens();
      return Promise.reject(error);
    }

    const { refreshToken } = getStoredTokens();
    if (!refreshToken) {
      clearStoredTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({
          resolve: (token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest as AxiosRequestConfig));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshed = await refreshAccessTokenRequest(refreshToken);
      storeAccessToken(refreshed.access_token);
      resolvePendingRequests(null, refreshed.access_token);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${refreshed.access_token}`;
      }

      return api(originalRequest as AxiosRequestConfig);
    } catch (refreshError) {
      clearStoredTokens();
      resolvePendingRequests(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export const authApi = {
  async register(payload: RegisterRequest) {
    const response = await api.post<AuthResponse>("/api/auth/register", payload);
    return response.data;
  },
  async login(payload: LoginRequest) {
    const response = await api.post<AuthResponse>("/api/auth/login", payload);
    return response.data;
  },
  async refresh(payload: RefreshTokenRequest) {
    const response = await refreshClient.post<AccessTokenResponse>(
      "/api/auth/refresh",
      payload,
    );
    return response.data;
  },
  async me(token?: string) {
    const response = await api.get<AuthUser>("/api/auth/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data;
  },
  async updateMe(payload: UpdateProfileRequest) {
    const response = await api.patch<AuthUser>("/api/auth/me", payload);
    return response.data;
  },
};

export { api };
