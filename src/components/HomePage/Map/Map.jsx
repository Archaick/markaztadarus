import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import CountUp from "react-countup";
import { Modal } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconHandFinger, IconPointer, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./Map.module.css";
import MapCanvas from "./MapCanvas";
import { ALL_PROVINCES, WIDTH, fitProjection } from "./mapGeometry";
import { ProvinceChips, ProvinceDetail } from "./ProvinceDetail";
import { mtiProvinces, provinceList, provinceTotals } from "../../../data/mtiProvinceData";
import { SITE_DOCS, useSiteContent } from "../siteContent";

const Map = () => {
  const { t, i18n } = useTranslation("homepage/Map");
  const isPhone = useMediaQuery("(max-width: 640px)");
  const canHover = useMediaQuery("(hover: hover)");

  // Provinces come from the Website dashboard once an admin has saved them.
  const stored = useSiteContent(SITE_DOCS.map);
  const provinces =
    stored?.provinces && Object.keys(stored.provinces).length ? stored.provinces : mtiProvinces;

  const list = useMemo(() => provinceList(provinces), [provinces]);
  const totals = useMemo(() => provinceTotals(provinces), [provinces]);
  const [selected, setSelected] = useState(() => list[0]?.name || null);
  const [picked, setPicked] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Until the visitor picks one, keep the busiest province selected as data arrives.
  useEffect(() => {
    if (!picked) setSelected(list[0]?.name || null);
  }, [list, picked]);

  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.5 });

  // Phones zoom in on where the programs are; wider screens show all of Indonesia.
  const { projection, height } = useMemo(() => {
    const active = ALL_PROVINCES.filter((f) => provinces[f.properties.PROVINSI]);
    return isPhone && active.length ? fitProjection(active, 40) : fitProjection(ALL_PROVINCES, 16);
  }, [isPhone, provinces]);

  const select = useCallback((name) => {
    setSelected(name);
    setPicked(true);
    setHovered(null);
  }, []);

  // On a mouse, hovering previews a province; a tap or click keeps it.
  const shownOf = (name) => (name ? list.find((p) => p.name === name) || { name, inactive: true } : null);
  const shown = shownOf((canHover && hovered) || selected);
  const rtl = i18n.language === "ar";

  const stats = [
    { value: totals.provinces, label: t("stat_provinces") },
    { value: totals.locations, label: t("stat_locations") },
    { value: totals.islands, label: t("stat_islands") },
  ];

  const shared = { list, provinces, totals, selected };

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
          <MapCanvas
            {...shared}
            projection={projection}
            height={height}
            onSelect={select}
            onHover={canHover ? setHovered : undefined}
            pinScale={isPhone ? 1.8 : 1}
            onExpand={() => setExpanded(true)}
          />

          <div className={styles.mapFooter}>
            <span className={styles.hint}>
              {canHover ? <IconPointer size={14} /> : <IconHandFinger size={14} />}{" "}
              {canHover ? t("hint_mouse") : t("hint_touch")}
            </span>
            <Legend />
          </div>
        </motion.div>

        <ProvinceChips {...shared} onPick={select} />

        <aside className={styles.detail} aria-live="polite">
          <ProvinceDetail shown={shown} provinces={provinces} />
        </aside>
      </div>

      <ExpandedMap
        opened={expanded}
        onClose={() => setExpanded(false)}
        {...shared}
        onSelect={select}
        shown={shownOf(selected)}
        rtl={rtl}
      />
    </section>
  );
};

function Legend() {
  const { t } = useTranslation("homepage/Map");
  return (
    <span className={styles.legend}>
      <span className={styles.legendLabel}>{t("legend_low")}</span>
      <span className={styles.legendScale} />
      <span className={styles.legendLabel}>{t("legend_high")}</span>
      <span className={styles.legendSwatch} />
      <span className={styles.legendLabel}>{t("legend_inactive")}</span>
    </span>
  );
}

// Size of an element, measured as soon as it mounts and again on resize.
function useBoxSize() {
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

// Full-screen map: every gesture moves the map, and picking a province from
// the chips flies to it.
function ExpandedMap({ opened, onClose, list, provinces, totals, selected, onSelect, shown, rtl }) {
  const { t } = useTranslation("homepage/Map");
  const isPhone = useMediaQuery("(max-width: 640px)");
  const { ref, width, height } = useBoxSize();
  const canvasRef = useRef(null);

  // Fit Indonesia to whatever shape the screen gives the map.
  const fit = useMemo(() => {
    if (!width || !height) return null;
    const h = Math.max(240, Math.round((WIDTH * height) / width));
    return fitProjection(ALL_PROVINCES, 24, h);
  }, [width, height]);

  const pick = (name) => {
    onSelect(name);
    canvasRef.current?.focus(name, isPhone ? 3.5 : 3);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      zIndex={1200} // above the site's fixed navbar (z-index 1000)
      classNames={{ content: styles.expanded, body: styles.expandedBody }}
      transitionProps={{ transition: "fade", duration: 150 }}
    >
      <div className={styles.expandedLayout} dir={rtl ? "rtl" : "ltr"}>
        <header className={styles.expandedHeader}>
          <div>
            <span className={styles.expandedEyebrow}>{t("eyebrow")}</span>
            <h2 className={styles.expandedTitle}>{t("title")}</h2>
          </div>
          <button type="button" className={styles.expandedClose} onClick={onClose} aria-label={t("close")}>
            <IconX size={22} />
          </button>
        </header>

        <div className={styles.expandedMain}>
          <div className={styles.expandedMap} ref={ref}>
            {fit && (
              <MapCanvas
                ref={canvasRef}
                list={list}
                provinces={provinces}
                totals={totals}
                selected={selected}
                projection={fit.projection}
                height={fit.height}
                onSelect={onSelect}
                pinScale={isPhone ? 1.6 : 1}
                free
              />
            )}
          </div>

          <div className={styles.expandedSide}>
            <ProvinceChips
              list={list}
              provinces={provinces}
              selected={selected}
              onPick={pick}
              className={styles.expandedChips}
            />
            <div className={styles.expandedDetail} aria-live="polite">
              <ProvinceDetail shown={shown} provinces={provinces} />
            </div>
            <div className={styles.expandedLegend}>
              <Legend />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default Map;
