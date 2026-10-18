import { useState } from "react";
import { doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { auditedWrite } from "../Internal/audit";
import { CERTS, cleanText, normCode, safeFileName, verifyLink } from "./certSchema";
import { existingQrCode, isDocx, snapshotDocx, stampDocx } from "./docStamp";

// The picture of page 1 of a certificate's Word file, kept apart so the
// certificate list stays light.
export const SNAPSHOT = "snapshot";
export const SNAPSHOT_DOC = "page1";

export const download = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

/**
 * Stamps a Word file with a certificate's QR and attaches it to that
 * certificate: its text, fingerprints and a picture of page 1 are saved on
 * the certificate (the file itself never leaves the browser), and the stamped
 * file is downloaded. `busy` is the certificate id being worked on.
 *
 * attach(cert, file) resolves to true when done; problems are shown with
 * `notify` and resolve to false.
 */
export function useWordAttach({ user, certs, notify, t }) {
  const [busy, setBusy] = useState(null);

  // Whether `file` can carry the QR of `code` (null for a new certificate):
  // a file already stamped for another certificate that still exists is not
  // reused. Shows the problem and resolves to false.
  const canUse = async (file, code) => {
    if (!file) return false;
    if (!isDocx(file)) {
      notify("error", t("documents.errors.notDocx"), file.name);
      return false;
    }
    const previous = await existingQrCode(file);
    if (previous && previous !== normCode(code) && (certs || []).some((c) => normCode(c.code) === previous)) {
      notify("error", t("documents.errors.alreadyStamped"), t("documents.errors.alreadyStampedFor", { code: previous }));
      return false;
    }
    return true;
  };

  const attach = async (cert, file) => {
    if (!(await canUse(file, cert.code))) return false;

    setBusy(cert.id);
    try {
      const result = await stampDocx(file, verifyLink(normCode(cert.code)));
      const pics = await snapshotDocx(result.blob).catch((err) => {
        console.error("Snapshot failed:", err);
        return { snapshot: "", thumb: "" };
      });
      const snapRef = doc(db, CERTS, cert.id, SNAPSHOT, SNAPSHOT_DOC);
      const oldSnap = pics.snapshot ? null : await getDoc(snapRef);
      await auditedWrite(
        user,
        {
          area: "certificates",
          action: "doc.stamp",
          target: cert.code,
          label: [cert.name, cert.nameAr].filter(Boolean).join(" · "),
          details: { file: file.name, ...(result.replaced && { replacedQr: true }) },
        },
        (batch, auditId, markDelete) => {
          batch.update(doc(db, CERTS, cert.id), {
            auditId,
            doc: {
              fileName: cleanText(file.name),
              fileHash: result.fileHash,
              textHash: result.textHash,
              text: result.text.slice(0, 3000),
              thumb: pics.thumb || "",
              attachedAt: serverTimestamp(),
            },
          });
          if (pics.snapshot) batch.set(snapRef, { dataUrl: pics.snapshot, auditId });
          else if (oldSnap?.exists()) {
            // never keep a picture of another file
            batch.delete(snapRef);
            markDelete(`certificates~${cert.id}~${SNAPSHOT}~${SNAPSHOT_DOC}`, oldSnap.data().auditId);
          }
        }
      );
      const base = safeFileName(cleanText(file.name.replace(/\.docx$/i, "").replace(/\s*\(QR\)$/i, ""))) || "document";
      download(result.blob, `${base} (QR).docx`);
      notify("success", t("documents.savedTitle"), t("documents.savedText", { code: cert.code }));
      return true;
    } catch (err) {
      console.error("Could not stamp the document:", err);
      notify("error", t("documents.errors.unreadable"), file.name);
      return false;
    } finally {
      setBusy(null);
    }
  };

  return { attach, canUse, busy };
}
