import { useEffect, useState } from "react";
import { ActionIcon, Button, Group, Modal, Text } from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconGripVertical, IconLock } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { isSection } from "./formSchema";
import styles from "./Forms.module.css";

const NS = "internal/Forms";

/** The form's section cards, each with the questions that follow it. */
const blocksOf = (fields) => {
  const blocks = [];
  fields.forEach((f) => {
    if (isSection(f)) blocks.push({ id: f.id, title: f.title, items: [f] });
    else if (blocks.length) blocks[blocks.length - 1].items.push(f);
  });
  return blocks;
};

/**
 * "Reorder sections", as in Google Forms: every section in a list, moved with
 * the arrows or by dragging, then saved in one go. Section 1 (under the
 * form's title) stays first. `onApply(fields)` gets the reordered list.
 */
export default function ReorderSections({ opened, onClose, fields, formTitle, onApply }) {
  const { t } = useTranslation(NS);
  const [order, setOrder] = useState([]);
  const [dragging, setDragging] = useState(null);

  const firstCard = fields.findIndex(isSection);
  const lead = firstCard === -1 ? fields : fields.slice(0, firstCard); // section 1's questions
  const blocks = blocksOf(fields);
  const byId = new Map(blocks.map((b) => [b.id, b]));

  useEffect(() => {
    if (opened) setOrder(blocksOf(fields).map((b) => b.id));
  }, [opened, fields]);

  const move = (from, to) =>
    setOrder((o) => {
      if (to < 0 || to >= o.length || from === to) return o;
      const next = [...o];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const apply = () => {
    onApply([...lead, ...order.flatMap((id) => byId.get(id)?.items || [])]);
    onClose();
  };

  const offset = lead.length ? 1 : 0; // section numbers start after section 1
  const total = order.length + offset;

  return (
    <Modal opened={opened} onClose={onClose} title={t("builder.reorderTitle")} centered size="md">
      <Text size="sm" c="dimmed" mb="sm">
        {t("builder.reorderHint")}
      </Text>
      <div className={styles.reorderList}>
        {lead.length > 0 && (
          <div className={`${styles.reorderRow} ${styles.reorderLocked}`}>
            <IconLock size={16} />
            <div className={styles.reorderText}>
              <b dir="auto">{formTitle || t("builder.sectionOf", { n: 1, total })}</b>
              <span>{t("builder.sectionOf", { n: 1, total })}</span>
            </div>
          </div>
        )}
        {order.map((id, i) => (
          <div
            key={id}
            className={`${styles.reorderRow} ${dragging === i ? styles.reorderDragging : ""}`}
            draggable
            onDragStart={() => setDragging(i)}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragging !== null && dragging !== i) {
                move(dragging, i);
                setDragging(i);
              }
            }}
            onDragEnd={() => setDragging(null)}
          >
            <IconGripVertical size={16} className={styles.reorderGrip} />
            <div className={styles.reorderText}>
              <b dir="auto">{byId.get(id)?.title || t("builder.untitledSection")}</b>
              <span>{t("builder.sectionOf", { n: i + 1 + offset, total })}</span>
            </div>
            <ActionIcon variant="subtle" color="gray" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={t("builder.moveSectionUp")}>
              <IconArrowUp size={16} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" disabled={i === order.length - 1} onClick={() => move(i, i + 1)} aria-label={t("builder.moveSectionDown")}>
              <IconArrowDown size={16} />
            </ActionIcon>
          </div>
        ))}
      </div>
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>
          {t("builder.cancel")}
        </Button>
        <Button color="violet" onClick={apply}>
          {t("builder.apply")}
        </Button>
      </Group>
    </Modal>
  );
}
