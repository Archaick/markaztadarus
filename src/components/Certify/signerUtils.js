// src/.../signerUtils.js - shared helpers for certificate signers
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

export const SIGNERS_COLLECTION = "certificate_signers";

// Images are stored inline in Firestore (1MB doc limit), so keep them small
const MAX_IMAGE_SIDE = 480;

/**
 * Load an image file, downscale it, and optionally turn near-white pixels
 * transparent so scanned signatures / stamps sit cleanly on the page.
 * Returns a PNG data URL.
 */
export const processImageFile = (file, { removeWhite = true, threshold = 225 } = {}) =>
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

                resolve(canvas.toDataURL("image/png"));
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
 * Signers shown on a certificate: its own selection if it has one,
 * otherwise every active signer marked as default.
 */
export const resolveCertificateSigners = (certificate, allSigners) => {
    const active = allSigners.filter((s) => s.active !== false);
    if (Array.isArray(certificate?.signerIds) && certificate.signerIds.length > 0) {
        return certificate.signerIds
            .map((id) => active.find((s) => s.id === id))
            .filter(Boolean);
    }
    return active.filter((s) => s.isDefault);
};
