// Edno myasto za VSICHKI zayavki kum API-to.
// Taka tokenut, headerite i obrabotkata na greshki sa napisani vednuj.

const TOKEN_KEY = "social_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY) || "",
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();

  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // hvurlyame greshka s suobshtenieto ot survura,
    // za da q hvane .catch() v komponenta
    throw new Error((data as any).error || `Грешка ${res.status}`);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  // Kachvane na fail: tyaloto e FormData, NE JSON.
  // Zatova ne minavame prez request() — tam Content-Type e zakovan.
  async upload(file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append("image", file);

    const token = tokenStore.get();
    const res = await fetch("/api/upload", {
      method: "POST",
      // vnimanie: TUK NE slagame Content-Type —
      // brauzurut go slaga sam, zaedno s boundary-to na formata
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as any).error || "Качването се провали");
    return data as { url: string };
  },
};

// --- tipove, ogledalo na tova, koeto survurut vrushta ---

export interface Author {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

export type Visibility = "PUBLIC" | "FOLLOWERS";

export interface Comment {
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  caption: string;
  imageUrl: string | null;
  authorId: string;
  author: Author;
  comments: Comment[];
  likedBy: string[];
  visibility: Visibility;
  editedAt: string | null;
  createdAt: string;
}
