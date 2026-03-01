import { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";

import { IconPlus, IconTrash } from "../components/ui/icons";
import { useAuth } from "../contexts/AuthContext";
import { authApi, type AdminUser, type UserRole } from "../services/api";

function parseApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data as { detail?: string } | undefined;
    if (typeof detail?.detail === "string") {
      return detail.detail;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Request failed";
}

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authApi.listUsers();
      setUsers(result);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    void loadUsers();
  }, [isAdmin, loadUsers]);

  const userCountLabel = useMemo(() => `${users.length} users`, [users.length]);

  if (!isAdmin) {
    return <Navigate to="/pages" replace />;
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setName("");
    setEmail("");
    setUsername("");
    setPassword("");
    setRole("user");
    setCreateError(null);
    setIsCreating(false);
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsCreating(true);
    setCreateError(null);
    setDeleteError(null);

    try {
      await authApi.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        password,
        role,
      });

      await loadUsers();
      closeCreateModal();
    } catch (err) {
      setCreateError(parseApiError(err));
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (target: AdminUser) => {
    setDeletingUserId(target.id);
    setDeleteError(null);
    setCreateError(null);

    try {
      await authApi.deleteUser(target.id);
      await loadUsers();
    } catch (err) {
      setDeleteError(parseApiError(err));
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950">
      <div className="mx-auto max-w-[1200px] p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">User Management</h1>
            <p className="text-sm text-slate-400">Create and delete users from this workspace.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300">
              {userCountLabel}
            </span>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-white"
            >
              <IconPlus className="h-4 w-4" />
              Create User
            </button>
          </div>
        </div>

        {error ? (
          <p className="mb-3 rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {deleteError ? (
          <p className="mb-3 rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
            {deleteError}
          </p>
        ) : null}

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          {isLoading ? (
            <p className="p-4 text-sm text-slate-400">Loading users...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((item) => (
                    <tr key={item.id} className="text-slate-200">
                      <td className="px-4 py-3">{item.name || "-"}</td>
                      <td className="px-4 py-3">{item.email}</td>
                      <td className="px-4 py-3">{item.username || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded border border-slate-700 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-300">
                          {item.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void handleDeleteUser(item)}
                          disabled={deletingUserId === item.id || item.id === user?.id}
                          className="inline-flex items-center gap-1 rounded-md border border-red-900/60 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                          {deletingUserId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Create user</h3>

            <form className="mt-4 space-y-3" onSubmit={handleCreateUser}>
              <label className="block text-sm text-slate-300">
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
                  required
                />
              </label>

              <label className="block text-sm text-slate-300">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
                  required
                />
              </label>

              <label className="block text-sm text-slate-300">
                Username
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
                  required
                />
              </label>

              <label className="block text-sm text-slate-300">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
                  required
                />
              </label>

              <label className="block text-sm text-slate-300">
                Role
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              {createError ? (
                <p className="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                  {createError}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <IconPlus className="h-4 w-4" />
                  {isCreating ? "Creating..." : "Create user"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
