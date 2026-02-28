import { useEffect, useState, type FormEvent } from "react";
import { parseApiError, useAuth } from "../contexts/AuthContext";

function isValidUsername(username: string): boolean {
  return /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$/.test(username);
}

export default function DashboardPage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
    setUsername(user?.username ?? "");
  }, [user?.name, user?.username]);

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedName = name.trim();
    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedName) {
      setError("Name cannot be empty.");
      return;
    }
    if (!isValidUsername(normalizedUsername)) {
      setError(
        "Username must be 3-30 chars, lowercase letters/numbers/underscore, and cannot start/end with underscore.",
      );
      return;
    }

    try {
      setSaving(true);
      await updateProfile({ name: normalizedName, username: normalizedUsername });
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Dashboard
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Signed in as <span className="font-medium">{user?.email}</span> ({user?.role}).
        </p>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Next Phase 5 tasks will add pages CRUD and protected data features here.
        </p>

        <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Profile
          </h2>
          <form onSubmit={handleSaveProfile} className="mt-4 grid gap-4 md:max-w-lg">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Name
              </span>
              <input
                type="text"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-900/10 transition focus:border-slate-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500"
                placeholder="Your name"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Username
              </span>
              <input
                type="text"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-900/10 transition focus:border-slate-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500"
                placeholder="e.g. naresh_dev"
              />
            </label>

            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="w-fit rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
