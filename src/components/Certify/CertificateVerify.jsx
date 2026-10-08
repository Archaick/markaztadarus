import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { IconAlertTriangle, IconBan, IconCheck, IconHome2, IconRefresh } from "@tabler/icons-react";
import { db } from "../../../firebaseConfig";
import stampImg from "../../assets/imgs/stamp.png";
import SignatureBlock from "./SignatureBlock";
import { fetchAllSigners, resolveCertificateSigners } from "./signerUtils";
import { CERTS, PUBLIC, certDate, normCode, publicFields } from "./certSchema";
import styles from "./CertificateVerify.module.css";

const LANGS = [
  { code: "id", label: "ID" },
  { code: "en", label: "EN" },
  { code: "ar", label: "AR" },
];
const LOCALES = { id: "id-ID", en: "en-GB", ar: "ar-u-nu-latn" };

/**
 * markaztadarus.com/verify/<CODE>: what someone sees after scanning a
 * certificate's QR code. It opens that one code only; certificates cannot be
 * listed from here.
 */
export default function CertificateVerify() {
  const { code: rawCode } = useParams();
  const { t, i18n } = useTranslation("verification/CertificateVerify");
  const [state, setState] = useState({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);
  const lang = (i18n.language || "id").slice(0, 2);
  const rtl = lang === "ar";

  useEffect(() => {
    let alive = true;
    const code = normCode(rawCode);
    if (!code) {
      setState({ phase: "missing" });
      return undefined;
    }

    const show = async (cert, countScan) => {
      let signers = [];
      try {
        signers = resolveCertificateSigners(cert, await fetchAllSigners());
      } catch (err) {
        // signatures are a bonus: the certificate is valid without them
        console.error("Could not load signers:", err);
      }
      if (!alive) return;
      setState({ phase: "found", cert, signers });
      if (countScan) {
        updateDoc(doc(db, PUBLIC, code), { scans: increment(1), lastScannedAt: serverTimestamp() }).catch(() => {});
      }
    };

    (async () => {
      setState({ phase: "loading" });
      try {
        const snap = await getDoc(doc(db, PUBLIC, code));
        if (snap.exists()) return show(snap.data(), true);

        // Older certificates not yet copied over (closed once the copy is done).
        try {
          const legacy = await getDocs(query(collection(db, CERTS), where("code", "==", code), limit(1)));
          if (!legacy.empty) return show(publicFields(legacy.docs[0].data()), false);
        } catch {
          // no longer readable: the code simply does not exist
        }
        if (alive) setState({ phase: "missing" });
      } catch (err) {
        console.error("Verification failed:", err);
        if (alive) setState({ phase: "error" });
      }
    })();

    return () => {
      alive = false;
    };
  }, [rawCode, attempt]);

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(LOCALES[lang] || "id-ID", { day: "numeric", month: "long", year: "numeric" }),
    [lang]
  );

  useEffect(() => {
    const previous = document.title;
    const revokedNow = state.cert?.status === "revoked";
    const label = state.phase !== "found" ? t("tab_check") : revokedNow ? t("revoked_badge") : t("tab_found");
    document.title = `${label} · Markaz Tadarus Indonesia`;
    return () => {
      document.title = previous;
    };
  }, [state.phase, state.cert, t]);

  const cert = state.cert;
  const revoked = cert?.status === "revoked";
  const event = certDate(cert?.eventDate);
  const issued = certDate(cert?.issuedAt);

  return (
    <main className={styles.page} dir={rtl ? "rtl" : "ltr"}>
      <div className={styles.pattern} aria-hidden="true" />

      <div className={styles.langs} role="group" aria-label="Language">
        {LANGS.map((l) => (
          <button
            type="button"
            key={l.code}
            className={lang === l.code ? styles.langOn : ""}
            aria-pressed={lang === l.code}
            onClick={() => i18n.changeLanguage(l.code)}
          >
            {l.label}
          </button>
        ))}
      </div>

      <section className={`${styles.card} ${revoked ? styles.cardRevoked : ""}`} aria-live="polite">
        {state.phase === "loading" ? (
          // the logo in a turning gold ring while the code is looked up
          <div className={styles.loading}>
            <div className={styles.logoRing}>
              <img src="/MTIFavicon.png" alt="" width="84" height="84" />
            </div>
            <p className={styles.brandText}>Markaz Tadarus Indonesia</p>
            <p className={styles.loadingText}>{t("loading")}</p>
            {rawCode && (
              <p className={styles.codeBox}>
                <bdi>{normCode(rawCode)}</bdi>
              </p>
            )}
            <div className={styles.bar}>
              <span />
            </div>
          </div>
        ) : (
          <header className={styles.brand}>
            <img src="/MTIFavicon.png" alt="" width="44" height="44" />
            <span>Markaz Tadarus Indonesia</span>
          </header>
        )}

        {state.phase === "found" && (
          <>
            <div className={styles.sealWrap}>
              <span className={`${styles.seal} ${revoked ? styles.sealRevoked : ""}`}>
                {revoked ? <IconBan size={38} /> : <IconCheck size={40} stroke={3} />}
              </span>
              <span className={`${styles.badge} ${revoked ? styles.badgeRevoked : ""}`}>
                {revoked ? t("revoked_badge") : t("authentic_badge")}
              </span>
            </div>

            {revoked && (
              <div className={styles.revokedBox}>
                <strong>{t("revoked_title")}</strong>
                <p>{t("revoked_text")}</p>
                {cert.revokedReason && (
                  <p dir="auto">
                    {t("revoked_reason")}: {cert.revokedReason}
                  </p>
                )}
              </div>
            )}

            <p className={styles.label}>{t("issued_to")}</p>
            <h1 className={styles.name} dir="auto">
              {cert.name}
            </h1>
            <p className={styles.label}>{t("program")}</p>
            <p className={styles.program} dir="auto">
              {cert.program}
            </p>
            {cert.description && (
              <p className={styles.muted} dir="auto">
                {cert.description}
              </p>
            )}

            <dl className={styles.details}>
              {event && (
                <div>
                  <dt>{t("event_date")}</dt>
                  <dd>{dateFormat.format(event)}</dd>
                </div>
              )}
              {issued && (
                <div>
                  <dt>{t("issued_on")}</dt>
                  <dd>{dateFormat.format(issued)}</dd>
                </div>
              )}
              <div>
                <dt>{t("document_code")}</dt>
                <dd>
                  <bdi className={styles.code}>{cert.code}</bdi>
                </dd>
              </div>
            </dl>

            {state.signers.length > 0 ? (
              <div className={styles.signatures}>
                <p className={styles.signaturesTitle}>{t("signatures_title")}</p>
                <div className={styles.signaturesGrid} style={{ "--sig-cols": Math.min(state.signers.length, 3) }}>
                  {state.signers.map((s) => (
                    <SignatureBlock key={s.id} signer={s} />
                  ))}
                </div>
              </div>
            ) : (
              <img src={stampImg} alt="" className={styles.stamp} />
            )}

            <p className={styles.footer}>{revoked ? t("footer_revoked") : t("footer_text")}</p>
          </>
        )}

        {state.phase === "missing" && (
          <div className={styles.center}>
            <span className={`${styles.seal} ${styles.sealInvalid}`}>
              <IconAlertTriangle size={36} />
            </span>
            <h1 className={styles.headline}>{t("invalid_title")}</h1>
            <p className={styles.muted}>{t("invalid_subtext")}</p>
            {rawCode && (
              <p className={styles.codeBox}>
                <bdi>{normCode(rawCode)}</bdi>
              </p>
            )}
            <a href="/" className={styles.button}>
              <IconHome2 size={16} /> {t("home")}
            </a>
          </div>
        )}

        {state.phase === "error" && (
          <div className={styles.center}>
            <span className={`${styles.seal} ${styles.sealInvalid}`}>
              <IconRefresh size={34} />
            </span>
            <h1 className={styles.headline}>{t("errors.failed")}</h1>
            <button type="button" className={styles.button} onClick={() => setAttempt((n) => n + 1)}>
              <IconRefresh size={16} /> {t("retry")}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
