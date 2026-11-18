// The supervision report as an A4 PDF, made in the browser: the report sheet
// is laid out at A4 width, pictured, and cut into pages between rows and
// sections (never through a table row). jsPDF and html-to-image load only when
// a PDF is asked for.

const A4_W_MM = 210;
const A4_H_MM = 297;
const MARGIN_MM = 10; // top and bottom of every page; the sheet has its own side padding
const SLAB_PX = 0; // how much of the sheet one picture may hold beyond a page: 0 = every page pictured on its own (exact edges; one picture of a long report gets squashed)
const SHEET_PX = 820; // the sheet's own width

// where a page may end: below content, never right below a heading or a
// subheading row (which would leave it alone at the foot of a page)
const BREAK_AFTER = "tbody tr:not([class*='groupRow']), section, [class*='identityRow'], [class*='summary'], [class*='notes'] > div, [class*='signs']";

/** The report element as A4 pages: [{ dataUrl, heightMm }], JPEG pictures cut between rows. */
export async function reportPages(sheet, sheetPx = SHEET_PX) {
  const { toCanvas, getFontEmbedCSS } = await import("html-to-image");

  // a copy at A4 width, off screen, so a phone's narrow layout does not shape the PDF
  const holder = document.createElement("div");
  holder.style.cssText = `position:fixed;left:-100000px;top:0;width:${sheetPx}px;background:#fff;`;
  const copy = sheet.cloneNode(true);
  copy.style.maxWidth = `${sheetPx}px`;
  copy.style.width = `${sheetPx}px`;
  copy.style.margin = "0";
  copy.style.boxSizing = "border-box"; // its padding inside the A4 width, whatever the page's own styles
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
    // every block (row, card, section) with its place in the sheet
    const blocks = [...copy.querySelectorAll(BREAK_AFTER)].map((el) => {
      const r = el.getBoundingClientRect();
      return { el, top: Math.round(r.top - top), bottom: Math.min(total, Math.ceil(r.bottom - top) + 1) };
    });
    const breaks = blocks.map((b) => b.bottom).filter((y) => y > 0 && y < total);
    // what may be left out of a page's picture: the blocks, and the sheet's own parts (its letterhead, title, charts)
    const top0 = top;
    const parts = [...copy.children].filter((el) => !blocks.some((b) => b.el === el)).map((el) => {
      const r = el.getBoundingClientRect();
      return { el, top: Math.round(r.top - top0), bottom: Math.ceil(r.bottom - top0) };
    });
    const hideable = [...parts, ...blocks];
    breaks.push(total);
    // elements marked data-pdf-page always start a new page (e.g. each printed form section)
    const forced = [...copy.querySelectorAll("[data-pdf-page]")].map((el) => Math.round(el.getBoundingClientRect().top - top)).filter((y) => y > 2);

    const scale = 2;
    const pxPerMm = sheetPx / A4_W_MM;
    const pageH = Math.floor((A4_H_MM - MARGIN_MM * 2) * pxPerMm);

    // where each page starts and ends, from the layout alone
    const ranges = [];
    let start = 0;
    while (start < total - 2) {
      const limit = start + pageH;
      // the last row or section ending on this page (but not a nearly empty page)
      const fits = breaks.filter((b) => b > start + pageH * 0.4 && b <= limit);
      const pageStart = forced.find((y) => y > start + 2 && y <= limit);
      const end = pageStart || (limit >= total ? total : fits.length ? Math.max(...fits) : limit);
      ranges.push([start, end]);
      start = end;
    }

    // pictured a few pages at a time: one picture of a long report (hundreds
    // of responses) is taller than a browser can draw and comes out squashed
    const fontEmbedCSS = await getFontEmbedCSS(copy).catch(() => undefined);
    const frame = document.createElement("div");
    frame.style.cssText = `position:fixed;left:-100000px;top:0;width:${sheetPx}px;overflow:hidden;background:#fff;`;
    document.body.appendChild(frame);
    frame.appendChild(copy);
    const pages = [];
    try {
      let i = 0;
      while (i < ranges.length) {
        const slabTop = ranges[i][0];
        let j = i;
        while (j + 1 < ranges.length && ranges[j + 1][1] - slabTop <= SLAB_PX) j += 1;
        const slabH = ranges[j][1] - slabTop;
        frame.style.height = `${slabH}px`;
        // a long report is copied for every picture: everything above and below this slab is taken
        // out of the sheet meanwhile (and put back after), so each picture holds only its own page
        const outermost = (list) => list.filter((b) => !list.some((o) => o !== b && o.el.contains(b.el)));
        const above = outermost(hideable.filter((b) => b.bottom <= slabTop));
        const slabEnd = slabTop + slabH;
        const below = outermost(hideable.filter((b) => b.top >= slabEnd && !above.some((a) => a.el.contains(b.el))));
        // the first thing starting on this slab: everything from it on moves up by the same amount
        const anchor = hideable.filter((b) => b.top >= slabTop && b.top < slabEnd).sort((x, y) => x.top - y.top)[0];
        copy.style.marginTop = "0px";
        const away = [...above, ...below].map((b) => {
          const mark = document.createComment("");
          b.el.replaceWith(mark);
          return [mark, b.el];
        });
        let canvas;
        try {
          const shift = anchor ? anchor.top - Math.round(anchor.el.getBoundingClientRect().top - copy.getBoundingClientRect().top) : 0;
          copy.style.marginTop = `${-(slabTop - shift)}px`;
          canvas = await toCanvas(frame, { pixelRatio: scale, backgroundColor: "#ffffff", width: sheetPx, height: slabH, fontEmbedCSS, style: { position: "static", left: "0", top: "0" } });
        } finally {
          away.forEach(([mark, el]) => mark.replaceWith(el));
        }
        for (let k = i; k <= j; k += 1) {
          const [from, to] = ranges[k];
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = Math.max(1, Math.round((to - from) * scale));
          const ctx = slice.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, slice.width, slice.height);
          ctx.drawImage(canvas, 0, Math.round((from - slabTop) * scale), canvas.width, slice.height, 0, 0, slice.width, slice.height);
          pages.push({ dataUrl: slice.toDataURL("image/jpeg", 0.85), heightMm: (to - from) / pxPerMm });
        }
        i = j + 1;
      }
    } finally {
      frame.remove();
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
