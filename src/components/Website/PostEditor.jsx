import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  SegmentedControl,
  Select,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconEye,
  IconPhotoPlus,
  IconStar,
  IconStarFilled,
  IconTrash,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import topoData from "../../data/indonesia-provinces.topo.json";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import { AccountBar, InternalLayout } from "../Internal/InternalUI";
import { stableKey } from "../Internal/stableKey";
import layout from "../Internal/AccessControl.module.css";
import portal from "../Internal/InternalPortal.module.css";
import { CATEGORIES, IMAGES, MAX_IMAGES, POSTS, THUMBS, hasLargeCard, makeGridThumb, makeImage, makeThumb } from "../Blog/blogSchema";
import { buildPostThumbs } from "./postThumbs";
import SaveBar from "./SaveBar";
import PostPreview from "./PostPreview";
import styles from "./Website.module.css";

const PROVINCES = topoData.objects["indonesia-38-prov-topo"].geometries
  .map((g) => g.properties.PROVINSI)
  .sort((a, b) => a.localeCompare(b));

const TEXT_FIELDS = ["title", "excerpt", "body", "category", "province", "date"];
const textOf = (post) => Object.fromEntries(TEXT_FIELDS.map((f) => [f, post[f] || ""]));

const problemIn = (draft) => {
  if (!draft.title.trim()) return "noTitle";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return "noDate";
  return null;
};

export default function PostEditor() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(["internal/Website", "blog/Blog", "internal/Internal"]);
  const { email, user } = useAccess();
  const postRef = useMemo(() => doc(db, POSTS, postId), [postId]);

  const [post, setPost] = useState(undefined);
  const [images, setImages] = useState({});
  const [thumbs, setThumbs] = useState({}); // id → { auditId }, to delete them with their photo
  const [draft, setDraft] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [baseline, setBaseline] = useState(null);
  const baselineRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [upload, setUpload] = useState(null); // { done, total }
  const [photoErrors, setPhotoErrors] = useState([]);
  const [busyPhoto, setBusyPhoto] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef(null);
  const coverRef = useRef(null); // cover id as soon as it is set, before the snapshot catches up

  useEffect(
    () =>
      onSnapshot(
        postRef,
        (snap) => setPost(snap.exists() ? { id: snap.id, ...snap.data() } : null),
        (err) => {
          console.error("Could not load post:", err);
          setPost(null);
        }
      ),
    [postRef]
  );

  useEffect(
    () =>
      onSnapshot(
        collection(db, POSTS, postId, IMAGES),
        (snap) => setImages(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))),
        (err) => console.error("Could not load photos:", err)
      ),
    [postId]
  );

  useEffect(
    () =>
      onSnapshot(
        collection(db, POSTS, postId, THUMBS),
        (snap) => setThumbs(Object.fromEntries(snap.docs.map((d) => [d.id, { auditId: d.data().auditId }]))),
        (err) => console.error("Could not load thumbnails:", err)
      ),
    [postId]
  );

  // A post saved before gallery thumbnails existed gets them once its photos
  // have loaded, so visitors stop downloading every full photo.
  const buildingThumbs = useRef(false);
  useEffect(() => {
    if (!post || (post.thumbsReady && !hasLargeCard(post)) || buildingThumbs.current) return;
    const ids = post.images || [];
    if (!ids.every((id) => images[id])) return;
    buildingThumbs.current = true;
    buildPostThumbs({ user, post, images }).catch((err) => {
      console.error("Could not make thumbnails:", err);
      buildingThumbs.current = false;
    });
  }, [post, images, user]);

  // Text fields: keep local edits, take in changes saved elsewhere.
  useEffect(() => {
    if (!post) return;
    coverRef.current = post.coverId || null;
    const incoming = textOf(post);
    const key = stableKey(incoming);
    const previous = baselineRef.current;
    if (key === previous) return;
    baselineRef.current = key;
    setBaseline(key);
    setDraft((current) => (current === null || stableKey(current) === previous ? incoming : current));
  }, [post]);

  const dirty = draft !== null && stableKey(draft) !== baseline;

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const touch = { updatedBy: email, updatedAt: serverTimestamp() };

  // Changes the post (and its photos) in one batch with a history entry.
  const writePost = (action, patch, details, more) =>
    auditedWrite(user, { area: "site", action, target: postId, label: post?.title || postId, details }, (batch, auditId, markDelete) => {
      if (patch) batch.update(postRef, { ...patch, ...touch, auditId });
      more?.(batch, auditId, markDelete);
    });

  const saveText = async (extra = {}) => {
    setMessage(null);
    const problem = problemIn(draft);
    if (problem) {
      setMessage({ color: "red", text: t(`blog.editor.problems.${problem}`) });
      return false;
    }
    const clean = {
      title: draft.title.trim(),
      excerpt: draft.excerpt.trim(),
      body: draft.body.replace(/\s+$/, ""),
      category: CATEGORIES.includes(draft.category) ? draft.category : "lainnya",
      province: draft.province,
      date: draft.date,
    };
    setSaving(true);
    try {
      const changed = ["title", "excerpt", "body", "category", "province", "date"].filter((k) => (post?.[k] ?? "") !== clean[k]);
      await writePost(extra.status ? "post.status" : "post.update", { ...clean, ...extra }, {
        changed,
        ...(extra.status && { from: post?.status || "draft", to: extra.status }),
      });
      setDraft(clean);
      setMessage({ color: "teal", text: t("saved") });
      return true;
    } catch (err) {
      console.error("Could not save post:", err);
      setMessage({ color: "red", text: t("saveFailed") });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Publishing also saves any text still being edited.
  const changeStatus = async (status) => {
    const extra = { status, ...(status === "published" && !post.publishedAt ? { publishedAt: serverTimestamp() } : {}) };
    if (dirty) {
      await saveText(extra);
      return;
    }
    try {
      await writePost("post.status", extra, { from: post?.status || "draft", to: status });
    } catch (err) {
      console.error("Could not change status:", err);
      setMessage({ color: "red", text: t("blog.statusFailed") });
    }
  };

  /* ── photos: each change is saved straight away ── */

  const order = post?.images || [];

  const uploadFiles = async (fileList) => {
    const files = [...fileList];
    setPhotoErrors([]);
    const room = MAX_IMAGES - order.length;
    const accepted = files.slice(0, Math.max(0, room));
    const errors = files.length > room ? [t("blog.editor.tooMany", { max: MAX_IMAGES })] : [];
    setUpload({ done: 0, total: accepted.length });
    for (const [i, file] of accepted.entries()) {
      try {
        const image = await makeImage(file);
        const grid = await makeGridThumb(image.dataUrl);
        const ref = doc(collection(db, POSTS, postId, IMAGES));
        const patch = { images: arrayUnion(ref.id) };
        if (!coverRef.current) {
          coverRef.current = ref.id;
          patch.coverId = ref.id;
          patch.coverThumb = await makeThumb(image.dataUrl);
        }
        await writePost("post.photo_add", patch, { photo: file.name }, (batch, auditId) => {
          batch.set(ref, { ...image, auditId, createdAt: serverTimestamp() });
          batch.set(doc(db, POSTS, postId, THUMBS, ref.id), { ...grid, auditId });
        });
      } catch (err) {
        console.error("Photo upload failed:", err);
        const key = err.message === "unreadable" ? "unreadable" : err.message === "too-large" ? "tooLarge" : "failed";
        errors.push(t(`blog.editor.photoErrors.${key}`, { name: file.name }));
      }
      setUpload({ done: i + 1, total: accepted.length });
    }
    setUpload(null);
    setPhotoErrors(errors);
  };

  const setCover = async (id) => {
    if (!images[id]) return;
    setBusyPhoto(id);
    try {
      const coverThumb = await makeThumb(images[id].dataUrl);
      coverRef.current = id;
      await writePost("post.cover", { coverId: id, coverThumb }, { photo: order.indexOf(id) + 1 });
    } catch (err) {
      console.error("Could not set cover:", err);
    } finally {
      setBusyPhoto("");
    }
  };

  const movePhoto = async (index, delta) => {
    const next = [...order];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await writePost("post.photo_move", { images: next }, { from: index + 1, to: target + 1 }).catch((err) => console.error("Could not reorder:", err));
  };

  const deletePhoto = async (id) => {
    setBusyPhoto(id);
    try {
      const remaining = order.filter((x) => x !== id);
      const patch = { images: remaining };
      if (post.coverId === id) {
        const next = remaining.find((x) => images[x]);
        coverRef.current = next || null;
        patch.coverId = next || null;
        patch.coverThumb = next ? await makeThumb(images[next].dataUrl) : "";
      }
      await writePost("post.photo_delete", patch, { photo: order.indexOf(id) + 1 }, (batch, _auditId, markDelete) => {
        batch.delete(doc(db, POSTS, postId, IMAGES, id));
        markDelete(`posts~${postId}~images~${id}`, images[id]?.auditId);
        batch.delete(doc(db, POSTS, postId, THUMBS, id));
        markDelete(`posts~${postId}~thumbs~${id}`, thumbs[id]?.auditId);
      });
    } catch (err) {
      console.error("Could not delete photo:", err);
    } finally {
      setBusyPhoto("");
    }
  };

  const deletePost = async () => {
    setDeleting(true);
    try {
      const snap = await getDocs(collection(db, POSTS, postId, IMAGES));
      const small = await getDocs(collection(db, POSTS, postId, THUMBS));
      await writePost("post.delete", null, { status: post?.status || "draft", photos: snap.size }, (batch, _auditId, markDelete) => {
        snap.docs.forEach((d) => {
          batch.delete(d.ref);
          markDelete(`posts~${postId}~images~${d.id}`, d.data().auditId);
        });
        small.docs.forEach((d) => {
          batch.delete(d.ref);
          markDelete(`posts~${postId}~thumbs~${d.id}`, d.data().auditId);
        });
        batch.delete(postRef);
        markDelete(`posts~${postId}`, post?.auditId);
      });
      navigate("/internal/website?tab=blog", { replace: true });
    } catch (err) {
      console.error("Could not delete post:", err);
      setMessage({ color: "red", text: t("blog.editor.deleteFailed") });
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const set = (field) => (value) => setDraft((d) => ({ ...d, [field]: value }));

  return (
    <InternalLayout align="top">
      <div className={layout.page}>
        <a href="/internal/website?tab=blog" className={layout.back}>
          <IconArrowLeft size={16} className={portal.flipRtl} /> {t("blog.editor.back")}
        </a>

        <Card className={layout.panel}>
          <AccountBar />

          {post === undefined || (post && draft === null) ? (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          ) : post === null ? (
            <Alert color="red" mt="lg">
              {t("blog.editor.notFound")}
            </Alert>
          ) : (
            <div className={styles.editor}>
              <div className={styles.postHeader}>
                <Title order={2} className={layout.headingTitle} dir="auto">
                  {post.title || t("blog.untitled")}
                </Title>
                <div className={styles.statusBox}>
                  <SegmentedControl
                    value={post.status === "published" ? "published" : "draft"}
                    onChange={changeStatus}
                    data={["draft", "published"].map((value) => ({ value, label: t(`blog.status.${value}`) }))}
                    color={post.status === "published" ? "teal" : "gray"}
                  />
                  <Text size="xs" c="dimmed" mt={4}>
                    {t(`blog.statusHint.${post.status === "published" ? "published" : "draft"}`)}
                  </Text>
                </div>
              </div>
              <Group gap="xs">
                <Button size="xs" color="yellow" leftSection={<IconEye size={14} />} onClick={() => setPreviewOpen(true)}>
                  {t("blog.editor.preview")}
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="yellow"
                  component="a"
                  href={`/berita/${post.id}`}
                  target="_blank"
                  rel="noreferrer"
                  leftSection={<IconExternalLink size={14} />}
                >
                  {t("blog.editor.view")}
                </Button>
                <Text size="xs" c="dimmed">
                  <bdi>/berita/{post.id}</bdi>
                </Text>
              </Group>

              {/* ── photos ── */}
              <section className={styles.photoSection}>
                <Group justify="space-between" align="flex-start" gap="xs">
                  <div>
                    <Text fw={700}>{t("blog.editor.photos")}</Text>
                    <Text size="xs" c="dimmed">
                      {t("blog.editor.photosHint", { max: MAX_IMAGES })}
                    </Text>
                  </div>
                  <Button
                    size="sm"
                    className={styles.goldButton}
                    leftSection={<IconPhotoPlus size={16} />}
                    loading={!!upload}
                    disabled={order.length >= MAX_IMAGES}
                    onClick={() => fileRef.current?.click()}
                  >
                    {t("blog.editor.addPhotos")}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files?.length) uploadFiles(files);
                      e.target.value = "";
                    }}
                  />
                </Group>

                {upload && (
                  <Text size="sm" c="yellow.8" fw={600} mt="xs">
                    {t("blog.editor.uploading", upload)}
                  </Text>
                )}
                {photoErrors.length > 0 && (
                  <Alert color="red" mt="xs" withCloseButton onClose={() => setPhotoErrors([])}>
                    {photoErrors.map((e) => (
                      <div key={e}>{e}</div>
                    ))}
                  </Alert>
                )}

                {order.length > 0 && (
                  <div className={styles.photoGrid}>
                    {order.map((id, index) => {
                      const isCover = post.coverId === id;
                      return (
                        <div key={id} className={`${styles.photoTile} ${isCover ? styles.photoCover : ""}`}>
                          {images[id] ? <img src={images[id].dataUrl} alt="" /> : <Loader size="xs" />}
                          {isCover && <span className={styles.coverBadge}>{t("blog.editor.cover")}</span>}
                          <div className={styles.photoActions} dir="ltr">
                            <Tooltip label={t("blog.editor.setCover")}>
                              <ActionIcon
                                size="sm"
                                variant="filled"
                                color={isCover ? "yellow" : "dark"}
                                onClick={() => setCover(id)}
                                disabled={isCover || busyPhoto === id}
                                aria-label={t("blog.editor.setCover")}
                              >
                                {isCover ? <IconStarFilled size={14} /> : <IconStar size={14} />}
                              </ActionIcon>
                            </Tooltip>
                            <ActionIcon
                              size="sm"
                              variant="filled"
                              color="dark"
                              onClick={() => movePhoto(index, -1)}
                              disabled={index === 0}
                              aria-label={t("blog.editor.moveLeft")}
                            >
                              <IconChevronLeft size={14} />
                            </ActionIcon>
                            <ActionIcon
                              size="sm"
                              variant="filled"
                              color="dark"
                              onClick={() => movePhoto(index, 1)}
                              disabled={index === order.length - 1}
                              aria-label={t("blog.editor.moveRight")}
                            >
                              <IconChevronRight size={14} />
                            </ActionIcon>
                            <Tooltip label={t("blog.editor.deletePhoto")}>
                              <ActionIcon
                                size="sm"
                                variant="filled"
                                color="red"
                                onClick={() => deletePhoto(id)}
                                loading={busyPhoto === id}
                                aria-label={t("blog.editor.deletePhoto")}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* ── text ── */}
              <TextInput label={t("blog.editor.title")} value={draft.title} onChange={(e) => set("title")(e.target.value)} />
              <div className={styles.fieldGrid}>
                <Select
                  label={t("blog.editor.category")}
                  data={CATEGORIES.map((value) => ({ value, label: t(`blog/Blog:categories.${value}`) }))}
                  value={draft.category || "lainnya"}
                  onChange={(v) => v && set("category")(v)}
                  allowDeselect={false}
                  comboboxProps={{ withinPortal: true }}
                />
                <TextInput
                  type="date"
                  label={t("blog.editor.date")}
                  value={draft.date}
                  onChange={(e) => set("date")(e.target.value)}
                />
                <Select
                  label={t("blog.editor.province")}
                  description={t("blog.editor.provinceHint")}
                  data={PROVINCES}
                  value={draft.province || null}
                  onChange={(v) => set("province")(v || "")}
                  searchable
                  clearable
                  comboboxProps={{ withinPortal: true }}
                />
              </div>
              <Textarea
                label={t("blog.editor.excerpt")}
                description={t("blog.editor.excerptHint")}
                autosize
                minRows={2}
                maxLength={300}
                value={draft.excerpt}
                onChange={(e) => set("excerpt")(e.target.value)}
              />
              <Textarea
                label={t("blog.editor.body")}
                description={t("blog.editor.bodyHint")}
                autosize
                minRows={8}
                maxLength={40000}
                value={draft.body}
                onChange={(e) => set("body")(e.target.value)}
                classNames={{ input: styles.bodyInput }}
              />

              <div className={styles.dangerRow}>
                <Button variant="subtle" color="red" leftSection={<IconTrash size={15} />} onClick={() => setDeleteOpen(true)}>
                  {t("blog.editor.delete")}
                </Button>
              </div>

              <SaveBar
                dirty={dirty}
                saving={saving}
                message={message}
                onDismiss={() => setMessage(null)}
                onDiscard={() => {
                  setDraft(textOf(post));
                  setMessage(null);
                }}
                onSave={() => saveText()}
              />
            </div>
          )}
        </Card>
      </div>

      {post && draft && (
        <PostPreview
          opened={previewOpen}
          onClose={() => setPreviewOpen(false)}
          post={{ ...post, ...draft }}
          images={images}
          unsaved={dirty}
        />
      )}

      <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} title={t("blog.editor.deleteTitle")} centered>
        <Text size="sm">{t("blog.editor.deleteText")}</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setDeleteOpen(false)}>
            {t("blog.create.cancel")}
          </Button>
          <Button color="red" loading={deleting} onClick={deletePost}>
            {t("blog.editor.deleteConfirm")}
          </Button>
        </Group>
      </Modal>
    </InternalLayout>
  );
}
