import { useEffect, useState } from "react";

/**
 * Custom hook: vrushta true, kogato potrebitelyat skrolva NADOLU.
 * Polzva se i ot gornata lenta, i ot dolniya bar — logikata e edna,
 * napisana na edno myasto.
 */
export function useHideOnScroll(threshold = 80) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    function onScroll() {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 8) return; // malkite dvijeniya — ignorirame
      setHidden(y > lastY && y > threshold);
      lastY = y;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return hidden;
}
