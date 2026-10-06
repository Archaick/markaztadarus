// Photos are kept in Firestore as JPEG data URLs (this project has no Storage
// bucket), so every image is shrunk in the browser before it is saved.

export const loadImage = (source) =>
  new Promise((resolve, reject) => {
    const isFile = typeof source !== "string";
    const url = isFile ? URL.createObjectURL(source) : source;
    const img = new Image();
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
