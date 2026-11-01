import {
  IconBed,
  IconBook,
  IconBuildingMosque,
  IconBus,
  IconCertificate,
  IconChalkboard,
  IconClock,
  IconHeartHandshake,
  IconId,
  IconLanguage,
  IconMapPin,
  IconPlaneTilt,
  IconToolsKitchen2,
  IconUsersGroup,
  IconUserStar,
} from "@tabler/icons-react";

// The facilities the Umrah programs offer, each with its icon; their names
// live in public/locales/*/programs/UmrahCommon.json (facility.<key>).
export const FACILITY_ICONS = {
  briefing: IconChalkboard,
  ticket: IconPlaneTilt,
  visa: IconId,
  leader: IconUserStar,
  transport: IconBus,
  room: IconBed,
  food: IconToolsKitchen2,
  foodTraining: IconToolsKitchen2,
  visits: IconMapPin,
  visitsHistoric: IconMapPin,
  module: IconBook,
  bookPack: IconBook,
  alumni: IconUsersGroup,
  language: IconLanguage,
  hours: IconClock,
  certificate: IconCertificate,
  certificateTraining: IconCertificate,
  friends: IconHeartHandshake,
  academy: IconBuildingMosque,
};

/** The facilities tab of an Umrah program: an optional price, then the facilities. */
export const facilitiesTab = (tc, label, keys, price) => ({
  key: "facilities",
  label,
  type: "facilities",
  price: price && { label: tc("priceLabel"), value: price, note: tc("included") },
  items: keys.map((key) => ({ icon: FACILITY_ICONS[key], text: tc(`facility.${key}`) })),
});

/** Groups (goals, requirements) from "<prefix>.<key>.title / .items". */
export const groupsOf = (t, prefix, keys) => keys.map((key) => ({ title: t(`${prefix}.${key}.title`), items: t(`${prefix}.${key}.items`, { returnObjects: true }) }));
