import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Modal } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useSupervisi } from "./SupervisiData";
import { BASE } from "./SupervisiShell";
import { createSession } from "./actions";
import { tr, withoutMeta } from "./supervisiSchema";

const NS = "internal/Supervisi";
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Starts a supervision of one teacher: a draft on the identity sheet, already
 * filled in with what is known (school, teacher, today, the signed-in
 * supervisor), with its own copy of the instrument.
 */
export function useStartSession() {
  const { user } = useAccess();
  const navigate = useNavigate();
  const { instruments } = useSupervisi();
  const active = useMemo(() => (instruments || []).filter((i) => i.active !== false), [instruments]);
  const [busy, setBusy] = useState(false);

  const start = async (school, teacher, instrument) => {
    setBusy(true);
    try {
      const id = await createSession(user, {
        schoolId: school.id,
        schoolName: school.name,
        teacherId: teacher.id,
        teacherName: teacher.name,
        supervisorName: user?.displayName || "",
        date: today(),
        className: "",
        book: "",
        surah: "",
        instrumentId: instrument.id,
        instrument: withoutMeta(instrument),
        max: instrument.scaleMax || 5,
      });
      navigate(`${BASE}/sesi/${id}`);
    } catch (err) {
      console.error("Could not start the supervision:", err);
    } finally {
      setBusy(false);
    }
  };

  return { active, busy, start };
}

/** Asked only when more than one instrument is active: which one to use. */
export default function PickInstrument({ opened, onClose, onPick, busy }) {
  const { t, i18n } = useTranslation(NS);
  const { active } = useStartSession();
  return (
    <Modal opened={opened} onClose={onClose} title={t("sessions.instrument")} centered>
      <div style={{ display: "grid", gap: 10 }}>
        {active.map((i) => (
          <Button key={i.id} variant="light" color="#003366" justify="space-between" loading={busy} onClick={() => onPick(i)}>
            <span dir="auto">{tr(i.name, i18n.language)}</span>
          </Button>
        ))}
      </div>
    </Modal>
  );
}
