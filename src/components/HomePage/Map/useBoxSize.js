import { useCallback, useEffect, useRef, useState } from "react";

// Size of an element, measured as soon as it mounts and again on resize.
// (Measured directly rather than waiting for a frame, so the map draws at once.)
export function useBoxSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const observer = useRef(null);
  const ref = useCallback((node) => {
    observer.current?.disconnect();
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      const next = { width: Math.round(rect.width), height: Math.round(rect.height) };
      setSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next));
    };
    measure();
    observer.current = new ResizeObserver(measure);
    observer.current.observe(node);
  }, []);
  useEffect(() => () => observer.current?.disconnect(), []);
  return { ref, ...size };
}
