import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ActionIcon, Alert, Badge, Button, CopyButton, Group, Loader, Modal, Select, Text, TextInput, Tooltip } from "@mantine/core";
import { IconCheck, IconClipboardText, IconCopy, IconExternalLink, IconFiles, IconMessages, IconPlus, IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, doc, getCountFromServer, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import { timeAgo } from "../Internal/timeAgo";
import FormsShell, { FORMS_BASE, useFormsList } from "./FormsShell";
import styles from "./Forms.module.css";
import app from "./FormsApp.module.css";
import {
  COVER_DOC,
  FORMS_COLLECTION,
  KEY_DOC,
  MEDIA,
  PRIVATE,
  RESPONSES,
  STATUS_COLORS,
  TEMPLATES,
  formLink,
  isValidSlug,
  questionsOf,
  slugify,
} from "./formSchema";

const NS = ["internal/Forms", "internal/Internal"];
const millis = (v) => (v && typeof v.toMillis === "function" ? v.toMillis() : 0);
const statusOf = (f) => (STATUS_COLORS[f.status] ? f.status : "draft");

export default function FormsAdmin() {
  return (
    <FormsShell>
      <FormsList />
    </FormsShell>
  );
}

/**
 * Every form in one list: search, the status from the menu, sorting, and
 * for each form its responses, when it was last edited and quick actions
 * (open, copy the link, see it as people do, duplicate).
 */
function FormsList() {
  const { t } = useTranslation(NS);
  const navigate = useNavigate();
  const { email } = useAccess();
  const forms = useFormsList();
  const [params, setParams] = useSearchParams();
  const status = params.get("status");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [counts, setCounts] = useState({});
  const [copyOf, setCopyOf] = useState(null); // a form being duplicated
  const creating = params.get("new") === "1";

  const list = useMemo(() => (Array.isArray(forms) ? forms : []), [forms]);
  const formIds = list.map((f) => f.id).join("|");
  useEffect(() => {
    if (!formIds) return undefined;
    let alive = true;
    formIds.split("|").forEach(async (id) => {
      try {
        const snap = await getCountFromServer(collection(db, FORMS_COLLECTION, id, RESPONSES));
        if (alive) setCounts((prev) => ({ ...prev, [id]: snap.data().count }));
      } catch (err) {
        console.error("Could not count responses:", err);
      }
    });
    return () => {
      alive = false;
    };
  }, [formIds]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = list
      .filter((f) => !status || statusOf(f) === status)
      .filter((f) => !term || [f.title, f.id].some((v) => (v || "").toLowerCase().includes(term)));
    if (sort === "responses") rows.sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
    else if (sort === "name") rows.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else rows.sort((a, b) => millis(b.updatedAt) - millis(a.updatedAt));
    return rows;
  }, [list, status, search, sort, counts]);

  const closeCreate = () => {
    const next = new URLSearchParams(params);
    next.delete("new");
    setParams(next, { replace: true });
    setCopyOf(null);
  };
  const open = (id) => navigate(`${FORMS_BASE}/${id}`);

  return (
    <div className={app.page}>
      <header className={app.head}>
        <div>
          <h1 className={app.title}>{status ? t(`list.titles.${status}`) : t("title")}</h1>
          <p className={app.sub}>{t("intro")}</p>
        </div>
        {/* on a phone the menu is folded away, so "New form" is here too */}
        <Button className={app.newOnPhone} color="yellow" c="dark" leftSection={<IconPlus size={18} />} onClick={() => setParams({ new: "1" })}>
          {t("newForm")}
        </Button>
      </header>

      <div className={app.tools}>
        <TextInput
          className={app.search}
          leftSection={<IconSearch size={16} />}
          placeholder={t("list.search")}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          radius="md"
          size="md"
        />
        <Select
          className={app.sort}
          value={sort}
          onChange={(v) => v && setSort(v)}
          allowDeselect={false}
          radius="md"
          size="md"
          data={["recent", "responses", "name"].map((v) => ({ value: v, label: t(`list.sort.${v}`) }))}
          comboboxProps={{ withinPortal: true }}
        />
      </div>

      {forms === "error" && <Alert color="red">{t("loadFailed")}</Alert>}
      {forms === null && (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      )}

      {Array.isArray(forms) && list.length === 0 && (
        <div className={app.empty}>
          <IconClipboardText size={40} />
          <Text fw={700}>{t("empty.title")}</Text>
          <Text size="sm" c="dimmed">
            {t("empty.text")}
          </Text>
          <Button mt="sm" color="teal" onClick={() => setParams({ new: "1" })}>
            {t("empty.button")}
          </Button>
        </div>
      )}

      {Array.isArray(forms) && list.length > 0 && shown.length === 0 && (
        <Text c="dimmed" ta="center" py="xl">
          {t("list.none")}
        </Text>
      )}

      {shown.length > 0 && (
        <div className={app.table} role="list">
          <div className={app.tableHead} aria-hidden="true">
            <span>{t("list.columns.form")}</span>
            <span>{t("list.columns.status")}</span>
            <span>{t("list.columns.responses")}</span>
            <span>{t("list.columns.updated")}</span>
            <span />
          </div>
          {shown.map((form) => {
            const st = statusOf(form);
            return (
              <div
                key={form.id}
                className={app.row}
                role="listitem"
                tabIndex={0}
                onClick={() => open(form.id)}
                onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && open(form.id)}
              >
                <div className={app.nameCell}>
                  <span className={`${app.dot} ${app[`dot_${st}`]}`} aria-hidden="true" />
                  <div className={app.nameText}>
                    <b dir="auto">{form.title || t("untitled")}</b>
                    <span>
                      <bdi>/form/{form.id}</bdi> · {t("card.questions", { count: questionsOf(form.fields || []).length })}
                    </span>
                  </div>
                </div>
                <div className={app.statusCell}>
                  <Badge color={STATUS_COLORS[st]} variant="light" radius="sm">
                    {t(`status.${st}`)}
                  </Badge>
                </div>
                <div className={app.countCell}>
                  <IconMessages size={15} />
                  {counts[form.id] === undefined ? "…" : counts[form.id]}
                </div>
                <div className={app.timeCell}>{timeAgo(form.updatedAt)}</div>
                <div className={app.actions} onClick={(e) => e.stopPropagation()}>
                  <CopyButton value={formLink(form.id)}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? t("card.copied") : t("card.copyLink")}>
                        <ActionIcon variant="subtle" color={copied ? "teal" : "gray"} onClick={copy} aria-label={t("card.copyLink")}>
                          {copied ? <IconCheck size={17} /> : <IconCopy size={17} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                  <Tooltip label={t("card.openForm")}>
                    <ActionIcon variant="subtle" color="gray" component="a" href={`/form/${form.id}`} target="_blank" rel="noreferrer" aria-label={t("card.openForm")}>
                      <IconExternalLink size={17} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t("list.duplicate")}>
                    <ActionIcon variant="subtle" color="gray" onClick={() => setCopyOf(form)} aria-label={t("list.duplicate")}>
                      <IconFiles size={17} />
                    </ActionIcon>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateFormModal opened={creating || !!copyOf} source={copyOf} onClose={closeCreate} createdBy={email} onCreated={(id) => navigate(`${FORMS_BASE}/${id}`)} />
    </div>
  );
}

// a form's own content, for its copy (not its status, history or responses)
const COPIED = ["description", "language", "fields", "firstNext", "quiz", "quizKey", "allowDownload", "coverPosition", "coverVersion"];

/** A new form, from a template, or (`source`) a copy of an existing one under a new link. */
function CreateFormModal({ opened, source, onClose, createdBy, onCreated }) {
  const { user } = useAccess();
  const { t, i18n } = useTranslation(NS);
  const [templateKey, setTemplateKey] = useState("komitmen-tadarus");
  const [title, setTitle] = useState("Komitmen Pelaksanaan Tadarus");
  const [slug, setSlug] = useState("komitmen-tadarus");
  const [slugTouched, setSlugTouched] = useState(false);
  const [errorKey, setErrorKey] = useState(null);
  const [saving, setSaving] = useState(false);

  // a copy starts as "<title> (copy)" at "<link>-2"
  useEffect(() => {
    if (!opened) return;
    setErrorKey(null);
    if (source) {
      setTitle(`${source.title || t("untitled")} ${t("list.copySuffix")}`);
      setSlug(slugify(`${source.id}-2`));
      setSlugTouched(true);
    }
  }, [opened, source]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickTemplate = (template) => {
    setTemplateKey(template.key);
    setTitle(template.build(i18n.language).title);
    if (!slugTouched) setSlug(template.key === "blank" ? "" : template.key);
  };

  const handleTitle = (value) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleCreate = async () => {
    setErrorKey(null);
    const id = slugify(slug);
    if (!title.trim()) return setErrorKey({ key: "noTitle" });
    if (!isValidSlug(id)) return setErrorKey({ key: "badLink" });

    setSaving(true);
    try {
      const ref = doc(db, FORMS_COLLECTION, id);
      if ((await getDoc(ref)).exists()) {
        setErrorKey({ key: "taken", id });
        return;
      }
      let content;
      let key = null;
      let cover = null;
      if (source) {
        content = Object.fromEntries(COPIED.filter((k) => source[k] !== undefined).map((k) => [k, source[k]]));
        // the answer key and the cover live in their own documents
        const [keySnap, coverSnap] = await Promise.all([
          getDoc(doc(db, FORMS_COLLECTION, source.id, PRIVATE, KEY_DOC)).catch(() => null),
          source.coverVersion ? getDoc(doc(db, FORMS_COLLECTION, source.id, MEDIA, COVER_DOC)).catch(() => null) : null,
        ]);
        if (keySnap?.exists()) key = keySnap.data().key || {};
        if (coverSnap?.exists()) cover = coverSnap.data().dataUrl;
        if (!cover) {
          delete content.coverVersion;
          delete content.coverPosition;
        }
      } else {
        const template = TEMPLATES.find((tpl) => tpl.key === templateKey) || TEMPLATES[0];
        content = template.build(i18n.language.slice(0, 2));
      }
      await auditedWrite(
        user,
        {
          area: "forms",
          action: "form.create",
          target: id,
          label: title.trim(),
          details: source ? { copyOf: source.id } : { template: templateKey },
        },
        (batch, auditId) => {
          batch.set(ref, {
            ...content,
            title: title.trim(),
            status: "draft",
            auditId,
            createdBy,
            updatedBy: createdBy,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          if (key) batch.set(doc(db, FORMS_COLLECTION, id, PRIVATE, KEY_DOC), { key, auditId, updatedAt: serverTimestamp() });
          if (cover) batch.set(doc(db, FORMS_COLLECTION, id, MEDIA, COVER_DOC), { dataUrl: cover, auditId, updatedAt: serverTimestamp() });
        }
      );
      onCreated(id);
    } catch (err) {
      console.error("Could not create form:", err);
      setErrorKey({ key: "failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={source ? t("list.duplicateTitle") : t("create.title")} centered size="lg">
      {source ? (
        <Text size="sm" c="dimmed" mb="sm">
          {t("list.duplicateText", { title: source.title || t("untitled") })}
        </Text>
      ) : (
        <>
          <Text size="sm" fw={600} mb={8}>
            {t("create.startFrom")}
          </Text>
          <div className={styles.templateGrid}>
            {TEMPLATES.map((tpl) => (
              <button
                type="button"
                key={tpl.key}
                className={`${styles.templateCard} ${templateKey === tpl.key ? styles.templateActive : ""}`}
                onClick={() => pickTemplate(tpl)}
              >
                <span className={styles.templateTitle}>{t(`templates.${tpl.key}.title`)}</span>
                <span className={styles.templateDesc}>{t(`templates.${tpl.key}.description`)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <TextInput mt="md" label={t("create.formTitle")} value={title} onChange={(e) => handleTitle(e.target.value)} placeholder={t("create.formTitlePlaceholder")} />
      <TextInput
        mt="sm"
        dir="ltr"
        label={t("create.link")}
        description={t("create.linkHint")}
        leftSection={
          <Text size="xs" c="dimmed" pl={6}>
            /form/
          </Text>
        }
        leftSectionWidth={56}
        value={slug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
        }}
      />

      {errorKey && (
        <Alert color="red" mt="md">
          {t(`create.errors.${errorKey.key}`, { id: errorKey.id })}
        </Alert>
      )}

      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          {t("create.cancel")}
        </Button>
        <Button className={styles.primaryButton} loading={saving} onClick={handleCreate}>
          {source ? t("list.duplicateSubmit") : t("create.submit")}
        </Button>
      </Group>
    </Modal>
  );
}
