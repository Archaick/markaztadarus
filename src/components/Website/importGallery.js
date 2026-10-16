import { collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { auditedWrite } from "../Internal/audit";
import { LEGACY_GALLERY } from "../../data/legacyGallery";
import { IMAGES, POSTS, makeImage, makeThumb, todayIso } from "../Blog/blogSchema";

export const LEGACY_PHOTO_COUNT = LEGACY_GALLERY.reduce((n, g) => n + g.images.length, 0);
export const LEGACY_SLUGS = LEGACY_GALLERY.map((g) => g.slug);

// Turns each old gallery group into a published news post. Groups already
// imported are skipped, so running it twice is harmless. A post is only
// published once all its photos are in, so a failure leaves a draft.
export async function importLegacyGallery({ user, editorEmail, onPhoto }) {
  let created = 0;
  for (const group of LEGACY_GALLERY) {
    const postRef = doc(db, POSTS, group.slug);
    if ((await getDoc(postRef)).exists()) continue;

    const entry = (action, details) => ({ area: "site", action, target: group.slug, label: group.title, details: { ...details, imported: true } });
    await auditedWrite(user, entry("post.create"), (batch, auditId) =>
      batch.set(postRef, {
      auditId,
      title: group.title,
      excerpt: "",
      body: group.body,
      category: group.category,
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
      })
    );

    const ids = [];
    let coverThumb = "";
    for (const url of group.images) {
      const blob = await (await fetch(url)).blob();
      const image = await makeImage(blob);
      const imageRef = doc(collection(db, POSTS, group.slug, IMAGES));
      // one photo per write: each is close to the size limit of a request
      await auditedWrite(user, entry("post.photo_add", { photo: ids.length + 1 }), (batch, auditId) =>
        batch.set(imageRef, { ...image, auditId, createdAt: serverTimestamp() })
      );
      ids.push(imageRef.id);
      if (!coverThumb) coverThumb = await makeThumb(image.dataUrl);
      onPhoto?.();
    }

    await auditedWrite(user, entry("post.status", { from: "draft", to: "published", photos: ids.length }), (batch, auditId) =>
      batch.update(postRef, {
      auditId,
      images: ids,
      coverId: ids[0] || null,
      coverThumb,
      status: "published",
      publishedAt: serverTimestamp(),
      updatedBy: editorEmail,
      updatedAt: serverTimestamp(),
      })
    );
    created += 1;
  }
  return created;
}
