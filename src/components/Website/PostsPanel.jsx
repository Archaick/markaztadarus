import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Group, Loader, Modal, SegmentedControl, Select, Text, TextInput } from "@mantine/core";
import { IconBolt, IconCalendar, IconMapPin, IconPhoto, IconPhotoDown, IconPlus, IconSearch, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import { isValidSlug, slugify } from "../Forms/formSchema";
import { CATEGORIES, POSTS, formatPostDate, hasLargeCard, todayIso } from "../Blog/blogSchema";
import styles from "./Website.module.css";
import app from "./WebsiteApp.module.css";
import { LEGACY_PHOTO_COUNT, LEGACY_SLUGS, importLegacyGallery } from "./importGallery";
import { buildPostThumbs } from "./postThumbs";
import { SITE_BASE, usePostsList } from "./WebsiteShell";

const STATUS_COLORS = { draft: "gray", published: "teal" };
const STATUSES = ["published", "draft"];
const SORTS = ["newest", "oldest", "title", "photos"];
const NO_POSTS = [];

const statusOf = (p) => (p.status === "published" ? "published" : "draft");
const categoryOf = (p) => (CATEGORIES.includes(p.category) ? p.category : "lainnya");

/**
 * The news, as cards with their cover: searchable, by status (also in the
 * menu), category and province, in the order chosen. "Write news" (here or
 * in the menu) opens the new-item window.
 */
export default function PostsPanel({ editorEmail }) {
  const { t, i18n } = useTranslation(["internal/Website", "blog/Blog"]);
  const { user } = useAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const statusParam = params.get("status");
  const status = STATUSES.includes(statusParam) ? statusParam : "all";
  const live = usePostsList();
  const posts = Array.isArray(live) ? live : live === "error" ? NO_POSTS : null;
  const failed = live === "error";
  const [importing, setImporting] = useState(null); // { done, total }
  const [importResult, setImportResult] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(null);
  const [province, setProvince] = useState(null);
  const [sort, setSort] = useState("newest");

  // the address keeps the status and whether the new-item window is open ("Write news" in the menu)
  const setParam = (key, value) => {
    const next = new URLSearchParams(location.search);
    next.set("view", "blog");
    next.delete("tab");
    if (value === null) next.delete(key);
    else next.set(key, value);
    navigate({ search: next.toString() }, { replace: true });
  };
  const setStatus = (value) => setParam("status", value === "all" ? null : value);
  const creating = params.get("new") === "1";
  const setCreating = (open) => setParam("new", open ? "1" : null);

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

  // the choices, each with how many news items it has
  const categoryOptions = useMemo(
    () =>
      CATEGORIES.map((value) => ({
        value,
        label: `${t(`blog/Blog:categories.${value}`)} (${(posts || []).filter((p) => categoryOf(p) === value).length})`,
      })),
    [posts, t]
  );
  const provinceOptions = useMemo(() => {
    const counts = {};
    (posts || []).forEach((p) => {
      if (p.province) counts[p.province] = (counts[p.province] || 0) + 1;
    });
    return Object.keys(counts)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: `${value} (${counts[value]})` }));
  }, [posts]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = (posts || []).filter(
      (p) =>
        (status === "all" || statusOf(p) === status) &&
        (!category || categoryOf(p) === category) &&
        (!province || p.province === province) &&
        (!term || [p.title, p.excerpt, p.province, p.id].some((v) => (v || "").toLowerCase().includes(term)))
    );
    const by = {
      newest: (a, b) => (b.date || "").localeCompare(a.date || ""),
      oldest: (a, b) => (a.date || "").localeCompare(b.date || ""),
      title: (a, b) => (a.title || "").localeCompare(b.title || ""),
      photos: (a, b) => (b.images || []).length - (a.images || []).length,
    };
    return [...list].sort(by[sort]);
  }, [posts, status, category, province, search, sort]);
  const filtering = !!(search || category || province || status !== "all");

  const clear = () => {
    setSearch("");
    setCategory(null);
    setProvince(null);
    setStatus("all");
  };

  return (
    <div className={styles.editor}>
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

      <div className={app.filters}>
        <TextInput
          className={app.grow}
          leftSection={<IconSearch size={16} />}
          placeholder={t("blog.filters.search")}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <SegmentedControl
          value={status}
          onChange={setStatus}
          data={[
            { value: "all", label: t("blog.filters.all") },
            { value: "published", label: t("blog.status.published") },
            { value: "draft", label: t("blog.status.draft") },
          ]}
        />
        <Select
          className={app.pick}
          placeholder={t("blog.filters.allCategories")}
          data={categoryOptions}
          value={category}
          onChange={setCategory}
          clearable
          comboboxProps={{ withinPortal: true }}
        />
        {provinceOptions.length > 0 && (
          <Select
            className={app.pick}
            placeholder={t("blog.filters.allProvinces")}
            data={provinceOptions}
            value={province}
            onChange={setProvince}
            clearable
            searchable
            comboboxProps={{ withinPortal: true }}
          />
        )}
        <Select
          className={app.sort}
          aria-label={t("blog.filters.sortLabel")}
          data={SORTS.map((value) => ({ value, label: t(`blog.filters.sort.${value}`) }))}
          value={sort}
          onChange={(v) => v && setSort(v)}
          allowDeselect={false}
          comboboxProps={{ withinPortal: true }}
        />
      </div>

      {posts && posts.length > 0 && (
        <div className={app.summary}>
          <span>{t("blog.filters.summary", { count: shown.length, total: posts.length })}</span>
          {filtering && (
            <button type="button" className={app.clear} onClick={clear}>
              <IconX size={14} /> {t("blog.filters.clear")}
            </button>
          )}
          <Button className={`${styles.goldButton} ${app.newOnPhone}`} size="xs" leftSection={<IconPlus size={14} />} onClick={() => setCreating(true)}>
            {t("blog.newPost")}
          </Button>
        </div>
      )}

      {posts === null ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : posts.length === 0 ? (
        <div className={app.empty}>
          <Text c="dimmed">{t("blog.empty")}</Text>
          <Button className={styles.goldButton} leftSection={<IconPlus size={16} />} onClick={() => setCreating(true)}>
            {t("blog.newPost")}
          </Button>
        </div>
      ) : shown.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          {t("blog.filters.noMatch")}
        </Text>
      ) : (
        <div className={app.cards}>
          {shown.map((post) => (
            <button type="button" key={post.id} className={app.card} onClick={() => navigate(`${SITE_BASE}/berita/${post.id}`)}>
              <span className={app.cover}>
                {post.coverThumb ? <img src={post.coverThumb} alt="" loading="lazy" /> : <IconPhoto size={30} />}
                <Badge className={app.cardStatus} color={STATUS_COLORS[statusOf(post)]} variant="filled" size="sm">
                  {t(`blog.status.${statusOf(post)}`)}
                </Badge>
              </span>
              <span className={app.cardBody}>
                <span className={app.cardCategory}>{t(`blog/Blog:categories.${categoryOf(post)}`)}</span>
                <span className={app.cardTitle} dir="auto">
                  {post.title || t("blog.untitled")}
                </span>
                <span className={app.cardMeta}>
                  <span>
                    <IconCalendar size={13} /> {formatPostDate(post.date, i18n.language)}
                  </span>
                  <span>
                    <IconPhoto size={13} /> {(post.images || []).length}
                  </span>
                  {post.province && (
                    <span>
                      <IconMapPin size={13} /> {post.province}
                    </span>
                  )}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <CreatePostModal
        opened={creating}
        onClose={() => setCreating(false)}
        editorEmail={editorEmail}
        onCreated={(id) => navigate(`${SITE_BASE}/berita/${id}`)}
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
