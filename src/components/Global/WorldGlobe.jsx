import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, forwardRef } from "react";
import { geoBounds, geoCircle, geoContains, geoDistance, geoGraticule10, geoOrthographic, geoPath, geoRotation } from "d3-geo";
import HolyPlaces from "../Common/HolyPlaces";
import { closeUpOf, flightAt } from "../Common/haramainFlight";
import { provinceList, provinceTotals } from "../../data/mtiProvinceData";
import { COUNTRIES, ORIGIN, anchorOf, countryByCode, moonNow, subsolarPoint } from "./globalData";
import { CENTROIDS, ProvinceMarks, ProvinceShapes, SHOW_PINS, SHOW_PROVINCES, provinceAt, provinceMarks } from "./ProvinceLayer";
import LiveLayer from "./LiveLayer";
import { useLiveSessions } from "./liveSessions";
import styles from "./WorldGlobe.module.css";

const GRATICULE = geoGraticule10();
const SPHERE = { type: "Sphere" };
const DEG = 180 / Math.PI;
const MIN_ZOOM = 0.85;
const MAX_ZOOM = 30;
const SPIN_DEG_PER_S = 5;
const IDLE_MS = 5000;
// how close (pixels per radian) before Indonesia's neighbours are drawn in finer detail
const DETAIL_SCALE = 350;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// the shorter way round from a to b, in degrees
const wrapDelta = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;

/**
 * A globe you can spin, zoom and tap: drag to turn it (with a little
 * momentum), scroll or pinch to zoom, tap a country to pick it and fly there.
 * Countries with Tadarus programs glow gold and get a line of light from
 * Makkah; the night side of the Earth is shaded where it is night right now.
 * Close to Indonesia its provinces show, gold by how many programs each has,
 * with a pin for each and the partner places as dots.
 *
 * `programs` is { [code]: { cities: [{ name, lon, lat }] } }; `selected` the
 * picked country's code; `onSelect(code | null)`; `onPoint([lon, lat], code)`
 * is called on every tap with where on Earth it landed (the dashboard uses it
 * to place cities). `provinces` are Indonesia's program provinces (as the
 * home page map stores them); with `onProvince(name, placeIndex)` they can be
 * picked, `onProvinceHover(name | null)` previews them on a mouse, and
 * `selectedProvince` is outlined.
 *
 * `fit` (province shapes) makes the globe open on them, fitted to its box,
 * and come back there with `home()`; `story` (0–1) plays the opening flight
 * from the Haramain, out to the Earth and down to that view (a tap calls
 * `onSkip`). `page` leaves one-finger and wheel scrolling to the page (zoom
 * with two fingers or Ctrl + wheel); `theme` "day" draws it light, without
 * the night side. The parent can call `ref.current.home()`, `.world()`,
 * `.zoomBy(factor)`, `.flyTo(code)`, `.flyToPoint([lon, lat], zoom)` and
 * `.focusProvince(name)`.
 */
const WorldGlobe = forwardRef(function WorldGlobe(
  {
    programs = {},
    selected = null,
    onSelect,
    onPoint,
    provinces = {},
    selectedProvince = null,
    onProvince,
    onProvinceHover,
    fit = null,
    story,
    onSkip,
    page = false,
    theme = "night",
    labels,
    highlightCity,
    className = "",
    autoSpin = true,
    initialView,
    sky = true,
  },
  ref
) {
  const day = theme === "day";
  const boxRef = useRef(null);
  const [size, setSize] = useState({ w: 600, h: 600 });
  // on a tall, narrow phone screen a little smaller, so the Sun and Moon have room beside it
  const base = sky && size.h > size.w * 1.15 ? Math.min(size.w * 0.34, size.h * 0.42) : Math.min(size.w, size.h) * 0.42;

  // the view lives in a ref (it changes every frame); `tick` re-renders
  // where it opens: given, or over the Indian Ocean (Makkah to Indonesia)
  const view = useRef(initialView ? { zoom: 1, ...initialView } : { lambda: -100, phi: -5, zoom: 1 });
  const [, setTick] = useState(0);
  const redraw = useCallback(() => setTick((n) => (n + 1) % 1e9), []);

  const motion = useRef({ flight: null, vx: 0, vy: 0, lastInput: 0, dragging: false });
  // whether the visitor has moved the globe since it was last fitted
  const touched = useRef(false);
  const [hover, setHover] = useState(null);
  const [hoverProvince, setHoverProvince] = useState(null);
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
    if (day) return undefined;
    const id = setInterval(() => {
      setSun(subsolarPoint());
      setMoon(moonNow());
    }, 60000);
    return () => clearInterval(id);
  }, [day]);

  const reduceMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);

  // the view that fits `fit` into the box
  const fitView = useMemo(() => {
    if (!fit?.length) return null;
    const collection = { type: "FeatureCollection", features: fit };
    const [[x0, y0], [x1, y1]] = geoBounds(collection);
    const centre = [(x0 + x1) / 2, (y0 + y1) / 2];
    const pad = Math.min(size.w, size.h) * 0.04 + 10;
    const fitted = geoOrthographic()
      .rotate([-centre[0], -centre[1]])
      .fitExtent(
        [
          [pad, pad],
          [size.w - pad, size.h - pad],
        ],
        collection
      );
    return { lambda: -centre[0], phi: -centre[1], zoom: clamp(fitted.scale() / base, MIN_ZOOM, MAX_ZOOM) };
  }, [fit, size.w, size.h, base]);

  // the opening story: from the Haramain out to the Earth, then down to the fitted view
  const storyOn = story !== undefined && story < 1 && !!fitView && !reduceMotion;
  const storyKeys = useMemo(() => {
    if (!fitView) return null;
    const end = { lambda: fitView.lambda, phi: fitView.phi, scale: fitView.zoom };
    const globe = { lambda: end.lambda + 75, phi: end.phi - 18, scale: 1 };
    return { end, globe, close: closeUpOf(globe) };
  }, [fitView]);
  const act = storyOn ? flightAt(clamp(story, 0, 1), storyKeys) : null;
  if (act) view.current = { lambda: act.view.lambda, phi: act.view.phi, zoom: act.view.scale };
  const storyRef = useRef(storyOn);
  storyRef.current = storyOn;

  // until the visitor moves it, the globe stays fitted (also as its box changes size)
  useLayoutEffect(() => {
    if (storyOn) {
      touched.current = false;
      motion.current.flight = null;
      motion.current.vx = 0;
      motion.current.vy = 0;
      return;
    }
    if (fitView && !touched.current) {
      motion.current.flight = null;
      view.current = { ...fitView };
      redraw();
    }
  }, [fitView, storyOn, redraw]);

  const flyTo = useCallback(
    (target, ms = 1300) => {
      const from = { ...view.current };
      const to = { lambda: from.lambda + wrapDelta(from.lambda, target.lambda), phi: target.phi, zoom: target.zoom };
      motion.current.flight = { from, to, start: performance.now(), ms: reduceMotion ? 1 : ms };
      motion.current.vx = 0;
      motion.current.vy = 0;
      motion.current.lastInput = performance.now();
      touched.current = true;
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
      if (code === "ID") return fitView || { lambda: -118, phi: 2.5, zoom: 2.8 };
      const [lon, lat] = c.centre;
      return { lambda: -lon, phi: clamp(-lat, -70, 70), zoom };
    },
    [fitView]
  );

  const home = useCallback(() => {
    if (fitView) {
      flyTo(fitView);
      touched.current = false;
    } else {
      flyTo({ lambda: view.current.lambda, phi: -8, zoom: 1 });
    }
  }, [fitView, flyTo]);

  useImperativeHandle(
    ref,
    () => ({
      home,
      world: () => flyTo({ lambda: view.current.lambda, phi: -8, zoom: 1 }, 1600),
      zoomBy: (f) => flyTo({ ...view.current, zoom: clamp(view.current.zoom * f, MIN_ZOOM, MAX_ZOOM) }, 400),
      flyTo: (code) => {
        const v = viewFor(code);
        if (v) flyTo(v);
      },
      flyToPoint: ([lon, lat], zoom = 5) => flyTo({ lambda: -lon, phi: clamp(-lat, -70, 70), zoom }),
      focusProvince: (name, factor = 3) => {
        const at = CENTROIDS[name];
        if (at) flyTo({ lambda: -at[0], phi: -at[1], zoom: clamp((fitView?.zoom || 2.8) * factor, MIN_ZOOM, MAX_ZOOM) }, 900);
      },
    }),
    [flyTo, viewFor, home, fitView]
  );

  // fly to whatever gets picked, unless it is already in front, at least as close
  useEffect(() => {
    if (!selected) return;
    const v = viewFor(selected);
    if (!v) return;
    const c = countryByCode.get(selected);
    const inFront = c && view.current.zoom >= v.zoom * 0.9 && geoDistance(c.centre, [-view.current.lambda, -view.current.phi]) < 0.35;
    if (!inFront) flyTo(v);
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
      if (storyRef.current) {
        // the story moves the camera
      } else if (m.flight) {
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
  const centre = [-view.current.lambda, -view.current.phi];
  const visible = (point) => geoDistance(point, centre) < Math.PI / 2 - 0.04;

  // Indonesia's provinces: the list, totals, pins and places
  const hasProvinces = Object.keys(provinces).length > 0;
  const list = useMemo(() => provinceList(provinces), [provinces]);
  const totals = useMemo(() => provinceTotals(provinces), [provinces]);
  const marks = useMemo(() => provinceMarks(list), [list]);
  const showProvinces = hasProvinces && scale >= SHOW_PROVINCES;
  // Tadarus Live: the places with an online session, live or not right now
  const sessions = useLiveSessions(provinces, programs).all;

  // what lies under a point of the drawing: where on Earth, the country, and the province (or its pin or place)
  const hit = (x, y) => {
    const none = { point: null, code: null, province: null, place: null };
    const point = projection.invert([x, y]);
    if (!point || Number.isNaN(point[0])) return none;
    // invert also answers for the far side; keep taps on the visible half
    const dx = x - size.w / 2;
    const dy = y - size.h / 2;
    if (dx * dx + dy * dy > scale * scale) return none;
    const inProvince = hasProvinces ? provinceAt([x, y], point, { projection, scale, marks, visible }) : null;
    const country = inProvince ? countryByCode.get("ID") : COUNTRIES.find((c) => geoContains(c.feature, point));
    return { point, code: country?.code || null, province: inProvince?.province || null, place: inProvince?.place ?? null };
  };

  // ---- pointer input: drag to turn, pinch to zoom, tap to pick
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const local = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  const hoverAt = (p) => {
    const h = p ? hit(p[0], p[1]) : null;
    const province = onProvince ? h?.province || null : null;
    setHover(onSelect && !province ? h?.code || null : null);
    if (province !== hoverProvince) {
      setHoverProvince(province);
      onProvinceHover?.(province);
    }
  };

  const onPointerDown = (e) => {
    if (storyRef.current) {
      onSkip?.();
      return;
    }
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
      touched.current = true;
    } else {
      gesture.current = { start: local(e), last: local(e), lastT: performance.now(), moved: false };
    }
  };

  const onPointerMove = (e) => {
    const p = local(e);
    if (!pointers.current.has(e.pointerId)) {
      if (e.pointerType === "mouse" && !storyRef.current) hoverAt(p);
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
    if (!g.moved && Math.hypot(p[0] - g.start[0], p[1] - g.start[1]) > 5) {
      g.moved = true;
      touched.current = true;
    }
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
    if (g && !g.moved && e.type === "pointerup") {
      // a tap: pick the province or the country (tapping the sea lets go)
      motion.current.vx = 0;
      motion.current.vy = 0;
      const { point, code, province, place } = hit(p[0], p[1]);
      if (point) onPoint?.(point, code);
      if (province && onProvince) onProvince(province, place);
      else onSelect?.(code);
    } else if (g && performance.now() - g.lastT > 80) {
      motion.current.vx = 0;
      motion.current.vy = 0;
    }
  };

  const onWheel = useCallback(
    (e) => {
      // on the page, the wheel scrolls the page unless Ctrl (or ⌘) is held
      if (storyRef.current || (page && !e.ctrlKey && !e.metaKey)) return;
      e.preventDefault();
      motion.current.flight = null;
      motion.current.lastInput = performance.now();
      touched.current = true;
      view.current.zoom = clamp(view.current.zoom * Math.exp(-e.deltaY * 0.0015), MIN_ZOOM, MAX_ZOOM);
      redraw();
    },
    [redraw, page]
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
  const iconSize = clamp(16 + view.current.zoom * 3, 18, 34);
  // in the light theme the Haramain and the line make way for the provinces up close
  const holy = act
    ? { opacity: act.holyOpacity, size: 22 * act.iconScale, reveal: act.reveal }
    : { opacity: day ? clamp((SHOW_PINS - scale) / 220, 0, 1) : 1, size: iconSize };
  const pointing = (hover && onSelect) || (hoverProvince && onProvince);

  return (
    <div
      ref={boxRef}
      className={`${styles.box} ${day ? styles.day : ""} ${page ? styles.page : ""} ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => hoverAt(null)}
      style={{ cursor: storyOn ? "pointer" : pointing ? "pointer" : "grab" }}
    >
      <svg width={size.w} height={size.h} className={styles.svg} aria-hidden="true">
        <defs>
          <radialGradient id="wg-ocean" cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#1d4f9a" />
            <stop offset="0.6" stopColor="#0f2e66" />
            <stop offset="1" stopColor="#081a40" />
          </radialGradient>
          <radialGradient id="wg-ocean-day" cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#f6f9fd" />
            <stop offset="0.7" stopColor="#e4edf7" />
            <stop offset="1" stopColor="#cddcec" />
          </radialGradient>
          <radialGradient id="wg-air" cx="50%" cy="50%" r="50%">
            <stop offset="0.86" stopColor="#5fa8ff" stopOpacity="0" />
            <stop offset="0.93" stopColor="#5fa8ff" stopOpacity="0.28" />
            <stop offset="1" stopColor="#5fa8ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* the real Sun and Moon, far off in the direction they truly are */}
        {sky && !day && <Sky view={view.current} size={size} sun={sun} moon={moon} globe={base} />}

        {/* the thin glowing air around the Earth */}
        {!day && <circle cx={size.w / 2} cy={size.h / 2} r={scale * 1.16} fill="url(#wg-air)" />}
        <path d={path(SPHERE)} className={styles.sphere} fill={day ? "url(#wg-ocean-day)" : "url(#wg-ocean)"} />
        <path d={path(GRATICULE)} className={styles.graticule} />

        {COUNTRIES.map((c) => {
          const d = path(scale >= DETAIL_SCALE && c.detail ? c.detail : c.feature);
          if (!d) return null;
          const program = !!programs[c.code];
          const isSel = c.code === selected;
          const cls = [styles.country, program && styles.program, c.code === ORIGIN && styles.origin, isSel && styles.selected, hover === c.code && styles.hover].filter(Boolean).join(" ");
          return <path key={c.code + c.name} d={d} className={cls} />;
        })}

        {/* Indonesia's provinces, once the globe is close */}
        {showProvinces && (
          <ProvinceShapes path={path} provinces={provinces} totals={totals} selected={selectedProvince} hovered={hoverProvince} theme={day ? "day" : "night"} />
        )}

        {/* where it is night right now, with a soft edge for dusk and dawn */}
        {!day && <path d={path(twilight)} className={styles.twilight} />}
        {!day && <path d={path(night)} className={styles.night} />}

        {/* the selected country again, above the night, so it always shows */}
        {selected && countryByCode.get(selected) && <path d={path(countryByCode.get(selected).feature) || ""} className={styles.selectedRing} />}

        {/* cities of the program countries */}
        {codes.flatMap((code) =>
          (programs[code]?.cities || [])
            .filter((city) => Number.isFinite(city.lon) && Number.isFinite(city.lat))
            .map((city, i) => {
              if (!visible([city.lon, city.lat])) return null;
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

        <HolyPlaces projection={projection} opacity={holy.opacity} size={holy.size} reveal={holy.reveal} labels={labels} targets={targets.length ? targets : undefined} />

        {/* the program pins, above the line's landing at Jakarta */}
        {showProvinces && <ProvinceMarks projection={projection} scale={scale} marks={marks} selected={selectedProvince} visible={visible} />}

        {/* online sessions on top of everything: LIVE where one runs now */}
        <LiveLayer sessions={sessions} projection={projection} scale={scale} visible={visible} />
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
