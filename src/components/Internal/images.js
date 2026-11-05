// Photos are kept as JPEGs in Firestore or, for news, in Cloud Storage; either
// way every image is shrunk in the browser before it is saved.
//
// THE RULE: every image anyone can add, anywhere in the site, goes through
// compressImage (photos) or pngWithin (what must stay transparent: signatures,
// stamps, logos), each with a size limit. A new upload never skips this.

export const loadImage = (source) =>
  new Promise((resolve, reject) => {
    const isFile = typeof source !== "string";
    const url = isFile ? URL.createObjectURL(source) : source;
    const img = new Image();
    // a photo from Cloud Storage: without this a canvas may not read it back
    if (!isFile && /^https?:/.test(url)) img.crossOrigin = "anonymous";
    img.onload = () => {
      if (isFile) URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      if (isFile) URL.revokeObjectURL(url);
      reject(new Error("unreadable"));
    };
    img.src = url;
  });

// Scales an image (File or data URL) down to fit maxWidth × maxHeight and
// re-encodes it as JPEG until it is at most maxChars long.
// Resolves to { dataUrl, width, height }; rejects with "unreadable" or "too-large".
// A canvas as a PNG (keeps transparency) of at most maxChars, made smaller until it fits.
export const pngWithin = (canvas, maxChars) => {
  let current = canvas;
  let dataUrl = current.toDataURL("image/png");
  for (let attempt = 0; attempt < 8 && dataUrl.length > maxChars; attempt += 1) {
    const next = document.createElement("canvas");
    next.width = Math.max(1, Math.round(current.width * 0.8));
    next.height = Math.max(1, Math.round(current.height * 0.8));
    next.getContext("2d").drawImage(current, 0, 0, next.width, next.height);
    current = next;
    dataUrl = current.toDataURL("image/png");
  }
  return dataUrl;
};

export const compressImage = async (source, { maxWidth, maxHeight, maxChars }) => {
  const img = await loadImage(source);
  const fit = Math.min(1, maxWidth / img.naturalWidth, maxHeight / img.naturalHeight);
  let width = Math.max(1, Math.round(img.naturalWidth * fit));
  let height = Math.max(1, Math.round(img.naturalHeight * fit));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  for (let attempt = 0; attempt < 6; attempt += 1) {
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = "#ffffff"; // transparent PNGs would turn black as JPEG
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    for (let quality = 0.85; quality >= 0.55; quality -= 0.1) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= maxChars) return { dataUrl, width, height };
    }
    width = Math.round(width * 0.8);
    height = Math.round(height * 0.8);
  }
  throw new Error("too-large");
};
