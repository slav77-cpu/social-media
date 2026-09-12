import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // edna stranica, dva rejima — prevklyuchva se s butona dolu
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // bez tova brauzurut prezarejda stranicata
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false); // i pri uspeh, i pri greshka butonut se otpushta
    }
  }

  return (
    <div className="page narrow auth-page">
      <div className="auth-logo">Pulse</div>
      <p className="muted center" style={{ marginBottom: 22 }}>
        {mode === "login"
          ? "Влез, за да видиш какво ново."
          : "Създай профил за минута."}
      </p>

      <form onSubmit={handleSubmit} className="card stack">
        <label className="field-label">
          Потребителско име
          <input
            placeholder="ivan"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </label>

        <label className="field-label">
          Парола
          <input
            type="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button type="submit" disabled={busy || !username || !password}>
          {busy ? "Моля, изчакай…" : mode === "login" ? "Влез" : "Създай профил"}
        </button>

        {error && <p className="error">{error}</p>}
      </form>

      <p className="center muted switch-mode">
        {mode === "login" ? "Нямаш акаунт?" : "Вече имаш акаунт?"}{" "}
        <button
          className="link"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login" ? "Регистрирай се" : "Влез"}
        </button>
      </p>
    </div>
  );
}

export default Login;
