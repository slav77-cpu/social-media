import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Post } from "../lib/api";
import PostCard from "../components/PostCard";

/**
 * Stranica za EDIN post: /p/:id
 *
 * Sushtestvuva zaradi izvestiyata — kato cuknesh „X hareса publikaciyata ti",
 * trqbva da ima kude da otidesh. Preizpolzva PostCard, taka che layk,
 * komentar, redakciya i triene rabotyat tochno kakto vuv feed-a.
 */
function PostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    // Pri smyana na id-to nulirame — inache za mig se vijda stariyat post.
    setLoading(true);
    setError("");
    setPost(null);

    api
      .get<Post>(`/posts/${id}`)
      .then(setPost)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <div className="skeleton line" style={{ width: "40%" }} />
          <div className="skeleton block" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="page">
        <p className="muted">{error || "Постът не е намерен."}</p>
        <Link to="/" className="btn-link">
          ← Към началото
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <button className="btn-ghost btn-sm back-btn" onClick={() => navigate(-1)}>
        ← Назад
      </button>

      <PostCard
        post={post}
        onChange={setPost}
        onDelete={() => navigate("/")} // iztrit post — nyama kude da ostanem
      />
    </div>
  );
}

export default PostPage;
