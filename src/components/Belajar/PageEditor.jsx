import { useState } from "react";
import { ActionIcon, Button, Group, Switch, Textarea, Tooltip } from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconGripVertical, IconColumnInsertRight, IconColumnRemove, IconRowInsertBottom, IconRowRemove, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { NS } from "./belajarSchema";
import guru from "../Guru/Guru.module.css";
import styles from "./Belajar.module.css";
import { bare } from "./bareInput";


const KINDS = ["text", "heading", "arabic", "table"];
const blankTable = () => ({ type: "table", head: true, rows: [{ cells: ["", ""] }, { cells: ["", ""] }] });
const blankOfKind = (type) => (type === "table" ? blankTable() : { type, text: "" });

const swap = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

/**
 * The opening reading, edited on the page itself: what the admin types sits
 * where, and looks as, the teacher will see it. Lines are text, headings,
 * Arabic or tables (navy and gold, like the rest of Tadarus).
 */
export default function PageEditor({ value, onChange }) {
  const { t } = useTranslation(NS);
  const set = (i, patch) => onChange(value.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const add = (type, at = value.length) => onChange([...value.slice(0, at), blankOfKind(type), ...value.slice(at)]);
  // dragging a line by its grip: armed on the grip only, so selecting text inside a line still works
  const [armed, setArmed] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const drop = (to) => {
    if (dragging === null || to === dragging) return;
    const next = [...value];
    const [moved] = next.splice(dragging, 1);
    next.splice(to > dragging ? to - 1 : to, 0, moved);
    onChange(next);
  };
  const endDrag = () => {
    setArmed(null);
    setDragging(null);
    setOver(null);
  };

  return (
    <div className={styles.pageBlock}>
      <div>
        <div className={`${guru.glassCard} ${guru.reading} ${styles.pageSheet} ${value.length ? "" : styles.pageSheetEmpty}`}>
          {value.length === 0 && <p className={styles.pageEmpty}>{t("sectionPage.noReading")}</p>}
          {value.map((b, i) => (
            <div
              key={i}
              className={`${styles.pblock} ${dragging === i ? styles.pblockDragging : ""} ${over === i && dragging !== null && dragging !== i ? (i > dragging ? styles.pblockDropAfter : styles.pblockDropBefore) : ""}`}
              draggable={armed === i}
              onDragStart={(e) => {
                setDragging(i);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                if (dragging === null) return;
                e.preventDefault();
                setOver(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(i > dragging ? i + 1 : i);
                endDrag();
              }}
              onDragEnd={endDrag}
            >
              <div className={styles.pblockTools}>
                <span className={styles.grip} onMouseDown={() => setArmed(i)} onMouseUp={() => setArmed(null)} title={t("pageEditor.drag")} aria-hidden="true">
                  <IconGripVertical size={16} />
                </span>
                {KINDS.filter((k) => k !== "table").includes(b.type) && (
                  <Group gap={2} wrap="nowrap">
                    {["text", "heading", "arabic"].map((k) => (
                      <button key={k} type="button" className={`${styles.kindPill} ${b.type === k ? styles.kindPillOn : ""}`} onClick={() => set(i, { type: k })}>
                        {t(`block.${k}`)}
                      </button>
                    ))}
                  </Group>
                )}
                <Group gap={2} wrap="nowrap" ml="auto">
                  <ActionIcon size="sm" variant="subtle" onClick={() => onChange(swap(value, i, -1))} disabled={i === 0} aria-label={t("sections.up")}>
                    <IconArrowUp size={14} />
                  </ActionIcon>
                  <ActionIcon size="sm" variant="subtle" onClick={() => onChange(swap(value, i, 1))} disabled={i === value.length - 1} aria-label={t("sections.down")}>
                    <IconArrowDown size={14} />
                  </ActionIcon>
                  <ActionIcon size="sm" variant="subtle" color="red" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={t("delete")}>
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </div>
              {b.type === "table" ? (
                <TableEditor block={b} onChange={(patch) => set(i, patch)} />
              ) : b.type === "heading" ? (
                <h3>
                  <Textarea variant="unstyled" autosize minRows={1} styles={bare} placeholder={t("pageEditor.heading")} value={b.text} onChange={(e) => set(i, { text: e.currentTarget.value })} />
                </h3>
              ) : b.type === "arabic" ? (
                <div className={guru.arabic} dir="rtl">
                  <Textarea variant="unstyled" autosize minRows={1} styles={bare} placeholder="اكتب هنا" value={b.text} onChange={(e) => set(i, { text: e.currentTarget.value })} />
                </div>
              ) : (
                <p>
                  <Textarea variant="unstyled" autosize minRows={1} styles={bare} placeholder={t("pageEditor.text")} value={b.text} onChange={(e) => set(i, { text: e.currentTarget.value })} />
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      <Group gap="xs" mt="sm">
        <span className={styles.chipsLabel}>{t("pageEditor.add")}</span>
        {KINDS.map((k) => (
          <Button key={k} size="xs" variant="light" color="#003366" onClick={() => add(k)}>
            + {t(`block.${k}`)}
          </Button>
        ))}
      </Group>
    </div>
  );
}

function TableEditor({ block, onChange }) {
  const { t } = useTranslation(NS);
  const rows = (block.rows || []).map((r) => r.cells || []);
  const width = Math.max(1, ...rows.map((r) => r.length));
  const put = (next) => onChange({ rows: next.map((cells) => ({ cells })) });
  const head = block.head !== false;

  return (
    <>
      <div className={guru.rtableWrap}>
        <table className={guru.rtable}>
          <tbody>
            {rows.map((r, i) => {
              const Cell = head && i === 0 ? "th" : "td";
              return (
                <tr key={i}>
                  {Array.from({ length: width }, (_, j) => (
                    <Cell key={j}>
                      <Textarea
                        variant="unstyled"
                        autosize
                        minRows={1}
                        styles={bare}
                        placeholder={head && i === 0 ? t("pageEditor.column") : "…"}
                        value={r[j] || ""}
                        onChange={(e) => put(rows.map((row, a) => (a === i ? Array.from({ length: width }, (_, b) => (b === j ? e.currentTarget.value : row[b] || "")) : row)))}
                      />
                    </Cell>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Group gap={4} mt={6} className={styles.tableTools}>
        <Tooltip label={t("pageEditor.addRow")}>
          <ActionIcon variant="light" color="#003366" onClick={() => put([...rows, Array(width).fill("")])} aria-label={t("pageEditor.addRow")}>
            <IconRowInsertBottom size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={t("pageEditor.removeRow")}>
          <ActionIcon variant="light" color="red" disabled={rows.length <= 1} onClick={() => put(rows.slice(0, -1))} aria-label={t("pageEditor.removeRow")}>
            <IconRowRemove size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={t("pageEditor.addColumn")}>
          <ActionIcon variant="light" color="#003366" disabled={width >= 6} onClick={() => put(rows.map((r) => [...Array.from({ length: width }, (_, b) => r[b] || ""), ""]))} aria-label={t("pageEditor.addColumn")}>
            <IconColumnInsertRight size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={t("pageEditor.removeColumn")}>
          <ActionIcon variant="light" color="red" disabled={width <= 1} onClick={() => put(rows.map((r) => r.slice(0, width - 1)))} aria-label={t("pageEditor.removeColumn")}>
            <IconColumnRemove size={16} />
          </ActionIcon>
        </Tooltip>
        <Switch ml="sm" size="xs" checked={head} onChange={(e) => onChange({ head: e.currentTarget.checked })} label={t("pageEditor.headerRow")} />
      </Group>
    </>
  );
}
