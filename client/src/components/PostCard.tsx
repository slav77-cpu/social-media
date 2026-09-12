import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Post, Visibility } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

interface Props {
  post: Post;
  onChange: (updated: Post) => void;
  onDelete: (id: string) => void;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "преди малко";
  if (diff < 3600) return `преди ${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `преди ${Math.floor(diff / 3600)} ч`;
  if (diff < 604800) return `преди ${Math.floor(diff / 86400)} дни`;
  return new Date(iso).toLocaleDateString("bg-BG");
}

function PostCard({ post, onChange, onDelete }: Props) {
  const { user } = useAuth();

  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.caption);
  const menuRef = useRef<HTMLDivElement>(null);

  const liked = user ? post.likedBy.includes(user.id) : false;
  const mine = user?.id === post.authorId;

  // zatvarya menyuto pri klik nyakude drugade po stranicata
  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  async function toggleLike() {
    setError("");
    try {
      onChange(await api.post<Post>(`/posts/${post.id}/like`));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      onChange(await api.post<Post>(`/posts/${post.id}/comments`, { text }));
      setText("");
    } catch (err) {
      // tuk pristiga i otkazut ot AI moderaciyata (status 422)
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    setError("");
    try {
      onChange(await api.patch<Post>(`/posts/${post.id}`, { caption: draft }));
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function changeVisibility(visibility: Visibility) {
    setMenuOpen(false);
    setError("");
    try {
      onChange(await api.patch<Post>(`/posts/${post.id}`, { visibility }));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function removeComment(index: number) {
    setError("");
    try {
      onChange(await api.delete<Post>(`/posts/${post.id}/comments/${index}`));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove() {
    setMenuOpen(false);
    if (!confirm("Да изтрия ли поста?")) return;
    try {
      await api.delete(`/posts/${post.id}`);
      onDelete(post.id);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <article className="card post">
      <header className="post-head">
        <Link to={`/u/${post.author.username}`}>
          <Avatar username={post.author.username} url={post.author.avatarUrl} />
        </Link>

        <div className="post-head-text">
          <Link to={`/u/${post.author.username}`} className="post-author">
            {post.author.username}
          </Link>
          <span className="muted">
            {timeAgo(post.createdAt)}
            {post.editedAt && " · редактиран"}
            {post.visibility === "FOLLOWERS" && " · 🔒 само за последователи"}
          </span>
        </div>

        {mine && (
          <div className="menu-wrap" ref={menuRef}>
            <button
              className="dots"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Опции"
            >
              ⋯
            </button>

            {menuOpen && (
              <div className="menu-pop">
                <button
                  onClick={() => {
                    setEditing(true);
                    setDraft(post.caption);
                    setMenuOpen(false);
                  }}
                >
                  Редактирай
                </button>
                {post.visibility === "PUBLIC" ? (
                  <button onClick={() => changeVisibility("FOLLOWERS")}>
                    Само за последователи
                  </button>
                ) : (
                  <button onClick={() => changeVisibility("PUBLIC")}>
                    Направи публичен
                  </button>
                )}
                <button className="danger" onClick={remove}>
                  Изтрий
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {editing ? (
        <div className="stack">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} />
          <div className="row">
            <button onClick={saveEdit} disabled={draft.trim().length < 2}>
              Запази
            </button>
            <button className="link" onClick={() => setEditing(false)}>
              Отказ
            </button>
          </div>
        </div>
      ) : (
        <p className="post-caption">{post.caption}</p>
      )}

      {post.imageUrl && <img src={post.imageUrl} alt="" className="post-img" />}

      <div className="row post-actions">
        <button className={`like ${liked ? "is-liked" : ""}`} onClick={toggleLike} disabled={!user}>
          {liked ? "♥" : "♡"} {post.likedBy.length}
        </button>
        <span className="muted">{post.comments.length} коментара</span>
      </div>

      {post.comments.length > 0 && (
        <ul className="comments">
          {post.comments.map((c, i) => (
            <li key={i}>
              <Link to={`/u/${c.authorName}`}>
                <Avatar username={c.authorName} size={26} />
              </Link>
              <span className="comment-body">
                <Link to={`/u/${c.authorName}`} className="comment-author">
                  {c.authorName}
                </Link>
                : {c.text}
              </span>

              {/* mahane: ot avtora na komentara ili ot sobstvenika na posta */}
              {user && (mine || user.id === c.authorId) && (
                <button
                  className="comment-del"
                  onClick={() => removeComment(i)}
                  title="Изтрий коментара"
                  aria-label="Изтрий коментара"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {user && (
        <form onSubmit={addComment} className="row comment-form">
          <Avatar username={user.username} url={user.avatarUrl} size={28} />
          <input
            placeholder="Коментар…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" disabled={busy || !text.trim()}>
            {busy ? "…" : "Прати"}
          </button>
        </form>
      )}

      {error && <p className="error">{error}</p>}
    </article>
  );
}

export default PostCard;
