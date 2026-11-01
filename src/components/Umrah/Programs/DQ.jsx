import { IconBuildingMosque, IconCalendar, IconCash, IconFileText, IconUserCheck, IconUserStar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import ProgramPage from "../../ProgramPage/ProgramPage";
import { facilitiesTab, groupsOf } from "./umrahProgram";
import hero from "../../../assets/imgs/programs/DQ.jpg";
import brochure from "../../../assets/imgs/programs/dq-brochure.jpg";

const FACTS = [
  ["audience", IconUserStar],
  ["price", IconCash],
  ["length", IconCalendar],
  ["partner", IconBuildingMosque],
];

// Duta Qur'an: its words (public/locales/*/programs/DQ.json); the look is ProgramPage's.
export default function DQ() {
  const { t } = useTranslation("programs/DQ");
  const { t: tc } = useTranslation("programs/UmrahCommon");
  const list = (key) => t(key, { returnObjects: true });

  const program = {
    title: t("title"),
    lead: t("lead"),
    hero,
    whatsapp: t("whatsapp"),
    parent: { label: tc("umrah"), href: "/umrah" },
    seo: { title: t("title"), description: t("seo"), path: "/dq" },
    facts: FACTS.map(([key, icon]) => ({ icon, label: t(`facts.${key}.label`), value: t(`facts.${key}.value`) })),
    tabs: [
      { key: "goals", label: t("tabs.goals"), type: "goals", groups: groupsOf(t, "goals", ["aims", "strengths"]) },
      { key: "schedule", label: t("tabs.schedule"), type: "schedule", columns: list("schedule.columns"), rows: list("schedule.rows") },
      facilitiesTab(
        tc,
        t("tabs.facilities"),
        ["briefing", "ticket", "visa", "leader", "transport", "room", "foodTraining", "visits", "bookPack", "academy", "certificateTraining"],
        t("facts.price.value")
      ),
      {
        key: "requirements",
        label: t("tabs.requirements"),
        type: "cards",
        cards: [
          { icon: IconUserCheck, title: t("requirements.who.title"), items: list("requirements.who.items") },
          { icon: IconFileText, title: t("requirements.documents.title"), items: list("requirements.documents.items") },
        ],
      },
      { key: "media", label: t("tabs.media"), type: "media", youtube: "mfzh-Y_MMio", brochure },
    ],
  };

  return <ProgramPage program={program} />;
}
