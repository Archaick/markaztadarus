import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ActionIcon, Alert, Button, Card, Loader, NumberInput, SegmentedControl, Select, Text, TextInput, Textarea, Title, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconChevronRight, IconExternalLink, IconMapPinPlus, IconTrash, IconWorld } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { AccountBar, InternalLayout } from "../Internal/InternalUI";
import layout from "../Internal/AccessControl.module.css";
import portal from "../Internal/InternalPortal.module.css";
import formStyles from "../Forms/Forms.module.css";
import websiteStyles from "../Website/Website.module.css";
import SaveBar from "../Website/SaveBar";
import MapEditor from "../Website/MapEditor";
import { useSiteDraft } from "../Website/useSiteDraft";
import { SITE_DOCS, useSiteContent } from "../HomePage/siteContent";
import { mtiProvinces, provinceTotals } from "../../data/mtiProvinceData";
import WorldGlobe from "./WorldGlobe";
import { COUNTRIES, DEFAULT_GLOBAL, GLOBAL_DOC, countryName } from "./globalData";
import Flag from "./Flag";
import SessionFields from "./SessionFields";
import { badTime, badUrl, newId, publicSession, usePrivateLinks } from "./liveSessions";
import styles from "./GlobalAdmin.module.css";

const NS = "internal/Global";
const LANGS = ["id", "en", "ar"];
const MAX_CITIES = 30;

// cities saved before they had ids get a steady one from where they are
const toDraft = (stored) => {
  const countries = JSON.parse(JSON.stringify(stored?.countries || DEFAULT_GLOBAL.countries));
  Object.entries(countries).forEach(([code, c]) => {
    c.cities = (c.cities || []).map((city, i) => ({ ...city, id: city.id || `c-${code.toLowerCase()}-${i}` }));
  });
  return { countries };
};
// what is saved: each city's session made public, its Zoom link only when it may show
const toStored = (draft, zoomOf) => ({
  countries: Object.fromEntries(
    Object.entries(draft?.countries || {}).map(([code, c]) => [
      code,
      {
        ...c,
        cities: (c.cities || []).map(({ session, ...city }) => {
          const open = publicSession(session, zoomOf(city.id));
          return open ? { ...city, session: open } : city;
        }),
      },
    ])
  ),
});
const cityIds = (draft) => Object.values(draft?.countries || {}).flatMap((c) => (c.cities || []).map((city) => city.id));
const round = (n) => Math.round(n * 10000) / 10000;

/**
 * /internal/global, on two levels. "Countries": which countries have Tadarus
 * programs, their figures and a note in three languages. "Inside a country":
 * what is in the picked one, i.e. Indonesia's provinces and partner places (the
 * home-page map; its only editor) or another
 * country's cities, placed by tapping the globe. `?country=ID&level=inside`
 * opens straight on a country. The globe is the public page's own, so every
 * edit shows at once.
 */
export default function GlobalAdmin() {
  const { t, i18n } = useTranslation([NS, "internal/Internal"]);
  const lang = (i18n.language || "id").slice(0, 2);
  const { email } = useAccess();
  const site = useSiteDraft(GLOBAL_DOC, toDraft, email, "global");
  const links = usePrivateLinks("c");
  const dirty = site.dirty || links.dirty;
  const siteMap = useSiteContent(SITE_DOCS.map);
  const provinces = siteMap?.provinces && Object.keys(siteMap.provinces).length ? siteMap.provinces : mtiProvinces;
  const indonesia = useMemo(() => provinceTotals(provinces), [provinces]);
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState(() => params.get("country") || "ID");
  const [level, setLevel] = useState(() => (params.get("level") === "inside" ? "inside" : "world"));
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState("");
  // Indonesia's editor stays mounted once opened, so moving between levels keeps its unsaved edits
  const [mapOpened, setMapOpened] = useState(false);
  const [mapDirty, setMapDirty] = useState(false);
  // Indonesia's provinces as being edited (unsaved too), so both levels show the same
  const [mapPreview, setMapPreview] = useState(null);
  const globe = useRef(null);

  const countries = site.draft?.countries || {};
  const codes = Object.keys(countries).sort((a, b) => countryName(a, lang).localeCompare(countryName(b, lang)));
  const current = selected ? countries[selected] : null;
  const inside = level === "inside" && !!current;
  const insideIndonesia = inside && selected === "ID";

  useEffect(() => {
    if (insideIndonesia) setMapOpened(true);
  }, [insideIndonesia]);

  // keep the address in step, so a reload (or a shared link) opens the same place
  useEffect(() => {
    const next = new URLSearchParams();
    if (selected) next.set("country", selected);
    if (inside) next.set("level", "inside");
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [selected, inside, params, setParams]);

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
    setLevel("world");
  };
  const goLevel = (next) => {
    setLevel(next);
    setPlacing(false);
  };

  // a tap on the globe: place a city while placing, else pick the country
  const onPoint = ([lon, lat]) => {
    if (!placing || !selected || !current) return;
    if ((current.cities || []).length >= MAX_CITIES) return;
    patch(selected, { cities: [...(current.cities || []), { id: newId("c"), name: "", lon: round(lon), lat: round(lat) }] });
  };
  const onSelect = (code) => {
    if (placing || inside) return;
    setSelected(code);
  };

  const save = async () => {
    setMessage(null);
    const bad = Object.entries(countries).find(([, c]) => (c.cities || []).some((city) => city.session && (badUrl(city.session.activity) || badUrl(links.value(city.id)) || badTime(city.session))));
    if (bad) {
      setSelected(bad[0]);
      setLevel("inside");
      setMessage({ color: "red", text: t("session.problem", { country: countryName(bad[0], lang) }) });
      return;
    }
    const ok = await site.save(toStored(site.draft, links.value), (batch, auditId) => links.write(batch, auditId, cityIds(site.draft)));
    if (ok) links.done();
    setMessage(ok ? { color: "green", text: t("saved") } : { color: "red", text: t("saveFailed") });
  };

  const dot = (dirty) => (dirty ? " ●" : "");
  const levels = (
    <SegmentedControl
      fullWidth
      radius="md"
      className={styles.levels}
      value={inside ? "inside" : "world"}
      onChange={goLevel}
      data={[
        { value: "world", label: `${t("levels.world")}${dot(dirty)}` },
        {
          value: "inside",
          disabled: !current,
          label: current ? `${t("levels.inside", { country: countryName(selected, lang) })}${dot(selected === "ID" && mapDirty)}` : t("levels.insidePick"),
        },
      ]}
    />
  );

  const preview = (
    <div className={`${styles.preview} ${placing ? styles.placing : ""}`}>
      <WorldGlobe
        ref={globe}
        programs={countries}
        provinces={mapPreview || provinces}
        selected={selected}
        onSelect={onSelect}
        onPoint={onPoint}
        autoSpin={false}
        labels={{ makkah: "Makkah", madinah: "Madinah", quds: "Al-Quds" }}
      />
      <span className={styles.previewTag}>{t("preview")}</span>
    </div>
  );

  const countryHead = (
    <div className={styles.cardHead}>
      <Flag code={selected} size={30} />
      <h3>{countryName(selected, lang)}</h3>
      <Tooltip label={t("remove")}>
        <ActionIcon variant="subtle" color="red" onClick={() => remove(selected)} aria-label={t("remove")}>
          <IconTrash size={18} />
        </ActionIcon>
      </Tooltip>
    </div>
  );

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
              {/* about the countries list, so not shown inside Indonesia (its editor says its own) */}
              {site.loadFailed && !insideIndonesia && <Alert color="red" mb="md">{t("loadFailed")}</Alert>}
              {site.fromBuiltIn && !insideIndonesia && <Alert color="blue" mb="md">{t("builtIn")}</Alert>}

              {levels}

              {/* ---------- Countries: the world level ---------- */}
              {!inside && (
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
                        {countryHead}

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

                        <button type="button" className={styles.insideLink} onClick={() => goLevel("inside")}>
                          <span>
                            <b>{t("manageInside", { country: countryName(selected, lang) })}</b>
                            <small>
                              {selected === "ID"
                                ? t("insideSummaryIndonesia", { provinces: indonesia.provinces, count: indonesia.locations })
                                : t("insideSummary", { count: (current.cities || []).length })}
                            </small>
                          </span>
                          <IconChevronRight size={18} className={portal.flipRtl} />
                        </button>
                      </div>
                    )}
                  </div>
                  {preview}
                </div>
              )}

              {/* ---------- Inside another country: its cities ---------- */}
              {inside && !insideIndonesia && (
                <div className={styles.layout}>
                  <div className={styles.editor}>
                    <div className={styles.card}>
                      {countryHead}
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
                            <li key={city.id || i}>
                              <div className={styles.cityRow}>
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
                              </div>
                              <SessionFields
                                indonesia={false}
                                session={city.session || null}
                                onChange={(session) => patch(selected, { cities: current.cities.map((c, j) => (j === i ? { ...c, session } : c)) })}
                                zoom={links.value(city.id)}
                                onZoom={(url) => links.set(city.id, url)}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  {preview}
                </div>
              )}

              {/* ---------- Inside Indonesia: the provinces (the home-page map) ---------- */}
              {insideIndonesia && (
                <Text size="sm" c="dimmed" mb="sm">
                  {t("insideIndonesia")}
                </Text>
              )}
              {mapOpened && (
                <div hidden={!insideIndonesia}>
                  <MapEditor editorEmail={email} onDirty={setMapDirty} onPreview={setMapPreview} />
                </div>
              )}

              {/* Indonesia's editor has its own; this one saves the countries and their cities */}
              {!insideIndonesia && (
                <SaveBar
                  dirty={dirty}
                  canSave={dirty || site.fromBuiltIn}
                  saving={site.saving}
                  message={message}
                  onDismiss={() => setMessage(null)}
                  onDiscard={() => {
                    site.discard();
                    links.discard();
                  }}
                  onSave={save}
                />
              )}
            </>
          )}
        </Card>
      </div>
    </InternalLayout>
  );
}
