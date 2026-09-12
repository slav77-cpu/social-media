import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useHideOnScroll } from "./hooks/useHideOnScroll";
import { useUnreadCount } from "./hooks/useUnreadCount";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import PostPage from "./pages/PostPage";
import Avatar from "./components/Avatar";
import BottomNav from "./components/BottomNav";
import PulseIcon from "./components/PulseIcon";
import SearchBox from "./components/SearchBox";

function Header() {
  const { user, logout } = useAuth();
  const hidden = useHideOnScroll();
  const { pathname } = useLocation();
  const unread = useUnreadCount(!!user && pathname !== "/notifications");

  return (
    <header className={`topbar ${hidden ? "is-hidden" : ""}`}>
      <Link to="/" className="brand">
        <PulseIcon size={20} />
        Pulse
      </Link>

      {user && <SearchBox />}

      {user ? (
        <nav className="row">
          <Link to="/notifications" className="icon-btn bell" title="Известия">
            🔔
            {unread > 0 && <span className="badge">{unread > 9 ? "9+" : unread}</span>}
          </Link>
          <Link to={`/u/${user.username}`} className="row me-link">
            <Avatar username={user.username} url={user.avatarUrl} size={30} />
            <span>{user.username}</span>
          </Link>
          <Link to="/settings" className="icon-btn" title="Настройки" aria-label="Настройки">
            ⚙
          </Link>
          <button className="btn-ghost btn-sm" onClick={logout}>
            Изход
          </button>
        </nav>
      ) : (
        <Link to="/login" className="btn-link btn-primary-link">
          Вход
        </Link>
      )}
    </header>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/p/:id" element={<PostPage />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
