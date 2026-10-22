import { useMemo, useState } from "react";
import { ActionIcon, Alert, Button, Group, SegmentedControl, Select, Switch, Text, TextInput, Textarea, Tooltip } from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { saveInstrument } from "./actions";
import { SCALE, indicatorsOf, newId, withoutMeta } from "./supervisiSchema";
import s from "./InstrumentSheet.module.css";

// The instrument editor drawn as the assessment sheet itself, the way it
// prints in a report: the admin clicks a text in the table and types. One
// language at a time; in English or Arabic the Indonesian text shows as the
// hint wherever a translation is still missing.

const NS = "internal/Supervisi";
const LANGS = ["id", "en", "ar"];

const blankText = () => ({ id: "", en: "", ar: "" });
export const blankItem = () => ({ id: newId(), text: blankText() });
export const blankGroup = () => ({ id: newId(), title: null, items: [blankItem()] });
export const blankSection = () => ({ id: newId(), title: blankText(), description: blankText(), groups: [blankGroup()] });

const move = (list, i, d) => {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

/** Texts written in Indonesian but not yet in `lang`. */
function missingIn(v, lang) {
  if (lang === "id") return 0;
  const texts = [v.name, v.note];
  for (const section of v.sections || []) {
    texts.push(section.title, section.description);
    for (const group of section.groups || []) {
      texts.push(group.title);
      for (const item of group.items || []) texts.push(item.text);
    }
  }
  return texts.filter((x) => x?.id?.trim() && !x?.[lang]?.trim()).length;
}

/** One text of the sheet in the language being edited, borderless, like the printed words. */
function Words({ value, onChange, lang, placeholder, multiline, className = "" }) {
  const v = value || {};
  const missing = lang !== "id" && v.id?.trim() && !v[lang]?.trim();
  const Input = multiline ? Textarea : TextInput;
  return (
    <Input
      variant="unstyled"
      autosize={multiline || undefined}
      minRows={multiline ? 1 : undefined}
      value={v[lang] || ""}
      placeholder={missing ? v.id : placeholder}
      onChange={(e) => onChange({ ...blankText(), ...v, [lang]: e.currentTarget.value })}
      dir={lang === "ar" ? "rtl" : "ltr"}
      className={`${s.words} ${missing ? s.missing : ""} ${className}`}
    />
  );
}

function Tools({ onUp, onDown, onRemove }) {
  const { t } = useTranslation(NS);
  return (
    <span className={s.tools}>
      <Tooltip label={t("instruments.up")}>
        <ActionIcon size="sm" variant="subtle" color="gray" onClick={onUp} aria-label={t("instruments.up")}>
          <IconArrowUp size={15} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t("instruments.down")}>
        <ActionIcon size="sm" variant="subtle" color="gray" onClick={onDown} aria-label={t("instruments.down")}>
          <IconArrowDown size={15} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t("common.delete")}>
        <ActionIcon size="sm" variant="subtle" color="red" onClick={onRemove} aria-label={t("common.delete")}>
          <IconTrash size={15} />
        </ActionIcon>
      </Tooltip>
    </span>
  );
}

export default function InstrumentSheet({ instrument, onClose }) {
  const { t, i18n } = useTranslation(NS);
  const { user } = useAccess();
  const [v, setV] = useState(() => JSON.parse(JSON.stringify(withoutMeta(instrument))));
  const [lang, setLang] = useState(() => (LANGS.includes(i18n.language?.slice(0, 2)) ? i18n.language.slice(0, 2) : "id"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const max = v.scaleMax || 5;
  const missing = useMemo(() => missingIn(v, lang), [v, lang]);

  const setSections = (fn) => setV((x) => ({ ...x, sections: fn(x.sections || []) }));
  const setSection = (si, patch) => setSections((ss) => ss.map((x, i) => (i === si ? { ...x, ...patch } : x)));
  const setGroups = (si, fn) => setSections((ss) => ss.map((x, i) => (i === si ? { ...x, groups: fn(x.groups || []) } : x)));
  const setGroup = (si, gi, patch) => setGroups(si, (gs) => gs.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const setItems = (si, gi, fn) => setGroups(si, (gs) => gs.map((g, i) => (i === gi ? { ...g, items: fn(g.items || []) } : g)));

  const save = async () => {
    setError("");
    if (!v.name?.id?.trim()) return setError(t("instruments.errors.name"));
    const items = indicatorsOf(v);
    if (!items.length) return setError(t("instruments.errors.empty"));
    if (items.some((i) => !i.text?.id?.trim())) return setError(t("instruments.errors.itemText"));
    setBusy(true);
    try {
      await saveInstrument(user, instrument.id ? instrument : null, v);
      onClose();
    } catch (err) {
      console.error(err);
      setError(t("errors.failed"));
    } finally {
      setBusy(false);
    }
  };

  let n = 0;
  return (
    <div className={s.wrap}>
      <div className={s.bar}>
        <div>
          <Text size="xs" fw={700} c="dimmed" mb={4}>
            {t("instruments.editingIn")}
          </Text>
          <SegmentedControl
            value={lang}
            onChange={setLang}
            color="#003366"
            data={LANGS.map((l) => ({ value: l, label: t(`instruments.langShort.${l}`) }))}
          />
        </div>
        <Select
          label={t("instruments.scale")}
          data={["3", "4", "5"].map((x) => ({ value: x, label: `1 – ${x}` }))}
          value={String(max)}
          onChange={(x) => setV({ ...v, scaleMax: Number(x) })}
          w={110}
          size="sm"
        />
        <Switch label={t("instruments.active")} checked={v.active !== false} onChange={(e) => setV({ ...v, active: e.currentTarget.checked })} />
        {missing > 0 && <span className={s.missingBadge}>{t("instruments.missing", { count: missing })}</span>}
      </div>

      <p className={s.hint}>{t("instruments.sheetHint")}</p>

      <article className={s.paper} dir={lang === "ar" ? "rtl" : "ltr"}>
        <Words value={v.name} onChange={(name) => setV({ ...v, name })} lang={lang} placeholder={t("instruments.name")} className={s.title} />
        <Words value={v.note} onChange={(note) => setV({ ...v, note })} lang={lang} placeholder={t("instruments.noteHint")} multiline className={s.note} />

        {(v.sections || []).map((section, si) => (
          <section key={section.id} className={s.section}>
            <div className={s.sectionHead}>
              <Words value={section.title} onChange={(title) => setSection(si, { title })} lang={lang} placeholder={t("instruments.sectionHint")} className={s.h3} />
              <Tools
                onUp={() => setSections((ss) => move(ss, si, -1))}
                onDown={() => setSections((ss) => move(ss, si, 1))}
                onRemove={() => setSections((ss) => ss.filter((_, i) => i !== si))}
              />
            </div>
            <Words
              value={section.description}
              onChange={(description) => setSection(si, { description })}
              lang={lang}
              placeholder={t("instruments.descriptionHint")}
              multiline
              className={s.description}
            />

            <table className={s.items}>
              <thead>
                <tr>
                  <th className={s.numCol}>#</th>
                  <th>{t("report.indicator")}</th>
                  {SCALE.slice(0, max).map((x) => (
                    <th key={x} className={s.scoreCol}>
                      {x}
                    </th>
                  ))}
                  <th className={s.toolCol} aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {(section.groups || []).map((group, gi) => [
                  <tr key={`${group.id}-title`} className={`${s.groupRow} ${group.title?.id?.trim() ? "" : s.groupEmpty}`}>
                    <td colSpan={2 + max}>
                      <Words value={group.title} onChange={(title) => setGroup(si, gi, { title })} lang={lang} placeholder={t("instruments.groupHint")} />
                    </td>
                    <td className={s.toolCol}>
                      <Tools
                        onUp={() => setGroups(si, (gs) => move(gs, gi, -1))}
                        onDown={() => setGroups(si, (gs) => move(gs, gi, 1))}
                        onRemove={() => setGroups(si, (gs) => gs.filter((_, i) => i !== gi))}
                      />
                    </td>
                  </tr>,
                  ...(group.items || []).map((item, ii) => {
                    n += 1;
                    return (
                      <tr key={item.id} className={s.itemRow}>
                        <td className={s.numCol}>{n}</td>
                        <td>
                          <Words
                            value={item.text}
                            onChange={(text) => setItems(si, gi, (its) => its.map((x, i) => (i === ii ? { ...x, text } : x)))}
                            lang={lang}
                            placeholder={t("instruments.itemHint")}
                            multiline
                          />
                        </td>
                        {SCALE.slice(0, max).map((x) => (
                          <td key={x} className={s.scoreCol}>
                            <span className={s.bubble} />
                          </td>
                        ))}
                        <td className={s.toolCol}>
                          <Tools
                            onUp={() => setItems(si, gi, (its) => move(its, ii, -1))}
                            onDown={() => setItems(si, gi, (its) => move(its, ii, 1))}
                            onRemove={() => setItems(si, gi, (its) => its.filter((_, i) => i !== ii))}
                          />
                        </td>
                      </tr>
                    );
                  }),
                  <tr key={`${group.id}-add`} className={s.addRow}>
                    <td colSpan={3 + max}>
                      <button type="button" onClick={() => setItems(si, gi, (its) => [...its, blankItem()])}>
                        <IconPlus size={15} /> {t("instruments.addItem")}
                      </button>
                    </td>
                  </tr>,
                ])}
              </tbody>
            </table>
            <button type="button" className={s.addLink} onClick={() => setGroups(si, (gs) => [...gs, blankGroup()])}>
              <IconPlus size={15} /> {t("instruments.addGroup")}
            </button>
          </section>
        ))}

        <button type="button" className={s.addSection} onClick={() => setSections((ss) => [...ss, blankSection()])}>
          <IconPlus size={17} /> {t("instruments.addSection")}
        </button>
      </article>

      <div className={s.footer}>
        {error && (
          <Alert color="red" mb="sm">
            {error}
          </Alert>
        )}
        <Group justify="space-between" wrap="wrap">
          <Text size="xs" c="dimmed">
            {t("instruments.versionHint")}
          </Text>
          <Group>
            <Button variant="default" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button color="#003366" loading={busy} onClick={save}>
              {t("common.save")}
            </Button>
          </Group>
        </Group>
      </div>
    </div>
  );
}
