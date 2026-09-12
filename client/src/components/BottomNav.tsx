import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHideOnScroll } from "../hooks/useHideOnScroll";
import Avatar from "./Avatar";
import PulseIcon from "./PulseIcon";

/**
 * Dolen navigacionen bar — vidim samo na telefon (viж CSS media query).
 * Krie se pri skrol nadolu i se poyavyava pri skrol nagore.
 */
function BottomNav() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const hidden = useHideOnScroll();

  if (!user) return null;

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className={`bottom-nav ${hidden ? "is-hidden" : ""}`}>
      <Link to="/" className={isActive("/") ? "active" : ""}>
        <PulseIcon />
        <span className="bn-label">Pulse</span>
      </Link>

      <Link
        to={`/u/${user.username}`}
        className={isActive(`/u/${user.username}`) ? "active" : ""}
      >
        <Avatar username={user.username} url={user.avatarUrl} size={22} />
        <span className="bn-label">Профил</span>
      </Link>

      <Link to="/settings" className={isActive("/settings") ? "active" : ""}>
        <span className="bn-icon">⚙</span>
        <span className="bn-label">Настройки</span>
      </Link>

      <button className="bn-btn" onClick={handleLogout}>
        <span className="bn-icon">⎋</span>
        <span className="bn-label">Изход</span>
      </button>
    </nav>
  );
}

export default BottomNav;
