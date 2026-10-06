import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { IconArrowsMaximize, IconFocusCentered, IconMinus, IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./Map.module.css";
import { ALL_PROVINCES, PROVINCE_COLLECTION, WIDTH } from "./mapGeometry";

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

/* ——— brand colours: gold for active, deeper gold for more programs ——— */
const COLORS = {
  low: [246, 220, 140],
  high: [168, 122, 0],
  inactive: "#d7e3ef",
  inactiveHover: "#c7d7e7",
  stroke: "#ffffff",
  selected: "#102141",
};

const shade = (ratio) => {
  const [r, g, b] = COLORS.low.map((c, i) => Math.round(c + (COLORS.high[i] - c) * ratio));
  return `rgb(${r}, ${g}, ${b})`;
};

const PROVINCE_STYLE = { outline: "none", vectorEffect: "non-scaling-stroke", cursor: "pointer" };

const Province = memo(function Province({ geo, name, fill, hoverFill, selected, onEnter, onLeave, onSelect }) {
  return (
    <Geography
      geography={geo}
      onMouseEnter={onEnter ? () => onEnter(name) : undefined}
      onMouseLeave={onLeave}
      onClick={() => onSelect(name)}
      style={{
        default: {
          ...PROVINCE_STYLE,
          fill,
          stroke: selected ? COLORS.selected : COLORS.stroke,
          strokeWidth: selected ? 1.6 : 0.5,
          transition: "fill 0.2s ease",
        },
        hover: { ...PROVINCE_STYLE, fill: hoverFill, stroke: selected ? COLORS.selected : COLORS.stroke, strokeWidth: selected ? 1.6 : 0.8 },
        pressed: { ...PROVINCE_STYLE, fill: hoverFill },
      }}
    />
  );
});

const easeOut = (p) => 1 - Math.pow(1 - p, 3);

/**
 * Zoomable, draggable province map.
 * `free` lets every gesture move the map (full-screen view). On the page,
 * the wheel only zooms with Ctrl/⌘, and one finger only pans once zoomed in,
 * so scrolling past the map keeps working.
 */
const MapCanvas = forwardRef(function MapCanvas(
  { list, provinces, totals, projection, height, selected, onSelect, onHover, pinScale = 1, free = false, onExpand },
  ref
) {
  const { t } = useTranslation("homepage/Map");
  const home = useMemo(
    () => ({ coordinates: projection.invert([WIDTH / 2, height / 2]), zoom: 1 }),
    [projection, height]
  );
  const [position, setPosition] = useState(home);
  const positionRef = useRef(home);
  const frame = useRef(0);

  const move = useCallback((next) => {
    positionRef.current = next;
    setPosition(next);
  }, []);

  useEffect(() => {
    cancelAnimationFrame(frame.current);
    move(home);
  }, [home, move]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const flyTo = useCallback(
    (target) => {
      cancelAnimationFrame(frame.current);
      const from = positionRef.current;
      const start = performance.now();
      const step = (now) => {
        const p = easeOut(Math.min(1, (now - start) / 450));
        move({
          coordinates: [
            from.coordinates[0] + (target.coordinates[0] - from.coordinates[0]) * p,
            from.coordinates[1] + (target.coordinates[1] - from.coordinates[1]) * p,
          ],
          zoom: from.zoom + (target.zoom - from.zoom) * p,
        });
        if (p < 1) frame.current = requestAnimationFrame(step);
      };
      frame.current = requestAnimationFrame(step);
    },
    [move]
  );

  const centroids = useMemo(
    () => Object.fromEntries(ALL_PROVINCES.map((f) => [f.properties.PROVINSI, geoCentroid(f)])),
    []
  );

  useImperativeHandle(
    ref,
    () => ({
      focus: (name, zoom = 3) => centroids[name] && flyTo({ coordinates: centroids[name], zoom }),
      reset: () => flyTo(home),
    }),
    [centroids, flyTo, home]
  );

  const zoomBy = (factor) =>
    flyTo({
      coordinates: positionRef.current.coordinates,
      zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, positionRef.current.zoom * factor)),
    });

  const freeRef = useRef(free);
  freeRef.current = free;
  const filterZoomEvent = useCallback((evt) => {
    if (!evt) return false;
    if (evt.button) return false;
    if (freeRef.current) return true;
    if (evt.type === "wheel") return evt.ctrlKey || evt.metaKey;
    if (evt.type.startsWith("touch")) return evt.touches.length > 1 || positionRef.current.zoom > 1.05;
    return true; // mouse drag and double-click
  }, []);

  const markers = useMemo(
    () => list.filter((p) => centroids[p.name]).map((p) => ({ name: p.name, coordinates: centroids[p.name], programs: p.programs })),
    [list, centroids]
  );

  // Pins and labels stay the same size on screen while the map zooms.
  const k = pinScale / position.zoom;
  const zoomed = position.zoom > 1.05;

  return (
    <div className={styles.canvas}>
      <ComposableMap projection={projection} width={WIDTH} height={height} className={styles.svg}>
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          translateExtent={[
            [0, 0],
            [WIDTH, height],
          ]}
          filterZoomEvent={filterZoomEvent}
          onMoveEnd={({ coordinates, zoom }) => {
            cancelAnimationFrame(frame.current);
            move({ coordinates, zoom });
          }}
        >
          <Geographies geography={PROVINCE_COLLECTION}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = geo.properties.PROVINSI;
                const data = provinces[name] ? list.find((p) => p.name === name) : null;
                const ratio = data ? (totals.maxPrograms > 1 ? (data.programs - 1) / (totals.maxPrograms - 1) : 1) : 0;
                return (
                  <Province
                    key={geo.rsmKey}
                    geo={geo}
                    name={name}
                    fill={data ? shade(ratio) : COLORS.inactive}
                    hoverFill={data ? shade(Math.min(1, ratio + 0.25)) : COLORS.inactiveHover}
                    selected={name === selected}
                    onEnter={onHover ? onHover : undefined}
                    onLeave={onHover ? () => onHover(null) : undefined}
                    onSelect={onSelect}
                  />
                );
              })
            }
          </Geographies>

          {markers.map((m) => (
            <Marker key={m.name} coordinates={m.coordinates} onClick={() => onSelect(m.name)}>
              <g className={styles.marker} style={{ cursor: "pointer" }}>
                <circle r={11 * k} className={styles.pulse} />
                <circle
                  r={(9 + Math.min(m.programs, 9) * 0.5) * k}
                  strokeWidth={2 * k}
                  className={`${styles.pin} ${m.name === selected ? styles.pinSelected : ""}`}
                />
                <text textAnchor="middle" dy="0.35em" className={styles.pinText} style={{ fontSize: 10 * k }}>
                  {m.programs}
                </text>
              </g>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      <div className={styles.controls} dir="ltr">
        <button type="button" onClick={() => zoomBy(1.6)} aria-label={t("zoom_in")} title={t("zoom_in")}>
          <IconPlus size={18} />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.6)}
          aria-label={t("zoom_out")}
          title={t("zoom_out")}
          disabled={!zoomed}
        >
          <IconMinus size={18} />
        </button>
        <button type="button" onClick={() => flyTo(home)} aria-label={t("reset")} title={t("reset")} disabled={!zoomed}>
          <IconFocusCentered size={18} />
        </button>
        {onExpand && (
          <button type="button" onClick={onExpand} aria-label={t("expand")} title={t("expand")} className={styles.expandButton}>
            <IconArrowsMaximize size={18} />
          </button>
        )}
      </div>
    </div>
  );
});

export default MapCanvas;
