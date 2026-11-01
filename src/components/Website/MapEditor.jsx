import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Alert,
  Autocomplete,
  Badge,
  Button,
  Group,
  Loader,
  NumberInput,
  Select,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconBuildingCommunity,
  IconCircleCheck,
  IconCircleX,
  IconClick,
  IconCurrentLocation,
  IconMapPin,
  IconMapPinOff,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import topoData from "../../data/indonesia-provinces.topo.json";
import { mtiProvinces, programCount } from "../../data/mtiProvinceData";
import { formatCoords, inIndonesia, parseCoords } from "../../data/coords";
import { SITE_DOCS } from "../HomePage/siteContent";
import MapGlobe from "../HomePage/Map/MapGlobe";
import { ALL_PROVINCES } from "../HomePage/Map/mapGeometry";
import SessionFields from "../Global/SessionFields";
import { badTime, badUrl, newId, publicSession, usePrivateLinks } from "../Global/liveSessions";
import { useSiteDraft } from "./useSiteDraft";
import SaveBar from "./SaveBar";
import styles from "./Website.module.css";

const ALL_PROVINCE_NAMES = topoData.objects["indonesia-38-prov-topo"].geometries
  .map((g) => g.properties.PROVINSI)
  .sort((a, b) => a.localeCompare(b));

const ISLANDS = [
  "Sumatera",
  "Pulau Jawa",
  "Kalimantan",
  "Pulau Sulawesi",
  "Bali",
  "Nusa Tenggara",
  "Maluku",
  "Papua",
  "Kep. Bangka Belitung",
  "Kepulauan Riau",
];

// The whole country, framed once for the preview.

const emptyLocation = () => ({ id: newId("p"), city: "", institution: "", coords: "", session: null });
// places saved before they had ids get a steady one from where they are
const idFor = (province, i) => `p-${province.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i}`;
const NO_LINK = () => "";
const NO_ROWS = [];

// Stored { [province]: {...} } ↔ editor rows sorted by name.
const toRows = (provinces) =>
  Object.entries(provinces || {})
    .map(([name, d]) => ({
      name,
      island: d.island || "",
      programs: Number.isFinite(d.programs) ? d.programs : "",
      participants: Number.isFinite(d.participants) ? d.participants : "",
      locations: (d.locations || []).map((l, i) => ({
        id: l.id || idFor(name, i),
        city: l.city || "",
        institution: l.institution || "",
        coords: formatCoords(l),
        session: l.session || null,
      })),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

const toDraft = (stored) => toRows(stored?.provinces || mtiProvinces);

// "" when empty, "ok", "bad" (not readable) or "outside" (not in Indonesia)
const coordsState = (text) => {
  if (!text.trim()) return "";
  const point = parseCoords(text);
  if (!point) return "bad";
  return inIndonesia(point) ? "ok" : "outside";
};

const problemIn = (rows, zoomOf) => {
  for (const row of rows) {
    if (row.locations.some((l) => l.session && (badUrl(l.session.activity) || badUrl(zoomOf(l.id)) || badTime(l.session)))) {
      return { key: "badSession", province: row.name };
    }
    if (row.locations.some((l) => !l.city.trim() && l.institution.trim())) return { key: "noCity", province: row.name };
    if (row.locations.some((l) => coordsState(l.coords) === "bad")) return { key: "badCoords", province: row.name };
    if (row.locations.some((l) => coordsState(l.coords) === "outside")) return { key: "outsideCoords", province: row.name };
    if ((row.programs !== "" && row.programs < 0) || (row.participants !== "" && row.participants < 0)) {
      return { key: "badNumber", province: row.name };
    }
  }
  return null;
};

// `zoomOf(id)`: a place's Zoom link, copied in only when it may show on /global
const toStored = (rows, zoomOf = NO_LINK) =>
  Object.fromEntries(
    rows.map((row) => {
      const data = {
        island: row.island.trim(),
        locations: row.locations
          .map((l) => {
            const place = { id: l.id, city: l.city.trim(), institution: l.institution.trim() };
            const point = parseCoords(l.coords);
            const session = publicSession(l.session, zoomOf(l.id));
            return { ...place, ...(point || {}), ...(session && { session }) };
          })
          .filter((l) => l.city),
      };
      if (row.programs !== "") data.programs = Number(row.programs);
      if (row.participants !== "") data.participants = Number(row.participants);
      return [row.name, data];
    })
  );

const countOf = (row) => programCount({ programs: row.programs === "" ? 0 : row.programs, locations: row.locations });

/**
 * The home-page map (Indonesia's provinces), editable inside Tadarus Global: tap a province on the map (or pick it below)
 * and change it in the panel beside it. The map redraws as you type, so the
 * result is visible before it is saved.
 */
// `onPreview(provinces)`: the edits as the map shows them, for another globe on the page
export default function MapEditor({ editorEmail, onDirty, onPreview }) {
  const { t } = useTranslation("internal/Website");
  const site = useSiteDraft(SITE_DOCS.map, toDraft, editorEmail, "global");
  const links = usePrivateLinks("p");
  const dirty = site.dirty || links.dirty;
  const rows = site.draft || NO_ROWS;
  const [selected, setSelected] = useState(null);
  const [focusPlace, setFocusPlace] = useState(null); // location index tapped on the map
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState("");
  const panelRef = useRef(null);

  // What the home page would show with these edits.
  const preview = useMemo(() => toStored(rows), [rows]);
  const row = rows.find((r) => r.name === selected) || null;

  useEffect(() => {
    if (!site.loading) onPreview?.(preview);
  }, [preview, site.loading, onPreview]);

  useEffect(() => {
    onDirty?.(dirty);
  }, [dirty, onDirty]);

  const summary = useMemo(
    () => ({ provinces: rows.length, locations: rows.reduce((sum, r) => sum + countOf(r), 0) }),
    [rows]
  );

  const select = (name, placeIndex = null) => {
    setSelected(name);
    setFocusPlace(placeIndex);
    // when the panel sits under the map (a narrow page): bring it into view
    const panel = panelRef.current;
    if (panel && panel.previousElementSibling && panel.offsetTop > panel.previousElementSibling.offsetTop + 20) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  useEffect(() => {
    if (focusPlace === null) return undefined;
    const timer = setTimeout(() => setFocusPlace(null), 2400);
    return () => clearTimeout(timer);
  }, [focusPlace]);

  const update = (name, patch) =>
    site.setDraft((current) => current.map((r) => (r.name === name ? { ...r, ...patch } : r)));

  const setLocation = (name, index, patch) =>
    site.setDraft((current) =>
      current.map((r) =>
        r.name === name ? { ...r, locations: r.locations.map((l, i) => (i === index ? { ...l, ...patch } : l)) } : r
      )
    );

  const addProvince = (name) =>
    site.setDraft((current) =>
      [...current, { name, island: "", programs: "", participants: "", locations: [emptyLocation()] }].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );

  const removeProvince = (name) => {
    if (!window.confirm(t("map.removeConfirm", { province: name }))) return;
    site.setDraft((current) => current.filter((r) => r.name !== name));
  };

  const save = async () => {
    setMessage(null);
    const problem = problemIn(rows, links.value);
    if (problem) {
      setMessage({ color: "red", text: t(`map.problems.${problem.key}`, { province: problem.province }) });
      select(problem.province);
      return;
    }
    const ids = rows.flatMap((r) => r.locations.filter((l) => l.city.trim()).map((l) => l.id));
    const ok = await site.save({ provinces: toStored(rows, links.value) }, (batch, auditId) => links.write(batch, auditId, ids));
    if (ok) links.done();
    setMessage(ok ? { color: "teal", text: t("saved") } : { color: "red", text: t("saveFailed") });
  };

  if (site.loading) {
    return (
      <Group justify="center" py="xl">
        <Loader size="sm" />
      </Group>
    );
  }

  return (
    <div className={styles.editor}>
      {site.loadFailed && <Alert color="red">{t("loadFailed")}</Alert>}
      {site.fromBuiltIn && <Alert color="blue">{t("builtIn")}</Alert>}

      <div className={styles.toolbar}>
        <Text fw={700} className={styles.summary}>
          {t("map.summary", summary)}
        </Text>
        <Select
          placeholder={t("map.search")}
          leftSection={<IconSearch size={15} />}
          data={ALL_PROVINCE_NAMES}
          value={null}
          onChange={(name) => {
            if (!name) return;
            select(name);
            setSearch("");
          }}
          searchValue={search}
          onSearchChange={setSearch}
          searchable
          className={styles.addSelect}
          comboboxProps={{ withinPortal: true }}
        />
      </div>

      <div className={styles.mapLayout}>
        <div className={styles.mapSide}>
          <div className={styles.mapBox}>
            <MapGlobe page fit={ALL_PROVINCES} provinces={preview} selectedProvince={selected} onProvince={select} />
          </div>
          <p className={styles.mapHint}>
            <IconClick size={14} /> {t("map.tapHint")}
          </p>
          <div className={styles.chips}>
            {rows.map((r) => (
              <button
                type="button"
                key={r.name}
                className={`${styles.chip} ${r.name === selected ? styles.chipOn : ""}`}
                onClick={() => select(r.name)}
              >
                {r.name} <span>{countOf(r)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.panel} ref={panelRef}>
          {!selected && (
            <div className={styles.panelEmpty}>
              <IconClick size={30} />
              <Text fw={700}>{t("map.pickTitle")}</Text>
              <Text size="sm" c="dimmed">
                {t("map.pickText")}
              </Text>
            </div>
          )}

          {selected && !row && (
            <div className={styles.panelEmpty}>
              <IconMapPinOff size={30} />
              <Text fw={700}>{selected}</Text>
              <Text size="sm" c="dimmed">
                {t("map.notActive")}
              </Text>
              <Button
                mt="sm"
                leftSection={<IconPlus size={16} />}
                className={styles.goldButton}
                onClick={() => addProvince(selected)}
              >
                {t("map.addThis")}
              </Button>
            </div>
          )}

          {row && (
            <ProvinceForm
              row={row}
              focusPlace={focusPlace}
              onUpdate={(patch) => update(row.name, patch)}
              onSetLocation={(i, patch) => setLocation(row.name, i, patch)}
              zoomOf={links.value}
              onZoom={links.set}
              onRemove={() => removeProvince(row.name)}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
      </div>

      <SaveBar
        dirty={dirty}
        canSave={dirty || site.fromBuiltIn}
        saving={site.saving}
        message={message}
        onDismiss={() => setMessage(null)}
        onDiscard={() => {
          site.discard();
          links.discard();
          setMessage(null);
        }}
        onSave={save}
      />
    </div>
  );
}

// Everything about one province: its island, numbers and the places in it.
function ProvinceForm({ row, focusPlace, onUpdate, onSetLocation, zoomOf, onZoom, onRemove, onClose }) {
  const { t } = useTranslation("internal/Website");
  const count = countOf(row);

  return (
    <div className={styles.provinceForm}>
      <div className={styles.panelHead}>
        <div>
          <h3 className={styles.panelTitle}>{row.name}</h3>
          <Badge color="yellow" variant="light">
            {t("map.count", { count })}
          </Badge>
        </div>
        <ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label={t("map.close")}>
          <IconX size={18} />
        </ActionIcon>
      </div>

      <div className={styles.fieldGrid3}>
        <Autocomplete
          label={t("map.island")}
          data={ISLANDS}
          value={row.island}
          onChange={(island) => onUpdate({ island })}
          comboboxProps={{ withinPortal: true }}
        />
        <NumberInput
          label={t("map.programs")}
          description={t("map.programsHint")}
          min={0}
          allowDecimal={false}
          placeholder={String(row.locations.filter((l) => l.city.trim()).length)}
          value={row.programs}
          onChange={(programs) => onUpdate({ programs })}
        />
        <NumberInput
          label={`${t("map.participants")} (${t("optional")})`}
          min={0}
          allowDecimal={false}
          thousandSeparator="."
          decimalSeparator=","
          value={row.participants}
          onChange={(participants) => onUpdate({ participants })}
        />
      </div>

      <Text className={styles.sectionLabel}>{t("map.locations")}</Text>
      <div className={styles.placeList}>
        {row.locations.map((loc, i) => (
          <div className={`${styles.placeCard} ${focusPlace === i ? styles.placeFocus : ""}`} key={i}>
            <div className={styles.placeTop}>
              <span className={styles.placeNumber}>{i + 1}</span>
              <Tooltip label={t("map.removeLocation")}>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label={t("map.removeLocation")}
                  onClick={() => onUpdate({ locations: row.locations.filter((_, idx) => idx !== i) })}
                >
                  <IconX size={15} />
                </ActionIcon>
              </Tooltip>
            </div>
            <TextInput
              leftSection={<IconMapPin size={15} />}
              placeholder={t("map.city")}
              aria-label={t("map.city")}
              value={loc.city}
              onChange={(e) => onSetLocation(i, { city: e.target.value })}
            />
            <TextInput
              leftSection={<IconBuildingCommunity size={15} />}
              placeholder={t("map.institutionPlaceholder")}
              aria-label={t("map.institution")}
              value={loc.institution}
              onChange={(e) => onSetLocation(i, { institution: e.target.value })}
            />
            <CoordsInput value={loc.coords} onChange={(coords) => onSetLocation(i, { coords })} />
            <SessionFields session={loc.session} onChange={(session) => onSetLocation(i, { session })} zoom={zoomOf(loc.id)} onZoom={(url) => onZoom(loc.id, url)} />
          </div>
        ))}
      </div>

      <Text size="xs" c="dimmed" mt={6}>
        {t("map.coordsHint")}
      </Text>

      <Group justify="space-between" mt="sm">
        <Button
          variant="light"
          color="yellow"
          size="xs"
          leftSection={<IconPlus size={14} />}
          onClick={() => onUpdate({ locations: [...row.locations, emptyLocation()] })}
        >
          {t("map.addLocation")}
        </Button>
        <Button variant="subtle" color="red" size="xs" leftSection={<IconTrash size={14} />} onClick={onRemove}>
          {t("map.removeProvince")}
        </Button>
      </Group>
    </div>
  );
}

// A place's position: paste coordinates or a Google Maps link; on leaving the
// field it is tidied into plain numbers.
function CoordsInput({ value, onChange }) {
  const { t } = useTranslation("internal/Website");
  const state = coordsState(value);
  return (
    <TextInput
      leftSection={<IconCurrentLocation size={15} />}
      rightSection={
        state === "ok" ? (
          <IconCircleCheck size={16} color="var(--mantine-color-teal-6)" />
        ) : state ? (
          <Tooltip label={t(`map.coords_${state}`)}>
            <IconCircleX size={16} color="var(--mantine-color-red-6)" />
          </Tooltip>
        ) : null
      }
      placeholder={t("map.coordsPlaceholder")}
      aria-label={t("map.coords")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => {
        const point = parseCoords(value);
        if (point) onChange(formatCoords(point));
      }}
      error={state === "bad" || state === "outside"}
      dir="ltr"
    />
  );
}

