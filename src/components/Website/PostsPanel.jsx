import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Group, Loader, Modal, Text, TextInput } from "@mantine/core";
import { IconCalendar, IconNews, IconPhoto, IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { isValidSlug, slugify } from "../Forms/formSchema";
import { POSTS, formatPostDate, todayIso } from "../Blog/blogSchema";
import styles from "./Website.module.css";

const STATUS_COLORS = { draft: "gray", published: "teal" };

export default function PostsPanel({ editorEmail }) {
  const { t, i18n } = useTranslation(["internal/Website", "blog/Blog"]);
  const navigate = useNavigate();
  const [posts, setPosts] = useState(null);
  const [failed, setFailed] = useState(false);
  const [creating, setCreating] = useState(false);

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
      await setDoc(ref, {
        title: title.trim(),
        excerpt: "",
        body: "",
        category: "lainnya",
        province: "",
        date: todayIso(),
        status: "draft",
        images: [],
        coverId: null,
        coverThumb: "",
        createdBy: editorEmail,
        updatedBy: editorEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
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
