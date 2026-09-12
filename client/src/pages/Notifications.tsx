import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { AppNotification } from "../lib/api";
import Avatar from "../components/Avatar";

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "преди малко";
  if (diff < 3600) return `преди ${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `преди ${Math.floor(diff / 3600)} ч`;
  return new Date(iso).toLocaleDateString("bg-BG");
}

/**
 * Kude vodi izvestieto pri klik:
 *  - FOLLOW        → profila na choveka
 *  - LIKE/COMMENT  → samiyat post
 * Ako postut e iztrit (nyama postId), ostavame na profila — po-dobre
 * otkolkoto link kum nishtoto.
 */
function linkFor(n: AppNotification) {
  if (n.type !== "FOLLOW" && n.postId) return `/p/${n.postId}`;
  return `/u/${n.actorName}`;
}

function textFor(n: AppNotification) {
  switch (n.type) {
    case "LIKE":
      return "хареса публикацията ти";
    case "COMMENT":
      return `коментира: „${n.excerpt ?? ""}“`;
    case "FOLLOW":
      return "започна да те следва";
  }
}

function Notifications() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ items: AppNotification[]; unread: number }>("/notifications")
      .then((data) => setItems(data.items))
      .finally(() => setLoading(false));

    // otvarqneto na stranicata gi markira kato procheteni
    api.post("/notifications/read").catch(() => {});
  }, []);

  return (
    <div className="page">
      <h1>Известия</h1>

      {loading ? (
        <div className="card">
          <div className="skeleton line" style={{ width: "70%" }} />
          <div className="skeleton line" style={{ width: "50%", marginTop: 10 }} />
        </div>
      ) : items.length === 0 ? (
        <p className="muted">Още няма известия.</p>
      ) : (
        <ul className="notif-list">
          {items.map((n) => (
            <li key={n.id} className={`notif-item ${n.read ? "" : "is-new"}`}>
              {/* celiyat red e edin link — ne vlagame <a> v <a>,
                  zatova imeto tuk e obiknoven tekst, a ne otdelen Link */}
              <Link to={linkFor(n)} className="card notif">
                <Avatar username={n.actorName} url={n.actorAvatar} size={38} />
                <div className="notif-body">
                  <span>
                    <strong className="comment-author">{n.actorName}</strong>{" "}
                    {textFor(n)}
                  </span>
                  <span className="muted">{timeAgo(n.createdAt)}</span>
                </div>
                <span className="notif-chevron" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Notifications;
