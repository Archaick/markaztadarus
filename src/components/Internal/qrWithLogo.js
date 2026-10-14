import QRCode from "qrcode";

const SIZE = 900;
const LOGO_SRC = "/MTIFavicon.png";

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/**
 * A print-ready PNG: the QR code in navy with the Markaz Tadarus logo in the
 * middle (high error correction keeps it scannable). No text, so it sits
 * cleanly on certificates and posters.
 */
export async function qrWithLogo(url) {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, url, {
    errorCorrectionLevel: "H",
    margin: 3,
    width: SIZE,
    color: { dark: "#102141", light: "#ffffff" },
  });
  ctx.drawImage(qr, 0, 0, SIZE, SIZE);

  try {
    const logo = await loadImage(LOGO_SRC);
    const box = SIZE * 0.22;
    const x = (SIZE - box) / 2;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, x, x, box, box, box * 0.18);
    ctx.fill();
    const pad = box * 0.12;
    ctx.drawImage(logo, x + pad, x + pad, box - pad * 2, box - pad * 2);
  } catch {
    // without the logo the code still works
  }

  return canvas.toDataURL("image/png");
}
