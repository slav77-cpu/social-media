import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Post } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";

function Feed() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");   // lokalen URL, samo za pokazvane
  const [uploadedUrl, setUploadedUrl] = useState(""); // adresut sled kachvane
  const [posting, setPosting] = useState(false);
  const [thinking, setThinking] = useState(false);    // AI-yat opisva snimkata

  // "all" = vsichki postove, "following" = samo ot horata, koito sledvam
  const [tab, setTab] = useState<"all" | "following">("all");

  useEffect(() => {
    setLoading(true);
    setError("");
    const path = tab === "following" ? "/posts?following=true" : "/posts";
    api
      .get<Post[]>(path)
      .then(setPosts)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [tab]);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0] ?? null;
    setFile(chosen);
    setUploadedUrl(""); // nova snimka → starото kachvane ne vaji
    // URL.createObjectURL pravi vremenen lokalen adres kum faila,
    // za da vidi potrebitelyat snimkata predi izprashtane
    setPreview(chosen ? URL.createObjectURL(chosen) : "");
  }

  // kachva faila samo pri purva nujda i pomni adresa
  async function ensureUploaded(): Promise<string | null> {
    if (!file) return null;
    if (uploadedUrl) return uploadedUrl;
    const uploaded = await api.upload(file);
    setUploadedUrl(uploaded.url);
    return uploaded.url;
  }

  async function askAI() {
    setError("");
    setThinking(true);
    try {
      const imageUrl = await ensureUploaded();
      if (!imageUrl) return;

      const result = await api.post<{ caption: string; hashtags: string[] }>(
        "/ai/caption",
        { imageUrl }
      );
      const tags = result.hashtags.map((t) => `#${t}`).join(" ");
      setCaption([result.caption, tags].filter(Boolean).join("\n\n"));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setThinking(false);
    }
  }

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPosting(true);
    try {
      const imageUrl = await ensureUploaded();

      const created = await api.post<Post>("/posts", { caption, imageUrl });
      setPosts([created, ...posts]);   // nov post otgore, bez da durpame vsichko nanovo
      setCaption("");
      setFile(null);
      setPreview("");
      setUploadedUrl("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPosting(false);
    }
  }

  // podmenya edin post v spisuka (sled layk ili komentar)
  function replacePost(updated: Post) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function removePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="page">
      {user && (
        <form onSubmit={createPost} className="card stack">
          <textarea
            placeholder="Какво ново?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
          />
          <input type="file" accept="image/*" onChange={pickFile} />

          {preview && <img src={preview} alt="" className="post-img" />}

          {file && (
            <button type="button" className="link" onClick={askAI} disabled={thinking}>
              {thinking ? "AI гледа снимката…" : "✨ Предложи описание с AI"}
            </button>
          )}

          <button type="submit" disabled={posting || caption.trim().length < 2}>
            {posting ? "Публикува се…" : "Публикувай"}
          </button>
        </form>
      )}

      {user && (
        <div className="row">
          <button
            className={tab === "all" ? "" : "link"}
            onClick={() => setTab("all")}
          >
            Всички
          </button>
          <button
            className={tab === "following" ? "" : "link"}
            onClick={() => setTab("following")}
          >
            Следвани
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Зареждане…</p>
      ) : posts.length === 0 ? (
        <p>Още няма постове.</p>
      ) : (
        posts.map((p) => (
          <PostCard key={p.id} post={p} onChange={replacePost} onDelete={removePost} />
        ))
      )}
    </div>
  );
}

export default Feed;
