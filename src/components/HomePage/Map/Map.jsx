import { memo, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { geoCentroid, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import CountUp from "react-countup";
import { useMediaQuery } from "@mantine/hooks";
import { IconBuildingCommunity, IconMapPin, IconMapPinOff, IconPointer } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./Map.module.css";

import topoData from "../../../data/indonesia-provinces.topo.json";
import { mtiProvinces, getDisplayName, provinceList, provinceTotals } from "../../../data/mtiProvinceData";

const ALL_PROVINCES = feature(topoData, topoData.objects["indonesia-38-prov-topo"]).features;
const PROVINCE_COLLECTION = { type: "FeatureCollection", features: ALL_PROVINCES };
const WIDTH = 800;

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

// Fits the features to the full width and makes the map exactly as tall as
// they need, so no band of empty sea is left under the islands.
const fitToWidth = (features, pad) => {
  const collection = { type: "FeatureCollection", features };
  const probe = geoMercator().fitWidth(WIDTH - pad * 2, collection);
  const [[, top], [, bottom]] = geoPath(probe).bounds(collection);
  const height = Math.ceil(bottom - top) + pad * 2;
  const projection = geoMercator().fitExtent(
    [
      [pad, pad],
      [WIDTH - pad, height - pad],
    ],
    collection
  );
  return { projection, height };
};

const Province = memo(function Province({ geo, fill, hoverFill, selected, onEnter, onLeave, onSelect }) {
  return (
    <Geography
      geography={geo}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onSelect}
      style={{
        default: {
          fill,
          stroke: selected ? COLORS.selected : COLORS.stroke,
          strokeWidth: selected ? 1.6 : 0.5,
          outline: "none",
          transition: "fill 0.2s ease",
          cursor: "pointer",
        },
        hover: { fill: hoverFill, stroke: selected ? COLORS.selected : COLORS.stroke, strokeWidth: selected ? 1.6 : 0.8, outline: "none", cursor: "pointer" },
        pressed: { fill: hoverFill, outline: "none" },
      }}
    />
  );
});

const Map = () => {
  const { t, i18n } = useTranslation("homepage/Map");
  const isPhone = useMediaQuery("(max-width: 640px)");
  const canHover = useMediaQuery("(hover: hover)");

  const list = useMemo(() => provinceList(mtiProvinces), []);
  const totals = useMemo(() => provinceTotals(mtiProvinces), []);
  const [selected, setSelected] = useState(() => list[0]?.name || null);
  const [hovered, setHovered] = useState(null);
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.5 });

  // Phones zoom in on where the programs are; wider screens show all of Indonesia.
  const { projection, height } = useMemo(() => {
    const active = ALL_PROVINCES.filter((f) => mtiProvinces[f.properties.PROVINSI]);
    return isPhone && active.length ? fitToWidth(active, 40) : fitToWidth(ALL_PROVINCES, 16);
  }, [isPhone]);

  const markers = useMemo(
    () =>
      ALL_PROVINCES.filter((f) => mtiProvinces[f.properties.PROVINSI]).map((f) => {
        const name = f.properties.PROVINSI;
        return { name, coordinates: geoCentroid(f), programs: list.find((p) => p.name === name)?.programs || 0 };
      }),
    [list]
  );

  const select = (name) => {
    setSelected(name);
    setHovered(null);
  };

  // On a mouse, hovering previews a province; a tap or click keeps it.
  const shownName = (canHover && hovered) || selected;
  const shown = shownName ? list.find((p) => p.name === shownName) || { name: shownName, inactive: true } : null;
  const k = isPhone ? 1.8 : 1; // keeps pins finger-sized when the map is scaled down
  const rtl = i18n.language === "ar";

  const stats = [
    { value: totals.provinces, label: t("stat_provinces") },
    { value: totals.locations, label: t("stat_locations") },
    { value: totals.islands, label: t("stat_islands") },
  ];

  return (
    <section className={styles.section} dir={rtl ? "rtl" : "ltr"} id="map">
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <span className={styles.eyebrow}>{t("eyebrow")}</span>
        <h2 className={styles.title}>{t("title")}</h2>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </motion.div>

      <div className={styles.stats} ref={statsRef}>
        {stats.map((s) => (
          <div className={styles.stat} key={s.label}>
            {statsInView ? (
              <CountUp end={s.value} duration={2} className={styles.statValue} />
            ) : (
              <span className={styles.statValue}>0</span>
            )}
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.board}>
        <motion.div
          className={styles.mapPanel}
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <ComposableMap projection={projection} width={WIDTH} height={height} className={styles.svg}>
            <Geographies geography={PROVINCE_COLLECTION}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name = geo.properties.PROVINSI;
                  const data = list.find((p) => p.name === name);
                  const ratio = data ? (totals.maxPrograms > 1 ? (data.programs - 1) / (totals.maxPrograms - 1) : 1) : 0;
                  return (
                    <Province
                      key={geo.rsmKey}
                      geo={geo}
                      fill={data ? shade(ratio) : COLORS.inactive}
                      hoverFill={data ? shade(Math.min(1, ratio + 0.25)) : COLORS.inactiveHover}
                      selected={name === selected}
                      onEnter={canHover ? () => setHovered(name) : undefined}
                      onLeave={canHover ? () => setHovered(null) : undefined}
                      onSelect={() => select(name)}
                    />
                  );
                })
              }
            </Geographies>

            {markers.map((m) => (
              <Marker key={m.name} coordinates={m.coordinates} onClick={() => select(m.name)}>
                <g className={styles.marker} style={{ cursor: "pointer" }}>
                  <circle r={11 * k} className={styles.pulse} />
                  <circle
                    r={(9 + Math.min(m.programs, 9) * 0.5) * k}
                    className={`${styles.pin} ${m.name === selected ? styles.pinSelected : ""}`}
                  />
                  <text textAnchor="middle" dy="0.35em" className={styles.pinText} style={{ fontSize: 10 * k }}>
                    {m.programs}
                  </text>
                </g>
              </Marker>
            ))}
          </ComposableMap>

          <div className={styles.mapFooter}>
            <span className={styles.hint}>
              <IconPointer size={14} /> {t("hint")}
            </span>
            <span className={styles.legend}>
              <span className={styles.legendLabel}>{t("legend_low")}</span>
              <span className={styles.legendScale} />
              <span className={styles.legendLabel}>{t("legend_high")}</span>
              <span className={styles.legendSwatch} />
              <span className={styles.legendLabel}>{t("legend_inactive")}</span>
            </span>
          </div>
        </motion.div>

        <div className={styles.chips} role="list">
          {list.map((p) => (
            <button
              type="button"
              role="listitem"
              key={p.name}
              className={`${styles.chip} ${p.name === selected ? styles.chipOn : ""}`}
              onClick={() => select(p.name)}
              aria-pressed={p.name === selected}
            >
              <span>{getDisplayName(p.name)}</span>
              <span className={styles.chipCount}>{p.programs}</span>
            </button>
          ))}
        </div>

        <aside className={styles.detail} aria-live="polite">
          {/* swaps at once and fades in, so the card is never left empty */}
          {shown && (
              <motion.div
                key={shown.name}
                initial={{ opacity: 0.4, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {shown.inactive ? (
                  <div className={styles.empty}>
                    <IconMapPinOff size={28} />
                    <h3 className={styles.detailTitle}>{shown.name}</h3>
                    <p className={styles.emptyTitle}>{t("no_program_title")}</p>
                    <p className={styles.emptyText}>{t("no_program_text", { province: shown.name })}</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.detailHead}>
                      <div>
                        <h3 className={styles.detailTitle}>{getDisplayName(shown.name)}</h3>
                        {shown.island && <span className={styles.island}>{shown.island}</span>}
                      </div>
                      <div className={styles.bigNumber}>
                        <strong>{shown.programs}</strong>
                        <span>{t("stat_locations")}</span>
                      </div>
                    </div>

                    {shown.participants ? (
                      <p className={styles.participants}>
                        {t("participants")}: <strong>{shown.participants}</strong>
                      </p>
                    ) : null}

                    <p className={styles.listTitle}>{t("locations_title")}</p>
                    <ul className={styles.locations}>
                      {(shown.locations || []).map((loc, i) => (
                        <li key={`${loc.city}-${i}`}>
                          {loc.institution ? <IconBuildingCommunity size={18} /> : <IconMapPin size={18} />}
                          <div>
                            {loc.institution && <span className={styles.institution}>{loc.institution}</span>}
                            <span className={styles.city}>{loc.city}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </motion.div>
          )}
        </aside>
      </div>
    </section>
  );
};

export default Map;
