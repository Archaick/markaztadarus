import { useState } from "react";
import { Modal } from "@mantine/core";
import { IconDeviceMobileDown, IconShare2, IconSquarePlus, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useInstall } from "./install";
import styles from "./Guru.module.css";

const NS = "guru/Guru";
const KEY = "guru.installHidden";
const HIDE_DAYS = 14;

const hiddenNow = () => {
  try {
    return Date.now() < Number(localStorage.getItem(KEY) || 0);
  } catch {
    return false;
  }
};

/** "Put Tadarus Guru on your phone": the browser's install, or the steps on an iPhone. */
export default function InstallCard() {
  const { t } = useTranslation(NS);
  const { canInstall, ios, install } = useInstall();
  const [hidden, setHidden] = useState(hiddenNow);
  const [steps, setSteps] = useState(false);

  if (hidden || (!canInstall && !ios)) return null;

  const hide = () => {
    try {
      localStorage.setItem(KEY, String(Date.now() + HIDE_DAYS * 24 * 3600 * 1000));
    } catch {
      // shown again next time, that is all
    }
    setHidden(true);
  };

  return (
    <>
      <div className={styles.installCard}>
        <img src="/guru-app/icon-192.png" alt="" />
        <div className={styles.installText}>
          <b>{t("install.title")}</b>
          <span>{t("install.text")}</span>
        </div>
        <button type="button" className={styles.installButton} onClick={() => (canInstall ? install() : setSteps(true))}>
          {t(canInstall ? "install.button" : "install.how")}
        </button>
        <button type="button" className={styles.installClose} onClick={hide} aria-label={t("install.later")}>
          <IconX size={16} />
        </button>
      </div>
      <IosSteps opened={steps} onClose={() => setSteps(false)} />
    </>
  );
}

export function IosSteps({ opened, onClose }) {
  const { t } = useTranslation(NS);
  return (
    <Modal opened={opened} onClose={onClose} centered radius="lg" title={t("install.iosTitle")}>
      <ol className={styles.iosSteps}>
        <li>
          <IconShare2 size={22} /> <span>{t("install.ios1")}</span>
        </li>
        <li>
          <IconSquarePlus size={22} /> <span>{t("install.ios2")}</span>
        </li>
        <li>
          <IconDeviceMobileDown size={22} /> <span>{t("install.ios3")}</span>
        </li>
      </ol>
    </Modal>
  );
}
