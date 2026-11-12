import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../../firebaseConfig";

// A section's written material is a PDF in Cloud Storage, under the surah and
// the section; the section's document keeps { url, file, name, size }. A file
// never changes (a new PDF is a new file), so browsers may keep it. Mirrored in
// storage.rules (belajar/...).
export const PDF_MAX_BYTES = 30 * 1024 * 1024;

const safeName = (name) =>
  (name || "materi.pdf")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80) || "materi.pdf";

/** Uploads a PDF for a section. Resolves to what the section keeps. */
export async function storePdf(lessonId, sectionId, file) {
  if (file.type !== "application/pdf") throw new Error("not-pdf");
  if (file.size > PDF_MAX_BYTES) throw new Error("too-large");
  const path = `belajar/${lessonId}/${sectionId}/${Date.now()}-${safeName(file.name)}`;
  const target = ref(storage, path);
  await uploadBytes(target, file, { contentType: "application/pdf", cacheControl: "public, max-age=31536000, immutable" });
  return { url: await getDownloadURL(target), file: path, name: file.name.slice(0, 120), size: file.size };
}

/** Removes a section's old PDF; one already gone is fine. */
export async function removePdf(path) {
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch (err) {
    if (err.code !== "storage/object-not-found") throw err;
  }
}
