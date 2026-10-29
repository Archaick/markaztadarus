import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCheck,
  IconClipboardText,
  IconCopy,
  IconExternalLink,
  IconMessages,
  IconPlus,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import { AccountBar, InternalLayout } from "../Internal/InternalUI";
import { timeAgo } from "../Internal/timeAgo";
import layout from "../Internal/AccessControl.module.css";
import portal from "../Internal/InternalPortal.module.css";
import styles from "./Forms.module.css";
import {
  FORMS_COLLECTION,
  RESPONSES,
  STATUS_COLORS,
  TEMPLATES,
  formLink,
  isValidSlug,
  questionsOf,
  slugify,
} from "./formSchema";

const NS = ["internal/Forms", "internal/Internal"];

export default function FormsAdmin() {
  const { t } = useTranslation(NS);
  const navigate = useNavigate();
  const { email } = useAccess();
  const [forms, setForms] = useState(null);
  const [counts, setCounts] = useState({});
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, FORMS_COLLECTION), orderBy("updatedAt", "desc")),
        (snap) => setForms(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => {
          console.error("Could not load forms:", err);
          setError(true);
          setForms([]);
        }
      ),
    []
  );

  const formIds = (forms || []).map((f) => f.id).join("|");
  useEffect(() => {
    if (!formIds) return;
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

  return (
    <InternalLayout align="top">
      <div className={layout.page}>
        <a href="/internal" className={layout.back}>
          <IconArrowLeft size={16} className={portal.flipRtl} /> {t("internal/Internal:backToHub")}
        </a>

        <Card className={layout.panel}>
          <AccountBar />

          <div className={styles.headerRow}>
            <div className={layout.heading}>
              <span className={layout.headingIcon} style={{ background: "linear-gradient(135deg, #10b981 0%, #047857 100%)" }}>
                <IconClipboardText size={22} />
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
              onClick={() => setCreating(true)}
            >
              {t("newForm")}
            </Button>
          </div>

          {error && (
            <Alert color="red" mt="md">
              {t("loadFailed")}
            </Alert>
          )}

          <div className={styles.formGrid}>
            {forms === null && (
              <Group justify="center" py="xl">
                <Loader size="sm" />
              </Group>
            )}

            {forms?.length === 0 && !error && (
              <div className={styles.empty}>
                <IconClipboardText size={34} />
                <Text fw={600}>{t("empty.title")}</Text>
                <Text size="sm" c="dimmed">
                  {t("empty.text")}
                </Text>
                <Button mt="sm" variant="light" color="teal" onClick={() => setCreating(true)}>
                  {t("empty.button")}
                </Button>
              </div>
            )}

            {forms?.map((form) => {
              const status = STATUS_COLORS[form.status] ? form.status : "draft";
              return (
                <div
                  key={form.id}
                  className={styles.formCard}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/internal/forms/${form.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && navigate(`/internal/forms/${form.id}`)}
                >
                  <div className={styles.formCardTop}>
                    <Badge color={STATUS_COLORS[status]} variant="light">
                      {t(`status.${status}`)}
                    </Badge>
                    <span className={styles.responsePill}>
                      <IconMessages size={14} />
                      {counts[form.id] === undefined ? "…" : t("card.responses", { count: counts[form.id] })}
                    </span>
                  </div>
                  <p className={styles.formCardTitle}>{form.title || t("untitled")}</p>
                  <p className={styles.formCardMeta}>
                    {t("card.questions", { count: questionsOf(form.fields || []).length })} ·{" "}
                    {t("card.updated", { time: timeAgo(form.updatedAt) })}
                  </p>
                  <div className={styles.formCardLink} onClick={(e) => e.stopPropagation()}>
                    <span className={styles.linkText}>
                      <bdi>/form/{form.id}</bdi>
                    </span>
                    <CopyButton value={formLink(form.id)}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? t("card.copied") : t("card.copyLink")}>
                          <ActionIcon
                            variant="subtle"
                            color={copied ? "teal" : "gray"}
                            onClick={copy}
                            aria-label={t("card.copyLink")}
                          >
                            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                    <Tooltip label={t("card.openForm")}>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        component="a"
                        href={`/form/${form.id}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={t("card.openForm")}
                      >
                        <IconExternalLink size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <CreateFormModal
        opened={creating}
        onClose={() => setCreating(false)}
        createdBy={email}
        onCreated={(id) => navigate(`/internal/forms/${id}`)}
      />
    </InternalLayout>
  );
}

function CreateFormModal({ opened, onClose, createdBy, onCreated }) {
  const { user } = useAccess();
  const { t, i18n } = useTranslation(NS);
  const [templateKey, setTemplateKey] = useState("komitmen-tadarus");
  const [title, setTitle] = useState("Komitmen Pelaksanaan Tadarus");
  const [slug, setSlug] = useState("komitmen-tadarus");
  const [slugTouched, setSlugTouched] = useState(false);
  const [errorKey, setErrorKey] = useState(null);
  const [saving, setSaving] = useState(false);

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
      const template = TEMPLATES.find((tpl) => tpl.key === templateKey) || TEMPLATES[0];
      const built = template.build(i18n.language.slice(0, 2));
      await auditedWrite(
        user,
        { area: "forms", action: "form.create", target: id, label: title.trim(), details: { template: template.key } },
        (batch, auditId) =>
          batch.set(ref, {
            ...built,
            title: title.trim(),
            status: "draft",
            auditId,
            createdBy,
            updatedBy: createdBy,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
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
    <Modal opened={opened} onClose={onClose} title={t("create.title")} centered size="lg">
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

      <TextInput
        mt="md"
        label={t("create.formTitle")}
        value={title}
        onChange={(e) => handleTitle(e.target.value)}
        placeholder={t("create.formTitlePlaceholder")}
      />
      <TextInput
        mt="sm"
        dir="ltr"
        label={t("create.link")}
        description={t("create.linkHint")}
        leftSection={<Text size="xs" c="dimmed" pl={6}>/form/</Text>}
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
          {t("create.submit")}
        </Button>
      </Group>
    </Modal>
  );
}
