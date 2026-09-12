import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Author } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";

interface Me extends Author {
  bio: string | null;
}

function Settings() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [preview, setPreview] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  // teglim aktualnite danni — localStorage moje da e ostaryal
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    api.get<Me>("/users/me").then((me) => {
      setUsername(me.username);
      setBio(me.bio ?? "");
      setAvatarUrl(me.avatarUrl ?? null);
    });
  }, [user, navigate]);

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setPreview(URL.createObjectURL(file));
    try {
      const uploaded = await api.upload(file);
      setAvatarUrl(uploaded.url);
    } catch (err) {
      setError((err as Error).message);
      setPreview("");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    setSaving(true);
    try {
      const updated = await api.patch<Me>("/users/me", { username, bio, avatarUrl });
      setUser({
        id: updated.id,
        username: updated.username,
        avatarUrl: updated.avatarUrl,
      });
      setOk("Готово, профилът е обновен.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="page narrow">
      <h1>Настройки</h1>

      <form onSubmit={save} className="card stack">
        <div className="row">
          <Avatar username={username || user.username} url={preview || avatarUrl} size={72} />
          <label className="file-label">
            Смени снимка
            <input type="file" accept="image/*" onChange={pickAvatar} hidden />
          </label>
          {avatarUrl && (
            <button
              type="button"
              className="link danger"
              onClick={() => {
                setAvatarUrl(null);
                setPreview("");
              }}
            >
              Премахни
            </button>
          )}
        </div>

        <label className="field-label">
          Потребителско име
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>

        <label className="field-label">
          За мен
          <textarea
            rows={3}
            maxLength={300}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Няколко думи за теб и колите ти…"
          />
          <span className="muted">{bio.length}/300</span>
        </label>

        <button type="submit" disabled={saving || username.trim().length < 3}>
          {saving ? "Запазва се…" : "Запази промените"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {ok && <p className="ok">{ok}</p>}
    </div>
  );
}

export default Settings;
