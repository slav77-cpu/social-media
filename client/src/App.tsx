import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useHideOnScroll } from "./hooks/useHideOnScroll";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Avatar from "./components/Avatar";
import BottomNav from "./components/BottomNav";
import PulseIcon from "./components/PulseIcon";

function Header() {
  const { user, logout } = useAuth();
  const hidden = useHideOnScroll();

  return (
    <header className={`topbar ${hidden ? "is-hidden" : ""}`}>
      <Link to="/" className="brand">
        <PulseIcon size={20} />
        Pulse
      </Link>

      {user ? (
        <nav className="row">
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
          <Route path="/u/:username" element={<Profile />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
