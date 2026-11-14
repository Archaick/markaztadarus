import { useTranslation } from "react-i18next";
import WorldGlobe from "./WorldGlobe";
import { useMemo } from "react";
import { useGlobalContent } from "./globalData";
import { schoolGroups, useGuruMap, useSchoolMap } from "./schoolMap";
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
  // the teachers studying now, as on /global (by school, else by country at this distance)
  const teachers = useGuruMap();
  const schools = useSchoolMap();
  const bySchool = useMemo(() => schoolGroups(teachers.list, schools), [teachers.list, schools]);
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <WorldGlobe
        programs={content?.countries || {}}
        initialView={VIEW}
        autoSpin={false}
        sky={false}
        teachers={bySchool.rest}
        teacherSchools={bySchool.schools}
        teacherWords={{ studying: (count) => t("studyingPin", { count }), school: (count) => t("schoolStudying", { count }) }}
        labels={{ makkah: t("holy.makkah"), madinah: t("holy.madinah"), quds: t("holy.quds") }}
      />
    </div>
  );
}
