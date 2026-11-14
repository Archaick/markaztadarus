import { IconArrowsSort, IconChecklist, IconCircleCheck, IconCircleDashed, IconCircleDot, IconCursorText, IconLink, IconPencil } from "@tabler/icons-react";

// the cards in "Pilih jenis soal": seven with an answer key, one written task.
// `ar`: the name every Arabic-reading admin knows it by, shown with the UI's own.
export const TYPES = [
  { type: "single", icon: IconCircleDot, group: "quiz", ar: "اختيار من متعدد" },
  { type: "truefalse", icon: IconCircleCheck, group: "quiz", ar: "صح أو خطأ" },
  { type: "multi", icon: IconChecklist, group: "quiz", ar: "اختيار متعدد الإجابات" },
  { type: "match", icon: IconLink, group: "quiz", ar: "توصيل" },
  { type: "fillblank", icon: IconCursorText, group: "quiz", ar: "املأ الفراغ" },
  { type: "order", icon: IconArrowsSort, group: "quiz", ar: "ترتيب الكلمات" },
  { type: "circle", icon: IconCircleDashed, group: "quiz", ar: "ضع دائرة" },
  { type: "task", icon: IconPencil, group: "written", ar: "مهمة كتابية" },
];
export const ICON = Object.fromEntries(TYPES.map((x) => [x.type, x.icon]));
