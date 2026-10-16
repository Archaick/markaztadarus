import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Chip, Loader, Select, Text, TextInput, Title } from "@mantine/core";
import { IconArrowLeft, IconHistory, IconSearch, IconShieldLock, IconUsersGroup } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, getDocs, limit, orderBy, query, startAfter } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { FEATURES, featureByKey } from "./access";
import { AUDIT_COLLECTION } from "./audit";
import { AccountBar, InternalLayout } from "./InternalUI";
import { intlLocale } from "./language";
import { timeAgo } from "./timeAgo";
import portal from "./InternalPortal.module.css";
import layout from "./AccessControl.module.css";
import styles from "./History.module.css";

const PAGE = 100;

const ACCESS = { key: "access", icon: IconUsersGroup, color: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)" };
const AREAS = [...FEATURES, ACCESS];
const areaOf = (key) => featureByKey(key) || ACCESS;

// Details that are shown on their own line rather than as a "key: value" row.
const HIDDEN_DETAILS = new Set(["from", "to", "changed", "names", "codes", "order", "provinces", "paths"]);

const toDate = (value) => (value?.toDate ? value.toDate() : value ? new Date(value) : null);
const dayKey = (date) => (date ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : "unknown");

/** Everything admins did in the dashboards, newest first. Super admin only. */
export default function History() {
  const { t, i18n } = useTranslation("internal/Internal");
  const locale = intlLocale(i18n.language);
  const [entries, setEntries] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [area, setArea] = useState("all");
  const [actor, setActor] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async (after) => {
    const q = after
      ? query(collection(db, AUDIT_COLLECTION), orderBy("at", "desc"), startAfter(after), limit(PAGE))
      : query(collection(db, AUDIT_COLLECTION), orderBy("at", "desc"), limit(PAGE));
    const snap = await getDocs(q);
    setCursor(snap.docs[snap.docs.length - 1] || after || null);
    setMore(snap.size === PAGE);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }, []);

  const refresh = useCallback(() => {
    setError(false);
    load(null)
      .then(setEntries)
      .catch((err) => {
        console.error("Could not load history:", err);
        setError(true);
        setEntries([]);
      });
  }, [load]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = await load(cursor);
      setEntries((list) => [...list, ...next]);
    } catch (err) {
      console.error("Could not load history:", err);
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const actors = useMemo(() => [...new Set((entries || []).map((e) => e.actor))].sort(), [entries]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (entries || []).filter(
      (e) =>
        (area === "all" || e.area === area) &&
        (!actor || e.actor === actor) &&
        (!term ||
          [e.label, e.target, e.actor, ...Object.values(e.details || {}).flat()].some((v) =>
            String(v ?? "").toLowerCase().includes(term)
          ))
    );
  }, [entries, area, actor, search]);

  // newest first, under a heading per day
  const days = useMemo(() => {
    const out = [];
    shown.forEach((e) => {
      const date = toDate(e.at);
      const key = dayKey(date);
      if (out[out.length - 1]?.key !== key) out.push({ key, date, items: [] });
      out[out.length - 1].items.push(e);
    });
    return out;
  }, [shown]);

  const format = (value, options) => {
    const date = toDate(value);
    return date ? new Intl.DateTimeFormat(locale, options).format(date) : "";
  };

  const dayTitle = (date) => {
    if (!date) return t("history.justNow");
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    if (dayKey(date) === dayKey(today)) return t("history.today");
    if (dayKey(date) === dayKey(yesterday)) return t("history.yesterday");
    return format(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const has = (key) => i18n.exists(key, { ns: "internal/Internal" });
  const areaTitle = (key) => t(`features.${key}.title`);
  const fieldName = (key) => (has(`history.fields.${key}`) ? t(`history.fields.${key}`) : key);
  const actionText = (e) => (has(`history.actions.${e.action}`) ? t(`history.actions.${e.action}`) : e.action);
  const value = (v) =>
    typeof v === "boolean" ? t(v ? "history.yes" : "history.no") : Array.isArray(v) ? v.join(", ") : String(v);

  return (
    <InternalLayout align="top">
      <div className={layout.page}>
        <a href="/internal/access" className={layout.back}>
          <IconArrowLeft size={16} className={portal.flipRtl} /> {t("features.access.title")}
        </a>

        <Card className={layout.panel}>
          <AccountBar />

          <div className={layout.heading}>
            <span className={layout.headingIcon}>
              <IconHistory size={22} />
            </span>
            <div>
              <Title order={2} className={layout.headingTitle}>
                {t("features.history.title")}
              </Title>
              <Text className={layout.headingText}>{t("history.intro")}</Text>
            </div>
            <Button variant="default" radius="xl" onClick={refresh} className={layout.historyLink}>
              {t("history.refresh")}
            </Button>
          </div>

          <div className={styles.filters}>
            <Chip.Group value={area} onChange={setArea}>
              <div className={styles.areas}>
                {["all", ...AREAS.map((a) => a.key)].map((key) => (
                  <Chip key={key} value={key} radius="xl" variant="light">
                    {key === "all" ? t("history.all") : areaTitle(key)}
                  </Chip>
                ))}
              </div>
            </Chip.Group>
            <div className={styles.filterRow}>
              <Select
                placeholder={t("history.everyone")}
                data={actors}
                value={actor}
                onChange={setActor}
                clearable
                searchable
                radius="xl"
                className={styles.grow}
              />
              <TextInput
                placeholder={t("history.search")}
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                radius="xl"
                className={styles.grow}
              />
            </div>
          </div>

          <p className={styles.lock}>
            <IconShieldLock size={16} /> {t("history.locked")}
          </p>

          {error && (
            <Alert color="red" radius="md" mb="md">
              {t("history.loadFailed")}
            </Alert>
          )}

          {entries === null ? (
            <div className={styles.center}>
              <Loader />
            </div>
          ) : !shown.length ? (
            <p className={styles.empty}>{t(entries.length ? "history.noMatch" : "history.empty")}</p>
          ) : (
            days.map((day) => (
              <section key={day.key} className={styles.day}>
                <h3 className={styles.dayTitle}>{dayTitle(day.date)}</h3>
                <ol className={styles.list}>
                  {day.items.map((e) => {
                    const meta = areaOf(e.area);
                    const Icon = meta.icon;
                    const d = e.details || {};
                    const isAccess = e.area === "access" && (Array.isArray(d.from) || Array.isArray(d.to));
                    const from = Array.isArray(d.from) ? d.from : [];
                    const to = Array.isArray(d.to) ? d.to : [];
                    const rows = Object.entries(d).filter(([k]) => !HIDDEN_DETAILS.has(k));
                    const list = d.names || d.provinces || d.paths;
                    return (
                      <li key={e.id} className={styles.entry}>
                        <span className={styles.icon} style={{ background: meta.color }}>
                          <Icon size={18} />
                        </span>
                        <div className={styles.body}>
                          <div className={styles.head}>
                            <span className={styles.action}>{actionText(e)}</span>
                            <time className={styles.time} title={format(e.at, { dateStyle: "full", timeStyle: "medium" })}>
                              {format(e.at, { hour: "2-digit", minute: "2-digit" })} · {timeAgo(e.at)}
                            </time>
                          </div>
                          {e.label && (
                            <p className={styles.label} dir="auto">
                              {e.label}
                            </p>
                          )}
                          <p className={styles.actor}>
                            {t("history.by")} <strong>{e.actorName ? `${e.actorName} · ${e.actor}` : e.actor}</strong>
                          </p>

                          {isAccess && (
                            <div className={styles.chips}>
                              {[...new Set([...from, ...to])].map((key) => {
                                const state = from.includes(key) && to.includes(key) ? "kept" : to.includes(key) ? "added" : "removed";
                                return (
                                  <Badge
                                    key={key}
                                    radius="xl"
                                    variant={state === "kept" ? "light" : "filled"}
                                    color={state === "added" ? "teal" : state === "removed" ? "red" : "gray"}
                                  >
                                    {state === "added" ? "+ " : state === "removed" ? "− " : ""}
                                    {has(`features.${key}.title`) ? areaTitle(key) : key}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                          {!isAccess && d.from !== undefined && d.to !== undefined && (
                            <p className={styles.change}>
                              {fieldName(String(d.from))} → <strong>{fieldName(String(d.to))}</strong>
                            </p>
                          )}
                          {Array.isArray(d.changed) && d.changed.length > 0 && (
                            <div className={styles.chips}>
                              <span className={styles.chipsLabel}>{t("history.changed")}</span>
                              {d.changed.map((k) => (
                                <Badge key={k} radius="xl" variant="light">
                                  {fieldName(k)}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {Array.isArray(list) && list.length > 0 && (
                            <p className={styles.names} dir="auto">
                              {list.slice(0, 8).join(", ")}
                              {list.length > 8 && ` ${t("history.andMore", { count: list.length - 8 })}`}
                            </p>
                          )}
                          {Array.isArray(d.order) && (
                            <p className={styles.names}>{d.order.map((n, i) => `${i + 1}. ${n}`).join("   ")}</p>
                          )}
                          {rows.length > 0 && (
                            <dl className={styles.details}>
                              {rows.map(([k, v]) => (
                                <div key={k} className={styles.detail}>
                                  <dt>{fieldName(k)}</dt>
                                  <dd dir="auto">{value(v)}</dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))
          )}

          {more && entries?.length > 0 && (
            <div className={styles.center}>
              <Button variant="default" radius="xl" loading={loadingMore} onClick={loadMore}>
                {t("history.loadMore")}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </InternalLayout>
  );
}
