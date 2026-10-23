import { useTranslation } from "react-i18next";
import WorldGlobe from "./WorldGlobe";
import { useGlobalContent } from "./globalData";
import styles from "./HubGlobe.module.css";

/**
 * The Tadarus Global globe in the internal portal's banner, held still on
 * the view that tells the story: Makkah, Madinah and Al-Quds on one side, the
 * program countries lit gold on the other, joined by the line of light.
 * Only to look at; the portal's tiles stay in front.
 */
// between Makkah and Indonesia (the globe is turned so this point faces us)
const VIEW = { lambda: -74, phi: -6 };

export default function HubGlobe() {
  const { t } = useTranslation("global/Global");
  const content = useGlobalContent();
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <WorldGlobe programs={content?.countries || {}} initialView={VIEW} autoSpin={false} sky={false} labels={{ makkah: t("holy.makkah"), madinah: t("holy.madinah"), quds: t("holy.quds") }} />
    </div>
  );
}
