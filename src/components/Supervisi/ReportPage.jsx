import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Group, Loader, Modal, Text } from "@mantine/core";
import { IconArrowLeft, IconPencil, IconPrinter, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useSupervisi } from "./SupervisiData";
import { BASE } from "./SupervisiShell";
import { deleteSession, loadSignatures } from "./actions";
import { useDateFormat } from "./parts";
import { SCALE, formatAverage, headerOf, itemNo, summarize, tr } from "./supervisiSchema";
import styles from "./Supervisi.module.css";
import report from "./Report.module.css";

const NS = "internal/Supervisi";

/**
 * Laporan Supervisi: the identity sheet, every indicator with its score, the
 * two notes and both signatures, laid out for A4. "Cetak / PDF" uses the
 * browser's print dialog, where "Save as PDF" gives the file; finishing a
 * supervision opens it straight away (?print=1).
 */
export default function ReportPage() {
  const { sessionId } = useParams();
  const [params, setParams] = useSearchParams();
  const { t, i18n } = useTranslation(NS);
  const lang = i18n.language;
  const { user } = useAccess();
  const navigate = useNavigate();
  const dates = useDateFormat();
  const { sessions, loading } = useSupervisi();
  const session = (sessions || []).find((s) => s.id === sessionId);
  const [signs, setSigns] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (session) loadSignatures(session.id).then(setSigns).catch(() => setSigns({}));
  }, [session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // straight to the print dialog after "Selesaikan & Simpan Laporan"
  useEffect(() => {
    if (params.get("print") !== "1" || !session || signs === null) return undefined;
    const timer = setTimeout(() => {
      setParams({}, { replace: true });
      window.print();
    }, 600);
    return () => clearTimeout(timer);
  }, [params, session, signs, setParams]);

  if (loading) return <Loader />;
  if (!session) return <p className={styles.empty}>{t("sessions.missing")}</p>;

  const instrument = session.instrument;
  const summary = summarize(instrument, session.scores);
  const max = instrument?.scaleMax || 5;
  const identity = [
    ["teacherName", session.teacherName],
    ["schoolName", session.schoolName],
    ["date", dates.long(session.date)],
    ["className", session.className],
    ["book", session.book],
    ["surah", session.surah],
    ["supervisorName", session.supervisorName],
  ];
  let n = 0;

  return (
    <>
      <div className={report.toolbar}>
        <Link to={`${BASE}/sekolah/${session.schoolId}`} className={styles.crumb} style={{ margin: 0 }}>
          <IconArrowLeft size={16} className={styles.flip} /> {session.schoolName}
        </Link>
        <Group gap="xs">
          <Button variant="default" leftSection={<IconPencil size={16} />} onClick={() => navigate(`${BASE}/sesi/${session.id}`)}>
            {t("report.edit")}
          </Button>
          <Button variant="default" color="red" leftSection={<IconTrash size={16} />} onClick={() => setRemoving(true)}>
            {t("common.delete")}
          </Button>
          <Button color="#003366" leftSection={<IconPrinter size={16} />} onClick={() => window.print()}>
            {t("report.print")}
          </Button>
        </Group>
      </div>

      <article className={report.sheet} dir={lang.startsWith("ar") ? "rtl" : "ltr"}>
        <div className={report.head}>
          <img src="/MTIFavicon.png" alt="" />
          <div>
            <p className={report.org}>Markaz Tadarus Indonesia</p>
            <h1 className={report.title}>{t("report.title")}</h1>
            <p className={report.subtitle}>{tr(instrument?.name, lang)}</p>
          </div>
        </div>

        <h2 className={report.h2}>{t("identity.title")}</h2>
        <table className={report.identity}>
          <tbody>
            {identity.map(([key, value]) => (
              <tr key={key}>
                <th>{t(`fields.${key}`)}</th>
                <td dir="auto">{value || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={report.summary}>
          <div>
            <b>{formatAverage(summary.average)}</b>
            <span>{t("report.average", { max })}</span>
          </div>
          <div>
            <b>{summary.percent ? `${summary.percent}%` : "—"}</b>
            <span>{t("report.percent")}</span>
          </div>
          <div>
            <b>
              {summary.scored}/{summary.total}
            </b>
            <span>{t("report.scored")}</span>
          </div>
          <div>
            <b>{summary.toClarify}</b>
            <span>{t("report.toClarify")}</span>
          </div>
        </div>

        <h2 className={report.h2}>{t("report.assessment")}</h2>
        {instrument?.note && <p className={report.note}>{tr(instrument.note, lang)}</p>}
        {(instrument?.sections || []).map((section, si) => (
          <section key={section.id} className={report.section}>
            <h3 className={report.h3}>
              <span>{tr(section.title, lang)}</span>
              <span className={report.sectionScore}>
                ⌀ {formatAverage(summary.sections[si].average)} · {summary.sections[si].scored}/{summary.sections[si].total}
              </span>
            </h3>
            <table className={report.items}>
              <thead>
                <tr>
                  <th className={report.numCol}>{headerOf(instrument, "num", lang, "#")}</th>
                  <th>{headerOf(instrument, "indicator", lang, t("report.indicator"))}</th>
                  {SCALE.slice(0, max).map((v) => (
                    <th key={v} className={report.scoreCol}>
                      {headerOf(instrument, `s${v}`, lang, String(v))}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(section.groups || []).map((group) => [
                  tr(group.title, lang) ? (
                    <tr key={`${group.id}-title`} className={report.groupRow}>
                      <td colSpan={2 + max}>{tr(group.title, lang)}</td>
                    </tr>
                  ) : null,
                  ...(group.items || []).map((item) => {
                    n += 1;
                    const value = session.scores?.[item.id];
                    return (
                      <tr key={item.id} className={value ? "" : report.unscored}>
                        <td className={report.numCol}>{itemNo(item, n)}</td>
                        <td dir="auto">{tr(item.text, lang)}</td>
                        {SCALE.slice(0, max).map((v) => (
                          <td key={v} className={report.scoreCol}>
                            {value === v ? <span className={report.mark}>{v}</span> : ""}
                          </td>
                        ))}
                      </tr>
                    );
                  }),
                ])}
              </tbody>
            </table>
          </section>
        ))}

        <h2 className={report.h2}>{t("notes.title")}</h2>
        <div className={report.notes}>
          <div>
            <h4>{t("notes.appreciation")}</h4>
            <p dir="auto">{session.notes?.appreciation || "—"}</p>
          </div>
          <div>
            <h4>{t("notes.followUp")}</h4>
            <p dir="auto">{session.notes?.followUp || "—"}</p>
          </div>
        </div>

        <div className={report.signs}>
          {[
            ["teacher", session.teacherName],
            ["supervisor", session.supervisorName],
          ].map(([who, name]) => (
            <div key={who} className={report.sign}>
              <p>{t(`sign.${who}`)}</p>
              <div className={report.signBox}>{signs?.[who] ? <img src={signs[who]} alt="" /> : null}</div>
              <p className={report.signName} dir="auto">
                {name || "……………………"}
              </p>
            </div>
          ))}
        </div>
      </article>

      <Modal opened={removing} onClose={() => setRemoving(false)} title={t("common.delete")} centered>
        <Text size="sm">{t("report.deleteText", { name: session.teacherName })}</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setRemoving(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            color="red"
            onClick={async () => {
              await deleteSession(user, session);
              navigate(`${BASE}/sekolah/${session.schoolId}`);
            }}
          >
            {t("common.delete")}
          </Button>
        </Group>
      </Modal>
    </>
  );
}
