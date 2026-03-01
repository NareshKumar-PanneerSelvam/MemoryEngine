import axios, { type AxiosRequestConfig } from "axios";

import type {
  CreatePageRequest,
  Page,
  PageShare,
  SharePageRequest,
  UpdatePageRequest,
} from "../types/page";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
export const ACCESS_TOKEN_KEY = "memoryengine.access_token";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

function buildAuthConfig(token?: string): AxiosRequestConfig {
  const accessToken = token ?? localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
  if (!accessToken) {
    return {};
  }

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

export async function getPages(parentId?: string, token?: string): Promise<Page[]> {
  const query = parentId ? { params: { parent_id: parentId } } : {};
  const response = await api.get<Page[]>("/api/pages", {
    ...query,
    ...buildAuthConfig(token),
  });
  return response.data;
}

export async function getPage(pageId: string, token?: string): Promise<Page> {
  const response = await api.get<Page>(`/api/pages/${pageId}`, buildAuthConfig(token));
  return response.data;
}

export async function createPage(
  payload: CreatePageRequest,
  token?: string,
): Promise<Page> {
  const response = await api.post<Page>(
    "/api/pages",
    payload,
    buildAuthConfig(token),
  );
  return response.data;
}

export async function updatePage(
  pageId: string,
  payload: UpdatePageRequest,
  token?: string,
): Promise<Page> {
  const response = await api.put<Page>(
    `/api/pages/${pageId}`,
    payload,
    buildAuthConfig(token),
  );
  return response.data;
}

export async function deletePage(pageId: string, token?: string): Promise<void> {
  await api.delete(`/api/pages/${pageId}`, buildAuthConfig(token));
}

export async function getChildPages(pageId: string, token?: string): Promise<Page[]> {
  const response = await api.get<Page[]>(
    `/api/pages/${pageId}/children`,
    buildAuthConfig(token),
  );
  return response.data;
}

export async function sharePage(
  pageId: string,
  payload: SharePageRequest,
  token?: string,
): Promise<PageShare> {
  const response = await api.post<PageShare>(
    `/api/pages/${pageId}/share`,
    payload,
    buildAuthConfig(token),
  );
  return response.data;
}

export async function revokeShare(
  pageId: string,
  sharedWithUserId: string,
  token?: string,
): Promise<void> {
  await api.delete(
    `/api/pages/${pageId}/share/${sharedWithUserId}`,
    buildAuthConfig(token),
  );
}

export async function getPageShares(pageId: string, token?: string): Promise<PageShare[]> {
  const response = await api.get<PageShare[]>(
    `/api/pages/${pageId}/shares`,
    buildAuthConfig(token),
  );
  return response.data;
}
