import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Post } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface Props {
  post: Post;
  onChange: (updated: Post) => void;   // roditelyat podmenya posta v spisuka
  onDelete: (id: string) => void;
}

function PostCard({ post, onChange, onDelete }: Props) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const liked = user ? post.likedBy.includes(user.id) : false;
  const mine = user?.id === post.authorId;

  async function toggleLike() {
    setError("");
    try {
      const updated = await api.post<Post>(`/posts/${post.id}/like`);
      onChange(updated);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const updated = await api.post<Post>(`/posts/${post.id}/comments`, { text });
      onChange(updated);
      setText("");
    } catch (err) {
      // tuk pristiga i otkazut ot AI moderaciyata (status 422)
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Да изтрия ли поста?")) return;
    try {
      await api.delete(`/posts/${post.id}`);
      onDelete(post.id);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <article className="card">
      <header className="row">
        <Link to={`/u/${post.author.username}`}>
          <strong>{post.author.username}</strong>
        </Link>
        <span className="muted">
          {new Date(post.createdAt).toLocaleString("bg-BG")}
        </span>
        {mine && (
          <button className="link danger" onClick={remove}>
            Изтрий
          </button>
        )}
      </header>

      <p>{post.caption}</p>
      {post.imageUrl && <img src={post.imageUrl} alt="" className="post-img" />}

      <div className="row">
        <button onClick={toggleLike} disabled={!user}>
          {liked ? "♥" : "♡"} {post.likedBy.length}
        </button>
        <span className="muted">{post.comments.length} коментара</span>
      </div>

      {post.comments.length > 0 && (
        <ul className="comments">
          {post.comments.map((c, i) => (
            <li key={i}>
              <strong>{c.authorName}:</strong> {c.text}
            </li>
          ))}
        </ul>
      )}

      {user && (
        <form onSubmit={addComment} className="row">
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
