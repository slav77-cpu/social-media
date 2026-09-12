import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <Link to="/" className="brand">
        Гараж
      </Link>
      {user ? (
        <span className="row">
          <Link to={`/u/${user.username}`} className="muted">
            @{user.username}
          </Link>
          <button className="link" onClick={logout}>
            Изход
          </button>
        </span>
      ) : (
        <Link to="/login">Вход</Link>
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
          <Route path="/u/:username" element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
