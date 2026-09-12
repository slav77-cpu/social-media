import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Post } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import Avatar from "../components/Avatar";

interface ProfileUser {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  followersCount: number;
  followingCount: number;
}

interface ProfileResponse {
  user: ProfileUser;
  posts: Post[];
}

interface Me {
  id: string;
  following: string[];
}

function Profile() {
  const { username } = useParams();
  const { user: me } = useAuth();

  const [data, setData] = useState<ProfileResponse | null>(null);
  const [following, setFollowing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get<ProfileResponse>(`/users/${username}`)
      .then(async (profile) => {
        setData(profile);
        if (me) {
          const mine = await api.get<Me>("/users/me");
          setFollowing(mine.following.includes(profile.user.id));
        }
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [username, me]);

  async function toggleFollow() {
    if (!data) return;
    setError("");
    try {
      const result = await api.post<{ following: boolean }>(
        `/users/${data.user.id}/follow`
      );
      setFollowing(result.following);
      setData({
        ...data,
        user: {
          ...data.user,
          followersCount: data.user.followersCount + (result.following ? 1 : -1),
        },
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function replacePost(updated: Post) {
    if (!data) return;
    setData({
      ...data,
      posts: data.posts.map((p) => (p.id === updated.id ? updated : p)),
    });
  }

  function removePost(id: string) {
    if (!data) return;
    setData({ ...data, posts: data.posts.filter((p) => p.id !== id) });
  }

  if (loading) {
    // skeleton — sivi pravоъгълnici na myastoto na sudurjanieto,
    // za da ne "skacha" stranicata, kogato dannite pristignat
    return (
      <div className="page">
        <div className="card skeleton-card">
          <div className="skeleton circle" />
          <div className="stack" style={{ flex: 1 }}>
            <div className="skeleton line" style={{ width: "45%" }} />
            <div className="skeleton line" style={{ width: "70%" }} />
          </div>
        </div>
        <div className="card">
          <div className="skeleton line" style={{ width: "60%" }} />
          <div className="skeleton block" />
        </div>
      </div>
    );
  }

  if (error) return <div className="page"><p className="error">{error}</p></div>;
  if (!data) return null;

  const isMe = me?.id === data.user.id;
  const joined = new Date(data.user.createdAt).toLocaleDateString("bg-BG", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="page">
      <section className="card profile-head">
        <Avatar username={data.user.username} url={data.user.avatarUrl} size={84} />

        <div className="profile-info">
          <h1>{data.user.username}</h1>
          {data.user.bio && <p className="profile-bio">{data.user.bio}</p>}

          <div className="row stats">
            <span>
              <strong>{data.posts.length}</strong> <span className="muted">публикации</span>
            </span>
            <span>
              <strong>{data.user.followersCount}</strong>{" "}
              <span className="muted">последователи</span>
            </span>
            <span>
              <strong>{data.user.followingCount}</strong> <span className="muted">следва</span>
            </span>
          </div>

          <span className="muted">В Pulse от {joined}</span>

          <div className="row" style={{ marginTop: 12 }}>
            {isMe ? (
              <Link to="/settings" className="btn-link">
                Редактирай профила
              </Link>
            ) : (
              me && (
                <button onClick={toggleFollow} className={following ? "btn-ghost" : ""}>
                  {following ? "Следваш" : "Следвай"}
                </button>
              )
            )}
          </div>
        </div>
      </section>

      <h2 className="wall-title">Стена</h2>

      {data.posts.length === 0 ? (
        <p className="muted">
          {isMe ? "Още нямаш публикации. Напиши първата си!" : "Още няма публикации."}
        </p>
      ) : (
        data.posts.map((p) => (
          <PostCard key={p.id} post={p} onChange={replacePost} onDelete={removePost} />
        ))
      )}
    </div>
  );
}

export default Profile;
