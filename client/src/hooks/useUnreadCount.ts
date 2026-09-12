import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { AppNotification } from "../lib/api";

/**
 * Broy neprocheteni izvestiya.
 * Proverqva na vseki 30 sekundi (polling) — prosto i dostatuchno.
 * Za real-time bi trqbvalo WebSocket, no tova e tema za drug den.
 */
export function useUnreadCount(enabled: boolean) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;

    async function load() {
      try {
        const data = await api.get<{ items: AppNotification[]; unread: number }>(
          "/notifications"
        );
        if (!stopped) setUnread(data.unread);
      } catch {
        // tiho — broyachut ne e kritichen
      }
    }

    load();
    const timer = setInterval(load, 30000);

    return () => {
      stopped = true;       // spira zakusnyal otgovor da pipa state
      clearInterval(timer);
    };
  }, [enabled]);

  return unread;
}
