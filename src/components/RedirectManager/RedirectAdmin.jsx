import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  CopyButton,
  Group,
  Loader,
  Modal,
  SegmentedControl,
  Select,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconBrandGoogleDrive,
  IconBrandWhatsapp,
  IconBrandYoutube,
  IconCheck,
  IconCircleCheck,
  IconClick,
  IconClockOff,
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconFileImport,
  IconFileText,
  IconForms,
  IconLink,
  IconPencil,
  IconPlayerPause,
  IconPlus,
  IconQrcode,
  IconSearch,
  IconTrash,
  IconWorld,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import AppShell from "../Internal/AppShell";
import { intlLocale } from "../Internal/language";
import { timeAgo } from "../Internal/timeAgo";
import {
  LEGACY_LINKS,
  REDIRECT_COLLECTION,
  SITE_HOST,
  destinationKind,
  expiryDate,
  linkState,
  shortLink,
} from "../Redirects/redirectSchema";
import LinkEditor from "./LinkEditor";
import { qrWithLogo } from "../Internal/qrWithLogo";
import styles from "./RedirectAdmin.module.css";

const NS = ["internal/Redirects", "internal/Internal"];
const PAGE = 20;
const BASE = "/internal/redirect-manager";

const KIND_ICONS = {
  form: IconForms,
  drive: IconBrandGoogleDrive,
  docs: IconFileText,
  youtube: IconBrandYoutube,
  whatsapp: IconBrandWhatsapp,
  site: IconWorld,
  link: IconLink,
};

const STATE_COLORS = { active: "teal", paused: "gray", expired: "orange" };
const STATES = ["active", "paused", "expired"];

const kindOf = (l) => destinationKind(l.destination).kind;
const millis = (value) => (value && typeof value.toMillis === "function" ? value.toMillis() : 0);

const SORTS = {
  newest: (a, b) => millis(b.createdAt) - millis(a.createdAt),
  popular: (a, b) => (b.clicks || 0) - (a.clicks || 0) || millis(b.lastClickedAt) - millis(a.lastClickedAt),
  recent: (a, b) => millis(b.lastClickedAt) - millis(a.lastClickedAt),
  az: (a, b) => a.source.localeCompare(b.source),
};

/**
 * The short links, in the shared internal frame: the menu holds "New link"
 * and the links by state (with how many), the page searches them, narrows
 * them by kind of destination and orders them.
 */
export default function RedirectAdmin() {
  const { t, i18n } = useTranslation(NS);
  const { email, user, isSuperAdmin } = useAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const status = STATES.includes(params.get("status")) ? params.get("status") : "all";
  const [links, setLinks] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState(null);
  const [sort, setSort] = useState("newest");
  const [shown, setShown] = useState(PAGE);
  const [editingLink, setEditingLink] = useState(null);
  const [qrFor, setQrFor] = useState(null);
  const [notice, setNotice] = useState(null);
  const [importing, setImporting] = useState(false);

  // the address keeps the state shown and whether the new-link window is open ("New link" in the menu)
  const setParam = (key, value) => {
    const next = new URLSearchParams(location.search);
    if (value === null) next.delete(key);
    else next.set(key, value);
    navigate({ search: next.toString() }, { replace: true });
  };
  const setStatus = (value) => setParam("status", value === "all" ? null : value);
  const editing = editingLink || (params.get("new") === "1" ? "new" : null);
  const setEditing = (value) => {
    if (value === "new") setParam("new", "1");
    else {
      setEditingLink(value);
      if (params.has("new")) setParam("new", null);
    }
  };

  // Every link at once: there are a few hundred at most, and searching and
  // sorting then work across all of them.
  useEffect(
    () =>
      onSnapshot(
        collection(db, REDIRECT_COLLECTION),
        (snap) => setLinks(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((l) => l.source)),
        (err) => {
          console.error("Could not load links:", err);
          setLoadFailed(true);
          setLinks([]);
        }
      ),
    []
  );

  useEffect(() => setShown(PAGE), [search, sort, kind, status]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = (links || []).filter(
      (l) =>
        (status === "all" || linkState(l) === status) &&
        (!kind || kindOf(l) === kind) &&
        (!term || [l.source, l.title, l.destination, l.note].some((v) => (v || "").toLowerCase().includes(term)))
    );
    return list.sort(SORTS[sort]);
  }, [links, search, sort, kind, status]);

  const totals = useMemo(() => {
    const all = links || [];
    const byState = Object.fromEntries(STATES.map((s) => [s, all.filter((l) => linkState(l) === s).length]));
    const byKind = {};
    all.forEach((l) => {
      const k = kindOf(l);
      byKind[k] = (byKind[k] || 0) + 1;
    });
    return { links: all.length, ...byState, byKind, clicks: all.reduce((sum, l) => sum + (l.clicks || 0), 0) };
  }, [links]);

  const filtering = !!(search || kind || status !== "all");
  const clear = () => {
    setSearch("");
    setKind(null);
    setStatus("all");
  };

  // Links still written in the code that the dashboard does not hold yet.
  const missingLegacy = useMemo(() => {
    if (!links) return [];
    const have = new Set(links.map((l) => l.source));
    const seen = new Set();
    return LEGACY_LINKS.filter((l) => !have.has(l.source) && !seen.has(l.source) && seen.add(l.source));
  }, [links]);

  const importLegacy = async () => {
    setImporting(true);
    try {
      await auditedWrite(
        user,
        { area: "redirects", action: "link.import", details: { count: missingLegacy.length, paths: missingLegacy.map((l) => l.source) } },
        (batch, auditId) =>
      missingLegacy.forEach((l) =>
        batch.set(doc(collection(db, REDIRECT_COLLECTION)), {
          ...l,
          auditId,
          note: "",
          active: true,
          expiresAt: null,
          clicks: 0,
          importedFromCode: true,
          createdAt: serverTimestamp(),
          createdBy: email || "unknown",
          updatedAt: serverTimestamp(),
          updatedBy: email || "unknown",
        })
      )
      );
      setNotice({ color: "teal", text: t("legacy.done", { count: missingLegacy.length }) });
    } catch (err) {
      console.error("Could not import links:", err);
      setNotice({ color: "red", text: t("errors.failed") });
    } finally {
      setImporting(false);
    }
  };

  const remove = async (link) => {
    if (!window.confirm(t("deleteConfirm", { path: `${SITE_HOST}${link.source}` }))) return;
    try {
      await auditedWrite(
        user,
        {
          area: "redirects",
          action: "link.delete",
          target: link.source,
          label: link.title || link.source,
          details: { path: `${SITE_HOST}${link.source}`, destination: link.destination, clicks: link.clicks || 0 },
        },
        (batch, _auditId, markDelete) => {
          batch.delete(doc(db, REDIRECT_COLLECTION, link.id));
          markDelete(`redirect_manager_links~${link.id}`, link.auditId);
        }
      );
      setNotice({ color: "teal", text: t("deleted", { path: link.source }) });
    } catch (err) {
      console.error("Could not delete link:", err);
      setNotice({ color: "red", text: t("errors.failed") });
    }
  };

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(intlLocale(i18n.language), { day: "numeric", month: "short", year: "numeric" }),
    [i18n.language]
  );

  const count = (n) => (links ? n : null);
  const sections = [
    {
      label: t("nav.links"),
      items: [
        { to: BASE, icon: IconLink, label: t("nav.all"), count: count(totals.links), active: status === "all" },
        { to: `${BASE}?status=active`, icon: IconCircleCheck, label: t("status.active"), count: count(totals.active), active: status === "active" },
        { to: `${BASE}?status=paused`, icon: IconPlayerPause, label: t("status.paused"), count: count(totals.paused), active: status === "paused" },
        { to: `${BASE}?status=expired`, icon: IconClockOff, label: t("status.expired"), count: count(totals.expired), active: status === "expired" },
      ],
    },
  ];

  const newButton = (
    <Button fullWidth size="md" radius="md" color="yellow" c="dark" leftSection={<IconPlus size={18} />} onClick={() => setEditing("new")}>
      {t("newLink")}
    </Button>
  );

  return (
    <AppShell
      brand={t("shellBrand")}
      role={isSuperAdmin ? t("internal/Internal:superAdmin") : t("nav.admin")}
      sections={sections}
      action={newButton}
      collapseKey="mt.linksMenu"
    >
      <div className={styles.page}>
        <header className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>{t("title")}</h1>
            <p className={styles.pageSub}>{t("intro")}</p>
          </div>
          <Button className={styles.newOnPhone} color="yellow" c="dark" leftSection={<IconPlus size={17} />} onClick={() => setEditing("new")}>
            {t("newLink")}
          </Button>
        </header>

        <div className={styles.stats}>
          <Stat value={totals.links} label={t("stats.links")} />
          <Stat value={totals.active} label={t("stats.active")} />
          <Stat value={totals.clicks} label={t("stats.clicks")} />
        </div>

        {notice && (
          <Alert color={notice.color} variant="light" mt="md" withCloseButton onClose={() => setNotice(null)}>
            {notice.text}
          </Alert>
        )}
        {loadFailed && (
          <Alert color="red" mt="md">
            {t("loadFailed")}
          </Alert>
        )}

        {missingLegacy.length > 0 && (
          <div className={styles.legacy}>
            <IconFileImport size={22} />
            <div>
              <Text fw={700}>{t("legacy.title", { count: missingLegacy.length })}</Text>
              <Text size="sm" c="dimmed">
                {t("legacy.text")}
              </Text>
            </div>
            <Button variant="light" loading={importing} onClick={importLegacy}>
              {t("legacy.button")}
            </Button>
          </div>
        )}

        <div className={styles.toolbar}>
          <TextInput
            leftSection={<IconSearch size={16} />}
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            className={styles.search}
          />
          <SegmentedControl
            value={status}
            onChange={setStatus}
            data={[
              { value: "all", label: t("nav.all") },
              ...STATES.map((value) => ({ value, label: t(`status.${value}`) })),
            ]}
          />
          <Select
            className={styles.pick}
            placeholder={t("filters.allKinds")}
            data={Object.keys(KIND_ICONS)
              .filter((k) => totals.byKind[k])
              .map((value) => ({ value, label: `${t(`kind.${value}`)} (${totals.byKind[value]})` }))}
            value={kind}
            onChange={setKind}
            clearable
            comboboxProps={{ withinPortal: true }}
          />
          <Select
            className={styles.sortPick}
            aria-label={t("filters.sort")}
            data={Object.keys(SORTS).map((value) => ({ value, label: t(`sort.${value}`) }))}
            value={sort}
            onChange={(v) => v && setSort(v)}
            allowDeselect={false}
            comboboxProps={{ withinPortal: true }}
          />
        </div>

        {links?.length > 0 && (
          <div className={styles.summary}>
            <span>{t("filters.summary", { count: visible.length, total: links.length })}</span>
            {filtering && (
              <button type="button" className={styles.clear} onClick={clear}>
                <IconX size={14} /> {t("filters.clear")}
              </button>
            )}
          </div>
        )}

        {links === null && (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        )}

        {links?.length === 0 && !loadFailed && (
          <div className={styles.empty}>
            <IconLink size={34} />
            <Text fw={600}>{t("empty.title")}</Text>
            <Text size="sm" c="dimmed">
              {t("empty.text")}
            </Text>
            <Button mt="sm" variant="light" onClick={() => setEditing("new")}>
              {t("empty.button")}
            </Button>
          </div>
        )}

        {links?.length > 0 && visible.length === 0 && (
          <Text c="dimmed" ta="center" py="xl">
            {t("noMatch")}
          </Text>
        )}

        <ul className={styles.list}>
          {visible.slice(0, shown).map((link) => (
            <LinkRow
              key={link.id}
              link={link}
              dateFormat={dateFormat}
              onEdit={() => setEditing(link)}
              onQr={() => setQrFor(link)}
              onDelete={() => remove(link)}
            />
          ))}
        </ul>

        {visible.length > shown && (
          <Group justify="center" mt="md">
            <Button variant="subtle" onClick={() => setShown((n) => n + PAGE)}>
              {t("showMore", { count: visible.length - shown })}
            </Button>
          </Group>
        )}
      </div>

      <LinkEditor
        opened={editing !== null}
        onClose={() => setEditing(null)}
        link={editing === "new" ? null : editing}
        links={links || []}
        email={email}
        onSaved={(kind, path) => setNotice({ color: "teal", text: t(kind, { path }) })}
      />
      <QrModal link={qrFor} onClose={() => setQrFor(null)} />
    </AppShell>
  );
}

function Stat({ value, label }) {
  return (
    <div className={styles.stat}>
      <strong>{value.toLocaleString("en-US")}</strong>
      <span>{label}</span>
    </div>
  );
}

function LinkRow({ link, dateFormat, onEdit, onQr, onDelete }) {
  const { t } = useTranslation(NS);
  const state = linkState(link);
  const { kind, host } = destinationKind(link.destination);
  const KindIcon = KIND_ICONS[kind];
  const ends = expiryDate(link);
  const full = shortLink(link.source);

  return (
    <li className={`${styles.row} ${state !== "active" ? styles.rowOff : ""}`}>
      <span className={styles.kind} title={t(`kind.${kind}`)}>
        <KindIcon size={20} />
      </span>

      <div className={styles.main}>
        <div className={styles.titleLine}>
          <span className={styles.linkTitle} dir="auto">
            {link.title || link.source.slice(1)}
          </span>
          <Badge size="sm" variant="light" color={STATE_COLORS[state]}>
            {t(`status.${state}`)}
          </Badge>
        </div>
        <div className={styles.pathLine}>
          <bdi className={styles.path}>
            {SITE_HOST}
            <strong>{link.source}</strong>
          </bdi>
          <CopyButton value={full} timeout={1600}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? t("row.copied") : t("row.copy")}>
                <ActionIcon size="sm" variant="subtle" color={copied ? "teal" : "gray"} onClick={copy} aria-label={t("row.copy")}>
                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </div>
        <bdi className={styles.dest} title={link.destination}>
          {t(`kind.${kind}`)} · {host}
        </bdi>
        {link.note && (
          <p className={styles.note} dir="auto">
            {link.note}
          </p>
        )}
        {ends && (
          <p className={styles.ends}>
            {t(state === "expired" ? "row.endedOn" : "row.ends", { date: dateFormat.format(ends) })}
          </p>
        )}
      </div>

      <div className={styles.clicks}>
        <span className={styles.clickCount}>
          <IconClick size={15} /> {(link.clicks || 0).toLocaleString("en-US")}
        </span>
        <span className={styles.clickWhen}>
          {link.lastClickedAt ? t("row.lastClick", { time: timeAgo(link.lastClickedAt) }) : t("row.neverClicked")}
        </span>
      </div>

      <div className={styles.actions}>
        <Tooltip label={t("row.qr")}>
          <ActionIcon variant="subtle" color="gray" onClick={onQr} aria-label={t("row.qr")}>
            <IconQrcode size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={t("row.edit")}>
          <ActionIcon variant="subtle" color="blue" onClick={onEdit} aria-label={t("row.edit")}>
            <IconPencil size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={t("row.open")}>
          <ActionIcon
            variant="subtle"
            color="gray"
            component="a"
            href={link.destination}
            target="_blank"
            rel="noreferrer"
            aria-label={t("row.open")}
          >
            <IconExternalLink size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={t("row.delete")}>
          <ActionIcon variant="subtle" color="red" onClick={onDelete} aria-label={t("row.delete")}>
            <IconTrash size={18} />
          </ActionIcon>
        </Tooltip>
      </div>
    </li>
  );
}

function QrModal({ link, onClose }) {
  const { t } = useTranslation(NS);
  const [image, setImage] = useState("");

  useEffect(() => {
    setImage("");
    if (!link) return undefined;
    let alive = true;
    qrWithLogo(shortLink(link.source))
      .then((url) => alive && setImage(url))
      .catch((err) => console.error("QR failed:", err));
    return () => {
      alive = false;
    };
  }, [link]);

  return (
    <Modal opened={!!link} onClose={onClose} title={t("qr.title")} centered size="sm">
      <div className={styles.qrBox}>
        {image ? <img src={image} alt={t("qr.title")} className={styles.qrImage} /> : <Loader size="sm" />}
        <Text size="sm" c="dimmed" ta="center">
          {t("qr.hint")}
        </Text>
        <Button
          component="a"
          href={image || undefined}
          download={link ? `QR-${link.source.slice(1)}.png` : undefined}
          leftSection={<IconDownload size={17} />}
          className={styles.primaryButton}
          disabled={!image}
          fullWidth
        >
          {t("qr.download")}
        </Button>
      </div>
    </Modal>
  );
}
