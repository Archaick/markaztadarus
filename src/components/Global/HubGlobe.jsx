import WorldGlobe from "./WorldGlobe";
import { useGlobalContent } from "./globalData";
import styles from "./HubGlobe.module.css";

/**
 * The Tadarus Global globe as the internal portal's backdrop: large, faint
 * and slowly turning, with the program countries lit and joined to Makkah.
 * Only to look at; the portal's tiles stay in front.
 */
export default function HubGlobe() {
  const content = useGlobalContent();
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <WorldGlobe programs={content?.countries || {}} />
    </div>
  );
}
