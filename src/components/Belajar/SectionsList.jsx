import { useState } from "react";
import { Link } from "react-router-dom";
import { ActionIcon, Alert, Badge, Button, Group, Modal, SegmentedControl, Select, Stack, Text, TextInput, Tooltip } from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconChevronRight, IconLayoutList, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { addTemplateSections, createSection, deleteSection, reorderSections, updateSectionMeta } from "./actions";
import { BASE, FIVE_T, NS, SECTION_TYPES, fiveTOf, issuesOfSection, kindOf, questionsOf, sectionTitle } from "./belajarSchema";
import styles from "./Belajar.module.css";

/**
 * A surah's sections, as the admin wants them: add (a standard one or their
 * own), rename, retag, move up and down, delete. Each opens its editor.
 */
export default function SectionsList({ lesson, sections }) {
  const { t } = useTranslation(NS);
  const { user, isSuperAdmin } = useAccess();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const missing = SECTION_TYPES.filter((s) => !sections.some((x) => x.key === s.key));

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= sections.length) return;
    const list = [...sections];
    [list[i], list[j]] = [list[j], list[i]];
    run(() => reorderSections(user, lesson, list));
  };

  return (
    <>
      {sections.length === 0 ? (
        <div className={styles.drop}>
          <IconLayoutList size={36} color="#1a4970" />
          <p className={styles.pageSub}>{t("sections.empty")}</p>
          <Group justify="center">
            <Button color="#003366" loading={busy} onClick={() => run(() => addTemplateSections(user, lesson, sections))}>
              {t("sections.useTemplate", { count: SECTION_TYPES.length })}
            </Button>
            <Button variant="light" color="#003366" leftSection={<IconPlus size={16} />} onClick={() => setAdding(true)}>
              {t("sections.add")}
            </Button>
          </Group>
        </div>
      ) : (
        <>
          <div className={styles.rows}>
            {sections.map((section, i) => {
              const kind = kindOf(section);
              const tag = fiveTOf(section);
              const issues = issuesOfSection(section);
              const count = kind === "written" ? (section.tasks || []).length : kind === "quiz" ? questionsOf(section).length : (section.reading || []).length;
              return (
                <div key={section.id} className={styles.row}>
                  <span className={styles.rowNo}>{i + 1}</span>
                  <Link to={`${BASE}/surat/${lesson.id}/${section.id}`} className={styles.rowMain} style={{ color: "inherit", textDecoration: "none" }}>
                    <div className={styles.rowTitle}>{sectionTitle(section, t)}</div>
                    <div className={styles.rowSub}>
                      {count ? t(`kind.${kind}Count`, { count }) : t("lesson.notYet")} · {t(`kind.${kind}`)}
                      {tag && (
                        <>
                          {" "}
                          · <span className={styles.tag}>{t(`fiveT.${tag}`)}</span>
                        </>
                      )}
                    </div>
                  </Link>
                  {issues > 0 && <Badge color="orange">{t("lessons.issues", { count: issues })}</Badge>}
                  <Group gap={2} wrap="nowrap">
                    <ActionIcon variant="subtle" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label={t("sections.up")}>
                      <IconArrowUp size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" disabled={busy || i === sections.length - 1} onClick={() => move(i, 1)} aria-label={t("sections.down")}>
                      <IconArrowDown size={16} />
                    </ActionIcon>
                    <Tooltip label={t("sections.edit")}>
                      <ActionIcon variant="subtle" color="#003366" onClick={() => setEditing(section)}>
                        <IconPencil size={16} />
                      </ActionIcon>
                    </Tooltip>
                    {isSuperAdmin && (
                      <Tooltip label={t("sectionPage.delete")}>
                        <ActionIcon variant="subtle" color="red" onClick={() => setRemoving(section)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    <Link to={`${BASE}/surat/${lesson.id}/${section.id}`} className={styles.rowGo} aria-label={t("sections.open")}>
                      <IconChevronRight size={18} />
                    </Link>
                  </Group>
                </div>
              );
            })}
          </div>
          <Group mt="md">
            <Button color="#003366" leftSection={<IconPlus size={16} />} onClick={() => setAdding(true)}>
              {t("sections.add")}
            </Button>
          </Group>
        </>
      )}

      <SectionForm opened={adding} onClose={() => setAdding(false)} lesson={lesson} sections={sections} missing={missing} />
      <SectionForm opened={!!editing} onClose={() => setEditing(null)} lesson={lesson} sections={sections} section={editing} />

      <Modal opened={!!removing} onClose={() => setRemoving(null)} title={t("sectionPage.delete")} centered>
        {removing && (
          <>
            <Text mb="md">{t("sections.deleteBody", { name: sectionTitle(removing, t) })}</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setRemoving(null)}>
                {t("cancel")}
              </Button>
              <Button color="red" loading={busy} onClick={() => run(async () => (await deleteSection(user, lesson, removing), setRemoving(null)))}>
                {t("delete")}
              </Button>
            </Group>
          </>
        )}
      </Modal>
    </>
  );
}

/** Adding a section (a standard one, or one of the admin's own), or changing one. */
function SectionForm({ opened, onClose, lesson, sections, section = null, missing = [] }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const start = section
    ? { source: "own", key: section.key, title: section.title || "", kind: kindOf(section), fiveT: fiveTOf(section) }
    : { source: missing.length ? "standard" : "own", key: missing[0]?.key || "", title: "", kind: "quiz", fiveT: "" };
  const value = form || start;
  const set = (patch) => setForm({ ...value, ...patch });
  const standard = SECTION_TYPES.find((s) => s.key === value.key);
  const hasContent = section && (questionsOf(section).length || (section.tasks || []).length);

  const close = () => {
    setForm(null);
    onClose();
  };
  const save = async () => {
    setBusy(true);
    try {
      if (section) await updateSectionMeta(user, lesson, section, { title: value.title.trim(), kind: value.kind, fiveT: value.fiveT });
      else if (value.source === "standard" && standard) await createSection(user, lesson, sections, { key: standard.key, kind: standard.kind, fiveT: standard.t || "", title: "" });
      else await createSection(user, lesson, sections, { title: value.title.trim(), kind: value.kind, fiveT: value.fiveT });
      close();
    } finally {
      setBusy(false);
    }
  };

  const fiveTData = [{ value: "", label: t("sections.noTag") }, ...FIVE_T.map((k) => ({ value: k, label: t(`fiveT.${k}`) }))];
  const kindData = ["quiz", "reading", "written"].map((k) => ({ value: k, label: t(`kind.${k}`) }));

  return (
    <Modal opened={opened} onClose={close} title={t(section ? "sections.edit" : "sections.add")} centered>
      <Stack>
        {!section && missing.length > 0 && (
          <SegmentedControl
            fullWidth
            color="#003366"
            value={value.source}
            onChange={(source) => set({ source })}
            data={[
              { value: "standard", label: t("sections.fromBook") },
              { value: "own", label: t("sections.own") },
            ]}
          />
        )}
        {!section && value.source === "standard" ? (
          <Select
            label={t("sections.pick")}
            allowDeselect={false}
            data={missing.map((s) => ({ value: s.key, label: t(`section.${s.key}`) }))}
            value={value.key}
            onChange={(key) => set({ key })}
          />
        ) : (
          <>
            <TextInput
              label={t("sections.name")}
              placeholder={section && SECTION_TYPES.some((s) => s.key === section.key) ? t(`section.${section.key}`) : t("sections.namePlaceholder")}
              description={section && SECTION_TYPES.some((s) => s.key === section.key) ? t("sections.nameHint") : undefined}
              value={value.title}
              onChange={(e) => set({ title: e.currentTarget.value })}
              data-autofocus
            />
            <Select label={t("sections.kind")} allowDeselect={false} data={kindData} value={value.kind} onChange={(kind) => set({ kind })} />
            {hasContent && value.kind !== kindOf(section) && (
              <Alert color="orange" variant="light">
                {t("sections.kindWarning")}
              </Alert>
            )}
            <Select label={t("sections.tag")} allowDeselect={false} data={fiveTData} value={value.fiveT} onChange={(fiveT) => set({ fiveT: fiveT || "" })} />
          </>
        )}
        <Button color="#003366" loading={busy} onClick={save} disabled={!section && value.source === "own" && !value.title.trim()}>
          {t(section ? "save" : "sections.addButton")}
        </Button>
      </Stack>
    </Modal>
  );
}
