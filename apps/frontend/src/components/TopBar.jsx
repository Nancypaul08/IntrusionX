import { useAuth } from "../contexts/AuthContext";

export function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-cyber-line bg-cyber-panel/40 px-6 py-4 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-cyber-blue">AI Compliance Command</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Live monitoring and enforcement</h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-cyber-line bg-slate-950/50 px-4 py-2 text-sm text-slate-300">
          {user?.name} · {user?.role}
        </div>
        <button
          onClick={logout}
          className="rounded-2xl border border-cyber-red/50 px-4 py-2 text-sm text-cyber-red hover:bg-cyber-red/10"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
