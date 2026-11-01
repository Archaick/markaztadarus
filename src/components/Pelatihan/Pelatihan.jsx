import { IconClockHour4, IconMessages, IconReceipt2, IconRoute, IconUserCheck, IconUsers, IconUsersGroup, IconUserStar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import ProgramPage from "../ProgramPage/ProgramPage";
import hero from "../../assets/imgs/homepage/programs/pelatihan.jpg";

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
  ["coaching", IconRoute],
];

// Pelatihan Tadarus 5T: its words (public/locales/*/programs/Pelatihan.json)
// and photo; the look is ProgramPage's.
export default function Pelatihan() {
  const { t } = useTranslation("programs/Pelatihan");
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
      { key: "topics", label: t("tabs.topics"), type: "steps", items: list("topics") },
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
          number: `001/PLT-5T/MTI/${new Date().getFullYear()}`,
          name: tp("sampleName"),
          description: "atas keikutsertaannya dalam *Pelatihan Tadarus al-Qur'an Metode 5T* yang diselenggarakan oleh *Markaz Tadarus Indonesia* selama dua hari.",
        },
      },
    ],
  };

  return <ProgramPage program={program} />;
}
