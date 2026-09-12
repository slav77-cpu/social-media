import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { api, tokenStore } from "../lib/api";
import type { Author } from "../lib/api";

interface AuthResponse {
  token: string;
  user: Author;
}

interface AuthContextType {
  user: Author | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: Author) => void;   // sled redakciya na profila
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = "social_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  // pri refresh vzimame potrebitelya ot localStorage, za da ne miga ekranut
  const [user, setUser] = useState<Author | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as Author) : null;
  });

  function saveSession(data: AuthResponse) {
    tokenStore.set(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }

  async function login(username: string, password: string) {
    const data = await api.post<AuthResponse>("/auth/login", { username, password });
    saveSession(data);
  }

  async function register(username: string, password: string) {
    const data = await api.post<AuthResponse>("/auth/register", { username, password });
    saveSession(data);
  }

  function logout() {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  // polzva se ot stranicata "Nastroyki": obnovyava i ekrana, i localStorage
  function updateUser(next: Author) {
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    setUser(next);
  }

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, setUser: updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth се ползва само вътре в <AuthProvider>");
  return ctx;
}
