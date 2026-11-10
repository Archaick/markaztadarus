import { useEffect } from "react";

// Full-screen layers (the practice player, the admin's walk through a surah) stop the page
// behind them from scrolling. They can open inside each other, so they share one count: the
// page is locked while any is open and given back, as it was, when the last one closes.
let open = 0;
let before = ["", ""];

export function useScrollLock() {
  useEffect(() => {
    const { documentElement: html, body } = document;
    if (open === 0) {
      before = [html.style.overflow, body.style.overflow];
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
    }
    open += 1;
    return () => {
      open -= 1;
      if (open === 0) [html.style.overflow, body.style.overflow] = before;
    };
  }, []);
}
