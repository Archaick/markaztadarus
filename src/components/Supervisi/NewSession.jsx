import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Group, Modal, Select } from "@mantine/core";
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
 * "Buat Supervisi Baru": pick the school, the teacher and the instrument; the
 * supervision starts as a draft on the identity sheet, already filled in with
 * what is known (school, teacher, today, the signed-in supervisor).
 */
export default function NewSession({ opened, onClose, schoolId: fixedSchool, teacherId: fixedTeacher }) {
  const { t, i18n } = useTranslation(NS);
  const { user } = useAccess();
  const navigate = useNavigate();
  const { schools, teachersOf, instruments, schoolById, teacherById } = useSupervisi();
  const active = useMemo(() => (instruments || []).filter((i) => i.active !== false), [instruments]);
  const [schoolId, setSchoolId] = useState(fixedSchool || null);
  const [teacherId, setTeacherId] = useState(fixedTeacher || null);
  const [instrumentId, setInstrumentId] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!opened) return;
    setSchoolId(fixedSchool || null);
    setTeacherId(fixedTeacher || null);
    setInstrumentId(active[0]?.id || null);
  }, [opened, fixedSchool, fixedTeacher, active]);

  const start = async () => {
    const school = schoolById.get(schoolId);
    const teacher = teacherById.get(teacherId);
    const instrument = active.find((i) => i.id === instrumentId);
    if (!school || !teacher || !instrument) return;
    setBusy(true);
    try {
      const copy = withoutMeta(instrument);
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
        instrument: copy,
        max: instrument.scaleMax || 5,
      });
      onClose();
      navigate(`${BASE}/sesi/${id}`);
    } catch (err) {
      console.error("Could not start the supervision:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t("sessions.new")} centered>
      <div style={{ display: "grid", gap: 14 }}>
        {!active.length && <Alert color="yellow">{t("sessions.noInstrument")}</Alert>}
        <Select
          label={t("fields.schoolName")}
          data={(schools || []).map((s) => ({ value: s.id, label: s.name }))}
          value={schoolId}
          onChange={(v) => {
            setSchoolId(v);
            setTeacherId(null);
          }}
          searchable
          disabled={!!fixedSchool}
          nothingFoundMessage={t("common.noMatch")}
        />
        <Select
          label={t("fields.teacherName")}
          data={schoolId ? teachersOf(schoolId).map((x) => ({ value: x.id, label: x.name })) : []}
          value={teacherId}
          onChange={setTeacherId}
          searchable
          disabled={!schoolId || !!fixedTeacher}
          placeholder={schoolId && !teachersOf(schoolId).length ? t("sessions.noTeachers") : ""}
          nothingFoundMessage={t("common.noMatch")}
        />
        <Select
          label={t("sessions.instrument")}
          data={active.map((i) => ({ value: i.id, label: tr(i.name, i18n.language) }))}
          value={instrumentId}
          onChange={setInstrumentId}
        />
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button color="#003366" loading={busy} disabled={!schoolId || !teacherId || !instrumentId} onClick={start}>
            {t("sessions.start")}
          </Button>
        </Group>
      </div>
    </Modal>
  );
}
