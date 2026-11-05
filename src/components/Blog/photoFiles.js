import { deleteObject, getDownloadURL, ref, uploadString } from "firebase/storage";
import { storage } from "../../../firebaseConfig";

// News photos live in Cloud Storage; each photo's document in Firestore keeps
// the file's link (`url`) and where it is (`file`). Photos saved before this
// keep their `dataUrl` in the document and work as they always did.

// Compressed already (see Internal/images.js); a file never changes, so browsers may keep it.
const META = { contentType: "image/jpeg", cacheControl: "public, max-age=31536000, immutable" };

/** Puts a compressed photo (a JPEG data URL) in the bucket. Resolves to { url, file }. */
export async function storePhoto(file, dataUrl) {
  const target = ref(storage, file);
  await uploadString(target, dataUrl, "data_url", META);
  return { url: await getDownloadURL(target), file };
}

export const photoFile = (postId, kind, id) => `posts/${postId}/${kind}/${id}.jpg`;

/** Removes a file; one already gone is fine. */
export async function removePhoto(file) {
  try {
    await deleteObject(ref(storage, file));
  } catch (err) {
    if (err.code !== "storage/object-not-found") throw err;
  }
}

/** A photo's document as the pages read it: `dataUrl` is whatever an <img> should show. */
export const photoOf = (data) => (data.url ? { ...data, dataUrl: data.url } : data);
