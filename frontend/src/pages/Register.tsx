import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { parseApiError, useAuth } from "../contexts/AuthContext";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password: string): boolean {
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return password.length >= 8 && hasLetter && hasNumber;
}

function isValidUsername(username: string): boolean {
  return /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$/.test(username);
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordHint = useMemo(
    () => "Minimum 8 characters with at least one letter and one number.",
    [],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedUsername = username.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!normalizedName) {
      setError("Please enter your name.");
      return;
    }
    if (!isValidUsername(normalizedUsername)) {
      setError(
        "Username must be 3-30 chars, lowercase letters/numbers/underscore, and cannot start/end with underscore.",
      );
      return;
    }
    if (!isStrongPassword(password)) {
      setError(passwordHint);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await register(normalizedEmail, normalizedName, normalizedUsername, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center px-4 py-8 sm:px-6">
      <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
        <div className="hidden bg-amber-100 p-8 text-slate-900 dark:bg-amber-200 md:block">
          <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>
          <p className="mt-4 text-slate-700">
            Start capturing notes, build structured page trees, and generate flashcards
            with AI assistance.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Register</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Set up your MemoryEngine account.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </span>
              <input
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-900/10 transition focus:border-slate-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Full name
              </span>
              <input
                name="name"
                type="text"
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
                name="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-900/10 transition focus:border-slate-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500"
                placeholder="e.g. naresh_dev"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </span>
              <input
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-900/10 transition focus:border-slate-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500"
                placeholder="Create a password"
              />
              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                {passwordHint}
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirm password
              </span>
              <input
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-900/10 transition focus:border-slate-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500"
                placeholder="Re-enter your password"
              />
            </label>

            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-slate-900 underline dark:text-slate-100">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
