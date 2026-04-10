import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@intrusionx.io");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[2rem] border border-cyber-line bg-cyber-panel/80 p-8 shadow-neon">
        <p className="text-xs uppercase tracking-[0.35em] text-cyber-neon">Secure Access</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">IntrusionX</h1>
        <p className="mt-3 text-sm text-slate-400">Login to the privacy operations console.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-cyber-line bg-slate-950/60 px-4 py-3 outline-none focus:border-cyber-blue"
            placeholder="Email"
          />
          <input
            value={password}
            type="password"
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-cyber-line bg-slate-950/60 px-4 py-3 outline-none focus:border-cyber-blue"
            placeholder="Password"
          />
          {error ? <p className="text-sm text-cyber-red">{error}</p> : null}
          <button className="w-full rounded-2xl bg-cyber-neon px-4 py-3 font-semibold text-slate-950">
            Enter Console
          </button>
        </form>
      </div>
    </div>
  );
}
