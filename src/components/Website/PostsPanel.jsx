import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Group, Loader, Modal, Text, TextInput } from "@mantine/core";
import { IconBolt, IconCalendar, IconNews, IconPhoto, IconPhotoDown, IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import { isValidSlug, slugify } from "../Forms/formSchema";
import { POSTS, formatPostDate, hasLargeCard, todayIso } from "../Blog/blogSchema";
import styles from "./Website.module.css";
import { LEGACY_PHOTO_COUNT, LEGACY_SLUGS, importLegacyGallery } from "./importGallery";
import { buildPostThumbs } from "./postThumbs";

const STATUS_COLORS = { draft: "gray", published: "teal" };

export default function PostsPanel({ editorEmail }) {
  const { t, i18n } = useTranslation(["internal/Website", "blog/Blog"]);
  const { user } = useAccess();
  const navigate = useNavigate();
  const [posts, setPosts] = useState(null);
  const [failed, setFailed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(null); // { done, total }
  const [importResult, setImportResult] = useState(null);

  const legacyLeft = posts ? LEGACY_SLUGS.filter((slug) => !posts.some((p) => p.id === slug)).length : 0;

  // Posts saved before gallery thumbnails existed: their page downloads every
  // full photo until they are optimised.
  const unoptimised = (posts || []).filter((p) => (p.images || []).length > 0 && (!p.thumbsReady || hasLargeCard(p)));
  const [optimising, setOptimising] = useState(null); // { done, total }
  const [optimiseResult, setOptimiseResult] = useState(null);

  const runOptimise = async () => {
    setOptimiseResult(null);
    const list = unoptimised;
    setOptimising({ done: 0, total: list.length });
    try {
      for (const [i, post] of list.entries()) {
        await buildPostThumbs({ user, post });
        setOptimising({ done: i + 1, total: list.length });
      }
      setOptimiseResult({ color: "teal", text: t("blog.optimise.done", { count: list.length }) });
    } catch (err) {
      console.error("Could not optimise photos:", err);
      setOptimiseResult({ color: "red", text: t("blog.optimise.failed") });
    } finally {
      setOptimising(null);
    }
  };

  const runImport = async () => {
    setImportResult(null);
    setImporting({ done: 0, total: LEGACY_PHOTO_COUNT });
    try {
      const count = await importLegacyGallery({
        user,
        editorEmail,
        onPhoto: () => setImporting((s) => ({ ...s, done: s.done + 1 })),
      });
      setImportResult({ color: "teal", text: t("blog.import.done", { count }) });
    } catch (err) {
      console.error("Gallery import failed:", err);
      setImportResult({ color: "red", text: t("blog.import.failed") });
    } finally {
      setImporting(null);
    }
  };

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, POSTS), orderBy("date", "desc")),
        (snap) => {
          setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setFailed(false);
        },
        (err) => {
          console.error("Could not load posts:", err);
          setFailed(true);
          setPosts([]);
        }
      ),
    []
  );

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <Text fw={700} className={styles.summary}>
          <IconNews size={18} className={styles.inlineIcon} /> {t("blog/Blog:pageTitle")}
        </Text>
        <Button leftSection={<IconPlus size={16} />} className={styles.goldButton} onClick={() => setCreating(true)}>
          {t("blog.newPost")}
        </Button>
      </div>

      {failed && <Alert color="red">{t("loadFailed")}</Alert>}

      {legacyLeft > 0 && (
        <div className={styles.importBox}>
          <IconPhotoDown size={26} />
          <div className={styles.importText}>
            <Text fw={700}>{t("blog.import.title")}</Text>
            <Text size="sm" c="dimmed">
              {t("blog.import.text", { count: LEGACY_PHOTO_COUNT })}
            </Text>
          </div>
          <Button className={styles.goldButton} loading={!!importing} onClick={runImport}>
            {t("blog.import.button")}
          </Button>
        </div>
      )}
      {unoptimised.length > 0 && (
        <div className={styles.importBox}>
          <IconBolt size={26} />
          <div className={styles.importText}>
            <Text fw={700}>{t("blog.optimise.title", { count: unoptimised.length })}</Text>
            <Text size="sm" c="dimmed">
              {t("blog.optimise.text")}
            </Text>
          </div>
          <Button className={styles.goldButton} loading={!!optimising} onClick={runOptimise}>
            {t("blog.optimise.button")}
          </Button>
        </div>
      )}
      {optimising && (
        <Text size="sm" c="yellow.8" fw={600}>
          {t("blog.optimise.progress", optimising)}
        </Text>
      )}
      {optimiseResult && (
        <Alert color={optimiseResult.color} withCloseButton onClose={() => setOptimiseResult(null)}>
          {optimiseResult.text}
        </Alert>
      )}
      {importing && (
        <Text size="sm" c="yellow.8" fw={600}>
          {t("blog.import.progress", importing)}
        </Text>
      )}
      {importResult && (
        <Alert color={importResult.color} withCloseButton onClose={() => setImportResult(null)}>
          {importResult.text}
        </Alert>
      )}

      {posts === null ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : posts.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          {t("blog.empty")}
        </Text>
      ) : (
        <div className={styles.postList}>
          {posts.map((post) => (
            <button
              type="button"
              key={post.id}
              className={styles.postRow}
              onClick={() => navigate(`/internal/website/berita/${post.id}`)}
            >
              <span className={styles.postThumb}>
                {post.coverThumb ? <img src={post.coverThumb} alt="" /> : <IconPhoto size={22} />}
              </span>
              <span className={styles.postInfo}>
                <span className={styles.postTitle} dir="auto">
                  {post.title || t("blog.untitled")}
                </span>
                <span className={styles.postMeta}>
                  <IconCalendar size={13} /> {formatPostDate(post.date, i18n.language)} ·{" "}
                  {t(`blog/Blog:categories.${post.category || "lainnya"}`)} · {t("blog/Blog:photos", { count: (post.images || []).length })}
                </span>
              </span>
              <Badge color={STATUS_COLORS[post.status] || "gray"} variant="light">
                {t(`blog.status.${post.status === "published" ? "published" : "draft"}`)}
              </Badge>
            </button>
          ))}
        </div>
      )}

      <CreatePostModal
        opened={creating}
        onClose={() => setCreating(false)}
        editorEmail={editorEmail}
        onCreated={(id) => navigate(`/internal/website/berita/${id}`)}
      />
    </div>
  );
}

function CreatePostModal({ opened, onClose, editorEmail, onCreated }) {
  const { t } = useTranslation("internal/Website");
  const { user } = useAccess();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const create = async () => {
    setError(null);
    const id = slugify(slug);
    if (!title.trim()) return setError({ key: "noTitle" });
    if (!isValidSlug(id)) return setError({ key: "badLink" });
    setSaving(true);
    try {
      const ref = doc(db, POSTS, id);
      if ((await getDoc(ref)).exists()) {
        setError({ key: "taken", id });
        return;
      }
      await auditedWrite(user, { area: "site", action: "post.create", target: id, label: title.trim() }, (batch, auditId) =>
        batch.set(ref, {
        auditId,
        title: title.trim(),
        excerpt: "",
        body: "",
        category: "lainnya",
        province: "",
        date: todayIso(),
        status: "draft",
        images: [],
        thumbsReady: true,
        coverId: null,
        coverThumb: "",
        createdBy: editorEmail,
        updatedBy: editorEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        })
      );
      onCreated(id);
    } catch (err) {
      console.error("Could not create post:", err);
      setError({ key: "failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t("blog.create.title")} centered>
      <TextInput
        label={t("blog.create.postTitle")}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (!slugTouched) setSlug(slugify(e.target.value));
        }}
        data-autofocus
      />
      <TextInput
        mt="sm"
        dir="ltr"
        label={t("blog.create.link")}
        description={t("blog.create.linkHint")}
        leftSection={
          <Text size="xs" c="dimmed" pl={6}>
            /berita/
          </Text>
        }
        leftSectionWidth={64}
        value={slug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
        }}
      />
      {error && (
        <Alert color="red" mt="md">
          {t(`blog.create.errors.${error.key}`, { id: error.id })}
        </Alert>
      )}
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          {t("blog.create.cancel")}
        </Button>
        <Button className={styles.goldButton} loading={saving} onClick={create}>
          {t("blog.create.submit")}
        </Button>
      </Group>
    </Modal>
  );
}
