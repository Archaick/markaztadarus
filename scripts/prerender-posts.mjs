/**
 * Link previews for news posts (WhatsApp, Facebook, Telegram…).
 *
 * Preview bots read the page's HTML without running JavaScript, so every
 * published post gets its own copy of dist/index.html at
 * dist/berita/<slug>/index.html with that post's title, summary and cover,
 * plus the cover as a real image file at dist/og/<slug>.jpg (photos are
 * stored as data URLs in Firestore). The app itself is unchanged: the page
 * still boots the same bundle and renders the post.
 *
 * Runs after `vite build`. If Firestore cannot be reached the build still
 * succeeds; posts then share the site's general preview.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SITE = "https://markaztadarus.com";
const DIST = "dist";
const PROJECT = "markaz-tadarus";
// FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 reads the local emulator instead.
const API = process.env.FIRESTORE_EMULATOR_HOST
  ? `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1`
  : "https://firestore.googleapis.com/v1";
const RUN_QUERY = `${API}/projects/${PROJECT}/databases/(default)/documents:runQuery`;
const BLOCK = /<!-- Static SEO, Open Graph, & Twitter Tags -->[\s\S]*?(?=<!-- Redirect domain extension -->)/;

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const plain = (value) => value?.stringValue ?? "";

const summaryOf = (fields) => {
  const text = (plain(fields.excerpt) || plain(fields.body)).replace(/\s+/g, " ").trim();
  return text.length > 200 ? `${text.slice(0, 200).replace(/\s+\S*$/, "")}…` : text;
};

const metaBlock = ({ title, description, url, image, type = "article" }) => `<!-- Static SEO, Open Graph, & Twitter Tags -->
    <title>${escapeHtml(title)}</title>
    <link rel="canonical" href="${url}" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:site_name" content="Markaz Tadarus Indonesia" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:type" content="${type}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${image}" />

    `;

async function publishedPosts() {
  const res = await fetch(RUN_QUERY, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "posts" }],
        where: { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "published" } } },
        orderBy: [{ field: { fieldPath: "date" }, direction: "DESCENDING" }],
        limit: 500,
      },
    }),
  });
  if (!res.ok) throw new Error(`Firestore answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const rows = await res.json();
  return rows
    .filter((row) => row.document)
    .map((row) => ({ slug: row.document.name.split("/").pop(), fields: row.document.fields || {} }));
}

async function main() {
  const template = await readFile(join(DIST, "index.html"), "utf8");
  if (!BLOCK.test(template)) throw new Error("index.html no longer has the SEO block markers");
  const page = (meta) => template.replace(BLOCK, metaBlock(meta));

  // The news list itself.
  await mkdir(join(DIST, "berita"), { recursive: true });
  await writeFile(
    join(DIST, "berita", "index.html"),
    page({
      title: "Berita & Kegiatan · Markaz Tadarus Indonesia",
      description: "Kabar dan dokumentasi kegiatan Markaz Tadarus Indonesia di seluruh Indonesia.",
      url: `${SITE}/berita`,
      image: `${SITE}/slide1.jpg`,
      type: "website",
    })
  );

  const posts = await publishedPosts();
  await mkdir(join(DIST, "og"), { recursive: true });
  let withImage = 0;

  for (const { slug, fields } of posts) {
    if (!/^[a-z0-9-]+$/.test(slug)) continue;
    let image = `${SITE}/slide1.jpg`;
    const thumb = plain(fields.coverThumb);
    const match = thumb.match(/^data:image\/jpeg;base64,(.+)$/);
    if (match) {
      await writeFile(join(DIST, "og", `${slug}.jpg`), Buffer.from(match[1], "base64"));
      image = `${SITE}/og/${slug}.jpg`;
      withImage += 1;
    }
    await mkdir(join(DIST, "berita", slug), { recursive: true });
    await writeFile(
      join(DIST, "berita", slug, "index.html"),
      page({
        title: `${plain(fields.title)} · Markaz Tadarus Indonesia`,
        description: summaryOf(fields) || "Berita Markaz Tadarus Indonesia.",
        url: `${SITE}/berita/${slug}`,
        image,
      })
    );
  }

  console.log(`prerender: ${posts.length} news previews written (${withImage} with their own photo)`);
}

main().catch((err) => {
  // Never fail the build over previews; the general site preview still works.
  console.warn(`prerender: skipped news previews — ${err.message}`);
});
