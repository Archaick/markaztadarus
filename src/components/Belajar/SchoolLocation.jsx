import { useRef } from "react";
import { Button, Group, Select, Text, TextInput } from "@mantine/core";
import { IconMapPinOff } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { geoContains } from "d3-geo";
import WorldGlobe from "../Global/WorldGlobe";
import { countryByCode } from "../Global/globalData";
import { CENTROIDS } from "../Global/ProvinceLayer";
import { ALL_PROVINCES } from "../HomePage/Map/mapGeometry";
import { PROVINCES, countryOptions } from "../Guru/places";
import { NS } from "./belajarSchema";
import styles from "./SchoolLocation.module.css";

const round = (n) => Math.round(n * 1e5) / 1e5;
const provinceOf = (point) => ALL_PROVINCES.find((f) => geoContains(f, point))?.properties.PROVINSI || "";

/**
 * "Lokasi sekolah": where a school is, for Tadarus Global's map. Pick the
 * country and (in Indonesia) the province, which puts the pin at its centre,
 * then tap the globe to set the pin on the school itself. `value` is
 * { country, province, city, lat, lng } or null (not on the map);
 * `onChange(next)`. Loaded on its own (the globe's shapes are heavy).
 */
export default function SchoolLocation({ value, onChange }) {
  const { t, i18n } = useTranslation(NS);
  const lang = (i18n.language || "id").slice(0, 2);
  const globe = useRef(null);
  const loc = value || { country: "ID", province: "", city: "", lat: null, lng: null };
  const pinned = Number.isFinite(loc.lat) && Number.isFinite(loc.lng);

  const set = (patch) => onChange({ ...loc, ...patch });
  const pickCountry = (country) => {
    if (!country) return;
    const at = country === "ID" ? null : countryByCode.get(country)?.centre;
    set({ country, province: "", ...(at ? { lng: round(at[0]), lat: round(at[1]) } : { lat: null, lng: null }) });
    if (at) setTimeout(() => globe.current?.flyToPoint(at, 3), 60);
  };
  const pickProvince = (province) => {
    const at = CENTROIDS[province];
    set({ province: province || "", ...(at ? { lng: round(at[0]), lat: round(at[1]) } : {}) });
    if (at) setTimeout(() => globe.current?.flyToPoint(at, 9), 60);
  };
  // a tap on the globe: the pin there, and the country (and province) it is in
  const onPoint = ([lng, lat], code) => {
    const country = code || loc.country || "ID";
    const province = country === "ID" ? provinceOf([lng, lat]) || loc.province : "";
    set({ country, province, lat: round(lat), lng: round(lng) });
  };

  return (
    <div className={styles.box}>
      <Text size="sm" fw={700}>
        {t("schoolLocation.title")}
      </Text>
      <Text size="xs" c="dimmed" mb={8}>
        {t("schoolLocation.hint")}
      </Text>
      <Group grow align="flex-start" gap="xs" mb="xs">
        <Select label={t("schoolLocation.country")} data={countryOptions(lang)} value={loc.country || "ID"} onChange={pickCountry} searchable allowDeselect={false} comboboxProps={{ withinPortal: true }} />
        {loc.country === "ID" && (
          <Select label={t("schoolLocation.province")} placeholder={t("schoolLocation.pick")} data={PROVINCES} value={loc.province || null} onChange={pickProvince} searchable comboboxProps={{ withinPortal: true }} />
        )}
      </Group>
      <TextInput label={t("schoolLocation.city")} value={loc.city || ""} onChange={(e) => set({ city: e.currentTarget.value.slice(0, 120) })} mb="xs" />
      <div className={styles.globe}>
        <WorldGlobe
          ref={globe}
          selected={loc.country || null}
          onPoint={onPoint}
          autoSpin={false}
          sky={false}
          initialView={pinned ? { lambda: -loc.lng, phi: -loc.lat, zoom: 6 } : { lambda: -118, phi: 2.5, zoom: 2.8 }}
          pin={pinned ? [loc.lng, loc.lat] : null}
          labels={{ makkah: "Makkah", madinah: "Madinah", quds: "Al-Quds" }}
        />
      </div>
      <Group justify="space-between" mt={6} gap="xs">
        <Text size="xs" c={pinned ? "teal" : "dimmed"}>
          {pinned ? t("schoolLocation.pinned", { lat: loc.lat.toFixed(4), lng: loc.lng.toFixed(4) }) : t("schoolLocation.notPinned")}
        </Text>
        {value && (
          <Button size="compact-xs" variant="subtle" color="red" leftSection={<IconMapPinOff size={14} />} onClick={() => onChange(null)}>
            {t("schoolLocation.clear")}
          </Button>
        )}
      </Group>
      <Text size="xs" c="dimmed" mt={2}>
        {t("schoolLocation.tapHint")}
      </Text>
    </div>
  );
}
