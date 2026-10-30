// The supervision report as an A4 PDF, made in the browser: the report sheet
// is laid out at A4 width, pictured, and cut into pages between rows and
// sections (never through a table row). jsPDF and html-to-image load only when
// a PDF is asked for.

const A4_W_MM = 210;
const A4_H_MM = 297;
const MARGIN_MM = 10; // top and bottom of every page; the sheet has its own side padding
const SHEET_PX = 820; // the sheet's own width

// where a page may end: below content, never right below a heading or a
// subheading row (which would leave it alone at the foot of a page)
const BREAK_AFTER = "tbody tr:not([class*='groupRow']), section, [class*='identityRow'], [class*='summary'], [class*='notes'] > div, [class*='signs']";

/** The report element as A4 pages: [{ dataUrl, heightMm }], JPEG pictures cut between rows. */
export async function reportPages(sheet, sheetPx = SHEET_PX) {
  const { toCanvas } = await import("html-to-image");

  // a copy at A4 width, off screen, so a phone's narrow layout does not shape the PDF
  const holder = document.createElement("div");
  holder.style.cssText = `position:fixed;left:-100000px;top:0;width:${sheetPx}px;background:#fff;`;
  const copy = sheet.cloneNode(true);
  copy.style.maxWidth = `${sheetPx}px`;
  copy.style.width = `${sheetPx}px`;
  copy.style.margin = "0";
  copy.style.boxShadow = "none";
  copy.style.borderRadius = "0";
  holder.appendChild(copy);
  document.body.appendChild(holder);

  try {
    await document.fonts?.ready;
    // the copy's pictures (a letterhead, a photo) load anew; wait for them, or they come out blank
    await Promise.all([...copy.querySelectorAll("img")].map((img) => (img.complete && img.naturalWidth ? null : img.decode().catch(() => null))));
    const top = copy.getBoundingClientRect().top;
    const total = copy.scrollHeight;
    const breaks = [...copy.querySelectorAll(BREAK_AFTER)].map((el) => Math.round(el.getBoundingClientRect().bottom - top)).filter((y) => y > 0 && y < total);
    breaks.push(total);
    // elements marked data-pdf-page always start a new page (e.g. each printed form section)
    const forced = [...copy.querySelectorAll("[data-pdf-page]")].map((el) => Math.round(el.getBoundingClientRect().top - top)).filter((y) => y > 2);

    const scale = 2;
    const canvas = await toCanvas(copy, { pixelRatio: scale, backgroundColor: "#ffffff", cacheBust: true });

    const pxPerMm = sheetPx / A4_W_MM;
    const pageH = Math.floor((A4_H_MM - MARGIN_MM * 2) * pxPerMm);
    const pages = [];

    let start = 0;
    while (start < total - 2) {
      const limit = start + pageH;
      // the last row or section ending on this page (but not a nearly empty page)
      const fits = breaks.filter((b) => b > start + pageH * 0.4 && b <= limit);
      const pageStart = forced.find((y) => y > start + 2 && y <= limit);
      const end = pageStart || (limit >= total ? total : fits.length ? Math.max(...fits) : limit);

      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = Math.max(1, Math.round((end - start) * scale));
      const ctx = slice.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, Math.round(start * scale), canvas.width, slice.height, 0, 0, slice.width, slice.height);

      pages.push({ dataUrl: slice.toDataURL("image/jpeg", 0.85), heightMm: (end - start) / pxPerMm });
      start = end;
    }
    return pages;
  } finally {
    holder.remove();
  }
}

/** The report element as a PDF Blob. */
export async function reportToPdf(sheet, sheetPx) {
  const [pages, { jsPDF }] = await Promise.all([reportPages(sheet, sheetPx), import("jspdf")]);
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
  pages.forEach((page, i) => {
    if (i > 0) pdf.addPage();
    // the first page starts with the sheet's own top padding; later ones get a margin
    pdf.addImage(page.dataUrl, "JPEG", 0, i === 0 ? 0 : MARGIN_MM, A4_W_MM, page.heightMm);
  });
  return pdf.output("blob");
}

/**
 * Hands the PDF to the phone's (or computer's) share sheet, so it can go
 * straight to WhatsApp, email or any app; where sharing files is not
 * possible, it is downloaded instead. Resolves to "shared", "downloaded" or
 * "cancelled".
 */
export async function sharePdf(blob, fileName, title) {
  const file = new File([blob], fileName, { type: "application/pdf" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
      // a share target that failed: fall back to saving the file
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
