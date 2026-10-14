import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  collection,
  doc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { IconArrowRight, IconHome2, IconLinkOff, IconLock, IconRefresh } from "@tabler/icons-react";
import { db } from "../../../firebaseConfig";
import { REDIRECT_COLLECTION, destinationKind, legacyDestination, linkState, normalizePath } from "./redirectSchema";
import LoaderGlobe from "../Common/LoaderGlobe";
import styles from "./Redirects.module.css";

const NS = "common/Redirect";
const MIN_SHOWN_MS = 3000; // long enough for the globe to land on Indonesia, short enough not to annoy
const COUNT_WAIT_MS = 1500; // a slow network never holds the visitor back for long

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * markaztadarus.com/<short link>: a branded "please wait" page while the link
 * is looked up, then on to its destination. Paused, expired and unknown links
 * get a page that says so instead of a silent jump to the home page.
 */
export default function Redirects() {
  const { shortCode } = useParams();
  const { t, i18n } = useTranslation(NS);
  const [state, setState] = useState({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);
  const rtl = i18n.language === "ar";

  useEffect(() => {
    let alive = true;
    const started = Date.now();

    const go = async (destination, countClick) => {
      if (!alive) return;
      setState({ phase: "going", destination, ...countClick?.meta });
      await Promise.race([countClick?.write().catch(() => {}), wait(COUNT_WAIT_MS)]);
      await wait(Math.max(0, MIN_SHOWN_MS - (Date.now() - started)));
      // replace: the back button returns to where the visitor came from, not here
      if (alive) window.location.replace(destination);
    };

    (async () => {
      try {
        const source = normalizePath(shortCode);
        const snap = await getDocs(
          query(collection(db, REDIRECT_COLLECTION), where("source", "==", source), limit(1))
        );
        if (!alive) return;

        if (!snap.empty) {
          const link = { id: snap.docs[0].id, ...snap.docs[0].data() };
          const status = linkState(link);
          if (status !== "active" || !link.destination) {
            setState({ phase: "closed", title: link.title, status });
            return;
          }
          await go(link.destination, {
            meta: { title: link.title },
            write: () =>
              updateDoc(doc(db, REDIRECT_COLLECTION, link.id), {
                clicks: increment(1),
                lastClickedAt: serverTimestamp(),
              }),
          });
          return;
        }

        const legacy = legacyDestination(shortCode);
        if (legacy) await go(legacy);
        else setState({ phase: "missing" });
      } catch (err) {
        console.error("Redirect lookup error:", err);
        const legacy = legacyDestination(shortCode);
        if (legacy) await go(legacy);
        else if (alive) setState({ phase: "error" });
      }
    })();

    return () => {
      alive = false;
    };
  }, [shortCode, attempt]);

  useEffect(() => {
    const previous = document.title;
    document.title = `${t(`tab.${state.phase}`)} · Markaz Tadarus Indonesia`;
    return () => {
      document.title = previous;
    };
  }, [state.phase, t]);

  const kind = state.destination ? destinationKind(state.destination).kind : null;
  const waiting = state.phase === "loading" || state.phase === "going";

  return (
    <main className={styles.page} dir={rtl ? "rtl" : "ltr"}>
      <div className={styles.pattern} aria-hidden="true" />
      <section className={styles.card} aria-live="polite" aria-busy={waiting}>
        {waiting ? (
          // while it opens: the globe flies down to the Tadarus provinces
          <>
            <LoaderGlobe />
            <p className={styles.brandRow}>
              <img src="/MTIFavicon.png" alt="" width="22" height="22" />
              Markaz Tadarus Indonesia
            </p>
          </>
        ) : (
          <>
            <div className={styles.logoWrap}>
              <img src="/MTIFavicon.png" alt="" className={styles.logo} width="88" height="88" />
            </div>
            <p className={styles.brand}>Markaz Tadarus Indonesia</p>
          </>
        )}

        {waiting && (
          <>
            <h1 className={styles.headline}>{t("wait.title")}</h1>
            <p className={styles.text}>
              {state.phase === "going" ? t(`wait.to.${kind}`) : t("wait.finding")}
            </p>
            {state.title && (
              <p className={styles.linkTitle} dir="auto">
                {state.title}
              </p>
            )}
            <div className={styles.bar}>
              <span />
            </div>
            {state.phase === "going" && (
              <a href={state.destination} className={styles.fallback}>
                {t("wait.manual")} <IconArrowRight size={15} className={styles.flip} />
              </a>
            )}
          </>
        )}

        {state.phase === "closed" && (
          <Notice
            icon={<IconLock size={26} />}
            title={t(state.status === "expired" ? "closed.expiredTitle" : "closed.title")}
            text={t("closed.text")}
            extra={state.title}
            home={t("home")}
          />
        )}

        {state.phase === "missing" && (
          <Notice
            icon={<IconLinkOff size={26} />}
            title={t("missing.title")}
            text={t("missing.text", { path: `markaztadarus.com/${shortCode}` })}
            home={t("home")}
          />
        )}

        {state.phase === "error" && (
          <Notice
            icon={<IconRefresh size={26} />}
            title={t("error.title")}
            text={t("error.text")}
            home={t("home")}
            action={
              <button type="button" className={styles.secondary} onClick={() => setAttempt((n) => n + 1)}>
                <IconRefresh size={16} /> {t("error.retry")}
              </button>
            }
          />
        )}
      </section>
    </main>
  );
}

function Notice({ icon, title, text, extra, home, action }) {
  return (
    <>
      <span className={styles.noticeIcon}>{icon}</span>
      <h1 className={styles.headline}>{title}</h1>
      {extra && (
        <p className={styles.linkTitle} dir="auto">
          {extra}
        </p>
      )}
      <p className={styles.text}>{text}</p>
      <div className={styles.actions}>
        {action}
        <a href="/" className={styles.primary}>
          <IconHome2 size={16} /> {home}
        </a>
      </div>
    </>
  );
}
