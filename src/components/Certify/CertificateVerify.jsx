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
import { CERTS, PUBLIC, certDate, certLang, displayName, displayProgram, normCode, publicFields } from "./certSchema";
import LoaderGlobe from "../Common/LoaderGlobe";
import styles from "./CertificateVerify.module.css";

const LANGS = [
  { code: "id", label: "ID" },
  { code: "en", label: "EN" },
  { code: "ar", label: "AR" },
];
const LOCALES = { id: "id-ID", en: "en-GB", ar: "ar-u-nu-latn" };
// The loading globe gets to land on Indonesia before the result replaces it.
const MIN_LOADING_MS = 4200;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const started = Date.now();
    const settle = () => wait(Math.max(0, MIN_LOADING_MS - (Date.now() - started)));
    const code = normCode(rawCode);
    if (!code) {
      setState({ phase: "missing" });
      return undefined;
    }

    const show = async (cert, countScan) => {
      let signers = [];
      try {
        // stamped documents carry their own signatures on paper
        if (cert.type !== "document") signers = resolveCertificateSigners(cert, await fetchAllSigners());
      } catch (err) {
        // signatures are a bonus: the certificate is valid without them
        console.error("Could not load signers:", err);
      }
      await settle();
      if (!alive) return;
      // open in the certificate's own language; the visitor can still switch
      if (cert.lang) i18n.changeLanguage(certLang(cert));
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
        await settle();
        if (alive) setState({ phase: "missing" });
      } catch (err) {
        console.error("Verification failed:", err);
        await settle();
        if (alive) setState({ phase: "error" });
      }
    })();

    return () => {
      alive = false;
    };
    // i18n is stable; the language only seeds the first view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawCode, attempt]);

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(LOCALES[lang] || "id-ID", { day: "numeric", month: "long", year: "numeric" }),
    [lang]
  );

  useEffect(() => {
    const previous = document.title;
    const revokedNow = state.cert?.status === "revoked";
    const isDocument = state.cert?.type === "document";
    const label =
      state.phase !== "found"
        ? t("tab_check")
        : revokedNow
          ? t(isDocument ? "doc_revoked_badge" : "revoked_badge")
          : t(isDocument ? "tab_doc" : "tab_found");
    document.title = `${label} · Markaz Tadarus Indonesia`;
    return () => {
      document.title = previous;
    };
  }, [state.phase, state.cert, t]);

  const cert = state.cert;
  const revoked = cert?.status === "revoked";
  // a Word document stamped from the dashboard: only its title is public
  const isDoc = cert?.type === "document";
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
          // while the code is looked up: the globe flies down to the Tadarus provinces
          <div className={styles.loading}>
            <LoaderGlobe />
            <p className={styles.brandText}>
              <img src="/MTIFavicon.png" alt="" width="22" height="22" />
              Markaz Tadarus Indonesia
            </p>
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
                {revoked ? t(isDoc ? "doc_revoked_badge" : "revoked_badge") : t(isDoc ? "doc_badge" : "authentic_badge")}
              </span>
            </div>

            {revoked && (
              <div className={styles.revokedBox}>
                <strong>{t(isDoc ? "doc_revoked_title" : "revoked_title")}</strong>
                <p>{t(isDoc ? "doc_revoked_text" : "revoked_text")}</p>
                {cert.revokedReason && (
                  <p dir="auto">
                    {t("revoked_reason")}: {cert.revokedReason}
                  </p>
                )}
              </div>
            )}

            {isDoc ? (
              <>
                <p className={styles.label}>{t("doc_label")}</p>
                <h1 className={styles.name} dir="auto">
                  {cert.title}
                </h1>
              </>
            ) : (
              <>
                <p className={styles.label}>{t("issued_to")}</p>
                <h1 className={styles.name} dir="auto">
                  {displayName(cert, lang)}
                </h1>
                <p className={styles.label}>{t("program")}</p>
                <p className={styles.program} dir="auto">
                  {displayProgram(cert, lang)}
                </p>
              </>
            )}
            {!isDoc && cert.description && (
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
