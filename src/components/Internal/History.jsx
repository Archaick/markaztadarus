import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Loader, SegmentedControl, Select, TextInput } from "@mantine/core";
import { IconChevronDown, IconRefresh, IconSearch, IconShieldLock, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, getDocs, limit, orderBy, query, startAfter } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { AUDIT_COLLECTION } from "./audit";
import AdminShell from "./AdminShell";
import HistoryRetention from "./HistoryRetention";
import { AREAS, actionKind, areaOf } from "./areas";
import { intlLocale } from "./language";
import { timeAgo } from "./timeAgo";
import a from "./AdminApp.module.css";
import styles from "./History.module.css";

const PAGE = 100;
const MAX_AUTO_PAGES = 20; // reaching back for a period stops here; "load older" carries on
const DAY = 24 * 60 * 60 * 1000;

// Details that are shown on their own line rather than as a "key: value" row.
const HIDDEN_DETAILS = new Set(["from", "to", "changed", "names", "codes", "order", "provinces", "paths"]);

const toDate = (value) => (value?.toDate ? value.toDate() : value ? new Date(value) : null);
const dayKey = (date) => (date ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : "unknown");

/** Where a period starts: today from midnight, otherwise so many days back. */
const periodStart = (period) => {
  if (period === "all") return null;
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  return period === "today" ? midnight : new Date(midnight.getTime() - (Number(period) - 1) * DAY);
};

/**
 * Everything admins did in the dashboards, newest first: searchable, by
 * area, by person and by period (older pages load by themselves until the
 * period is covered). Each action is one line that opens to show what
 * changed. Super admin only.
 */
export default function History() {
  const { t, i18n } = useTranslation("internal/Internal");
  const locale = intlLocale(i18n.language);
  const [entries, setEntries] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [area, setArea] = useState(null);
  const [actor, setActor] = useState(null);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [kind, setKind] = useState(null); // created · edited · deleted
  const [open, setOpen] = useState(() => new Set());
  const autoPages = useRef(0);

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
    autoPages.current = 0;
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

  const loadMore = useCallback(async () => {
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
  }, [load, cursor]);

  // a period reaching further back than what is loaded: fetch older pages until it is covered
  const since = useMemo(() => periodStart(period), [period]);
  const oldest = entries?.length ? toDate(entries[entries.length - 1].at) : null;
  const short = !!since && more && !!oldest && oldest >= since;
  useEffect(() => {
    autoPages.current = 0;
  }, [period]);
  useEffect(() => {
    if (!short || loadingMore || error || autoPages.current >= MAX_AUTO_PAGES) return;
    autoPages.current += 1;
    loadMore();
  }, [short, loadingMore, error, loadMore]);

  const actors = useMemo(() => {
    const names = new Map();
    (entries || []).forEach((e) => {
      if (!names.has(e.actor)) names.set(e.actor, { value: e.actor, label: e.actorName ? `${e.actorName} · ${e.actor}` : e.actor, count: 0 });
      names.get(e.actor).count += 1;
    });
    return [...names.values()].sort((x, y) => y.count - x.count).map(({ value, label, count }) => ({ value, label: `${label} (${count})` }));
  }, [entries]);

  const areaCounts = useMemo(() => {
    const counts = {};
    (entries || []).forEach((e) => {
      counts[e.area] = (counts[e.area] || 0) + 1;
    });
    return counts;
  }, [entries]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (entries || []).filter((e) => {
      if (area && e.area !== area) return false;
      if (actor && e.actor !== actor) return false;
      if (kind && actionKind(e.action) !== kind) return false;
      if (since) {
        const at = toDate(e.at);
        if (at && at < since) return false;
      }
      return (
        !term ||
        [e.label, e.target, e.actor, e.actorName, e.action, ...Object.values(e.details || {}).flat()].some((v) =>
          String(v ?? "").toLowerCase().includes(term)
        )
      );
    });
  }, [entries, area, actor, kind, search, since]);
  const people = useMemo(() => new Set(shown.map((e) => e.actor)).size, [shown]);
  const filtering = !!(search || area || actor || kind || period !== "all");

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

  const toggle = (id) =>
    setOpen((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const clear = () => {
    setSearch("");
    setArea(null);
    setActor(null);
    setKind(null);
    setPeriod("all");
  };

  /** What changed, under an entry that has been opened. */
  const details = (e) => {
    const d = e.details || {};
    const isAccess = e.area === "access" && (Array.isArray(d.from) || Array.isArray(d.to));
    const from = Array.isArray(d.from) ? d.from : [];
    const to = Array.isArray(d.to) ? d.to : [];
    const rows = Object.entries(d).filter(([k]) => !HIDDEN_DETAILS.has(k));
    const list = d.names || d.provinces || d.paths;
    return (
      <div className={a.entryMore}>
        <p className={styles.actor}>
          {t("history.by")} <strong>{e.actorName ? `${e.actorName} · ${e.actor}` : e.actor}</strong> ·{" "}
          {format(e.at, { dateStyle: "full", timeStyle: "short" })}
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
        {Array.isArray(d.order) && <p className={styles.names}>{d.order.map((n, i) => `${i + 1}. ${n}`).join("   ")}</p>}
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
    );
  };

  return (
    <AdminShell>
      <div className={a.page}>
        <header className={a.head}>
          <div>
            <h1 className={a.title}>{t("features.history.title")}</h1>
            <p className={a.sub}>{t("history.intro")}</p>
          </div>
          <div className={a.headActions}>
            <HistoryRetention onCleaned={refresh} />
            <Button variant="default" radius="md" leftSection={<IconRefresh size={16} />} onClick={refresh}>
              {t("history.refresh")}
            </Button>
          </div>
        </header>

        <div className={a.filters}>
          <TextInput
            className={a.grow}
            leftSection={<IconSearch size={16} />}
            placeholder={t("history.search")}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            className={a.pick}
            placeholder={t("history.allAreas")}
            data={AREAS.map((x) => ({ value: x.key, label: `${areaTitle(x.key)}${areaCounts[x.key] ? ` (${areaCounts[x.key]})` : ""}` }))}
            value={area}
            onChange={setArea}
            clearable
            comboboxProps={{ withinPortal: true }}
          />
          <Select
            className={a.pick}
            placeholder={t("history.everyone")}
            data={actors}
            value={actor}
            onChange={setActor}
            clearable
            searchable
            comboboxProps={{ withinPortal: true }}
          />
          <Select
            className={a.pick}
            placeholder={t("history.kinds.all")}
            data={["created", "edited", "deleted"].map((value) => ({ value, label: t(`history.kinds.${value}`) }))}
            value={kind}
            onChange={setKind}
            clearable
            comboboxProps={{ withinPortal: true }}
          />
          <SegmentedControl
            value={period}
            onChange={setPeriod}
            data={[
              { value: "all", label: t("history.period.all") },
              { value: "today", label: t("history.period.today") },
              { value: "7", label: t("history.period.week") },
              { value: "30", label: t("history.period.month") },
            ]}
          />
          {filtering && (
            <button type="button" className={a.clear} onClick={clear}>
              <IconX size={14} /> {t("history.clear")}
            </button>
          )}
        </div>

        <div className={a.summary}>
          <span>
            {entries === null ? "…" : t("history.summary", { count: shown.length, people })}
            {short && <Loader size={12} ml={8} />}
          </span>
          <span className={a.lock}>
            <IconShieldLock size={15} /> {t("history.locked")}
          </span>
        </div>

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
            <section key={day.key} className={a.day}>
              <h3 className={styles.dayTitle}>
                {dayTitle(day.date)} <small className={a.dayCount}>{day.items.length}</small>
              </h3>
              <ol className={a.log}>
                {day.items.map((e) => {
                  const meta = areaOf(e.area);
                  const Icon = meta.icon;
                  const isOpen = open.has(e.id);
                  return (
                    <li key={e.id} className={`${a.entry} ${isOpen ? a.entryOpen : ""}`}>
                      <button type="button" className={a.entryRow} onClick={() => toggle(e.id)} aria-expanded={isOpen}>
                        <span className={a.entryIcon} style={{ background: meta.color }}>
                          <Icon size={16} />
                        </span>
                        <span className={a.entryText}>
                          <span className={a.entryAction}>{actionText(e)}</span>
                          {e.label && (
                            <span className={a.entryLabel} dir="auto">
                              {e.label}
                            </span>
                          )}
                        </span>
                        <span className={a.entryWho} title={e.actor}>
                          {e.actorName || e.actor}
                        </span>
                        <time className={a.entryTime} title={format(e.at, { dateStyle: "full", timeStyle: "medium" })}>
                          {format(e.at, { hour: "2-digit", minute: "2-digit" })}
                          <small>{timeAgo(e.at)}</small>
                        </time>
                        <IconChevronDown size={16} className={a.entryChevron} />
                      </button>
                      {isOpen && details(e)}
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
        {oldest && <p className={a.footnote}>{t("history.loadedUntil", { date: format(oldest, { dateStyle: "long" }) })}</p>}
      </div>
    </AdminShell>
  );
}
