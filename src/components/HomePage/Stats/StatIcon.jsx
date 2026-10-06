import { STAT_ICONS } from "./statIcons";

export default function StatIcon({ name, size = 32, className }) {
  const entry = STAT_ICONS[name] || STAT_ICONS.users;
  if (entry.image) return <img src={entry.image} alt="" className={className} />;
  return <entry.Icon size={size} />;
}
