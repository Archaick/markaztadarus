import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Group, Loader, Modal, Progress, SegmentedControl, Select, Text, TextInput } from "@mantine/core";
import { IconAlertTriangle, IconArrowBackUp, IconClockHour4, IconSearch, IconTrash, IconTrashX, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "./accessContext";
import AdminShell, { useTrashList } from "./AdminShell";
import { AREAS, areaOf } from "./areas";
import { TRASH_DAYS } from "./audit";
import { intlLocale } from "./language";
import { timeAgo } from "./timeAgo";
import { findConflicts, loadItems, purgeGroup, restoreGroup } from "./trash";
import a from "./AdminApp.module.css";

const DAY = 24 * 60 * 60 * 1000;
const toDate = (value) => (value?.toDate ? value.toDate() : value ? new Date(value) : null);
const NO_GROUPS = [];

// Copies kept alongside the real thing (a photo's small version, a
// certificate's public page): restored with it, not counted.
const HIDDEN_KINDS = new Set(["thumbs", "certificate_public"]);

// The deleted thing itself first, then what went with it.
const MAIN_KINDS = [
  "supervisi_schools", "forms", "posts", "redirect_manager_links", "certificates", "certificate_designs",
  "certificate_signers", "supervisi_teachers", "supervisi_sessions", "supervisi_instruments", "internal_admins",
];
const rank = (kind) => (MAIN_KINDS.includes(kind) ? MAIN_KINDS.indexOf(kind) : MAIN_KINDS.length);

/**
 * Everything deleted in the dashboards over the last 30 days, one entry per
 * delete (a school with its teachers, a form with its responses). The super
 * admin restores an entry exactly as it was, or removes it for good;
 * untouched, it goes by itself after 30 days.
 */
export default function RecentlyDeleted() {
  const { t, i18n } = useTranslation("internal/Internal");
  const { user } = useAccess();
  return (
    <AdminShell>
      <BinPage t={t} i18n={i18n} user={user} />
    </AdminShell>
  );
}

function BinPage({ t, i18n, user }) {
  const live = useTrashList();
  const groups = Array.isArray(live) ? live : live === "error" ? NO_GROUPS : null;
  const [search, setSearch] = useState("");
  const [area, setArea] = useState(null);
  const [actor, setActor] = useState(null);
  const [state, setState] = useState("waiting"); // waiting · restored · all
  const [sort, setSort] = useState("newest");
  const [open, setOpen] = useState(null); // { group, mode: "restore" | "purge" }
  const [notice, setNotice] = useState(null);

  const format = (value, options) => {
    const date = toDate(value);
    return date ? new Intl.DateTimeFormat(intlLocale(i18n.language), options).format(date) : "";
  };
  const has = (key) => i18n.exists(key, { ns: "internal/Internal" });
  const actionText = (g) => (has(`history.actions.${g.action}`) ? t(`history.actions.${g.action}`) : g.action);
  const daysLeft = (g) => Math.max(0, Math.ceil(((toDate(g.expiresAt)?.getTime() || Date.now() + TRASH_DAYS * DAY) - Date.now()) / DAY));
  const kindsText = (g) =>
    Object.entries(g.kinds || {})
      .filter(([k, n]) => n > 0 && !HIDDEN_KINDS.has(k))
      .sort(([x], [y]) => rank(x) - rank(y))
      .map(([k, n]) => (has(`trash.kinds.${k}`) ? t(`trash.kinds.${k}`, { count: n }) : `${n} ${k}`))
      .join(" · ");

  const waitingCount = (groups || []).filter((g) => !g.restoredAt).length;
  const soon = (groups || []).filter((g) => !g.restoredAt && daysLeft(g) <= 7).length;
  const actors = useMemo(() => {
    const names = new Map();
    (groups || []).forEach((g) => names.set(g.actor, g.actorName ? `${g.actorName} · ${g.actor}` : g.actor));
    return [...names].map(([value, label]) => ({ value, label }));
  }, [groups]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = (groups || []).filter(
      (g) =>
        (state === "all" || (state === "restored") === !!g.restoredAt) &&
        (!area || g.area === area) &&
        (!actor || g.actor === actor) &&
        (!term || [g.label, g.target, g.actor, g.actorName, g.action].some((v) => String(v || "").toLowerCase().includes(term)))
    );
    const at = (g) => toDate(g.at)?.getTime() || 0;
    const ends = (g) => toDate(g.expiresAt)?.getTime() || 0;
    return list.sort(sort === "expiring" ? (x, y) => ends(x) - ends(y) : (x, y) => at(y) - at(x));
  }, [groups, state, area, actor, search, sort]);
  const filtering = !!(search || area || actor || state !== "waiting");

  return (
    <div className={a.page}>
      <header className={a.head}>
        <div>
          <h1 className={a.title}>{t("trash.title")}</h1>
          <p className={a.sub}>{t("trash.intro", { days: TRASH_DAYS })}</p>
        </div>
      </header>

      <div className={a.stats}>
        <div>
          <b>{groups ? waitingCount : "…"}</b>
          <span>{t("trash.stats.waiting")}</span>
        </div>
        <div>
          <b>{groups ? groups.length - waitingCount : "…"}</b>
          <span>{t("trash.stats.restored")}</span>
        </div>
        <div>
          <b>{groups ? soon : "…"}</b>
          <span>{t("trash.stats.soon")}</span>
        </div>
      </div>

      {notice && (
        <Alert color={notice.color} mb="md" withCloseButton onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}
      {live === "error" && (
        <Alert color="red" mb="md">
          {t("trash.loadFailed")}
        </Alert>
      )}

      <div className={a.filters}>
        <TextInput className={a.grow} leftSection={<IconSearch size={16} />} placeholder={t("trash.search")} value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
        <Select
          className={a.pick}
          placeholder={t("history.allAreas")}
          data={AREAS.map((x) => ({ value: x.key, label: t(`features.${x.key}.title`) }))}
          value={area}
          onChange={setArea}
          clearable
          comboboxProps={{ withinPortal: true }}
        />
        <Select className={a.pick} placeholder={t("history.everyone")} data={actors} value={actor} onChange={setActor} clearable searchable comboboxProps={{ withinPortal: true }} />
        <SegmentedControl
          value={state}
          onChange={setState}
          data={[
            { value: "waiting", label: t("trash.state.waiting") },
            { value: "restored", label: t("trash.state.restored") },
            { value: "all", label: t("trash.state.all") },
          ]}
        />
        <Select
          className={a.pick}
          aria-label={t("trash.sort.label")}
          data={[
            { value: "newest", label: t("trash.sort.newest") },
            { value: "expiring", label: t("trash.sort.expiring") },
          ]}
          value={sort}
          onChange={(v) => v && setSort(v)}
          allowDeselect={false}
          comboboxProps={{ withinPortal: true }}
        />
        {filtering && (
          <button
            type="button"
            className={a.clear}
            onClick={() => {
              setSearch("");
              setArea(null);
              setActor(null);
              setState("waiting");
            }}
          >
            <IconX size={14} /> {t("history.clear")}
          </button>
        )}
      </div>

      {groups === null ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : !shown.length ? (
        <p className={a.binEmpty}>
          <IconTrash size={30} />
          {t(groups.length ? "trash.noMatch" : "trash.empty")}
        </p>
      ) : (
        <ol className={a.log}>
          {shown.map((g) => {
            const meta = areaOf(g.area);
            const Icon = meta.icon;
            const left = daysLeft(g);
            return (
              <li key={g.id} className={`${a.binRow} ${g.restoredAt ? a.binRestored : ""}`}>
                <span className={a.entryIcon} style={{ background: meta.color }}>
                  <Icon size={16} />
                </span>
                <span className={a.entryText}>
                  <span className={a.entryAction}>{actionText(g)}</span>
                  {g.label && (
                    <span className={a.binLabel} dir="auto">
                      {g.label}
                    </span>
                  )}
                  <span className={a.binMeta}>
                    {kindsText(g) && <span>{kindsText(g)}</span>}
                    <span title={format(g.at, { dateStyle: "full", timeStyle: "short" })}>
                      {t("trash.by", { name: g.actorName || g.actor, time: timeAgo(g.at) })}
                    </span>
                  </span>
                </span>
                <span className={a.binSide}>
                  {g.restoredAt ? (
                    <Badge color="teal" variant="light">
                      {t("trash.restoredBy", { time: timeAgo(g.restoredAt) })}
                    </Badge>
                  ) : (
                    <>
                      <Badge color={left <= 3 ? "red" : left <= 7 ? "orange" : "gray"} variant="light" leftSection={<IconClockHour4 size={12} />}>
                        {t("trash.daysLeft", { count: left })}
                      </Badge>
                      <span className={a.binButtons}>
                        <Button size="xs" color="teal" leftSection={<IconArrowBackUp size={15} />} onClick={() => setOpen({ group: g, mode: "restore" })}>
                          {t("trash.restore")}
                        </Button>
                        <Button size="xs" variant="subtle" color="red" onClick={() => setOpen({ group: g, mode: "purge" })} aria-label={t("trash.purge")} title={t("trash.purge")}>
                          <IconTrashX size={16} />
                        </Button>
                      </span>
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <p className={a.footnote}>{t("trash.footnote", { days: TRASH_DAYS })}</p>

      <BinModal
        open={open}
        onClose={() => setOpen(null)}
        user={user}
        t={t}
        actionText={actionText}
        kindsText={kindsText}
        onDone={(text) => {
          setOpen(null);
          setNotice({ color: "teal", text });
        }}
      />
    </div>
  );
}

/** Restore (after checking nothing clashes) or delete for good. */
function BinModal({ open, onClose, user, t, actionText, kindsText, onDone }) {
  const [items, setItems] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(false);

  const group = open?.group;
  const groupId = group?.id;
  const mode = open?.mode;
  useEffect(() => {
    setItems(null);
    setConflicts([]);
    setError(false);
    setProgress(null);
    if (!groupId) return undefined;
    let alive = true;
    loadItems(groupId)
      .then(async (list) => {
        if (!alive) return;
        setItems(list);
        if (mode === "restore") {
          const found = await findConflicts(list);
          if (alive) setConflicts(found);
        }
      })
      .catch((err) => {
        console.error("Could not open the bin entry:", err);
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [groupId, mode]);

  const run = async () => {
    setBusy(true);
    setError(false);
    try {
      if (open.mode === "restore") {
        await restoreGroup(user, group, items, setProgress);
        onDone(t("trash.restored", { label: group.label || actionText(group) }));
      } else {
        await purgeGroup(user, group, items);
        onDone(t("trash.purged", { label: group.label || actionText(group) }));
      }
    } catch (err) {
      console.error("Bin action failed:", err);
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const restoring = open?.mode === "restore";
  return (
    <Modal opened={!!open} onClose={busy ? () => {} : onClose} title={restoring ? t("trash.restoreTitle") : t("trash.purgeTitle")} centered>
      {group && (
        <>
          <Text fw={700}>{actionText(group)}</Text>
          {group.label && (
            <Text size="sm" dir="auto">
              {group.label}
            </Text>
          )}
          {kindsText(group) && (
            <Text size="sm" c="dimmed" mt={4}>
              {kindsText(group)}
            </Text>
          )}
          <Text size="sm" mt="md">
            {restoring ? t("trash.restoreText") : t("trash.purgeText")}
          </Text>

          {items === null && !error && (
            <Group justify="center" py="md">
              <Loader size="sm" />
            </Group>
          )}
          {restoring && conflicts.length > 0 && (
            <Alert color="orange" mt="md" icon={<IconAlertTriangle size={18} />} title={t("trash.conflictTitle")}>
              {conflicts.slice(0, 5).map((c) => (
                <div key={`${c.reason}${c.path}`}>
                  <bdi>{c.path}</bdi> — {t(`trash.conflict.${c.reason}`)}
                </div>
              ))}
            </Alert>
          )}
          {items && items.length === 0 && (
            <Alert color="gray" mt="md">
              {t("trash.nothingLeft")}
            </Alert>
          )}
          {progress !== null && <Progress value={progress * 100} mt="md" striped animated />}
          {error && (
            <Alert color="red" mt="md">
              {t("trash.failed")}
            </Alert>
          )}

          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={onClose} disabled={busy}>
              {t("access.cancel")}
            </Button>
            {restoring ? (
              <Button color="teal" leftSection={<IconArrowBackUp size={16} />} loading={busy} disabled={!items?.length || conflicts.length > 0} onClick={run}>
                {t("trash.restore")}
              </Button>
            ) : (
              <Button color="red" leftSection={<IconTrashX size={16} />} loading={busy} disabled={items === null} onClick={run}>
                {t("trash.purgeConfirm")}
              </Button>
            )}
          </Group>
        </>
      )}
    </Modal>
  );
}
