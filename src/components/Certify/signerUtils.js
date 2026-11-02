// src/.../signerUtils.js - shared helpers for certificate signers
import { collection, doc, getDoc, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { certLang } from "./certSchema";
import { pngWithin } from "../Internal/images";

export const SIGNERS_COLLECTION = "certificate_signers";

// A default signer can be the default for some certificate languages only
// (`defaultLangs`); one saved before that (no list) is the default for all.
export const SIGNER_LANGS = ["id", "en", "ar"];
export const defaultLangsOf = (signer) => {
    if (!signer?.isDefault) return [];
    const langs = Array.isArray(signer.defaultLangs) ? signer.defaultLangs.filter((l) => SIGNER_LANGS.includes(l)) : [];
    return langs.length ? langs : SIGNER_LANGS;
};

// A signer's name, position and organization are written in Indonesian;
// the English and Arabic versions (nameEn, positionAr, …) are optional and
// fall back to it.
export const SIGNER_TEXT = ["name", "position", "organization"];
const LANG_SUFFIX = { en: "En", ar: "Ar" };
export const signerTextKey = (field, lang) => field + (LANG_SUFFIX[lang] || "");
export const signerInLang = (signer, lang) =>
    LANG_SUFFIX[lang]
        ? { ...signer, ...Object.fromEntries(SIGNER_TEXT.map((f) => [f, signer[signerTextKey(f, lang)] || signer[f] || ""])) }
        : signer;

// Images are stored inline in Firestore (1MB doc limit), so keep them small
const MAX_IMAGE_SIDE = 480;
// A certificate design's public copy holds up to 3 signers (signature + stamp)
// and 4 logos in one document (1 MiB at most), so each has its share.
const SIGNER_IMAGE_CHARS = 110000;
export const LOGO_IMAGE_CHARS = 70000;

/**
 * Load an image file, downscale it, and optionally turn near-white pixels
 * transparent so scanned signatures / stamps sit cleanly on the page.
 * Returns a PNG data URL.
 */
export const processImageFile = (file, { removeWhite = true, threshold = 225, maxChars = SIGNER_IMAGE_CHARS } = {}) =>
    new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith("image/")) {
            reject(new Error("not-image"));
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error("bad-image"));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error("bad-image"));
            img.onload = () => {
                const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
                const w = Math.round(img.width * scale);
                const h = Math.round(img.height * scale);

                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, w, h);

                if (removeWhite) {
                    const data = ctx.getImageData(0, 0, w, h);
                    const px = data.data;
                    for (let i = 0; i < px.length; i += 4) {
                        const min = Math.min(px[i], px[i + 1], px[i + 2]);
                        if (min >= threshold) {
                            px[i + 3] = 0;
                        } else if (min > threshold - 40) {
                            // soften edges between ink and paper
                            px[i + 3] = Math.round(px[i + 3] * ((threshold - min) / 40));
                        }
                    }
                    ctx.putImageData(data, 0, 0);
                }

                resolve(pngWithin(canvas, maxChars));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });

export const fetchAllSigners = async () => {
    const snapshot = await getDocs(query(collection(db, SIGNERS_COLLECTION), orderBy("order", "asc")));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Only the signers one certificate shows, for the public verification page:
 * its own (by id) or else the default ones. Visitors may not list every
 * signer (see firestore.rules), so their signatures cannot be collected.
 */
export const fetchSignersFor = async (certificate) => {
    const ids = Array.isArray(certificate?.signerIds) ? certificate.signerIds.filter((id) => typeof id === "string" && id) : [];
    if (ids.length) {
        const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, SIGNERS_COLLECTION, id)).catch(() => null)));
        return snaps.filter((s) => s?.exists()).map((s) => ({ id: s.id, ...s.data() }));
    }
    const snapshot = await getDocs(query(collection(db, SIGNERS_COLLECTION), where("isDefault", "==", true)));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
};

/**
 * Signers shown on a certificate: its own selection if it has one,
 * otherwise every active signer that is a default for its language.
 */
export const resolveCertificateSigners = (certificate, allSigners) => {
    const active = allSigners.filter((s) => s.active !== false);
    if (Array.isArray(certificate?.signerIds) && certificate.signerIds.length > 0) {
        return certificate.signerIds
            .map((id) => active.find((s) => s.id === id))
            .filter(Boolean);
    }
    const lang = certLang(certificate);
    return active.filter((s) => defaultLangsOf(s).includes(lang));
};
