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
    <div className="page narrow">
      <h1>{mode === "login" ? "Вход" : "Регистрация"}</h1>

      <form onSubmit={handleSubmit} className="stack">
        <input
          placeholder="Потребителско име"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Парола"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={busy || !username || !password}>
          {busy ? "Моля, изчакай…" : mode === "login" ? "Влез" : "Регистрирай се"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <button
        className="link"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError("");
        }}
      >
        {mode === "login" ? "Нямаш акаунт? Регистрирай се" : "Имаш акаунт? Влез"}
      </button>
    </div>
  );
}

export default Login;
