import React, { useState, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import { useTranslation } from "react-i18next";
import styles from "./Map.module.css";

// Path to TopoJSON (Renamed to .json for standard Vite import)
import topoData from "../../../data/indonesia-provinces.topo.json";
import { mtiProvinces, getDisplayName } from "../../../data/mtiProvinceData";

/* ——— colour tokens matching MTI brand ——— */
const COLORS = {
  active: "#b8960c",
  activeHover: "#d4a912",
  activeStroke: "#8a6b08",
  inactive: "#c5d5e4",
  inactiveHover: "#d0dfe9",
  inactiveStroke: "#ffffff",
  pressed: "#a07b08",
};

/* ——— Memoized single province path ——— */
const Province = memo(({ geo, isActive, data, onHoverStart, onHoverEnd }) => {
  // Use PROVINSI property from our verified TopoJSON
  const provinceName = geo.properties.PROVINSI || "Unknown";
  
  return (
    <Geography
      geography={geo}
      onMouseEnter={(evt) => {
        if (isActive) onHoverStart(evt, provinceName, data);
      }}
      onMouseMove={(evt) => {
        if (isActive) onHoverStart(evt, provinceName, data);
      }}
      onMouseLeave={onHoverEnd}
      style={{
        default: {
          fill: isActive ? COLORS.active : COLORS.inactive,
          stroke: isActive ? COLORS.activeStroke : COLORS.inactiveStroke,
          strokeWidth: isActive ? 0.6 : 0.4,
          outline: "none",
          transition: "fill 0.2s ease, stroke 0.2s ease",
          cursor: isActive ? "pointer" : "default",
        },
        hover: {
          fill: isActive ? COLORS.activeHover : COLORS.inactiveHover,
          stroke: isActive ? COLORS.activeStroke : COLORS.inactiveStroke,
          strokeWidth: isActive ? 0.8 : 0.4,
          outline: "none",
          cursor: isActive ? "pointer" : "default",
          filter: isActive
            ? "drop-shadow(0 0 4px rgba(184,150,12,0.35))"
            : "none",
        },
        pressed: {
          fill: isActive ? COLORS.pressed : COLORS.inactive,
          outline: "none",
        },
      }}
    />
  );
});

Province.displayName = "Province";

const Map = () => {
  const { t } = useTranslation("homepage/Map");
  const [tooltip, setTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    name: "",
    data: null,
  });

  const handleHoverStart = useCallback((evt, name, data) => {
    // Robust container detection for relative tooltip positioning
    const svg = evt.target.closest("svg");
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    setTooltip({
      show: true,
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
      name,
      data,
    });
  }, []);

  const handleHoverEnd = useCallback(() => {
    setTooltip((prev) => ({ ...prev, show: false }));
  }, []);

  /* pre-compute lookup set from data keys */
  const activeSet = useMemo(() => new Set(Object.keys(mtiProvinces)), []);
  const totalActive = activeSet.size;

  return (
    <div className={styles.mapContainer}>
      {/* Header */}
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <h2 className={styles.title}>{t("title")}</h2>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </motion.div>

      {/* Map Content Section */}
      <motion.div
        className={styles.mapSvgWrapper}
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [118, -2],
            scale: 850,
          }}
          width={800}
          height={400}
          style={{ width: "100%", height: "auto" }}
        >
          {/* TopoJSON integration using verified object key */}
          <Geographies geography={topoData}>
            {({ geographies }) =>
              geographies && geographies.length > 0 ? (
                geographies.map((geo) => {
                  const name = geo.properties.PROVINSI;
                  const isActive = activeSet.has(name);
                  const provinceData = isActive ? mtiProvinces[name] : null;

                  return (
                    <Province
                      key={geo.rsmKey || `geo-${name}`}
                      geo={geo}
                      isActive={isActive}
                      data={provinceData}
                      onHoverStart={handleHoverStart}
                      onHoverEnd={handleHoverEnd}
                    />
                  );
                })
              ) : (
                <text x="400" y="200" textAnchor="middle" fill="#999">
                  {t("loading_map") || "Loading map data..."}
                </text>
              )
            }
          </Geographies>
        </ComposableMap>

        {/* Tooltip Overlay */}
        <AnimatePresence>
          {tooltip.show && tooltip.data && (
            <motion.div
              className={styles.tooltip}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                left: tooltip.x,
                top: tooltip.y,
              }}
            >
              <div className={styles.tooltipHeader}>
                <div className={styles.tooltipDot}></div>
                <h4 className={styles.tooltipName}>{getDisplayName(tooltip.name)}</h4>
              </div>
              <div className={styles.tooltipDivider}></div>
              <div className={styles.tooltipBody}>
                <div className={styles.tooltipRow}>
                  <span className={styles.tooltipLabel}>{t("city")}</span>
                  <span className={styles.tooltipValue}>{tooltip.data.city}</span>
                </div>
                <div className={styles.tooltipRow}>
                  <span className={styles.tooltipLabel}>{t("island")}</span>
                  <span className={styles.tooltipValue}>{tooltip.data.island}</span>
                </div>
                <div className={styles.tooltipRow}>
                  <span className={styles.tooltipLabel}>{t("programs")}</span>
                  <span className={styles.tooltipValue}>
                    <strong>{tooltip.data.programs}</strong> {t("locations")}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Map Legend */}
      <motion.div
        className={styles.legend}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6 }}
      >
        <div className={styles.legendItem}>
          <div className={styles.legendSwatch} style={{ backgroundColor: COLORS.active }}></div>
          <span className={styles.legendText}>{t("legend_active")} ({totalActive})</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendSwatch} style={{ backgroundColor: COLORS.inactive }}></div>
          <span className={styles.legendText}>{t("legend_inactive")}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Map;