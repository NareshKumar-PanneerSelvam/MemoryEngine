import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import type {
  CreatePageRequest,
  Page,
  PageShare,
  SharePageRequest,
  UpdatePageRequest,
} from "../types/page";

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

export type AdminUser = AuthUser;

export interface AdminCreateUserRequest {
  email: string;
  name: string;
  username: string;
  password: string;
  role?: UserRole;
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

export interface AITextRequest {
  text: string;
}

export interface AITextResponse {
  original: string;
}

export interface AIRephraseResponse extends AITextResponse {
  rephrased: string;
}

export interface AIEnhanceResponse extends AITextResponse {
  enhanced: string;
}

export interface AISimplifyResponse extends AITextResponse {
  simplified: string;
}

export interface AIGenerateQuestionsRequest extends AITextRequest {
  count?: number;
}

export interface AIGenerateQuestionsResponse {
  questions: string[];
}

export interface AIGeneratedFlashcard {
  question: string;
  answer: string;
}

export interface AIGenerateFlashcardsRequest extends AITextRequest {
  count?: number;
}

export interface AIGenerateFlashcardsResponse {
  flashcards: AIGeneratedFlashcard[];
}

export interface AIImageToMarkdownResponse {
  markdown: string;
  confidence: number;
}

export class AIRateLimitError extends Error {
  readonly retryAfterSeconds: number | null;

  constructor(message: string, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = "AIRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
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
  async listUsers() {
    const response = await api.get<AdminUser[]>("/api/admin/users");
    return response.data;
  },
  async createUser(payload: AdminCreateUserRequest) {
    const response = await api.post<AdminUser>("/api/admin/users", payload);
    return response.data;
  },
  async deleteUser(userId: string) {
    await api.delete(`/api/admin/users/${userId}`);
  },
};

export async function getPages(parentId?: string): Promise<Page[]> {
  const response = await api.get<Page[]>("/api/pages", {
    params: parentId ? { parent_id: parentId } : undefined,
  });
  return response.data;
}

export async function getPage(pageId: string): Promise<Page> {
  const response = await api.get<Page>(`/api/pages/${pageId}`);
  return response.data;
}

export async function createPage(payload: CreatePageRequest): Promise<Page> {
  const response = await api.post<Page>("/api/pages", payload);
  return response.data;
}

export async function updatePage(pageId: string, payload: UpdatePageRequest): Promise<Page> {
  const response = await api.put<Page>(`/api/pages/${pageId}`, payload);
  return response.data;
}

export async function deletePage(pageId: string): Promise<void> {
  await api.delete(`/api/pages/${pageId}`);
}

export async function getChildPages(pageId: string): Promise<Page[]> {
  const response = await api.get<Page[]>(`/api/pages/${pageId}/children`);
  return response.data;
}

export async function sharePage(pageId: string, payload: SharePageRequest): Promise<PageShare> {
  const response = await api.post<PageShare>(`/api/pages/${pageId}/share`, payload);
  return response.data;
}

export async function revokeShare(pageId: string, sharedWithUserId: string): Promise<void> {
  await api.delete(`/api/pages/${pageId}/share/${sharedWithUserId}`);
}

export async function getPageShares(pageId: string): Promise<PageShare[]> {
  const response = await api.get<PageShare[]>(`/api/pages/${pageId}/shares`);
  return response.data;
}

export async function pingHealth(): Promise<void> {
  await refreshClient.get("/health");
}

function getApiErrorMessage(error: AxiosError, fallbackMessage: string): string {
  const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail;
  }
  return fallbackMessage;
}

function parseRetryAfterSeconds(error: AxiosError): number | null {
  const retryAfterHeader = error.response?.headers?.["retry-after"];
  if (typeof retryAfterHeader !== "string") {
    return null;
  }

  const retryAfterSeconds = Number.parseInt(retryAfterHeader, 10);
  return Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : null;
}

function handleAiApiError(error: unknown, fallbackMessage: string): never {
  if (!axios.isAxiosError(error)) {
    throw error;
  }

  if (error.response?.status === 429) {
    const retryAfterSeconds = parseRetryAfterSeconds(error);
    const retryMessage =
      retryAfterSeconds !== null
        ? ` Please wait ${retryAfterSeconds} seconds before trying again.`
        : " Please try again in a moment.";
    const message = `${getApiErrorMessage(error, "AI request limit reached.")}${retryMessage}`;
    throw new AIRateLimitError(message, retryAfterSeconds);
  }

  throw new Error(getApiErrorMessage(error, fallbackMessage));
}

export async function rephraseText(payload: AITextRequest): Promise<AIRephraseResponse> {
  try {
    const response = await api.post<AIRephraseResponse>("/api/ai/rephrase", payload);
    return response.data;
  } catch (error) {
    return handleAiApiError(error, "Unable to rephrase text right now.");
  }
}

export async function enhanceText(payload: AITextRequest): Promise<AIEnhanceResponse> {
  try {
    const response = await api.post<AIEnhanceResponse>("/api/ai/enhance", payload);
    return response.data;
  } catch (error) {
    return handleAiApiError(error, "Unable to enhance text right now.");
  }
}

export async function simplifyText(payload: AITextRequest): Promise<AISimplifyResponse> {
  try {
    const response = await api.post<AISimplifyResponse>("/api/ai/simplify", payload);
    return response.data;
  } catch (error) {
    return handleAiApiError(error, "Unable to simplify text right now.");
  }
}

export async function generateQuestions(
  payload: AIGenerateQuestionsRequest,
): Promise<AIGenerateQuestionsResponse> {
  try {
    const response = await api.post<AIGenerateQuestionsResponse>(
      "/api/ai/generate-questions",
      payload,
    );
    return response.data;
  } catch (error) {
    return handleAiApiError(error, "Unable to generate questions right now.");
  }
}

export async function generateFlashcards(
  payload: AIGenerateFlashcardsRequest,
): Promise<AIGenerateFlashcardsResponse> {
  try {
    const response = await api.post<AIGenerateFlashcardsResponse>(
      "/api/ai/generate-flashcards",
      payload,
    );
    return response.data;
  } catch (error) {
    return handleAiApiError(error, "Unable to generate flashcards right now.");
  }
}

export async function imageToMarkdown(image: File): Promise<AIImageToMarkdownResponse> {
  const formData = new FormData();
  formData.append("image", image);

  try {
    const response = await api.post<AIImageToMarkdownResponse>(
      "/api/ai/image-to-markdown",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (error) {
    return handleAiApiError(error, "Unable to convert image to Markdown right now.");
  }
}

export { api };
