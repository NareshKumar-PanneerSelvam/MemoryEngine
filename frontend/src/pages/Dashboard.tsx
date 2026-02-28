import { useAuth } from "../contexts/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Signed in as <span className="font-medium">{user?.email}</span> ({user?.role}).
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Next Phase 5 tasks will add pages CRUD and protected data features here.
        </p>
      </div>
    </div>
  );
}
