import { useState } from "react";

/**
 * A country's flag as a small picture (flag emoji do not show on Windows),
 * falling back to its two-letter code if the picture cannot load.
 */
export default function Flag({ code, size = 22, className = "" }) {
  const [failed, setFailed] = useState(false);
  const c = (code || "").toLowerCase();
  const box = { width: Math.round(size * 1.4), height: size, borderRadius: Math.max(2, size / 7), objectFit: "cover", flexShrink: 0, boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" };
  if (failed || !c) {
    return (
      <span className={className} style={{ ...box, display: "inline-grid", placeItems: "center", fontSize: size * 0.45, fontWeight: 800, background: "rgba(127,127,127,0.25)" }}>
        {c.toUpperCase()}
      </span>
    );
  }
  return <img src={`https://flagcdn.com/${c}.svg`} alt="" loading="lazy" className={className} style={box} onError={() => setFailed(true)} />;
}
