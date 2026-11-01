import { useEffect, useState } from "react";
import { Alert, Button, Group, Modal, NumberInput, SegmentedControl, Text } from "@mantine/core";
import { IconCalendarTime } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "./accessContext";
import { MAX_KEEP_DAYS, MIN_KEEP_DAYS, cleanHistory, countOlder, loadKeepDays, saveKeepDays } from "./historyCleanup";

const PRESETS = [0, 90, 180, 365, 730];

/** "1 year", "6 months", "45 days"… for a number of days (0: forever). */
export function keepLabel(t, days) {
  if (!days) return t("history.keep.forever");
  if (days % 365 === 0) return t("history.keep.years", { count: days / 365 });
  if (days % 30 === 0) return t("history.keep.months", { count: days / 30 });
  return t("history.keep.days", { count: days });
}

/**
 * The super admin's choice of how long the Activity History keeps entries.
 * Older ones are removed when the Admin app opens; "clean up now" does it at
 * once. The last 30 days always stay (the rules see to it).
 */
export default function HistoryRetention({ onCleaned }) {
  const { t } = useTranslation("internal/Internal");
  const { user } = useAccess();
  const [stored, setStored] = useState(null);
  const [opened, setOpened] = useState(false);
  const [days, setDays] = useState(0);
  const [custom, setCustom] = useState(false);
  const [older, setOlder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadKeepDays()
      .then(setStored)
      .catch((err) => {
        console.error("Could not load the history setting:", err);
        setStored(0);
      });
  }, []);

  const valid = days === 0 || (days >= MIN_KEEP_DAYS && days <= MAX_KEEP_DAYS);

  // how many entries the chosen period would remove
  useEffect(() => {
    if (!opened) return undefined;
    setOlder(null);
    if (!valid || !days) return undefined;
    let live = true;
    const timer = setTimeout(
      () =>
        countOlder(days)
          .then((n) => live && setOlder(n))
          .catch(() => live && setOlder(null)),
      300
    );
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [days, opened, valid]);

  const open = () => {
    setDays(stored || 0);
    setCustom(!!stored && !PRESETS.includes(stored));
    setMessage(null);
    setOpened(true);
  };

  const save = async (andClean) => {
    if (!valid) return;
    setBusy(true);
    setMessage(null);
    try {
      if (days !== stored) {
        await saveKeepDays(user, days);
        setStored(days);
      }
      if (andClean && days) {
        const n = await cleanHistory(user, days);
        setMessage({ color: "teal", text: t("history.keep.cleaned", { count: n }) });
        onCleaned?.();
      } else {
        setOpened(false);
      }
    } catch (err) {
      console.error("Could not save or clean the history:", err);
      setMessage({ color: "red", text: t("history.keep.failed") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="default" radius="md" leftSection={<IconCalendarTime size={16} />} onClick={open} disabled={stored === null}>
        {stored === null ? t("history.keep.button") : t("history.keep.buttonWith", { period: keepLabel(t, stored) })}
      </Button>

      <Modal opened={opened} onClose={() => setOpened(false)} title={t("history.keep.title")} centered>
        <Text size="sm" c="dimmed" mb="md">
          {t("history.keep.intro")}
        </Text>
        <SegmentedControl
          fullWidth
          orientation="vertical"
          value={custom ? "custom" : String(days)}
          onChange={(v) => {
            if (v === "custom") {
              setCustom(true);
              setDays(days || 60);
            } else {
              setCustom(false);
              setDays(Number(v));
            }
          }}
          data={[...PRESETS.map((d) => ({ value: String(d), label: keepLabel(t, d) })), { value: "custom", label: t("history.keep.custom") }]}
        />
        {custom && (
          <NumberInput
            mt="sm"
            label={t("history.keep.customLabel")}
            description={t("history.keep.customHint", { min: MIN_KEEP_DAYS })}
            min={MIN_KEEP_DAYS}
            max={MAX_KEEP_DAYS}
            allowDecimal={false}
            value={days}
            onChange={(v) => setDays(Number(v) || 0)}
            error={!valid ? t("history.keep.customHint", { min: MIN_KEEP_DAYS }) : null}
          />
        )}

        <Text size="sm" mt="md">
          {!days
            ? t("history.keep.foreverNote")
            : older === null
              ? t("history.keep.counting")
              : t("history.keep.olderNow", { count: older, period: keepLabel(t, days) })}
        </Text>
        {message && (
          <Alert color={message.color} mt="sm" p="xs">
            {message.text}
          </Alert>
        )}

        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => save(false)} loading={busy} disabled={!valid}>
            {t("history.keep.save")}
          </Button>
          {!!days && (
            <Button color="red" onClick={() => save(true)} loading={busy} disabled={!valid || !older}>
              {t("history.keep.cleanNow", { count: older || 0 })}
            </Button>
          )}
        </Group>
      </Modal>
    </>
  );
}
