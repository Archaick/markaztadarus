// Certificates as PDF files, made in the browser: each certificate is drawn
// off screen at A4 width, pictured (html-to-image) and placed on a landscape
// A4 page (jsPDF). The fonts are read once and reused for every page, so a
// long list stays quick. html-to-image, jsPDF and fflate load only when asked.
import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import CertificateSheet, { qrFor } from "./CertificateSheet";

const PAGE_PX = 1123; // A4 landscape at 96 dpi
const A4_W_MM = 297;
const A4_H_MM = 210;

// fonts loaded, pictures decoded, one frame painted
const settle = async (node) => {
  await document.fonts?.ready;
  await Promise.all([...node.querySelectorAll("img")].map((img) => (img.complete && img.naturalWidth ? null : img.decode().catch(() => null))));
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
};

/** Pictures each certificate (sheet data) in turn and hands it to `onPage(jpegDataUrl, index)`. */
async function eachPage(items, onPage, onProgress) {
  const { toJpeg, getFontEmbedCSS } = await import("html-to-image");
  const holder = document.createElement("div");
  holder.style.cssText = "position:fixed;left:-100000px;top:0;";
  document.body.appendChild(holder);
  const root = createRoot(holder);
  let fontEmbedCSS;
  try {
    for (let i = 0; i < items.length; i += 1) {
      const data = items[i];
      const qrSrc = data.code ? await qrFor(data.code) : undefined;
      flushSync(() => root.render(createElement(CertificateSheet, { data, width: PAGE_PX, qrSrc })));
      const node = holder.firstElementChild;
      await settle(node);
      if (fontEmbedCSS === undefined) fontEmbedCSS = await getFontEmbedCSS(node);
      const jpeg = await toJpeg(node, { pixelRatio: 2, quality: 0.82, fontEmbedCSS, backgroundColor: "#d3e6df" });
      await onPage(jpeg, i);
      onProgress?.((i + 1) / items.length);
    }
  } finally {
    root.unmount();
    holder.remove();
  }
}

const newPdf = (jsPDF) => new jsPDF({ orientation: "l", unit: "mm", format: "a4", compress: true });

/** All the certificates in one PDF, a page each. */
export async function certificatesPdf(items, onProgress) {
  const { jsPDF } = await import("jspdf");
  const pdf = newPdf(jsPDF);
  await eachPage(
    items,
    (jpeg, i) => {
      if (i > 0) pdf.addPage("a4", "l");
      pdf.addImage(jpeg, "JPEG", 0, 0, A4_W_MM, A4_H_MM);
    },
    onProgress
  );
  return pdf.output("blob");
}

/** A ZIP with one PDF per certificate, named by `fileNames[i]`. */
export async function certificatesZip(items, fileNames, onProgress) {
  const [{ jsPDF }, { zipSync }] = await Promise.all([import("jspdf"), import("fflate")]);
  const files = {};
  const used = new Set();
  await eachPage(
    items,
    (jpeg, i) => {
      const pdf = newPdf(jsPDF);
      pdf.addImage(jpeg, "JPEG", 0, 0, A4_W_MM, A4_H_MM);
      let name = fileNames[i] || `sertifikat-${i + 1}`;
      for (let n = 2; used.has(name); n += 1) name = `${fileNames[i]}-${n}`;
      used.add(name);
      files[`${name}.pdf`] = new Uint8Array(pdf.output("arraybuffer"));
    },
    onProgress
  );
  // the PDFs are compressed already
  return new Blob([zipSync(files, { level: 0 })], { type: "application/zip" });
}

export const saveBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};
