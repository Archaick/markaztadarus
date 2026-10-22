import { useState } from "react";
import { ActionIcon, Alert, Badge, Button, Group, Loader, Modal, Select, Switch, Text, TextInput, Textarea, Tooltip } from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconCopy, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useSupervisi } from "./SupervisiData";
import { deleteInstrument, installPqa, saveInstrument } from "./actions";
import { PQA_5T, indicatorsOf, newId, tr, withoutMeta } from "./supervisiSchema";
import styles from "./Supervisi.module.css";

const NS = "internal/Supervisi";
const LANGS = ["id", "en", "ar"];

const blankText = () => ({ id: "", en: "", ar: "" });
const blankItem = () => ({ id: newId(), text: blankText() });
const blankGroup = () => ({ id: newId(), title: null, items: [blankItem()] });
const blankSection = () => ({ id: newId(), title: blankText(), description: blankText(), groups: [blankGroup()] });
const strip = withoutMeta;

const move = (list, i, d) => {
  const next = [...list];
  const j = i + d;
  if (j < 0 || j >= next.length) return list;
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

/** One text in the three languages (Indonesian is the one required). */
function Tri({ label, value, onChange, multiline, required }) {
  const { t } = useTranslation(NS);
  const v = value || blankText();
  const Input = multiline ? Textarea : TextInput;
  return (
    <div>
      {label && (
        <Text size="sm" fw={600} mb={4}>
          {label}
        </Text>
      )}
      <div className={styles.langTriple}>
        {LANGS.map((l) => (
          <Input
            key={l}
            size="sm"
            autosize={multiline || undefined}
            minRows={multiline ? 1 : undefined}
            placeholder={t(`instruments.lang.${l}`)}
            leftSection={<span style={{ fontSize: 11, fontWeight: 700, color: "#5d6b7d" }}>{l.toUpperCase()}</span>}
            value={v[l] || ""}
            onChange={(e) => onChange({ ...v, [l]: e.currentTarget.value })}
            dir={l === "ar" ? "rtl" : "ltr"}
            required={required && l === "id"}
          />
        ))}
      </div>
    </div>
  );
}

function Mover({ onUp, onDown, onRemove }) {
  const { t } = useTranslation(NS);
  return (
    <Group gap={2} wrap="nowrap">
      <ActionIcon variant="subtle" color="gray" onClick={onUp} aria-label={t("instruments.up")}>
        <IconArrowUp size={16} />
      </ActionIcon>
      <ActionIcon variant="subtle" color="gray" onClick={onDown} aria-label={t("instruments.down")}>
        <IconArrowDown size={16} />
      </ActionIcon>
      <ActionIcon variant="subtle" color="red" onClick={onRemove} aria-label={t("common.delete")}>
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  );
}

/** Sections → (optional) groups → indicators, each in three languages. */
function InstrumentEditor({ instrument, onClose }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const [v, setV] = useState(() => JSON.parse(JSON.stringify(strip(instrument))));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const setSections = (fn) => setV((x) => ({ ...x, sections: fn(x.sections || []) }));
  const setSection = (si, patch) => setSections((ss) => ss.map((s, i) => (i === si ? { ...s, ...patch } : s)));
  const setGroups = (si, fn) => setSections((ss) => ss.map((s, i) => (i === si ? { ...s, groups: fn(s.groups || []) } : s)));
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

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Tri label={t("instruments.name")} value={v.name} onChange={(name) => setV({ ...v, name })} required />
      <Tri label={t("instruments.note")} value={v.note} onChange={(note) => setV({ ...v, note })} multiline />
      <Group>
        <Select
          label={t("instruments.scale")}
          data={["3", "4", "5"].map((x) => ({ value: x, label: `1 – ${x}` }))}
          value={String(v.scaleMax || 5)}
          onChange={(x) => setV({ ...v, scaleMax: Number(x) })}
          w={140}
        />
        <Switch mt={22} label={t("instruments.active")} checked={v.active !== false} onChange={(e) => setV({ ...v, active: e.currentTarget.checked })} />
      </Group>

      {(v.sections || []).map((section, si) => (
        <div key={section.id} className={styles.editBlock} style={{ borderInlineStart: "4px solid #003366" }}>
          <div className={styles.editRow}>
            <Tri label={`${t("instruments.section")} ${si + 1}`} value={section.title} onChange={(title) => setSection(si, { title })} required />
            <Mover
              onUp={() => setSections((ss) => move(ss, si, -1))}
              onDown={() => setSections((ss) => move(ss, si, 1))}
              onRemove={() => setSections((ss) => ss.filter((_, i) => i !== si))}
            />
          </div>
          <div style={{ marginTop: 8 }}>
            <Tri label={t("instruments.description")} value={section.description} onChange={(description) => setSection(si, { description })} multiline />
          </div>

          {(section.groups || []).map((group, gi) => (
            <div key={group.id} className={styles.editBlock} style={{ marginTop: 12, background: "#fbfcfd" }}>
              <div className={styles.editRow}>
                <Tri label={t("instruments.group")} value={group.title} onChange={(title) => setGroup(si, gi, { title })} />
                <Mover
                  onUp={() => setGroups(si, (gs) => move(gs, gi, -1))}
                  onDown={() => setGroups(si, (gs) => move(gs, gi, 1))}
                  onRemove={() => setGroups(si, (gs) => gs.filter((_, i) => i !== gi))}
                />
              </div>
              {(group.items || []).map((item, ii) => (
                <div key={item.id} className={styles.editRow} style={{ marginTop: 10 }}>
                  <Tri value={item.text} onChange={(text) => setItems(si, gi, (its) => its.map((x, i) => (i === ii ? { ...x, text } : x)))} multiline />
                  <Mover
                    onUp={() => setItems(si, gi, (its) => move(its, ii, -1))}
                    onDown={() => setItems(si, gi, (its) => move(its, ii, 1))}
                    onRemove={() => setItems(si, gi, (its) => its.filter((_, i) => i !== ii))}
                  />
                </div>
              ))}
              <Button mt="sm" size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => setItems(si, gi, (its) => [...its, blankItem()])}>
                {t("instruments.addItem")}
              </Button>
            </div>
          ))}
          <Button mt="sm" size="xs" variant="subtle" leftSection={<IconPlus size={14} />} onClick={() => setGroups(si, (gs) => [...gs, blankGroup()])}>
            {t("instruments.addGroup")}
          </Button>
        </div>
      ))}
      <Button variant="light" color="#003366" leftSection={<IconPlus size={16} />} onClick={() => setSections((ss) => [...ss, blankSection()])}>
        {t("instruments.addSection")}
      </Button>

      {error && <Alert color="red">{error}</Alert>}
      <Text size="xs" c="dimmed">
        {t("instruments.versionHint")}
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button color="#003366" loading={busy} onClick={save}>
          {t("common.save")}
        </Button>
      </Group>
    </div>
  );
}

/** The instruments (checklists) supervisions are scored with. */
export default function InstrumentsPage() {
  const { t, i18n } = useTranslation(NS);
  const { user } = useAccess();
  const { instruments, sessions, loading } = useSupervisi();
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [installing, setInstalling] = useState(false);

  if (loading) return <Loader />;
  const hasPqa = instruments.some((i) => i.key === PQA_5T.key);

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{t("instruments.title")}</h1>
          <p className={styles.pageSub}>{t("instruments.intro")}</p>
        </div>
        <Group>
          {!hasPqa && (
            <Button
              variant="light"
              color="#003366"
              loading={installing}
              onClick={async () => {
                setInstalling(true);
                try {
                  await installPqa(user);
                } finally {
                  setInstalling(false);
                }
              }}
            >
              {t("instruments.installPqa")}
            </Button>
          )}
          <button
            type="button"
            className={styles.primary}
            onClick={() => setEditing({ name: blankText(), note: blankText(), scaleMax: 5, active: true, sections: [blankSection()] })}
          >
            {t("instruments.new")}
          </button>
        </Group>
      </div>

      {instruments.length === 0 ? (
        <p className={styles.empty}>{t("instruments.empty")}</p>
      ) : (
        <ul className={styles.rows}>
          {instruments.map((ins) => {
            const items = indicatorsOf(ins).length;
            const used = sessions.filter((s) => s.instrumentId === ins.id).length;
            return (
              <li key={ins.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitle} dir="auto">
                    {tr(ins.name, i18n.language)}
                  </div>
                  <div className={styles.rowSub}>
                    {t("instruments.meta", { sections: (ins.sections || []).length, items, max: ins.scaleMax || 5, used, version: ins.version || 1 })}
                  </div>
                </div>
                <div className={styles.rowEnd}>
                  {ins.active === false && <Badge color="gray">{t("instruments.inactive")}</Badge>}
                  <Tooltip label={t("instruments.edit")}>
                    <ActionIcon variant="subtle" color="blue" onClick={() => setEditing(ins)}>
                      <IconPencil size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t("instruments.duplicate")}>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => {
                        const copy = JSON.parse(JSON.stringify(strip(ins)));
                        delete copy.key;
                        copy.name = { ...copy.name, id: `${copy.name?.id || ""} (${t("instruments.copy")})` };
                        setEditing(copy);
                      }}
                    >
                      <IconCopy size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t("common.delete")}>
                    <ActionIcon variant="subtle" color="red" onClick={() => setRemoving(ins)}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal opened={!!editing} onClose={() => setEditing(null)} title={t(editing?.id ? "instruments.edit" : "instruments.new")} size="90rem" centered>
        {editing && <InstrumentEditor key={editing.id || "new"} instrument={editing} onClose={() => setEditing(null)} />}
      </Modal>

      <Modal opened={!!removing} onClose={() => setRemoving(null)} title={t("common.delete")} centered>
        <Text size="sm">{t("instruments.deleteText", { name: tr(removing?.name, i18n.language) })}</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setRemoving(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            color="red"
            onClick={async () => {
              await deleteInstrument(user, removing);
              setRemoving(null);
            }}
          >
            {t("common.delete")}
          </Button>
        </Group>
      </Modal>
    </>
  );
}
