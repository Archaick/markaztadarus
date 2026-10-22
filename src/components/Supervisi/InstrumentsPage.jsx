import { useState } from "react";
import { ActionIcon, Badge, Button, Group, Loader, Modal, Text, Tooltip } from "@mantine/core";
import { IconCopy, IconPencil, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useSupervisi } from "./SupervisiData";
import { deleteInstrument, installPqa } from "./actions";
import { PQA_5T, indicatorsOf, tr, withoutMeta } from "./supervisiSchema";
import InstrumentSheet, { blankSection } from "./InstrumentSheet";
import InstrumentScene from "./InstrumentScene";
import styles from "./Supervisi.module.css";

const NS = "internal/Supervisi";

const blankText = () => ({ id: "", en: "", ar: "" });

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
        <div className={styles.cards}>
          {instruments.map((ins) => {
            const items = indicatorsOf(ins).length;
            const used = sessions.filter((s) => s.instrumentId === ins.id).length;
            return (
              <div key={ins.id} className={styles.card} style={ins.active === false ? { filter: "grayscale(0.7)" } : undefined}>
                <InstrumentScene id={ins.id} />
                <span className={`${styles.cardShade} ${styles.cardShadeScene}`} />
                <div className={styles.cardTop}>
                  <h2 className={styles.cardTitle} dir="auto" style={{ fontSize: "1.45rem" }}>
                    {tr(ins.name, i18n.language)}
                  </h2>
                  <p className={styles.cardPlace}>
                    {t("instruments.meta", { sections: (ins.sections || []).length, items, max: ins.scaleMax || 5, used, version: ins.version || 1 })}
                  </p>
                  {ins.active === false && (
                    <Badge color="gray" mt={8}>
                      {t("instruments.inactive")}
                    </Badge>
                  )}
                </div>
                <div className={styles.cardBottom}>
                  <button type="button" className={styles.cardOpen} onClick={() => setEditing(ins)} style={{ border: 0, color: "#fff", font: "inherit", cursor: "pointer" }}>
                    <IconPencil size={18} />
                    <span>{t("instruments.edit")}</span>
                  </button>
                  <div className={styles.cardTools}>
                    <Tooltip label={t("instruments.duplicate")}>
                      <ActionIcon
                        size="xl"
                        radius="xl"
                        variant="white"
                        color="dark"
                        onClick={() => {
                          const copy = JSON.parse(JSON.stringify(withoutMeta(ins)));
                          delete copy.key;
                          copy.name = { ...copy.name, id: `${copy.name?.id || ""} (${t("instruments.copy")})` };
                          setEditing(copy);
                        }}
                      >
                        <IconCopy size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label={t("common.delete")}>
                      <ActionIcon size="xl" radius="xl" variant="white" color="red" onClick={() => setRemoving(ins)}>
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal opened={!!editing} onClose={() => setEditing(null)} title={t(editing?.id ? "instruments.edit" : "instruments.new")} size="72rem" centered>
        {editing && <InstrumentSheet key={editing.id || "new"} instrument={editing} onClose={() => setEditing(null)} />}
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
