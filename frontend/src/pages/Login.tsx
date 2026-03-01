import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { parseApiError, useAuth } from "../contexts/AuthContext";

type LocationState = {
  from?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      await login(email.trim().toLowerCase(), password);
      navigate(state?.from || "/pages", { replace: true });
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center px-4 py-8 sm:px-6">
      <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
        <div className="hidden bg-slate-900 p-8 text-slate-100 dark:bg-slate-950 md:block">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-4 text-slate-300">
            Sign in to continue editing pages, managing knowledge trees, and reviewing
            flashcards.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Login</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use your account credentials.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
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
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
              <input
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-900/10 transition focus:border-slate-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500"
                placeholder="Your password"
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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            New here?{" "}
            <Link to="/register" className="font-medium text-slate-900 underline dark:text-slate-100">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
