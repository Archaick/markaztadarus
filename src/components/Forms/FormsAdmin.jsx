import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
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
  ActionIcon,
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
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { AccountBar, InternalLayout } from "../Internal/InternalUI";
import { timeAgo } from "../Internal/timeAgo";
import layout from "../Internal/AccessControl.module.css";
import styles from "./Forms.module.css";
import {
  FORMS_COLLECTION,
  RESPONSES,
  STATUS,
  TEMPLATES,
  formLink,
  isValidSlug,
  slugify,
} from "./formSchema";

export default function FormsAdmin() {
  const navigate = useNavigate();
  const { email } = useAccess();
  const [forms, setForms] = useState(null);
  const [counts, setCounts] = useState({});
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, FORMS_COLLECTION), orderBy("updatedAt", "desc")),
        (snap) => setForms(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => {
          console.error("Could not load forms:", err);
          setError("Could not load forms. Check the Firestore rules are deployed.");
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
          <IconArrowLeft size={16} /> Internal Access
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
                  Forms
                </Title>
                <Text className={layout.headingText}>
                  Build a form, share its link, and read every response here.
                </Text>
              </div>
            </div>
            <Button
              leftSection={<IconPlus size={17} />}
              className={styles.primaryButton}
              onClick={() => setCreating(true)}
            >
              New form
            </Button>
          </div>

          {error && (
            <Alert color="red" mt="md">
              {error}
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
                <Text fw={600}>No forms yet</Text>
                <Text size="sm" c="dimmed">
                  Create one from the Komitmen Pelaksanaan Tadarus template or start blank.
                </Text>
                <Button mt="sm" variant="light" color="teal" onClick={() => setCreating(true)}>
                  Create the first form
                </Button>
              </div>
            )}

            {forms?.map((form) => {
              const status = STATUS[form.status] || STATUS.draft;
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
                    <Badge color={status.color} variant="light">
                      {status.label}
                    </Badge>
                    <span className={styles.responsePill}>
                      <IconMessages size={14} />
                      {counts[form.id] ?? "…"} responses
                    </span>
                  </div>
                  <p className={styles.formCardTitle}>{form.title || "Untitled form"}</p>
                  <p className={styles.formCardMeta}>
                    {(form.fields || []).length} questions · updated {timeAgo(form.updatedAt)}
                  </p>
                  <div className={styles.formCardLink} onClick={(e) => e.stopPropagation()}>
                    <span className={styles.linkText}>/form/{form.id}</span>
                    <CopyButton value={formLink(form.id)}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? "Copied" : "Copy link"}>
                          <ActionIcon variant="subtle" color={copied ? "teal" : "gray"} onClick={copy} aria-label="Copy link">
                            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                    <Tooltip label="Open form">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        component="a"
                        href={`/form/${form.id}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open form"
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
  const [templateKey, setTemplateKey] = useState("komitmen-tadarus");
  const [title, setTitle] = useState("Komitmen Pelaksanaan Tadarus");
  const [slug, setSlug] = useState("komitmen-tadarus");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const pickTemplate = (template) => {
    setTemplateKey(template.key);
    const built = template.build();
    setTitle(built.title === "Untitled form" ? "" : built.title);
    if (!slugTouched) setSlug(template.key === "blank" ? "" : template.key);
  };

  const handleTitle = (value) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleCreate = async () => {
    setError("");
    const id = slugify(slug);
    if (!title.trim()) return setError("Give the form a title.");
    if (!isValidSlug(id)) return setError("The link needs 3–60 letters, numbers or dashes.");

    setSaving(true);
    try {
      const ref = doc(db, FORMS_COLLECTION, id);
      if ((await getDoc(ref)).exists()) {
        setError(`/form/${id} is already used. Pick another link.`);
        return;
      }
      const template = TEMPLATES.find((t) => t.key === templateKey) || TEMPLATES[0];
      const built = template.build();
      await setDoc(ref, {
        ...built,
        title: title.trim(),
        status: "draft",
        createdBy,
        updatedBy: createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onCreated(id);
    } catch (err) {
      console.error("Could not create form:", err);
      setError("Could not create the form. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="New form" centered size="lg">
      <Text size="sm" fw={600} mb={8}>
        Start from
      </Text>
      <div className={styles.templateGrid}>
        {TEMPLATES.map((t) => (
          <button
            type="button"
            key={t.key}
            className={`${styles.templateCard} ${templateKey === t.key ? styles.templateActive : ""}`}
            onClick={() => pickTemplate(t)}
          >
            <span className={styles.templateTitle}>{t.title}</span>
            <span className={styles.templateDesc}>{t.description}</span>
          </button>
        ))}
      </div>

      <TextInput
        mt="md"
        label="Title"
        value={title}
        onChange={(e) => handleTitle(e.target.value)}
        placeholder="Form title"
      />
      <TextInput
        mt="sm"
        label="Link"
        description="Letters, numbers and dashes. This cannot be changed later."
        leftSection={<Text size="xs" c="dimmed" pl={6}>/form/</Text>}
        leftSectionWidth={56}
        value={slug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
        }}
      />

      {error && (
        <Alert color="red" mt="md">
          {error}
        </Alert>
      )}

      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button className={styles.primaryButton} loading={saving} onClick={handleCreate}>
          Create form
        </Button>
      </Group>
    </Modal>
  );
}
