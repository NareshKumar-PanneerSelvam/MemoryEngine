export type PermissionLevel = "view_only" | "edit";

export interface Page {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
  is_shared?: boolean;
  permission?: PermissionLevel | null;
  owner_email?: string | null;
  children?: Page[];
}

export interface CreatePageRequest {
  title: string;
  content?: string | null;
  parent_id?: string | null;
}

export interface UpdatePageRequest {
  title?: string;
  content?: string | null;
  parent_id?: string | null;
}

export interface SharePageRequest {
  shared_with_user_id: string;
  permission_level: PermissionLevel;
}

export interface PageShare {
  id: string;
  page_id: string;
  owner_id: string;
  shared_with_user_id: string;
  permission_level: PermissionLevel;
  shared_with_email?: string | null;
  created_at?: string | null;
}
