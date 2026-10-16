import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  CopyButton,
  Group,
  Loader,
  Modal,
  SegmentedControl,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBrandGoogleDrive,
  IconBrandWhatsapp,
  IconBrandYoutube,
  IconCheck,
  IconClick,
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconFileImport,
  IconFileText,
  IconForms,
  IconLink,
  IconPencil,
  IconPlus,
  IconQrcode,
  IconSearch,
  IconTrash,
  IconWorld,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import { AccountBar, InternalLayout } from "../Internal/InternalUI";
import { intlLocale } from "../Internal/language";
import { timeAgo } from "../Internal/timeAgo";
import layout from "../Internal/AccessControl.module.css";
import portal from "../Internal/InternalPortal.module.css";
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

const millis = (value) => (value && typeof value.toMillis === "function" ? value.toMillis() : 0);

const SORTS = {
  newest: (a, b) => millis(b.createdAt) - millis(a.createdAt),
  popular: (a, b) => (b.clicks || 0) - (a.clicks || 0) || millis(b.lastClickedAt) - millis(a.lastClickedAt),
  az: (a, b) => a.source.localeCompare(b.source),
};

export default function RedirectAdmin() {
  const { t, i18n } = useTranslation(NS);
  const { email, user } = useAccess();
  const [links, setLinks] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [shown, setShown] = useState(PAGE);
  const [editing, setEditing] = useState(null); // null | "new" | link
  const [qrFor, setQrFor] = useState(null);
  const [notice, setNotice] = useState(null);
  const [importing, setImporting] = useState(false);

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

  useEffect(() => setShown(PAGE), [search, sort]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = (links || []).filter(
      (l) =>
        !term ||
        [l.source, l.title, l.destination, l.note].some((v) => (v || "").toLowerCase().includes(term))
    );
    return list.sort(SORTS[sort]);
  }, [links, search, sort]);

  const totals = useMemo(() => {
    const all = links || [];
    return {
      links: all.length,
      active: all.filter((l) => linkState(l) === "active").length,
      clicks: all.reduce((sum, l) => sum + (l.clicks || 0), 0),
    };
  }, [links]);

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

  return (
    <InternalLayout align="top">
      <div className={`${layout.page} ${styles.page}`}>
        <a href="/internal" className={layout.back}>
          <IconArrowLeft size={16} className={portal.flipRtl} /> {t("internal/Internal:backToHub")}
        </a>

        <Card className={layout.panel}>
          <AccountBar />

          <div className={styles.headerRow}>
            <div className={layout.heading}>
              <span
                className={layout.headingIcon}
                style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}
              >
                <IconLink size={22} />
              </span>
              <div>
                <Title order={2} className={layout.headingTitle}>
                  {t("title")}
                </Title>
                <Text className={layout.headingText}>{t("intro")}</Text>
              </div>
            </div>
            <Button
              leftSection={<IconPlus size={17} />}
              className={styles.primaryButton}
              onClick={() => setEditing("new")}
            >
              {t("newLink")}
            </Button>
          </div>

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
              value={sort}
              onChange={setSort}
              data={[
                { value: "newest", label: t("sort.newest") },
                { value: "popular", label: t("sort.popular") },
                { value: "az", label: t("sort.az") },
              ]}
            />
          </div>

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
        </Card>
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
    </InternalLayout>
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
