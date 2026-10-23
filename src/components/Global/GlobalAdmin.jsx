import { useMemo, useRef, useState } from "react";
import { ActionIcon, Alert, Button, Card, Loader, NumberInput, Select, Text, TextInput, Textarea, Title, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconExternalLink, IconMapPinPlus, IconTrash, IconWorld } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { AccountBar, InternalLayout } from "../Internal/InternalUI";
import layout from "../Internal/AccessControl.module.css";
import portal from "../Internal/InternalPortal.module.css";
import formStyles from "../Forms/Forms.module.css";
import websiteStyles from "../Website/Website.module.css";
import SaveBar from "../Website/SaveBar";
import { useSiteDraft } from "../Website/useSiteDraft";
import { SITE_DOCS, useSiteContent } from "../HomePage/siteContent";
import { mtiProvinces, provinceTotals } from "../../data/mtiProvinceData";
import WorldGlobe from "./WorldGlobe";
import { COUNTRIES, DEFAULT_GLOBAL, GLOBAL_DOC, countryName } from "./globalData";
import Flag from "./Flag";
import styles from "./GlobalAdmin.module.css";

const NS = "internal/Global";
const LANGS = ["id", "en", "ar"];
const MAX_CITIES = 30;

const toDraft = (stored) => JSON.parse(JSON.stringify({ countries: stored?.countries || DEFAULT_GLOBAL.countries }));
const round = (n) => Math.round(n * 10000) / 10000;

/**
 * /internal/global: which countries have Tadarus programs, their figures, a
 * note in three languages and their cities (placed by tapping the globe). The
 * globe beside the form is the public page's own, so every edit shows at once.
 */
export default function GlobalAdmin() {
  const { t, i18n } = useTranslation([NS, "internal/Internal"]);
  const lang = (i18n.language || "id").slice(0, 2);
  const { email } = useAccess();
  const site = useSiteDraft(GLOBAL_DOC, toDraft, email, "global");
  const siteMap = useSiteContent(SITE_DOCS.map);
  const provinces = siteMap?.provinces && Object.keys(siteMap.provinces).length ? siteMap.provinces : mtiProvinces;
  const indonesia = useMemo(() => provinceTotals(provinces), [provinces]);
  const [selected, setSelected] = useState("ID");
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState("");
  const globe = useRef(null);

  const countries = site.draft?.countries || {};
  const codes = Object.keys(countries).sort((a, b) => countryName(a, lang).localeCompare(countryName(b, lang)));
  const current = selected ? countries[selected] : null;

  const options = useMemo(
    () =>
      COUNTRIES.filter((c, i, all) => all.findIndex((x) => x.code === c.code) === i)
        .map((c) => ({ value: c.code, label: countryName(c.code, lang) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [lang]
  );

  const setCountries = (fn) => site.setDraft((d) => ({ ...d, countries: fn({ ...(d?.countries || {}) }) }));
  const patch = (code, change) => setCountries((all) => ({ ...all, [code]: { ...all[code], ...change } }));
  const add = (code) => {
    if (!code) return;
    setCountries((all) => (all[code] ? all : { ...all, [code]: { programs: 0, cities: [], note: { id: "", en: "", ar: "" } } }));
    setSelected(code);
  };
  const remove = (code) => {
    setCountries((all) => {
      const next = { ...all };
      delete next[code];
      return next;
    });
    setSelected(null);
    setPlacing(false);
  };

  // a tap on the globe: place a city while placing, else pick the country
  const onPoint = ([lon, lat]) => {
    if (!placing || !selected || !current) return;
    if ((current.cities || []).length >= MAX_CITIES) return;
    patch(selected, { cities: [...(current.cities || []), { name: "", lon: round(lon), lat: round(lat) }] });
  };
  const onSelect = (code) => {
    if (placing) return;
    setSelected(code);
  };

  const save = async () => {
    setMessage(null);
    const ok = await site.save(site.draft);
    setMessage(ok ? { color: "green", text: t("saved") } : { color: "red", text: t("saveFailed") });
  };

  return (
    <InternalLayout align="top">
      <div className={`${layout.page} ${websiteStyles.pageWide}`}>
        <a href="/internal" className={layout.back}>
          <IconArrowLeft size={16} className={portal.flipRtl} /> {t("internal/Internal:backToHub")}
        </a>

        <Card className={layout.panel}>
          <AccountBar />
          <div className={formStyles.headerRow}>
            <div className={layout.heading}>
              <span className={layout.headingIcon} style={{ background: "linear-gradient(135deg, #f2c94c 0%, #0a1d4a 100%)" }}>
                <IconWorld size={22} />
              </span>
              <div>
                <Title order={2} className={layout.headingTitle}>
                  {t("title")}
                </Title>
                <Text className={layout.headingText}>{t("intro")}</Text>
              </div>
            </div>
            <Button variant="light" color="yellow" component="a" href="/global" target="_blank" rel="noreferrer" rightSection={<IconExternalLink size={16} />}>
              {t("open")}
            </Button>
          </div>

          {site.loading ? (
            <Loader />
          ) : (
            <>
              {site.loadFailed && <Alert color="red" mb="md">{t("loadFailed")}</Alert>}
              {site.fromBuiltIn && <Alert color="blue" mb="md">{t("builtIn")}</Alert>}

              <div className={styles.layout}>
                <div className={styles.editor}>
                  <Select
                    label={t("add")}
                    placeholder={t("addPlaceholder")}
                    data={options.filter((o) => !countries[o.value])}
                    searchable
                    clearable
                    value={null}
                    searchValue={search}
                    onSearchChange={setSearch}
                    onChange={(code) => {
                      add(code);
                      setSearch("");
                    }}
                    nothingFoundMessage={t("noMatch")}
                    renderOption={({ option }) => (
                      <span className={styles.option}>
                        <Flag code={option.value} size={16} /> {option.label}
                      </span>
                    )}
                  />

                  <div className={styles.chips}>
                    {codes.map((code) => (
                      <button key={code} type="button" className={code === selected ? styles.chipOn : styles.chip} onClick={() => setSelected(code)}>
                        <Flag code={code} size={14} /> {countryName(code, lang)}
                      </button>
                    ))}
                  </div>

                  {selected && !current && (
                    <div className={styles.offer}>
                      <Flag code={selected} size={30} />
                      <div>
                        <b>{countryName(selected, lang)}</b>
                        <p>{t("notYet")}</p>
                        <Button size="xs" color="#0a1d4a" onClick={() => add(selected)}>
                          {t("addThis")}
                        </Button>
                      </div>
                    </div>
                  )}

                  {current && (
                    <div className={styles.card}>
                      <div className={styles.cardHead}>
                        <Flag code={selected} size={30} />
                        <h3>{countryName(selected, lang)}</h3>
                        <Tooltip label={t("remove")}>
                          <ActionIcon variant="subtle" color="red" onClick={() => remove(selected)} aria-label={t("remove")}>
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </div>

                      <NumberInput
                        label={t("programs")}
                        description={selected === "ID" ? t("programsIndonesia", { count: indonesia.locations }) : t("programsHint")}
                        min={0}
                        max={100000}
                        value={current.programs || 0}
                        onChange={(v) => patch(selected, { programs: Number(v) || 0 })}
                      />

                      <Text size="sm" fw={600} mt="md" mb={4}>
                        {t("note")}
                      </Text>
                      <div className={styles.notes}>
                        {LANGS.map((l) => (
                          <Textarea
                            key={l}
                            autosize
                            minRows={2}
                            label={t(`lang.${l}`)}
                            dir={l === "ar" ? "rtl" : "ltr"}
                            value={current.note?.[l] || ""}
                            onChange={(e) => patch(selected, { note: { ...(current.note || {}), [l]: e.currentTarget.value.slice(0, 600) } })}
                          />
                        ))}
                      </div>

                      <div className={styles.citiesHead}>
                        <Text size="sm" fw={600}>
                          {t("cities")}
                        </Text>
                        <Button
                          size="xs"
                          variant={placing ? "filled" : "light"}
                          color={placing ? "orange" : "#0a1d4a"}
                          leftSection={<IconMapPinPlus size={15} />}
                          onClick={() => {
                            setPlacing((p) => !p);
                            if (!placing) globe.current?.flyTo(selected);
                          }}
                          disabled={!placing && (current.cities || []).length >= MAX_CITIES}
                        >
                          {placing ? t("placingDone") : t("placeCity")}
                        </Button>
                      </div>
                      {placing && <Alert color="orange" p={8} mb={8}>{t("placingHint")}</Alert>}
                      {(current.cities || []).length === 0 ? (
                        <Text size="sm" c="dimmed">
                          {t("noCities")}
                        </Text>
                      ) : (
                        <ul className={styles.cities}>
                          {current.cities.map((city, i) => (
                            <li key={i}>
                              <TextInput
                                size="xs"
                                placeholder={t("cityName")}
                                value={city.name}
                                dir="auto"
                                onChange={(e) => patch(selected, { cities: current.cities.map((c, j) => (j === i ? { ...c, name: e.currentTarget.value.slice(0, 80) } : c)) })}
                              />
                              <button type="button" className={styles.coords} onClick={() => globe.current?.flyToPoint([city.lon, city.lat], 5)} title={t("showOnGlobe")}>
                                {city.lat.toFixed(2)}, {city.lon.toFixed(2)}
                              </button>
                              <ActionIcon variant="subtle" color="red" size="sm" onClick={() => patch(selected, { cities: current.cities.filter((_, j) => j !== i) })} aria-label={t("remove")}>
                                <IconTrash size={15} />
                              </ActionIcon>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <div className={`${styles.preview} ${placing ? styles.placing : ""}`}>
                  <WorldGlobe
                    ref={globe}
                    programs={countries}
                    provinces={provinces}
                    selected={selected}
                    onSelect={onSelect}
                    onPoint={onPoint}
                    autoSpin={false}
                    labels={{ makkah: "Makkah", madinah: "Madinah", quds: "Al-Quds" }}
                  />
                  <span className={styles.previewTag}>{t("preview")}</span>
                </div>
              </div>

              <SaveBar
                dirty={site.dirty}
                canSave={site.dirty || site.fromBuiltIn}
                saving={site.saving}
                message={message}
                onDismiss={() => setMessage(null)}
                onDiscard={site.discard}
                onSave={save}
              />
            </>
          )}
        </Card>
      </div>
    </InternalLayout>
  );
}
