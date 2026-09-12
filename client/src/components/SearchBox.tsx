import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { UserSummary } from "../lib/api";
import Avatar from "./Avatar";

function SearchBox() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserSummary[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // DEBOUNCE: chakame 300ms sled posledniya natisnat klavish,
  // za da ne prashtame zayavka na vsyaka bukva.
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      api
        .get<UserSummary[]>(`/users/search?q=${encodeURIComponent(q.trim())}`)
        .then((users) => {
          setResults(users);
          setOpen(true);
        })
        .catch(() => setResults([]));
    }, 300);

    // pri nov natisnat klavish starata "porachka" se otmenya
    return () => clearTimeout(timer);
  }, [q]);

  // zatvaryane pri klik navun
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="search" ref={boxRef}>
      <input
        placeholder="Търси хора…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
      />

      {open && results.length > 0 && (
        <div className="search-pop">
          {results.map((u) => (
            <Link
              key={u.id}
              to={`/u/${u.username}`}
              className="search-item"
              onClick={() => {
                setOpen(false);
                setQ("");
              }}
            >
              <Avatar username={u.username} url={u.avatarUrl} size={32} />
              <span className="search-item-text">
                <strong>{u.username}</strong>
                {u.bio && <span className="muted">{u.bio}</span>}
              </span>
            </Link>
          ))}
        </div>
      )}

      {open && q.trim().length >= 2 && results.length === 0 && (
        <div className="search-pop">
          <p className="muted center">Няма намерени потребители.</p>
        </div>
      )}
    </div>
  );
}

export default SearchBox;
