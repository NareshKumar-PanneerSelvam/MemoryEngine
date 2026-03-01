import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { IconLayoutDashboard, IconLogout, IconUsers } from "./ui/icons";

function getInitial(name: string | null | undefined, fallback: string): string {
  const source = (name ?? fallback).trim();
  return source.length > 0 ? source[0].toUpperCase() : "U";
}

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userName = user?.name || user?.username || "User";

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <Link to="/" className="text-lg font-semibold tracking-tight text-slate-100">
          MemoryEngine
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {isAuthenticated ? (
            <>
              <Link
                to="/pages"
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-slate-200 transition hover:bg-slate-900"
              >
                <IconLayoutDashboard className="h-4 w-4" />
                Pages
              </Link>
              {user?.role === "admin" ? (
                <Link
                  to="/users"
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-slate-200 transition hover:bg-slate-900"
                >
                  <IconUsers className="h-4 w-4" />
                  Users
                </Link>
              ) : null}

              <div className="hidden items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 sm:inline-flex">
                <span className="text-sm">{userName}</span>
                <Link
                  to="/profile"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-100 hover:bg-slate-600"
                  title="Profile"
                  aria-label="Open profile"
                >
                  {getInitial(user?.name || user?.username, user?.email ?? "User")}
                </Link>
              </div>

              <Link
                to="/profile"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-100 hover:bg-slate-600 sm:hidden"
                title="Profile"
                aria-label="Open profile"
              >
                {getInitial(user?.name || user?.username, user?.email ?? "User")}
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 font-medium text-slate-900 transition hover:bg-white"
              >
                <IconLogout className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-md px-3 py-2 text-slate-200 transition hover:bg-slate-900"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-slate-100 px-3 py-2 font-medium text-slate-900 transition hover:bg-white"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
