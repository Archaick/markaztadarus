import { IconFileText, IconMapPin, IconUsers, IconUserCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import ProgramPage from "../../ProgramPage/ProgramPage";
import { facilitiesTab, groupsOf } from "./umrahProgram";
import hero from "../../../assets/imgs/programs/UT.jpg";

const FACTS = [
  ["audience", IconUsers],
  ["place", IconMapPin],
  ["guidance", IconUserCheck],
  ["documents", IconFileText],
];

// Umrah Tadabburiyah: its words (public/locales/*/programs/UT.json); the look is ProgramPage's.
export default function UT() {
  const { t } = useTranslation("programs/UT");
  const { t: tc } = useTranslation("programs/UmrahCommon");

  const program = {
    title: t("title"),
    lead: t("lead"),
    hero,
    whatsapp: t("whatsapp"),
    parent: { label: tc("umrah"), href: "/umrah" },
    seo: { title: t("title"), description: t("seo"), path: "/ut" },
    facts: FACTS.map(([key, icon]) => ({ icon, label: t(`facts.${key}.label`), value: t(`facts.${key}.value`) })),
    tabs: [
      { key: "goals", label: t("tabs.goals"), type: "goals", groups: groupsOf(t, "goals", ["aims", "strengths"]) },
      { key: "journey", label: t("tabs.journey"), type: "journey", stages: groupsOf(t, "journey", ["before", "madinah", "makkah", "after"]) },
      facilitiesTab(tc, t("tabs.facilities"), ["briefing", "ticket", "visa", "leader", "transport", "room", "food", "visits", "module", "alumni"]),
      { key: "media", label: t("tabs.media"), type: "media", youtube: "I6DeL-x0PW4" },
    ],
  };

  return <ProgramPage program={program} />;
}
