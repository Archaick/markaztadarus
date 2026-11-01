import { Badge, Button, Chip, Group, Select, Switch, Text, TextInput } from "@mantine/core";
import { IconBrandZoom, IconBroadcast, IconLink, IconPlayerStop } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { ID_ZONES, LIVE_HOURS, OFFSETS, WEEK, badTime, badUrl, clockAt, dayAt, emptySession, liveState, useNow, zoneLabel } from "./liveSessions";
import styles from "./GlobalAdmin.module.css";

const LOCALES = { id: "id-ID", en: "en-GB", ar: "ar" };
// a Monday, to name the weekdays in the admin's language
const weekdayName = (day, lang, style = "short") =>
  new Intl.DateTimeFormat(LOCALES[lang] || "id-ID", { weekday: style, timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + day)));

/**
 * A place's online Tadarus (Tadarus Live), inside its card in the Tadarus
 * Global dashboard: when it meets each week, the Zoom link (private unless
 * "show on /global" is on), an activity link, and a button that marks it
 * live for the next two hours. `indonesia` offers WIB/WITA/WIT, others a UTC offset.
 */
export default function SessionFields({ session, onChange, zoom, onZoom, indonesia = true }) {
  const { t, i18n } = useTranslation("internal/Global");
  const lang = (i18n.language || "id").slice(0, 2);
  const now = useNow();

  if (!session) {
    return (
      <Switch
        size="sm"
        className={styles.sessionSwitch}
        label={t("session.enable")}
        checked={false}
        onChange={() => onChange(emptySession(indonesia ? 7 : 3))}
      />
    );
  }

  const set = (change) => onChange({ ...session, ...change });
  const state = liveState(session, now);
  const zones = indonesia
    ? ID_ZONES.map((z) => ({ value: String(z.value), label: z.label }))
    : OFFSETS.map((o) => ({ value: String(o), label: zoneLabel(o, false) }));

  return (
    <div className={styles.session}>
      <Group justify="space-between" gap="xs" wrap="nowrap">
        <Switch size="sm" label={t("session.enable")} checked onChange={() => onChange(null)} />
        {state.live ? (
          <Badge color="red" variant="filled" leftSection={<span className={styles.liveDot} />}>
            {t("session.liveUntil", { time: clockAt(state.endsAt, session.utc, indonesia) })}
          </Badge>
        ) : state.nextAt ? (
          <Badge color="gray" variant="light">
            {t("session.next", { day: weekdayName(dayAt(state.nextAt, session.utc), lang), time: clockAt(state.nextAt, session.utc, indonesia) })}
          </Badge>
        ) : null}
      </Group>

      <TextInput size="xs" label={t("session.title")} placeholder={t("session.titlePlaceholder")} value={session.title || ""} onChange={(e) => set({ title: e.currentTarget.value.slice(0, 80) })} dir="auto" />

      <div>
        <Text size="xs" fw={600} mb={4}>
          {t("session.days")}
        </Text>
        <Chip.Group multiple value={(session.days || []).map(String)} onChange={(v) => set({ days: v.map(Number) })}>
          <Group gap={4}>
            {WEEK.map((d) => (
              <Chip key={d} value={String(d)} size="xs" color="yellow" variant="light">
                {weekdayName(d, lang)}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </div>

      <div className={styles.sessionTimes}>
        <TextInput size="xs" type="time" label={t("session.start")} value={session.start || ""} onChange={(e) => set({ start: e.currentTarget.value })} error={badTime(session) && !/^\d{1,2}:\d{2}$/.test(session.start || "")} />
        <TextInput size="xs" type="time" label={t("session.end")} value={session.end || ""} onChange={(e) => set({ end: e.currentTarget.value })} error={badTime(session) && !/^\d{1,2}:\d{2}$/.test(session.end || "")} />
        <Select size="xs" label={t("session.zone")} data={zones} value={String(session.utc ?? 7)} onChange={(v) => v !== null && set({ utc: Number(v) })} allowDeselect={false} comboboxProps={{ withinPortal: true }} />
      </div>

      <TextInput
        size="xs"
        label={t("session.zoom")}
        placeholder="https://us02web.zoom.us/j/…"
        leftSection={<IconBrandZoom size={15} />}
        value={zoom}
        onChange={(e) => onZoom(e.currentTarget.value)}
        error={badUrl(zoom) ? t("session.badLink") : null}
        dir="ltr"
      />
      <Switch
        size="xs"
        label={t("session.zoomPublic")}
        description={session.zoomPublic ? t("session.zoomPublicOn") : t("session.zoomPublicOff")}
        checked={!!session.zoomPublic}
        onChange={(e) => set({ zoomPublic: e.currentTarget.checked })}
      />
      <TextInput
        size="xs"
        label={t("session.activity")}
        description={t("session.activityHint")}
        placeholder="https://…"
        leftSection={<IconLink size={15} />}
        value={session.activity || ""}
        onChange={(e) => set({ activity: e.currentTarget.value })}
        error={badUrl(session.activity) ? t("session.badLink") : null}
        dir="ltr"
      />

      <Group gap="xs" align="center">
        {Number(session.liveUntil) > now ? (
          <Button size="compact-xs" variant="light" color="gray" leftSection={<IconPlayerStop size={14} />} onClick={() => set({ liveUntil: 0 })}>
            {t("session.endLive")}
          </Button>
        ) : (
          <Button size="compact-xs" variant="light" color="red" leftSection={<IconBroadcast size={14} />} onClick={() => set({ liveUntil: Date.now() + LIVE_HOURS * 3600e3 })}>
            {t("session.goLive", { hours: LIVE_HOURS })}
          </Button>
        )}
        <Text size="xs" c="dimmed">
          {t("session.saveToShow")}
        </Text>
      </Group>
    </div>
  );
}
