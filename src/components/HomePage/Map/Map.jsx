import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, useInView, useMotionValue, useMotionValueEvent, useReducedMotion } from "framer-motion";
import CountUp from "react-countup";
import { Modal } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconHandFinger, IconPointer, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./Map.module.css";
import MapCanvas from "./MapCanvas";
import GlobeIntro from "./GlobeIntro";
import { ProvinceChips, ProvinceDetail } from "./ProvinceDetail";
import { ALL_PROVINCES, WIDTH, fitProjection } from "./mapGeometry";
import { useBoxSize } from "./useBoxSize";
import { mtiProvinces, provinceList, provinceTotals } from "../../../data/mtiProvinceData";
import { SITE_DOCS, useSiteContent } from "../siteContent";
import { hasCoords } from "../../../data/coords";

const FLY_IN_S = 2.6;
const FLY_OUT_S = 1.4;

const Map = () => {
  const { t, i18n } = useTranslation("homepage/Map");
  const isPhone = useMediaQuery("(max-width: 640px)");
  const isWide = useMediaQuery("(min-width: 901px)");
  const canHover = useMediaQuery("(hover: hover)");
  const reduceMotion = useReducedMotion();

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

  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.45 });
  const onScreen = useInView(sectionRef);

  // The globe flies to Indonesia on its own, but only once the map is (almost)
  // fully on screen, so it is never missed and needs no extra scrolling. Once
  // the map mostly leaves the screen, above or below, it flies back out to the
  // globe, so it plays again whenever the visitor returns. A tap skips ahead.
  const areaRef = useRef(null);
  const mapInView = useInView(areaRef, { amount: 0.8 });
  const mapMostlyGone = !useInView(areaRef, { amount: 0.35 });
  const flight = useMotionValue(0);
  const [progress, setProgress] = useState(0);
  useMotionValueEvent(flight, "change", setProgress);
  useEffect(() => {
    if (reduceMotion) return undefined;
    let controls;
    if (mapInView) {
      controls = animate(flight, 1, { duration: FLY_IN_S * (1 - flight.get()), ease: "linear" });
    } else if (mapMostlyGone) {
      controls = animate(flight, 0, { duration: FLY_OUT_S * flight.get(), ease: "linear" });
    }
    return () => controls?.stop();
  }, [mapInView, mapMostlyGone, reduceMotion, flight]);
  const skipFlight = () => {
    if (flight.get() < 1) animate(flight, 1, { duration: 0.5 * (1 - flight.get()), ease: "linear" });
  };

  // On wide screens the map fills whatever height the section leaves it;
  // on phones it zooms in on the active provinces at their natural shape.
  const box = useBoxSize();
  const fit = useMemo(() => {
    const active = ALL_PROVINCES.filter((f) => provinces[f.properties.PROVINSI]);
    if (!isWide)
      return isPhone && active.length ? fitProjection(active, 40) : fitProjection(ALL_PROVINCES, 16);
    if (!box.width || !box.height) return null;
    const h = Math.max(260, Math.round((WIDTH * box.height) / box.width));
    return fitProjection(ALL_PROVINCES, 16, h);
  }, [isWide, isPhone, provinces, box.width, box.height]);

  // Close enough to flat that the interactive map can take over.
  const showGlobe = !reduceMotion && progress < 0.985;

  // `place` is the location whose dot was clicked, to open it in the side card.
  const [place, setPlace] = useState(null);
  const select = useCallback((name, placeIndex = null) => {
    setSelected(name);
    setPlace(placeIndex);
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
  const hasPlaces = list.some((p) => (p.locations || []).some(hasCoords));

  return (
    <section className={styles.section} dir={rtl ? "rtl" : "ltr"} id="map" ref={sectionRef}>
      <header className={styles.topRow}>
        <div>
          <h2 className={styles.title}>{t("title")}</h2>
          <p className={styles.subtitle}>{t("subtitle")}</p>
        </div>
        <div className={styles.stats}>
          {stats.map((s) => (
            <div className={styles.stat} key={s.label}>
              {inView ? (
                <CountUp end={s.value} duration={2} className={styles.statValue} />
              ) : (
                <span className={styles.statValue}>0</span>
              )}
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      <div className={styles.board}>
        <div className={styles.mapPanel}>
          <div
            className={styles.mapArea}
            ref={(node) => {
              areaRef.current = node;
              if (isWide) box.ref(node);
            }}
          >
            {fit &&
              (showGlobe ? (
                <GlobeIntro
                  target={fit.projection}
                  height={fit.height}
                  provinces={provinces}
                  progress={progress}
                  spinning={onScreen}
                  onSkip={skipFlight}
                />
              ) : (
                <div className={`${styles.mapFill} ${reduceMotion ? "" : styles.mapArrive}`}>
                  <MapCanvas
                    {...shared}
                    projection={fit.projection}
                    height={fit.height}
                    onSelect={select}
                    onHover={canHover ? setHovered : undefined}
                    pinScale={isPhone ? 1.8 : 1}
                    onExpand={() => setExpanded(true)}
                  />
                </div>
              ))}
          </div>

          <div className={styles.mapFooter}>
            <span className={styles.hint}>
              {canHover ? <IconPointer size={14} /> : <IconHandFinger size={14} />}{" "}
              {canHover ? t("hint_mouse") : t("hint_touch")}
            </span>
            <Legend withPlaces={hasPlaces} />
          </div>
        </div>

        <ProvinceChips {...shared} onPick={select} className={styles.boardChips} />

        <aside className={styles.detail} aria-live="polite">
          <ProvinceDetail
            shown={shown}
            provinces={provinces}
            place={shown?.name === selected ? place : null}
            withMaps={shown?.name === selected}
          />
        </aside>
      </div>

      <ExpandedMap
        opened={expanded}
        onClose={() => setExpanded(false)}
        {...shared}
        onSelect={select}
        shown={shownOf(selected)}
        place={place}
        rtl={rtl}
      />
    </section>
  );
};

function Legend({ withPlaces = false }) {
  const { t } = useTranslation("homepage/Map");
  return (
    <span className={styles.legend}>
      {withPlaces && (
        <>
          <span className={styles.legendPlace} />
          <span className={styles.legendLabel}>{t("places_legend")}</span>
        </>
      )}
      <span className={styles.legendLabel}>{t("legend_low")}</span>
      <span className={styles.legendScale} />
      <span className={styles.legendLabel}>{t("legend_high")}</span>
      <span className={styles.legendSwatch} />
      <span className={styles.legendLabel}>{t("legend_inactive")}</span>
    </span>
  );
}

// Full-screen map: every gesture moves the map, and picking a province from
// the chips flies to it.
function ExpandedMap({ opened, onClose, list, provinces, totals, selected, onSelect, shown, place, rtl }) {
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
          <h2 className={styles.expandedTitle}>{t("title")}</h2>
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
              <ProvinceDetail shown={shown} provinces={provinces} place={place} />
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
