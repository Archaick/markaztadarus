import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { qrWithLogo } from "../Internal/qrWithLogo";
import { compressImage } from "../Internal/images";

// Stamping a Word file with its verification QR, all in the browser: the file
// is never uploaded or stored. What is kept is a picture of page 1, the text
// and two fingerprints (see stampDocx).

const QR_CM = 2.4;
const EMU_PER_CM = 360000;
const QR_REL_ID = "rIdMtiVerifyQr";
const QR_NAME = "MTI verification QR";

const NS = {
  wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  pic: "http://schemas.openxmlformats.org/drawingml/2006/picture",
};

export const isDocx = (file) => /\.docx$/i.test(file?.name || "");

const escapeXml = (s) => String(s).replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]);

const decodeXml = (s) =>
  s.replace(/&(lt|gt|amp|quot|apos|#(\d+)|#x([0-9a-f]+));/gi, (m, name, dec, hex) =>
    dec ? String.fromCodePoint(+dec) : hex ? String.fromCodePoint(parseInt(hex, 16)) : { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" }[name.toLowerCase()]
  );

const toHex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (bytes) => toHex(await crypto.subtle.digest("SHA-256", bytes));

/** The document's words, paragraph by paragraph. */
export function textOfDocument(xml) {
  return xml
    .split(/<\/w:p>/)
    .map((p) => [...p.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) => decodeXml(m[1])).join(""))
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

// Spacing and line breaks aside, so re-saving or moving the QR in Word still
// matches the same document.
const textKey = (text) => text.replace(/\s+/g, " ").trim();
export const textFingerprint = (text) => sha256(strToU8(textKey(text)));

const QR_MEDIA = "word/media/mti-verify-qr.png";

/** The code of the MTI QR already in a .docx (from an earlier stamp), if any. */
export async function existingQrCode(file) {
  try {
    const files = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter: (f) => f.name === "word/document.xml" });
    const xml = strFromU8(files["word/document.xml"] || new Uint8Array());
    const m = xml.match(new RegExp(`name="${QR_NAME}"[^>]*descr="[^"]*/verify/([A-Z0-9]+)"`));
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Fingerprints of a .docx someone hands back, to look it up. */
export async function fingerprintsOf(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const files = unzipSync(bytes);
  const xml = files["word/document.xml"] ? strFromU8(files["word/document.xml"]) : "";
  return { fileHash: await sha256(bytes), textHash: await textFingerprint(textOfDocument(xml)) };
}

const qrRun = (size, docPrId, url) => `<w:r><w:drawing><wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0" relativeHeight="251700000" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="margin"><wp:align>left</wp:align></wp:positionH><wp:positionV relativeFrom="margin"><wp:align>bottom</wp:align></wp:positionV><wp:extent cx="${size}" cy="${size}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapSquare wrapText="bothSides"/><wp:docPr id="${docPrId}" name="${QR_NAME}" descr="${escapeXml(url)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="${NS.a}" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="${NS.a}"><a:graphicData uri="${NS.pic}"><pic:pic xmlns:pic="${NS.pic}"><pic:nvPicPr><pic:cNvPr id="0" name="mti-verify-qr.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${QR_REL_ID}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${size}" cy="${size}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>`;

const dataUrlBytes = (dataUrl) => Uint8Array.from(atob(dataUrl.split(",")[1]), (c) => c.charCodeAt(0));

/**
 * Adds the verification QR to a Word file: a floating picture with square
 * wrapping, bottom-left of the last page, so it can simply be dragged in Word.
 * A file stamped before keeps its QR where it was (moved or not); only the
 * picture and its link change to the new code. Resolves to
 * { blob, text, fileHash, textHash, replaced }; rejects with "not-docx" or
 * "unreadable".
 */
export async function stampDocx(file, url) {
  if (!isDocx(file)) throw new Error("not-docx");
  let files;
  try {
    files = unzipSync(new Uint8Array(await file.arrayBuffer()));
  } catch {
    throw new Error("unreadable");
  }
  const docPath = "word/document.xml";
  const relsPath = "word/_rels/document.xml.rels";
  const typesPath = "[Content_Types].xml";
  if (!files[docPath] || !files[relsPath] || !files[typesPath]) throw new Error("unreadable");

  let xml = strFromU8(files[docPath]);

  // stamped before: swap the picture, keep where it sits
  if (xml.includes(`name="${QR_NAME}"`) && files[QR_MEDIA]) {
    files[QR_MEDIA] = dataUrlBytes(await qrWithLogo(url));
    xml = xml.replace(new RegExp(`(name="${QR_NAME}"[^>]*descr=")[^"]*"`), `$1${escapeXml(url)}"`);
    files[docPath] = strToU8(xml);
    return finish(files, xml, true);
  }

  // the namespaces the picture uses, if the document does not declare them
  const root = xml.match(/<w:document\b[^>]*>/);
  if (!root) throw new Error("unreadable");
  let tag = root[0];
  for (const prefix of ["wp", "r"]) {
    if (!new RegExp(`xmlns:${prefix}=`).test(tag)) tag = tag.replace("<w:document", `<w:document xmlns:${prefix}="${NS[prefix]}"`);
  }
  xml = xml.replace(root[0], tag);

  // the run goes into the document's last paragraph (or a new one after a
  // closing table), just before the final section settings
  const size = Math.round(QR_CM * EMU_PER_CM);
  const run = qrRun(size, 900000 + Math.floor(Math.random() * 90000), url);
  const sect = xml.lastIndexOf("<w:sectPr");
  const bodyEnd = xml.lastIndexOf("</w:body>");
  const at = sect > 0 && sect < bodyEnd ? sect : bodyEnd;
  if (at < 0) throw new Error("unreadable");
  const before = xml.slice(0, at);
  xml = before.endsWith("</w:p>") ? `${before.slice(0, -"</w:p>".length)}${run}</w:p>${xml.slice(at)}` : `${before}<w:p>${run}</w:p>${xml.slice(at)}`;

  // the image itself, its link from the document, and its file type
  files[QR_MEDIA] = dataUrlBytes(await qrWithLogo(url));
  let rels = strFromU8(files[relsPath]);
  rels = rels.replace(
    "</Relationships>",
    `<Relationship Id="${QR_REL_ID}" Type="${NS.r}/image" Target="media/mti-verify-qr.png"/></Relationships>`
  );
  let types = strFromU8(files[typesPath]);
  if (!/Extension="png"/i.test(types)) types = types.replace(/(<Types[^>]*>)/, '$1<Default Extension="png" ContentType="image/png"/>');

  files[docPath] = strToU8(xml);
  files[relsPath] = strToU8(rels);
  files[typesPath] = strToU8(types);
  return finish(files, xml, false);
}

async function finish(files, xml, replaced) {
  const out = zipSync(files, { level: 6 });
  const text = textOfDocument(xml);
  return {
    blob: new Blob([out], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
    text,
    fileHash: await sha256(out),
    textHash: await textFingerprint(text),
    replaced,
  };
}

/**
 * A picture of page 1, as Word would roughly show it: drawn in the browser
 * from the file, then compressed. Resolves to { snapshot, thumb } (JPEG data
 * URLs; ~150 KB and ~15 KB).
 */
export async function snapshotDocx(blob) {
  const [{ renderAsync }, { toJpeg }] = await Promise.all([import("docx-preview"), import("html-to-image")]);
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-20000px;top:0;width:900px;background:#fff;pointer-events:none;";
  document.body.append(host);
  try {
    await renderAsync(blob, host, null, { inWrapper: false, useBase64URL: true, ignoreLastRenderedPageBreak: false });
    const page = host.querySelector("section.docx") || host;
    await document.fonts?.ready;
    const shot = await toJpeg(page, { quality: 0.8, pixelRatio: 1.5, backgroundColor: "#ffffff", cacheBust: false });
    const snapshot = (await compressImage(shot, { maxWidth: 1000, maxHeight: 1414, maxChars: 300000 })).dataUrl;
    const thumb = (await compressImage(shot, { maxWidth: 220, maxHeight: 311, maxChars: 30000 })).dataUrl;
    return { snapshot, thumb };
  } finally {
    host.remove();
  }
}
