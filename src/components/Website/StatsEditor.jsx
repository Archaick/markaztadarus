import { useEffect, useState } from "react";
import {
  Accordion,
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  NumberInput,
  Select,
  Switch,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconLanguage, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DEFAULT_STATS } from "../../data/defaultStats";
import { STAT_ICONS } from "../HomePage/Stats/statIcons";
import StatIcon from "../HomePage/Stats/StatIcon";
import { SITE_DOCS } from "../HomePage/siteContent";
import { useSiteDraft } from "./useSiteDraft";
import SaveBar from "./SaveBar";
import styles from "./Website.module.css";

const LANGS = ["id", "en", "ar"];
const TEXT_FIELDS = ["label", "suffix", "description"];

const blankText = () => ({ id: "", en: "", ar: "" });

// Every text field as { id, en, ar } strings so inputs are always controlled.
const toItem = (item) => ({
  id: item.id || Math.random().toString(36).slice(2, 10),
  icon: STAT_ICONS[item.icon] ? item.icon : "users",
  value: Number.isFinite(Number(item.value)) ? Number(item.value) : 0,
  visible: item.visible !== false,
  ...Object.fromEntries(
    TEXT_FIELDS.map((field) => [field, { ...blankText(), ...(typeof item[field] === "string" ? { id: item[field] } : item[field]) }])
  ),
});

const toDraft = (stored) => (Array.isArray(stored?.items) ? stored.items : DEFAULT_STATS).map(toItem);

const problemIn = (items) => {
  for (const [i, item] of items.entries()) {
    if (!item.label.id.trim()) return { key: "noLabel", n: i + 1 };
    if (item.value === "" || !Number.isFinite(Number(item.value)) || Number(item.value) < 0) return { key: "badValue", n: i + 1 };
  }
  return null;
};

// Drops empty translations so the site falls back to Indonesian for them.
const cleanText = (text) => Object.fromEntries(LANGS.map((l) => [l, text[l].trim()]).filter(([, v]) => v));

const toStored = (items) =>
  items.map((item) => {
    const out = {
      id: item.id,
      icon: item.icon,
      value: Math.round(Number(item.value)),
      visible: item.visible,
      label: cleanText(item.label),
      suffix: cleanText(item.suffix),
    };
    const description = cleanText(item.description);
    if (Object.keys(description).length) out.description = description;
    return out;
  });

export default function StatsEditor({ editorEmail, onDirty }) {
  const { t } = useTranslation("internal/Website");
  const site = useSiteDraft(SITE_DOCS.stats, toDraft, editorEmail);
  const items = site.draft || [];
  const [open, setOpen] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    onDirty?.(site.dirty);
  }, [site.dirty, onDirty]);

  const iconOptions = Object.keys(STAT_ICONS).map((value) => ({ value, label: t(`icons.${value}`) }));

  const update = (index, patch) =>
    site.setDraft((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const setText = (index, field, lang, value) =>
    site.setDraft((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: { ...item[field], [lang]: value } } : item))
    );

  const move = (index, delta) =>
    site.setDraft((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const addItem = () => {
    const item = toItem({ icon: "users", value: 0, visible: true });
    site.setDraft((current) => [...current, item]);
    setOpen((current) => [...current, item.id]);
  };

  const save = async () => {
    setMessage(null);
    const problem = problemIn(items);
    if (problem) {
      setMessage({ color: "red", text: t(`stats.problems.${problem.key}`, { n: problem.n }) });
      const id = items[problem.n - 1]?.id;
      if (id) setOpen((current) => (current.includes(id) ? current : [...current, id]));
      return;
    }
    const ok = await site.save({ items: toStored(items) });
    setMessage(ok ? { color: "teal", text: t("saved") } : { color: "red", text: t("saveFailed") });
  };

  if (site.loading) {
    return (
      <Group justify="center" py="xl">
        <Loader size="sm" />
      </Group>
    );
  }

  return (
    <div className={styles.editor}>
      {site.loadFailed && <Alert color="red">{t("loadFailed")}</Alert>}
      {site.fromBuiltIn && <Alert color="blue">{t("builtIn")}</Alert>}

      <Accordion multiple value={open} onChange={setOpen} variant="separated" radius="md" className={styles.accordion}>
        {items.map((item, index) => (
          <Accordion.Item key={item.id} value={item.id}>
            <Accordion.Control>
              <div className={styles.statHead}>
                <span className={styles.statIcon}>
                  <StatIcon name={item.icon} size={20} className={styles.statIconImage} />
                </span>
                <span className={styles.statValue}>{Number(item.value || 0).toLocaleString("id-ID")}</span>
                <span className={styles.statLabel}>{item.label.id || t("stats.untitled")}</span>
                {!item.visible && (
                  <Badge color="gray" variant="light" size="sm">
                    {t("stats.hiddenBadge")}
                  </Badge>
                )}
              </div>
            </Accordion.Control>
            <Accordion.Panel>
              <div className={styles.fieldGrid}>
                <Select
                  label={t("stats.icon")}
                  data={iconOptions}
                  value={item.icon}
                  onChange={(icon) => icon && update(index, { icon })}
                  allowDeselect={false}
                  leftSection={<StatIcon name={item.icon} size={16} className={styles.selectIconImage} />}
                  renderOption={({ option }) => (
                    <Group gap="xs" wrap="nowrap">
                      <StatIcon name={option.value} size={16} className={styles.selectIconImage} />
                      <span>{option.label}</span>
                    </Group>
                  )}
                  comboboxProps={{ withinPortal: true }}
                />
                <NumberInput
                  label={t("stats.value")}
                  min={0}
                  allowDecimal={false}
                  thousandSeparator="."
                  decimalSeparator=","
                  value={item.value}
                  onChange={(value) => update(index, { value })}
                />
                <Switch
                  className={styles.visibleSwitch}
                  color="yellow"
                  label={t("stats.visible")}
                  checked={item.visible}
                  onChange={(e) => update(index, { visible: e.currentTarget.checked })}
                />
              </div>

              <div className={styles.fieldGrid}>
                <TextInput
                  label={t("stats.label")}
                  required
                  value={item.label.id}
                  onChange={(e) => setText(index, "label", "id", e.target.value)}
                />
                <TextInput
                  label={t("stats.suffix")}
                  placeholder={t("stats.suffixPlaceholder")}
                  value={item.suffix.id}
                  onChange={(e) => setText(index, "suffix", "id", e.target.value)}
                />
              </div>
              <Textarea
                mt="sm"
                autosize
                minRows={1}
                label={`${t("stats.description")} (${t("optional")})`}
                value={item.description.id}
                onChange={(e) => setText(index, "description", "id", e.target.value)}
              />

              <details className={styles.translations}>
                <summary>
                  <IconLanguage size={15} /> {t("stats.translations")}
                </summary>
                <Text size="xs" c="dimmed" mb="xs">
                  {t("stats.translationsHint")}
                </Text>
                {["en", "ar"].map((lang) => (
                  <div className={styles.translationBlock} key={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
                    <Text size="xs" fw={700} c="dimmed" mb={4}>
                      {t(`stats.${lang}`)}
                    </Text>
                    <div className={styles.fieldGrid3}>
                      {TEXT_FIELDS.map((field) => (
                        <TextInput
                          key={field}
                          size="xs"
                          placeholder={item[field].id || t(`stats.${field}`)}
                          aria-label={`${t(`stats.${field}`)} (${t(`stats.${lang}`)})`}
                          value={item[field][lang]}
                          onChange={(e) => setText(index, field, lang, e.target.value)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </details>

              <Group justify="space-between" mt="md">
                <Group gap={4}>
                  <Tooltip label={t("moveUp")}>
                    <ActionIcon variant="default" disabled={index === 0} onClick={() => move(index, -1)} aria-label={t("moveUp")}>
                      <IconArrowUp size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t("moveDown")}>
                    <ActionIcon
                      variant="default"
                      disabled={index === items.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label={t("moveDown")}
                    >
                      <IconArrowDown size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => site.setDraft((current) => current.filter((_, i) => i !== index))}
                >
                  {t("stats.delete")}
                </Button>
              </Group>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>

      <button type="button" className={styles.addButton} onClick={addItem}>
        <IconPlus size={18} /> {t("stats.add")}
      </button>

      <SaveBar
        dirty={site.dirty}
        canSave={site.dirty || site.fromBuiltIn}
        saving={site.saving}
        message={message}
        onDismiss={() => setMessage(null)}
        onDiscard={() => {
          site.discard();
          setMessage(null);
        }}
        onSave={save}
      />
    </div>
  );
}
