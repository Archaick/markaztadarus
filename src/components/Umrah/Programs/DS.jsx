import { IconBook, IconBook2, IconCash, IconLanguage, IconMapPin, IconMoodSmile, IconSchool, IconTrees } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import ProgramPage from "../../ProgramPage/ProgramPage";
import { facilitiesTab, groupsOf } from "./umrahProgram";
import hero from "../../../assets/imgs/programs/DS.jpg";
import brochure from "../../../assets/imgs/programs/ds-brochure.jpg";

const FACTS = [
  ["audience", IconSchool],
  ["price", IconCash],
  ["study", IconBook2],
  ["place", IconMapPin],
];
const ACTIVITIES = [
  ["quran", IconBook],
  ["arabic", IconLanguage],
  ["deepening", IconMoodSmile],
  ["outdoor", IconTrees],
];
const REQUIREMENT_ICONS = { who: IconSchool, documents: IconBook2, travel: IconMapPin, registration: IconCash };

// Tadarus Santri (/ts): its words (public/locales/*/programs/TS.json); the look is ProgramPage's.
export default function DS() {
  const { t } = useTranslation("programs/TS");
  const { t: tc } = useTranslation("programs/UmrahCommon");
  const list = (key) => t(key, { returnObjects: true });

  const program = {
    title: t("title"),
    lead: t("lead"),
    hero,
    whatsapp: t("whatsapp"),
    parent: { label: tc("umrah"), href: "/umrah" },
    seo: { title: t("title"), description: t("seo"), path: "/ts" },
    facts: FACTS.map(([key, icon]) => ({ icon, label: t(`facts.${key}.label`), value: t(`facts.${key}.value`) })),
    tabs: [
      { key: "goals", label: t("tabs.goals"), type: "goals", groups: groupsOf(t, "goals", ["aims", "strengths"]) },
      {
        key: "activities",
        label: t("tabs.activities"),
        type: "cards",
        cards: ACTIVITIES.map(([key, icon]) => ({ icon, title: t(`activities.${key}.title`), items: list(`activities.${key}.items`) })),
      },
      { key: "schedule", label: t("tabs.schedule"), type: "schedule", columns: list("schedule.columns"), rows: list("schedule.rows") },
      facilitiesTab(
        tc,
        t("tabs.facilities"),
        ["briefing", "ticket", "visa", "leader", "transport", "room", "food", "visitsHistoric", "module", "language", "hours", "certificate", "friends"],
        t("facts.price.value")
      ),
      {
        key: "requirements",
        label: t("tabs.requirements"),
        type: "cards",
        cards: Object.entries(REQUIREMENT_ICONS).map(([key, icon]) => ({ icon, title: t(`requirements.${key}.title`), items: list(`requirements.${key}.items`) })),
      },
      { key: "media", label: t("tabs.media"), type: "media", youtube: "SkS0H-ImbtI", brochure },
    ],
  };

  return <ProgramPage program={program} />;
}
