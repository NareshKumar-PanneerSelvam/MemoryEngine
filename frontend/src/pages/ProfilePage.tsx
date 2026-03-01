import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";

import { parseApiError, useAuth } from "../contexts/AuthContext";

export default function ProfilePage() {
  const { user, isAuthenticated, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
    setUsername(user?.username ?? "");
  }, [user?.name, user?.username]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextName = name.trim();
    const nextUsername = username.trim().toLowerCase();

    if (!nextName) {
      setError("Name cannot be empty.");
      return;
    }

    if (!nextUsername) {
      setError("Username cannot be empty.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      await updateProfile({ name: nextName, username: nextUsername });
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950">
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h1 className="text-2xl font-semibold text-slate-100">Profile</h1>
          <p className="mt-1 text-sm text-slate-400">Update your account details.</p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block text-sm text-slate-300">
              Email
              <input
                value={user.email}
                disabled
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-400 outline-none"
              />
            </label>

            <label className="block text-sm text-slate-300">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
              />
            </label>

            <label className="block text-sm text-slate-300">
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
              />
            </label>

            <label className="block text-sm text-slate-300">
              Role
              <input
                value={user.role}
                disabled
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-400 outline-none"
              />
            </label>

            {error ? (
              <p className="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-md border border-emerald-900/60 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
