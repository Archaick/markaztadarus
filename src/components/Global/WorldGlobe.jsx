import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from "react";
import { geoCircle, geoContains, geoDistance, geoGraticule10, geoOrthographic, geoPath, geoRotation } from "d3-geo";
import HolyPlaces from "../Common/HolyPlaces";
import { ALL_PROVINCES } from "../HomePage/Map/mapGeometry";
import { COUNTRIES, anchorOf, countryByCode, moonNow, subsolarPoint } from "./globalData";
import styles from "./WorldGlobe.module.css";

const GRATICULE = geoGraticule10();
const SPHERE = { type: "Sphere" };
const DEG = 180 / Math.PI;
const MIN_ZOOM = 0.85;
const MAX_ZOOM = 9;
const SPIN_DEG_PER_S = 5;
const IDLE_MS = 5000;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// the shorter way round from a to b, in degrees
const wrapDelta = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;

/**
 * A globe you can spin, zoom and tap: drag to turn it (with a little
 * momentum), scroll or pinch to zoom, tap a country to pick it and fly there.
 * Countries with Tadarus programs glow gold and get a line of light from
 * Makkah; the night side of the Earth is shaded where it is night right now.
 *
 * `programs` is { [code]: { cities: [{ name, lon, lat }] } }; `selected` the
 * picked country's code; `onSelect(code | null)`; `onPoint([lon, lat], code)`
 * is called on every tap with where on Earth it landed (the dashboard uses it
 * to place cities). `provinces` are Indonesia's program provinces, drawn when
 * the globe is close to Indonesia. The parent can call `ref.current.home()`,
 * `.zoomBy(factor)` and `.flyTo(code)`.
 */
const WorldGlobe = forwardRef(function WorldGlobe(
  { programs = {}, selected = null, onSelect, onPoint, provinces = {}, labels, highlightCity, className = "", autoSpin = true, initialView, sky = true },
  ref
) {
  const boxRef = useRef(null);
  const [size, setSize] = useState({ w: 600, h: 600 });
  // on a tall, narrow phone screen a little smaller, so the Sun and Moon have room beside it
  const base = size.h > size.w * 1.15 ? Math.min(size.w * 0.34, size.h * 0.42) : Math.min(size.w, size.h) * 0.42;

  // the view lives in a ref (it changes every frame); `tick` re-renders
  // where it opens: given, or over the Indian Ocean (Makkah to Indonesia)
  const view = useRef(initialView ? { zoom: 1, ...initialView } : { lambda: -100, phi: -5, zoom: 1 });
  const [, setTick] = useState(0);
  const redraw = useCallback(() => setTick((n) => (n + 1) % 1e9), []);

  const motion = useRef({ flight: null, vx: 0, vy: 0, lastInput: 0, dragging: false });
  const [hover, setHover] = useState(null);
  const [sun, setSun] = useState(() => subsolarPoint());
  const [moon, setMoon] = useState(() => moonNow());

  // keep the drawing the size of its box
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // day and night move on: once a minute
  useEffect(() => {
    const id = setInterval(() => {
      setSun(subsolarPoint());
      setMoon(moonNow());
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const reduceMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);

  const flyTo = useCallback(
    (target, ms = 1300) => {
      const from = { ...view.current };
      const to = { lambda: from.lambda + wrapDelta(from.lambda, target.lambda), phi: target.phi, zoom: target.zoom };
      motion.current.flight = { from, to, start: performance.now(), ms: reduceMotion ? 1 : ms };
      motion.current.vx = 0;
      motion.current.vy = 0;
      motion.current.lastInput = performance.now();
    },
    [reduceMotion]
  );

  const viewFor = useCallback(
    (code) => {
      const c = countryByCode.get(code);
      if (!c) return null;
      // zoom so the country fills about two thirds of the globe's disc
      const zoom = clamp(0.5 / Math.sin(Math.min(Math.max(c.radius, 0.05), 1.1)), 1.1, 3.6);
      // Indonesia: close enough for its program provinces to show
      if (code === "ID") return { lambda: -118, phi: 2.5, zoom: 2.8 };
      const [lon, lat] = c.centre;
      return { lambda: -lon, phi: clamp(-lat, -70, 70), zoom };
    },
    []
  );

  useImperativeHandle(
    ref,
    () => ({
      home: () => flyTo({ lambda: view.current.lambda, phi: -8, zoom: 1 }),
      zoomBy: (f) => flyTo({ ...view.current, zoom: clamp(view.current.zoom * f, MIN_ZOOM, MAX_ZOOM) }, 400),
      flyTo: (code) => {
        const v = viewFor(code);
        if (v) flyTo(v);
      },
      flyToPoint: ([lon, lat], zoom = 5) => flyTo({ lambda: -lon, phi: clamp(-lat, -70, 70), zoom }),
    }),
    [flyTo, viewFor]
  );

  // fly to whatever gets picked
  useEffect(() => {
    if (!selected) return;
    const v = viewFor(selected);
    if (v) flyTo(v);
  }, [selected, viewFor, flyTo]);

  // one animation loop: flights, momentum after a drag, and the idle spin
  useEffect(() => {
    let frame;
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(64, now - last);
      last = now;
      const m = motion.current;
      const v = view.current;
      let moved = false;
      if (m.flight) {
        const t = clamp((now - m.flight.start) / m.flight.ms, 0, 1);
        const e = easeInOut(t);
        const { from, to } = m.flight;
        v.lambda = from.lambda + (to.lambda - from.lambda) * e;
        v.phi = from.phi + (to.phi - from.phi) * e;
        v.zoom = from.zoom * Math.pow(to.zoom / from.zoom, e);
        if (t >= 1) m.flight = null;
        moved = true;
      } else if (!m.dragging && (Math.abs(m.vx) > 0.01 || Math.abs(m.vy) > 0.01)) {
        v.lambda += m.vx * dt;
        v.phi = clamp(v.phi + m.vy * dt, -85, 85);
        const decay = Math.pow(0.93, dt / 16);
        m.vx *= decay;
        m.vy *= decay;
        moved = true;
      } else if (autoSpin && !reduceMotion && !m.dragging && !selected && now - m.lastInput > IDLE_MS) {
        v.lambda += (SPIN_DEG_PER_S * dt) / 1000;
        moved = true;
      }
      if (moved) redraw();
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [autoSpin, reduceMotion, selected, redraw]);

  const scale = base * view.current.zoom;
  const projection = geoOrthographic()
    .translate([size.w / 2, size.h / 2])
    .scale(scale)
    .rotate([view.current.lambda, view.current.phi])
    .clipAngle(90)
    .precision(0.6);
  const path = geoPath(projection);

  // the country under a point of the drawing, and where on Earth that is
  const hit = (x, y) => {
    const point = projection.invert([x, y]);
    if (!point || Number.isNaN(point[0])) return { point: null, code: null };
    // invert also answers for the far side; keep taps on the visible half
    const dx = x - size.w / 2;
    const dy = y - size.h / 2;
    if (dx * dx + dy * dy > scale * scale) return { point: null, code: null };
    const country = COUNTRIES.find((c) => geoContains(c.feature, point));
    return { point, code: country?.code || null };
  };

  // ---- pointer input: drag to turn, pinch to zoom, tap to pick
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const local = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  const onPointerDown = (e) => {
    try {
      boxRef.current.setPointerCapture(e.pointerId);
    } catch {
      // a pointer the browser no longer tracks; dragging still works
    }
    pointers.current.set(e.pointerId, local(e));
    const m = motion.current;
    m.flight = null;
    m.vx = 0;
    m.vy = 0;
    m.dragging = true;
    m.lastInput = performance.now();
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { pinch: Math.hypot(a[0] - b[0], a[1] - b[1]), zoom: view.current.zoom, moved: true };
    } else {
      gesture.current = { start: local(e), last: local(e), lastT: performance.now(), moved: false };
    }
  };

  const onPointerMove = (e) => {
    const p = local(e);
    if (!pointers.current.has(e.pointerId)) {
      if (e.pointerType === "mouse") setHover(hit(p[0], p[1]).code);
      return;
    }
    pointers.current.set(e.pointerId, p);
    const g = gesture.current;
    if (!g) return;
    const m = motion.current;
    m.lastInput = performance.now();
    if (pointers.current.size >= 2 && g.pinch) {
      const [a, b] = [...pointers.current.values()];
      view.current.zoom = clamp((g.zoom * Math.hypot(a[0] - b[0], a[1] - b[1])) / g.pinch, MIN_ZOOM, MAX_ZOOM);
      redraw();
      return;
    }
    if (!g.start) return;
    const dx = p[0] - g.last[0];
    const dy = p[1] - g.last[1];
    if (!g.moved && Math.hypot(p[0] - g.start[0], p[1] - g.start[1]) > 5) g.moved = true;
    if (!g.moved) return;
    const degPerPx = DEG / scale;
    view.current.lambda += dx * degPerPx;
    view.current.phi = clamp(view.current.phi - dy * degPerPx, -85, 85);
    const now = performance.now();
    const dt = Math.max(1, now - g.lastT);
    m.vx = (dx * degPerPx) / dt;
    m.vy = (-dy * degPerPx) / dt;
    g.last = p;
    g.lastT = now;
    redraw();
  };

  const onPointerUp = (e) => {
    const g = gesture.current;
    const p = local(e);
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) return;
    motion.current.dragging = false;
    gesture.current = null;
    if (g && !g.moved) {
      // a tap: pick the country (tapping the sea lets go)
      motion.current.vx = 0;
      motion.current.vy = 0;
      const { point, code } = hit(p[0], p[1]);
      if (point) onPoint?.(point, code);
      onSelect?.(code);
    } else if (g && performance.now() - g.lastT > 80) {
      motion.current.vx = 0;
      motion.current.vy = 0;
    }
  };

  const onWheel = useCallback(
    (e) => {
      e.preventDefault();
      motion.current.flight = null;
      motion.current.lastInput = performance.now();
      view.current.zoom = clamp(view.current.zoom * Math.exp(-e.deltaY * 0.0015), MIN_ZOOM, MAX_ZOOM);
      redraw();
    },
    [redraw]
  );
  useEffect(() => {
    const el = boxRef.current;
    el?.addEventListener("wheel", onWheel, { passive: false });
    return () => el?.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  // ---- what to draw
  const codes = Object.keys(programs);
  const targets = useMemo(
    () => codes.map((code) => anchorOf(code, programs[code])).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(codes), JSON.stringify(Object.values(programs).map((p) => p?.cities?.[0] || null))]
  );
  const night = geoCircle().center([sun[0] + 180, -sun[1]]).radius(90)();
  const twilight = geoCircle().center([sun[0] + 180, -sun[1]]).radius(96)();
  const showProvinces = programs.ID && view.current.zoom > 2.4;
  const iconSize = clamp(16 + view.current.zoom * 3, 18, 34);

  return (
    <div
      ref={boxRef}
      className={`${styles.box} ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => setHover(null)}
      style={{ cursor: hover ? "pointer" : "grab" }}
    >
      <svg width={size.w} height={size.h} className={styles.svg} aria-hidden="true">
        <defs>
          <radialGradient id="wg-ocean" cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#1d4f9a" />
            <stop offset="0.6" stopColor="#0f2e66" />
            <stop offset="1" stopColor="#081a40" />
          </radialGradient>
          <radialGradient id="wg-air" cx="50%" cy="50%" r="50%">
            <stop offset="0.86" stopColor="#5fa8ff" stopOpacity="0" />
            <stop offset="0.93" stopColor="#5fa8ff" stopOpacity="0.28" />
            <stop offset="1" stopColor="#5fa8ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* the real Sun and Moon, far off in the direction they truly are */}
        {sky && <Sky view={view.current} size={size} sun={sun} moon={moon} globe={base} />}

        {/* the thin glowing air around the Earth */}
        <circle cx={size.w / 2} cy={size.h / 2} r={scale * 1.16} fill="url(#wg-air)" />
        <path d={path(SPHERE)} fill="url(#wg-ocean)" />
        <path d={path(GRATICULE)} fill="none" stroke="rgba(160, 200, 255, 0.08)" strokeWidth="0.6" />

        {COUNTRIES.map((c) => {
          const d = path(c.feature);
          if (!d) return null;
          const program = !!programs[c.code];
          const isSel = c.code === selected;
          const cls = [styles.country, program && styles.program, isSel && styles.selected, hover === c.code && styles.hover].filter(Boolean).join(" ");
          return <path key={c.code + c.name} d={d} className={cls} />;
        })}

        {/* Indonesia's provinces with programs, once the globe is close */}
        {showProvinces &&
          ALL_PROVINCES.map((f) => {
            const d = path(f);
            return d ? <path key={f.properties.PROVINSI} d={d} className={provinces[f.properties.PROVINSI] ? styles.provinceOn : styles.province} /> : null;
          })}

        {/* where it is night right now, with a soft edge for dusk and dawn */}
        <path d={path(twilight)} className={styles.twilight} />
        <path d={path(night)} className={styles.night} />

        {/* the selected country again, above the night, so it always shows */}
        {selected && countryByCode.get(selected) && <path d={path(countryByCode.get(selected).feature) || ""} className={styles.selectedRing} />}

        {/* cities of the program countries */}
        {codes.flatMap((code) =>
          (programs[code]?.cities || [])
            .filter((city) => Number.isFinite(city.lon) && Number.isFinite(city.lat))
            .map((city, i) => {
              if (geoDistance([city.lon, city.lat], [-view.current.lambda, -view.current.phi]) > Math.PI / 2 - 0.04) return null;
              const [x, y] = projection([city.lon, city.lat]);
              const lit = highlightCity === `${code}-${i}`;
              return (
                <g key={`${code}-${i}`} transform={`translate(${x} ${y})`} className={styles.city}>
                  <circle r={lit ? 11 : 7} className={styles.cityPulse} />
                  <circle r={lit ? 4.5 : 3.2} className={styles.cityDot} />
                  {view.current.zoom > 2.2 && city.name && (
                    <text y={-10} className={styles.cityName}>
                      {city.name}
                    </text>
                  )}
                </g>
              );
            })
        )}

        <HolyPlaces projection={projection} size={iconSize} labels={labels} targets={targets} />
      </svg>
    </div>
  );
});

export default WorldGlobe;

const RAD = Math.PI / 180;

/** Where a point of the sky over [lon, lat] lies on screen, seen from the globe's camera: x, y (screen) and z (towards the viewer). */
function skyDirection([lon, lat], view) {
  const [l, p] = geoRotation([view.lambda, view.phi])([lon, lat]);
  const x = Math.cos(p * RAD) * Math.sin(l * RAD);
  const y = -Math.sin(p * RAD);
  const z = Math.cos(p * RAD) * Math.cos(l * RAD);
  const len = Math.hypot(x, y);
  // straight behind or in front of the camera: put it up and to the side
  return len < 0.12 ? { x: 0.7, y: -0.7, z } : { x: x / len, y: y / len, z };
}

/**
 * The Sun and the Moon near the edge of the view, each in the direction it
 * really is from the Earth now (so the Sun is on the side of the globe that
 * is in daylight), the Moon in its true phase with its lit edge towards the
 * Sun. Small and soft, behind the globe, so they never get in the way.
 */
function Sky({ view, size, sun, moon, globe }) {
  // smaller on phones; the glow scales with it
  const r = clamp(Math.min(size.w, size.h) / 55, 5, 11);
  const margin = r * 3.2;
  const cx = size.w / 2;
  const cy = size.h / 2;
  // along its true direction to the edge of the view; where that edge is too
  // close to the globe (a narrow phone screen), lift it above or below the
  // globe on the same side, so it never sits on the Earth's rim
  const place = (dir) => {
    // the bottom strip holds the hint and the zoom buttons
    const roomY = dir.y > 0 ? cy - margin - 64 : cy - margin;
    const roomX = dir.y > 0.2 ? cx - margin - 56 : cx - margin;
    const t = Math.min(roomX / Math.max(Math.abs(dir.x), 1e-6), roomY / Math.max(Math.abs(dir.y), 1e-6));
    let x = cx + dir.x * t;
    let y = cy + dir.y * t;
    const need = globe * 1.12 + r * 2.4;
    if (Math.hypot(x - cx, y - cy) < need) {
      const dy = dir.y >= 0 ? 1 : -1;
      y = cy + dy * Math.min(roomY, need);
      x = cx + dir.x * Math.min(roomX, Math.sqrt(Math.max(0, need * need - (y - cy) * (y - cy))) + r);
    }
    return [x, y];
  };
  const sunDir = skyDirection(sun, view);
  const moonDir = skyDirection(moon.at, view);
  const [sx, sy] = place(sunDir);
  const [mx, my] = place(moonDir);
  // behind the camera they are only a soft hint
  const fade = (z) => clamp(1 - Math.max(0, z) * 0.55, 0.35, 1);

  const k = Math.cos(moon.phase * RAD);
  const rx = Math.abs(k) * r;
  // lit half towards the Sun, closed by the terminator: inside it for a crescent, outside for a gibbous moon
  const lit = `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${rx} ${r} 0 0 ${k > 0 ? 0 : 1} 0 ${-r} Z`;
  const towardsSun = (Math.atan2(sy - my, sx - mx) * 180) / Math.PI;

  return (
    <g className={styles.sky} pointerEvents="none">
      <defs>
        <radialGradient id="wg-sun">
          <stop offset="0" stopColor="#fff8dc" stopOpacity="0.95" />
          <stop offset="0.18" stopColor="#ffe28a" stopOpacity="0.6" />
          <stop offset="0.5" stopColor="#ffb84a" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ffb84a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wg-moonglow">
          <stop offset="0.4" stopColor="#dfe8ff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#dfe8ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={`translate(${sx} ${sy})`} opacity={fade(sunDir.z)}>
        <circle r={r * 5.5} fill="url(#wg-sun)" className={styles.sunGlow} />
        <g className={styles.sunRays}>
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={r * 1.6} y={-0.6} width={r * (i % 2 ? 1.1 : 1.8)} height={1.2} rx={0.6} fill="#ffe7a3" opacity="0.55" transform={`rotate(${i * 30})`} />
          ))}
        </g>
        <circle r={r * 1.15} fill="#fff4cf" />
      </g>
      <g transform={`translate(${mx} ${my})`} opacity={fade(moonDir.z)}>
        <circle r={r * 2.6} fill="url(#wg-moonglow)" />
        <circle r={r * 0.85} fill="#2a3552" />
        <g transform={`rotate(${towardsSun}) scale(0.85)`}>
          <path d={lit} fill="#eef2ff" />
          <circle cx={-r * 0.2} cy={r * 0.25} r={r * 0.16} fill="#c9d2ea" opacity="0.6" />
          <circle cx={r * 0.35} cy={-r * 0.3} r={r * 0.11} fill="#c9d2ea" opacity="0.6" />
        </g>
      </g>
    </g>
  );
}
