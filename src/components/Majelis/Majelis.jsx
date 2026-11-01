import { IconCalendarRepeat, IconClockHour4, IconMessages, IconUserCheck, IconUsers, IconUsersGroup } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import ProgramPage from "../ProgramPage/ProgramPage";
import hero from "../../assets/imgs/homepage/gallery/majelis/majelis1.jpg";
import book from "../../assets/imgs/ilmiah/tadarusbook.jpg";
import bookAr from "../../assets/imgs/ilmiah/tadarusbook-ar.jpg";
import toddler from "../../assets/imgs/ilmiah/toddlerbook.jpg";
import toddlerAr from "../../assets/imgs/ilmiah/toddlerbook-ar.jpg";

const FACTS = [
  ["duration", IconClockHour4],
  ["group", IconUsersGroup],
  ["intensity", IconCalendarRepeat],
  ["participants", IconUsers],
];
const DETAILS = [
  ["method", IconMessages],
  ["requirements", IconUserCheck],
];

// Majelis Tadarus 5T: its words (public/locales/*/programs/Majelis.json) and
// pictures; the look is ProgramPage's.
export default function Majelis() {
  const { t, i18n } = useTranslation("programs/Majelis");
  const ar = i18n.language === "ar";
  const list = (key) => t(key, { returnObjects: true });

  const program = {
    title: t("title"),
    lead: t("lead"),
    hero,
    whatsapp: t("whatsapp"),
    facts: FACTS.map(([key, icon]) => ({ icon, label: t(`facts.${key}.label`), value: t(`facts.${key}.value`) })),
    tabs: [
      {
        key: "goals",
        label: t("tabs.goals"),
        type: "goals",
        groups: ["general", "specific"].map((key) => ({ title: t(`goals.${key}.title`), items: list(`goals.${key}.items`) })),
      },
      { key: "curriculum", label: t("tabs.curriculum"), type: "steps", text: t("curriculum.text"), items: list("curriculum.items") },
      {
        key: "details",
        label: t("tabs.details"),
        type: "cards",
        cards: DETAILS.map(([key, icon]) => ({ icon, title: t(`details.${key}.title`), items: list(`details.${key}.items`) })),
      },
      {
        key: "books",
        label: t("tabs.books"),
        type: "books",
        books: [
          { key: "tadarus", img: ar ? bookAr : book },
          { key: "children", img: ar ? toddlerAr : toddler },
        ].map(({ key, img }) => ({
          img,
          tag: t(`modules.${key}.tag`),
          title: t(`modules.${key}.title`),
          text: t(`modules.${key}.text`),
          href: "/ilmiah",
        })),
      },
    ],
  };

  return <ProgramPage program={program} />;
}
