import { IconClockHour4, IconMessages, IconReceipt2, IconUserCheck, IconUsers, IconUsersGroup, IconUserStar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import ProgramPage from "../ProgramPage/ProgramPage";
import hero from "../../assets/imgs/homepage/programs/seminar.jpg";

const FACTS = [
  ["duration", IconClockHour4],
  ["size", IconUsers],
  ["group", IconUsersGroup],
  ["audience", IconUserStar],
];
const DETAILS = [
  ["method", IconMessages],
  ["requirements", IconUserCheck],
  ["funding", IconReceipt2],
];

// Seminar Tadarus 5T: its words (public/locales/*/programs/Seminar.json) and
// photo; the look is ProgramPage's.
export default function Seminar() {
  const { t } = useTranslation("programs/Seminar");
  const { t: tp } = useTranslation("programs/Program");
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
      { key: "topics", label: t("tabs.topics"), type: "steps", text: t("topics.text"), items: list("topics.items") },
      { key: "agenda", label: t("tabs.agenda"), type: "steps", items: list("agenda") },
      {
        key: "details",
        label: t("tabs.details"),
        type: "cards",
        cards: DETAILS.map(([key, icon]) => ({ icon, title: t(`details.${key}.title`), items: list(`details.${key}.items`) })),
      },
      {
        key: "certificate",
        label: t("tabs.certificate"),
        type: "certificate",
        title: t("certificate.title"),
        text: t("certificate.text"),
        sheet: {
          number: `001/SEM-5T/MTI/${new Date().getFullYear()}`,
          name: tp("sampleName"),
          description: "atas keikutsertaannya dalam acara *Seminar Tadarus al-Qur'an Metode 5T* yang diselenggarakan oleh *Markaz Tadarus Indonesia*.",
        },
      },
    ],
  };

  return <ProgramPage program={program} />;
}
