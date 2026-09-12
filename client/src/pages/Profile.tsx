import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { Post } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";

interface ProfileUser {
  id: string;
  username: string;
  bio: string | null;
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
    api
      .get<ProfileResponse>(`/users/${username}`)
      .then(async (profile) => {
        setData(profile);
        // sledvam li go veche? pitame "/users/me" samo ako sme lognati
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
      // broyachut se promenya vednaga na ekrana (optimistichno)
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

  if (loading) return <div className="page"><p>Зареждане…</p></div>;
  if (error) return <div className="page"><p className="error">{error}</p></div>;
  if (!data) return null;

  const isMe = me?.id === data.user.id;

  return (
    <div className="page">
      <div className="card">
        <h1>@{data.user.username}</h1>
        {data.user.bio && <p>{data.user.bio}</p>}
        <p className="muted">
          {data.user.followersCount} последователи · {data.user.followingCount} следва ·{" "}
          {data.posts.length} поста
        </p>

        {me && !isMe && (
          <button onClick={toggleFollow} style={{ marginTop: 10 }}>
            {following ? "Спри да следваш" : "Следвай"}
          </button>
        )}
      </div>

      {data.posts.length === 0 ? (
        <p>Още няма постове.</p>
      ) : (
        data.posts.map((p) => (
          <PostCard key={p.id} post={p} onChange={replacePost} onDelete={removePost} />
        ))
      )}
    </div>
  );
}

export default Profile;
