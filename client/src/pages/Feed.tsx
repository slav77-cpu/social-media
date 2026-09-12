import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "../lib/api";
import type { Post, Visibility } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import Avatar from "../components/Avatar";

const PAGE = 10; // kolko posta se durpat na edna partida

function Feed() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");

  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [posting, setPosting] = useState(false);
  const [thinking, setThinking] = useState(false);

  const [tab, setTab] = useState<"all" | "following">("all");

  // elementut-"strazh" nay-dolu: kogato vleze v ekrana, teglim oshte
  const sentinel = useRef<HTMLDivElement>(null);

  const path = tab === "following" ? "/posts?following=true" : "/posts";

  // purva partida (i pri smyana na tab)
  useEffect(() => {
    setLoading(true);
    setError("");
    setHasMore(true);
    api
      .get<Post[]>(`${path}${path.includes("?") ? "&" : "?"}take=${PAGE}&skip=0`)
      .then((data) => {
        setPosts(data);
        setHasMore(data.length === PAGE);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [tab]);

  // sledvashtite partidi
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const more = await api.get<Post[]>(
        `${path}${path.includes("?") ? "&" : "?"}take=${PAGE}&skip=${posts.length}`
      );
      setPosts((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, path, posts.length]);

  // IntersectionObserver: brauzurut ni kazva kogato "strazhut" se pokaje
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "300px" } // zapochvame da teglim malko predi da e stignal
    );

    observer.observe(el);
    return () => observer.disconnect(); // pochistvane, kato komponentut izchezne
  }, [loadMore]);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0] ?? null;
    setFile(chosen);
    setUploadedUrl("");
    setPreview(chosen ? URL.createObjectURL(chosen) : "");
  }

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
      const created = await api.post<Post>("/posts", { caption, imageUrl, visibility });
      setPosts([created, ...posts]);
      setCaption("");
      setFile(null);
      setPreview("");
      setUploadedUrl("");
      setVisibility("PUBLIC");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPosting(false);
    }
  }

  function replacePost(updated: Post) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function removePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="page">
      {user && (
        <form onSubmit={createPost} className="card stack composer">
          <div className="row">
            <Avatar username={user.username} url={user.avatarUrl} size={38} />
            <textarea
              placeholder={`Какво ново, ${user.username}?`}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>

          {preview && <img src={preview} alt="" className="post-img" />}

          <div className="row composer-actions">
            <label className="file-label">
              📷 Снимка
              <input type="file" accept="image/*" onChange={pickFile} hidden />
            </label>

            {file && (
              <button type="button" className="btn-link" onClick={askAI} disabled={thinking}>
                {thinking ? "AI гледа…" : "✨ AI описание"}
              </button>
            )}

            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              className="select"
            >
              <option value="PUBLIC">🌍 Публично</option>
              <option value="FOLLOWERS">🔒 Само последователи</option>
            </select>

            <button
              type="submit"
              disabled={posting || caption.trim().length < 2}
              style={{ marginLeft: "auto" }}
            >
              {posting ? "Публикува се…" : "Публикувай"}
            </button>
          </div>
        </form>
      )}

      {user && (
        <div className="row tabs">
          <button className={tab === "all" ? "" : "btn-ghost"} onClick={() => setTab("all")}>
            Всички
          </button>
          <button
            className={tab === "following" ? "" : "btn-ghost"}
            onClick={() => setTab("following")}
          >
            Следвани
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {loading ? (
        <>
          <div className="card">
            <div className="skeleton line" style={{ width: "40%" }} />
            <div className="skeleton block" />
          </div>
          <div className="card">
            <div className="skeleton line" style={{ width: "55%" }} />
            <div className="skeleton block" />
          </div>
        </>
      ) : posts.length === 0 ? (
        <p className="muted">
          {tab === "following"
            ? "Никой от хората, които следваш, още не е публикувал."
            : "Още няма публикации."}
        </p>
      ) : (
        posts.map((p) => (
          <PostCard key={p.id} post={p} onChange={replacePost} onDelete={removePost} />
        ))
      )}

      {/* strazhut: nevidim element, koyto zadeystva dozarejdaneto */}
      <div ref={sentinel} />

      {loadingMore && <p className="muted center">Зарежда още…</p>}
      {!hasMore && posts.length > 0 && (
        <p className="muted center">Това е всичко засега 🎉</p>
      )}
    </div>
  );
}

export default Feed;
