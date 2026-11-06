import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { qrWithLogo } from "../../Internal/qrWithLogo";
import { verifyLink } from "../certSchema";
import { KUFIC_PATH, PAGE_H, PAGE_W } from "./kufic";
import mtMark from "../../../assets/certificate/mt-mark.svg";
import sealKaaba from "../../../assets/certificate/seal-kaaba.png";
import goldPaper from "../../../assets/certificate/gold-paper.jpg";
import goldTitle from "../../../assets/certificate/gold-title.png";
import goldSeal from "../../../assets/certificate/gold-seal.png";
import annabaLogo from "../../../assets/certificate/annaba-logo.png";
import styles from "./CertificateSheet.module.css";

/*
 * The Markaz Tadarus certificates, in two designs: `mint` (the original: the
 * mint paper and embossed square-Kufic band, drawn in code) and `gold` (the
 * training certificate: gold Kufic medallion, navy ring, the An-Naba and
 * Markaz Tadarus logos, a gold seal), whose artwork comes from its own file.
 *
 * The mint one, drawn in code from the original design
 * (whose source file was lost): the mint paper, the embossed square-Kufic band,
 * "SERTIFIKAT", the number, the name, the sentence, the place and date, the
 * signers, the seal, the logos, and a QR code that opens /verify/<code>.
 *
 * It is laid out in the original file's own units (630.75 x 445.5, A4
 * landscape) and scaled to `width`, so it is sharp at any size: on screen,
 * printed, or pictured into a PDF.
 */

export const DEFAULT_CERTIFICATE = {
  title: "SERTIFIKAT",
  numberLabel: "Nomor:",
  number: "",
  givenTo: "Diberikan kepada:",
  name: "",
  // *between stars* prints in green
  description:
    "atas keikutsertaannya dalam acara *Seminar Tadarus al-Qur'an Metode 5T* yang diselenggarakan oleh *Markaz Tadarus Indonesia* bekerjasama dengan *[Lembaga Mitra]* pada tanggal *[Tanggal Pelaksanaan]*.",
  place: "Jakarta",
  issueDate: "",
  signers: [{ name: "Agus Mujib, Lc., M.A.", role: "Ketua Markaz Tadarus Indonesia", signature: "", stamp: "" }],
  logos: [], // partner logos (image URLs), shown after the Markaz Tadarus logo
  seal: true,
  code: "", // the verification code: with one, the QR code appears
  qrPlace: "corner", // "corner" (bottom left, with the signatures) or "signature" (in place of the first signer's signature)
  template: "mint", // "mint" or "gold"
};

export const TEMPLATES = ["mint", "gold"];

// "*green*" parts of the sentence
const Rich = ({ text }) =>
  String(text || "")
    .split(/(\*[^*]+\*)/g)
    .map((part, i) =>
      part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
        <span key={i} className={styles.mark}>
          {part.slice(1, -1)}
        </span>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      )
    );

// a line that shrinks its font to stay on one line (long names)
function FitLine({ className, max, min, width, children }) {
  const ref = useRef(null);
  const [size, setSize] = useState(max);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let s = max;
    el.style.fontSize = `${s}px`;
    while (el.scrollWidth > width && s > min) {
      s -= 0.5;
      el.style.fontSize = `${s}px`;
    }
    setSize(s);
  }, [children, max, min, width]);
  return (
    <div ref={ref} className={className} style={{ fontSize: size, maxWidth: width }} dir="auto">
      {children}
    </div>
  );
}

/** The QR code (a PNG data URL) that opens the certificate's verification page: the same navy code with the MTI logo as everywhere else. */
export const qrFor = (code) => qrWithLogo(verifyLink(code));

function useQr(code) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let live = true;
    if (!code) {
      setSrc("");
      return undefined;
    }
    qrFor(code)
      .then((url) => live && setSrc(url))
      .catch(() => live && setSrc(""));
    return () => {
      live = false;
    };
  }, [code]);
  return src;
}

/** The certificate at `width` CSS pixels (A4 landscape proportions). `placeholders` shows the empty slots, for the editor. */
export default function CertificateSheet({ data, width = 1123, placeholders = false, sheetRef, qrSrc }) {
  const c = { ...DEFAULT_CERTIFICATE, ...data };
  // the PDF maker passes the QR picture ready-made, so a page never waits for it
  const made = useQr(qrSrc ? "" : c.code);
  const qr = qrSrc || made;
  const signers = (c.signers || []).filter((s) => s && (s.name || s.role || s.signature)).slice(0, 3);
  const logos = (c.logos || []).filter(Boolean).slice(0, 4);
  const scale = width / PAGE_W;
  // the QR code stands in for the first signer's signature, or sits in the corner
  const qrInSign = c.qrPlace === "signature" && signers.length > 0;
  const qrShown = qr || placeholders;
  const qrBox = qr ? <img src={qr} alt="" /> : <div className={styles.qrSlot}>QR</div>;

  if (c.template === "gold") {
    return <GoldSheet c={c} width={width} scale={scale} sheetRef={sheetRef} placeholders={placeholders} signers={signers} logos={logos} qrInSign={qrInSign} qrShown={qrShown} qrBox={qrBox} />;
  }

  return (
    <div ref={sheetRef} className={styles.frame} style={{ width, height: PAGE_H * scale }}>
      <div className={styles.page} style={{ transform: `scale(${scale})` }}>
        <svg className={styles.art} viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} aria-hidden="true">
          <defs>
            {/* the paper's soft, uneven grain */}
            <filter id="mtcGrain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="7" />
              <feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.36  0 0 0 0 0.31  0 0 0 0.55 -0.22" />
            </filter>
            {/* the band's stone: pale flakes and darker flecks over the green */}
            <filter id="mtcStone" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="3" result="noise" />
              <feColorMatrix in="noise" values="0 0 0 0 0.62  0 0 0 0 0.83  0 0 0 0 0.75  0 0 0 3.4 -1.75" result="light" />
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="noise2" />
              <feColorMatrix in="noise2" values="0 0 0 0 0.14  0 0 0 0 0.34  0 0 0 0 0.28  0 0 0 3.2 -1.5" result="dark" />
              <feMerge>
                <feMergeNode in="dark" />
                <feMergeNode in="light" />
              </feMerge>
            </filter>
            <filter id="mtcSoft">
              <feGaussianBlur stdDeviation="0.9" />
            </filter>
            <linearGradient id="mtcBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#86c3ae" />
              <stop offset="0.45" stopColor="#559f88" />
              <stop offset="1" stopColor="#4a927b" />
            </linearGradient>
            <radialGradient id="mtcShade" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#1f5446" stopOpacity="0.85" />
              <stop offset="1" stopColor="#1f5446" stopOpacity="0" />
            </radialGradient>
            <clipPath id="mtcKufic">
              <path d={KUFIC_PATH} />
            </clipPath>
            {/* everything but the letters moved down-right: what is left inside them is their shadowed top-left edge */}
            <mask id="mtcInset" maskUnits="userSpaceOnUse" x="0" y="0" width={PAGE_W} height={PAGE_H}>
              <rect width={PAGE_W} height={PAGE_H} fill="#fff" />
              <path d={KUFIC_PATH} transform="translate(1.7 1.9)" fill="#000" />
            </mask>
          </defs>

          {/* paper */}
          <rect width={PAGE_W} height={PAGE_H} fill="#d3e6df" />
          <rect width={PAGE_W} height={PAGE_H} filter="url(#mtcGrain)" />

          {/* the band: green stone seen through the letters cut into the paper */}
          <g clipPath="url(#mtcKufic)">
            <rect x="0" y="0" width="150" height={PAGE_H} fill="url(#mtcBand)" />
            <ellipse cx="62" cy="150" rx="110" ry="70" fill="url(#mtcShade)" />
            <ellipse cx="72" cy="420" rx="105" ry="60" fill="url(#mtcShade)" />
            <rect x="0" y="0" width="150" height={PAGE_H} filter="url(#mtcStone)" opacity="0.6" />
            <rect x="0" y="0" width="150" height={PAGE_H} fill="#0b2a22" opacity="0.6" mask="url(#mtcInset)" filter="url(#mtcSoft)" />
          </g>
        </svg>

        {/* logos: Markaz Tadarus, then the partners */}
        <div className={styles.logos}>
          <div className={styles.mtLogo}>
            <img src={mtMark} alt="" />
            <b>MARKAZ TADARUS</b>
            <span>INDONESIA</span>
          </div>
          {logos.map((src, i) => (
            <img key={i} src={src} alt="" className={styles.partnerLogo} />
          ))}
          {placeholders && logos.length === 0 && <div className={styles.logoSlot}>Logo mitra</div>}
        </div>

        <h1 className={styles.title} dir="auto">
          {c.title}
        </h1>
        <div className={styles.number}>
          <span>{c.numberLabel}</span> <span dir="auto">{c.number || (placeholders ? "[Nomor Sertifikat]" : "")}</span>
        </div>

        <div className={styles.givenTo} dir="auto">
          {c.givenTo}
        </div>
        <FitLine className={styles.name} max={24} min={13} width={420}>
          {c.name || (placeholders ? "[Nama Peserta]" : "")}
        </FitLine>
        <p className={styles.description} dir="auto">
          <Rich text={c.description} />
        </p>

        {/* place and date, then the signers */}
        <div className={`${styles.signing} ${qrShown && !qrInSign ? styles.signingWithQr : ""}`}>
          <div className={styles.placeDate} dir="auto">
            {[c.place, c.issueDate || (placeholders ? "[tanggal diterbitkan]" : "")].filter(Boolean).join(", ")}
          </div>
          <div className={styles.signers} data-count={signers.length}>
            {signers.map((s, i) => (
              <div key={i} className={styles.signer}>
                {qrInSign && i === 0 ? (
                  <div className={`${styles.ink} ${styles.qrSign}`}>
                    {qrShown && qrBox}
                    {c.code && <b>{c.code}</b>}
                  </div>
                ) : (
                  <div className={styles.ink}>
                    {s.stamp && <img src={s.stamp} alt="" className={styles.stamp} />}
                    {s.signature && <img src={s.signature} alt="" className={styles.signature} />}
                  </div>
                )}
                <div className={styles.signerName} dir="auto">
                  {s.name}
                </div>
                <div className={styles.signerRole} dir="auto">
                  {s.role}
                </div>
              </div>
            ))}
          </div>
        </div>

        {qrShown && !qrInSign && (
          <div className={styles.qr}>
            {qrBox}
            <div>
              <span>Verifikasi keaslian</span>
              <b>{c.code || (placeholders ? "[KODE]" : "")}</b>
            </div>
          </div>
        )}

        {c.seal && <img src={sealKaaba} alt="" className={styles.seal} />}
      </div>
    </div>
  );
}

/**
 * The gold training certificate, laid out from its own file (842 x 596, here in
 * the same page units as the mint one): the paper with its Kufic medallion,
 * the logos top right, "SERTIFIKAT" in gold, the text from the medallion's
 * edge, the signers, the gold seal and the QR code above it.
 */
function GoldSheet({ c, width, scale, sheetRef, placeholders, signers, logos, qrInSign, qrShown, qrBox }) {
  // the title as the file draws it; any other title in the same gold
  const ownTitle = String(c.title || "").trim().toUpperCase() === "SERTIFIKAT";
  // a longer title narrows to stay on the page (about 0.7 of the font size per letter)
  const titleWidth = Math.min(String(c.title || "").length * 26.5, 400);
  return (
    <div ref={sheetRef} className={`${styles.frame} ${styles.goldFrame}`} style={{ width, height: PAGE_H * scale }}>
      <div className={`${styles.page} ${styles.gold}`} style={{ transform: `scale(${scale})` }}>
        <img src={goldPaper} alt="" className={styles.goldPaper} />

        <div className={styles.goldLogos}>
          <img src={annabaLogo} alt="" className={styles.annaba} />
          <div className={styles.mtLogo}>
            <img src={mtMark} alt="" />
            <b>MARKAZ TADARUS</b>
            <span>INDONESIA</span>
          </div>
          {logos.map((src, i) => (
            <img key={i} src={src} alt="" className={styles.partnerLogo} />
          ))}
          {placeholders && logos.length === 0 && <div className={styles.goldSlot}>Logo lembaga mitra</div>}
        </div>

        {ownTitle ? (
          <img src={goldTitle} alt={c.title} className={styles.goldTitle} />
        ) : (
          <svg className={styles.goldTitle} style={{ width: 400 }} viewBox="0 0 400 36" aria-label={c.title}>
            <defs>
              <linearGradient id="goldInk" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8a5a12" />
                <stop offset="0.35" stopColor="#e8c25a" />
                <stop offset="0.55" stopColor="#a8741c" />
                <stop offset="0.8" stopColor="#f2d47a" />
                <stop offset="1" stopColor="#8a5a12" />
              </linearGradient>
            </defs>
            <text x="0" y="31" fill="url(#goldInk)" fontFamily="'Times New Roman', Georgia, serif" fontWeight="700" fontSize="38" textLength={titleWidth} lengthAdjust="spacingAndGlyphs">
              {c.title}
            </text>
          </svg>
        )}

        <div className={styles.goldNumber}>
          <span>{c.numberLabel}</span> <span dir="auto">{c.number || (placeholders ? "[Nomor Sertifikat]" : "")}</span>
        </div>
        <div className={styles.goldGivenTo} dir="auto">
          {c.givenTo}
        </div>
        <FitLine className={styles.goldName} max={23} min={12} width={380}>
          {c.name || (placeholders ? "[Nama Peserta]" : "")}
        </FitLine>
        <p className={styles.goldDescription} dir="auto">
          <Rich text={c.description} />
        </p>

        <div className={styles.goldPlaceDate} dir="auto">
          {[c.place, c.issueDate || (placeholders ? "[tanggal sertifikat disahkan]" : "")].filter(Boolean).join(", ")}
        </div>
        <div className={styles.goldSigners} data-count={signers.length}>
          {signers.map((s, i) => (
            <div key={i} className={styles.goldSigner}>
              {qrInSign && i === 0 ? (
                <div className={`${styles.goldInk} ${styles.qrSign}`}>
                  {qrShown && qrBox}
                  {c.code && <b>{c.code}</b>}
                </div>
              ) : (
                <div className={styles.goldInk}>
                  {s.signature && <img src={s.signature} alt="" className={styles.goldSignature} />}
                  {s.stamp && <img src={s.stamp} alt="" className={styles.goldStamp} />}
                </div>
              )}
              <div className={styles.goldSignerName} dir="auto">
                {s.name}
              </div>
              <div className={styles.goldSignerRole} dir="auto">
                {s.role}
              </div>
            </div>
          ))}
        </div>

        {qrShown && !qrInSign && (
          <div className={styles.goldQr}>
            {qrBox}
            <span>Verifikasi keaslian</span>
            <b>{c.code || (placeholders ? "[KODE]" : "")}</b>
          </div>
        )}

        {c.seal && <img src={goldSeal} alt="" className={styles.goldSeal} />}
      </div>
    </div>
  );
}
