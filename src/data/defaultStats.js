/**
 * "Our Achievements" as shipped with the site. The Website dashboard stores
 * the same shape in Firestore (site_content/stats); until it has been saved
 * once, the home page and the editor both start from this list.
 *
 * Text is per language; only `id` is required, and en/ar fall back to it.
 * `icon` is a key of STAT_ICONS in components/HomePage/Stats/statIcons.jsx.
 */
export const DEFAULT_STATS = [
  {
    id: "seminar",
    icon: "users",
    value: 1087,
    visible: true,
    label: { id: "Peserta Seminar", en: "Seminar Participants", ar: "مشاركون في الندوات" },
    suffix: { id: "orang", en: "people", ar: "شخص" },
  },
  {
    id: "training",
    icon: "school",
    value: 536,
    visible: true,
    label: { id: "Peserta Pelatihan", en: "Training Participants", ar: "مشاركون في التدريبات" },
    suffix: { id: "orang", en: "people", ar: "شخص" },
  },
  {
    id: "partners",
    icon: "partners",
    value: 40,
    visible: true,
    label: { id: "Mitra 5T", en: "5T Partners", ar: "شركاء منهجية التاءات الخمس" },
    suffix: { id: "lembaga", en: "institutions", ar: "مؤسسة" },
  },
  {
    id: "tadarus",
    icon: "book",
    value: 418,
    visible: true,
    label: { id: "Peserta Majelis Tadarus", en: "Tadarus Assembly Participants", ar: "مشاركون في مجالس التدارس" },
    suffix: { id: "orang", en: "people", ar: "شخص" },
  },
  {
    id: "umrah",
    icon: "kaabah",
    value: 5,
    visible: true,
    label: { id: "Program Umrah", en: "Umrah Programs", ar: "برامج العمرة" },
    suffix: { id: "Umrah", en: "Umrah", ar: "عمرة" },
  },
  {
    id: "books",
    icon: "script",
    value: 1443,
    visible: true,
    label: { id: "Buku yang Didistribusikan", en: "Books Distributed", ar: "الكتب الموزعة" },
    suffix: { id: "eksemplar", en: "copies", ar: "نسخة" },
    description: {
      id: "Mubtadi: 303 eksemplar | Athfal: 190 paket (1.140 buku total)",
      en: "Mubtadi: 303 copies | Athfal: 190 sets (1,140 books total)",
      ar: "حقيبة المبتدئ: ٣٠٣ نسخة | حقيبة الأطفال: ١٩٠ مجموعة (١,١٤٠ نسخة)",
    },
  },
  {
    id: "qurban",
    icon: "goat",
    value: 77,
    visible: false,
    label: { id: "Qurban 1446H", en: "Qurban 1446H", ar: "الأضحية 1446هـ" },
    suffix: { id: "hewan", en: "animals", ar: "أضحية" },
    description: {
      id: "23 sapi dan 54 kambing didistribusikan",
      en: "23 cows and 54 goats distributed",
      ar: "من بقر وغنم",
    },
  },
  {
    id: "masjids",
    icon: "mosque",
    value: 2,
    visible: false,
    label: { id: "Masjid yang Dibangun", en: "Masjids Built", ar: "المساجد المبنية" },
    suffix: { id: "masjid", en: "masjids", ar: "مسجد" },
  },
];

// Text in the visitor's language, falling back to Indonesian.
export const localized = (text, lng) => {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[(lng || "id").slice(0, 2)] || text.id || "";
};
