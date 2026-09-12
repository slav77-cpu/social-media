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
  const [imageUrl, setImageUrl] = useState("");
  const [posting, setPosting] = useState(false);

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

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPosting(true);
    try {
      const created = await api.post<Post>("/posts", {
        caption,
        imageUrl: imageUrl.trim() || null,
      });
      setPosts([created, ...posts]);   // nov post otgore, bez da durpame vsichko nanovo
      setCaption("");
      setImageUrl("");
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
          <input
            placeholder="Линк към снимка (по избор)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
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
