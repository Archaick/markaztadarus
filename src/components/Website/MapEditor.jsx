import { useMemo, useState } from "react";
import {
  Accordion,
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
import { IconBuildingCommunity, IconMapPin, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import topoData from "../../data/indonesia-provinces.topo.json";
import { mtiProvinces, programCount } from "../../data/mtiProvinceData";
import { SITE_DOCS } from "../HomePage/siteContent";
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

const emptyLocation = () => ({ city: "", institution: "" });
const NO_ROWS = [];

// Stored { [province]: {...} } ↔ editor rows sorted by name.
const toRows = (provinces) =>
  Object.entries(provinces || {})
    .map(([name, d]) => ({
      name,
      island: d.island || "",
      programs: Number.isFinite(d.programs) ? d.programs : "",
      participants: Number.isFinite(d.participants) ? d.participants : "",
      locations: (d.locations || []).map((l) => ({ city: l.city || "", institution: l.institution || "" })),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

const toDraft = (stored) => toRows(stored?.provinces || mtiProvinces);

const problemIn = (rows) => {
  for (const row of rows) {
    if (row.locations.some((l) => !l.city.trim() && l.institution.trim())) return { key: "noCity", province: row.name };
    if ((row.programs !== "" && row.programs < 0) || (row.participants !== "" && row.participants < 0)) {
      return { key: "badNumber", province: row.name };
    }
  }
  return null;
};

const toStored = (rows) =>
  Object.fromEntries(
    rows.map((row) => {
      const data = {
        island: row.island.trim(),
        locations: row.locations
          .map((l) => ({ city: l.city.trim(), institution: l.institution.trim() }))
          .filter((l) => l.city),
      };
      if (row.programs !== "") data.programs = Number(row.programs);
      if (row.participants !== "") data.participants = Number(row.participants);
      return [row.name, data];
    })
  );

export default function MapEditor({ editorEmail }) {
  const { t } = useTranslation("internal/Website");
  const site = useSiteDraft(SITE_DOCS.map, toDraft, editorEmail);
  const rows = site.draft || NO_ROWS;
  const [open, setOpen] = useState([]);
  const [adding, setAdding] = useState(null);
  const [message, setMessage] = useState(null);

  const available = useMemo(
    () => ALL_PROVINCE_NAMES.filter((name) => !rows.some((r) => r.name === name)),
    [rows]
  );

  const totals = useMemo(
    () => ({
      provinces: rows.length,
      locations: rows.reduce(
        (sum, r) => sum + programCount({ programs: r.programs === "" ? 0 : r.programs, locations: r.locations }),
        0
      ),
    }),
    [rows]
  );

  const update = (name, patch) =>
    site.setDraft((current) => current.map((r) => (r.name === name ? { ...r, ...patch } : r)));

  const setLocation = (name, index, patch) =>
    site.setDraft((current) =>
      current.map((r) =>
        r.name === name ? { ...r, locations: r.locations.map((l, i) => (i === index ? { ...l, ...patch } : l)) } : r
      )
    );

  const addProvince = () => {
    if (!adding) return;
    site.setDraft((current) =>
      [...current, { name: adding, island: "", programs: "", participants: "", locations: [emptyLocation()] }].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
    setOpen((current) => [...current, adding]);
    setAdding(null);
  };

  const removeProvince = (name) => {
    site.setDraft((current) => current.filter((r) => r.name !== name));
    setOpen((current) => current.filter((n) => n !== name));
  };

  const save = async () => {
    setMessage(null);
    const problem = problemIn(rows);
    if (problem) {
      setMessage({ color: "red", text: t(`map.problems.${problem.key}`, { province: problem.province }) });
      setOpen((current) => (current.includes(problem.province) ? current : [...current, problem.province]));
      return;
    }
    const ok = await site.save({ provinces: toStored(rows) });
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
          {t("map.summary", totals)}
        </Text>
        <Group gap="xs" className={styles.addRow}>
          <Select
            placeholder={t("map.pickProvince")}
            data={available}
            value={adding}
            onChange={setAdding}
            searchable
            clearable
            className={styles.addSelect}
            comboboxProps={{ withinPortal: true }}
          />
          <Button leftSection={<IconPlus size={16} />} disabled={!adding} onClick={addProvince} className={styles.goldButton}>
            {t("map.addProvince")}
          </Button>
        </Group>
      </div>

      {rows.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          {t("map.empty")}
        </Text>
      ) : (
        <Accordion multiple value={open} onChange={setOpen} variant="separated" radius="md" className={styles.accordion}>
          {rows.map((row) => {
            const count = programCount({ programs: row.programs === "" ? 0 : row.programs, locations: row.locations });
            return (
              <Accordion.Item key={row.name} value={row.name}>
                <Accordion.Control>
                  <div className={styles.provinceHead}>
                    <span className={styles.provinceName}>{row.name}</span>
                    {row.island && <span className={styles.provinceIsland}>{row.island}</span>}
                    <Badge color="yellow" variant="light" className={styles.provinceCount}>
                      {t("map.count", { count })}
                    </Badge>
                  </div>
                </Accordion.Control>
                <Accordion.Panel>
                  <div className={styles.fieldGrid}>
                    <Autocomplete
                      label={t("map.island")}
                      data={ISLANDS}
                      value={row.island}
                      onChange={(island) => update(row.name, { island })}
                      comboboxProps={{ withinPortal: true }}
                    />
                    <NumberInput
                      label={t("map.programs")}
                      description={t("map.programsHint")}
                      min={0}
                      allowDecimal={false}
                      placeholder={String(row.locations.filter((l) => l.city.trim()).length)}
                      value={row.programs}
                      onChange={(programs) => update(row.name, { programs })}
                    />
                    <NumberInput
                      label={`${t("map.participants")} (${t("optional")})`}
                      min={0}
                      allowDecimal={false}
                      thousandSeparator="."
                      decimalSeparator=","
                      value={row.participants}
                      onChange={(participants) => update(row.name, { participants })}
                    />
                  </div>

                  <Text className={styles.sectionLabel}>{t("map.locations")}</Text>
                  <div className={styles.locationList}>
                    {row.locations.map((loc, i) => (
                      <div className={styles.locationRow} key={i}>
                        <TextInput
                          leftSection={<IconMapPin size={15} />}
                          placeholder={t("map.city")}
                          aria-label={t("map.city")}
                          value={loc.city}
                          onChange={(e) => setLocation(row.name, i, { city: e.target.value })}
                          className={styles.cityInput}
                        />
                        <TextInput
                          leftSection={<IconBuildingCommunity size={15} />}
                          placeholder={t("map.institutionPlaceholder")}
                          aria-label={t("map.institution")}
                          value={loc.institution}
                          onChange={(e) => setLocation(row.name, i, { institution: e.target.value })}
                          className={styles.institutionInput}
                        />
                        <Tooltip label={t("map.removeLocation")}>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            aria-label={t("map.removeLocation")}
                            onClick={() =>
                              update(row.name, { locations: row.locations.filter((_, idx) => idx !== i) })
                            }
                          >
                            <IconX size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </div>
                    ))}
                  </div>

                  <Group justify="space-between" mt="sm">
                    <Button
                      variant="light"
                      color="yellow"
                      size="xs"
                      leftSection={<IconPlus size={14} />}
                      onClick={() => update(row.name, { locations: [...row.locations, emptyLocation()] })}
                    >
                      {t("map.addLocation")}
                    </Button>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => removeProvince(row.name)}
                    >
                      {t("map.removeProvince")}
                    </Button>
                  </Group>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}

      <SaveBar
        dirty={site.dirty}
        canSave={site.dirty || site.fromBuiltIn}
        saving={site.saving}
        message={message}
        onDismiss={() => setMessage(null)}
        onDiscard={() => {
          site.discard();
          setMessage(null);
        }}
        onSave={save}
      />
    </div>
  );
}
