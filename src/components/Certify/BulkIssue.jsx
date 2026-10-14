import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  FileButton,
  Group,
  Modal,
  MultiSelect,
  Progress,
  SegmentedControl,
  Select,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { IconCheck, IconDownload, IconFileSpreadsheet, IconTable } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { cleanText, programKey, tidyPeople } from "./certSchema";
import LangPicker from "./LangPicker";
import styles from "./Admin.module.css";

const NS = ["internal/Certificates", "internal/Internal"];
const MAX_NAMES = 2000;
const NAME_HEADER = /nama|name|peserta|participant|اسم|الاسم/i;
const ARABIC_HEADER = /arab|arabic|عربي|بالعربية/i;
const NONE = "none";

const columnLetter = (i) => (i < 26 ? String.fromCharCode(65 + i) : `${String.fromCharCode(64 + Math.floor(i / 26))}${String.fromCharCode(65 + (i % 26))}`);

/**
 * Issue a certificate to everyone on a list at once: an Excel sheet (pick the
 * columns with the names) or names pasted one per line — "Latin name<Tab>Arabic
 * name" when both are wanted.
 */
export default function BulkIssue({ opened, onClose, programs, programsAr, signerOptions, signerPlaceholder, existing, onIssue, onDownloadZip, onDownloadCsv }) {
  const { t } = useTranslation(NS);
  const [source, setSource] = useState("excel");
  const [program, setProgram] = useState("");
  const [programAr, setProgramAr] = useState("");
  const [lang, setLang] = useState("id");
  const [eventDate, setEventDate] = useState("");
  const [signerIds, setSignerIds] = useState([]);
  const [pasted, setPasted] = useState("");
  const [sheet, setSheet] = useState(null); // { fileName, rows }
  const [column, setColumn] = useState("0");
  const [columnAr, setColumnAr] = useState(NONE);
  const [hasHeader, setHasHeader] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null);
  const [issued, setIssued] = useState(null);

  useEffect(() => {
    if (!opened) return;
    setError("");
    setProgress(null);
    setIssued(null);
  }, [opened]);

  const reset = () => {
    setPasted("");
    setSheet(null);
    setIssued(null);
    setProgress(null);
  };

  const readExcel = async (file) => {
    if (!file) return;
    setError("");
    try {
      const { readSheet } = await import("read-excel-file/browser");
      const rows = (await readSheet(file)).filter((r) => r.some((c) => c !== null && String(c).trim() !== ""));
      if (!rows.length) throw new Error("empty");
      const heads = rows[0].map((c) => String(c ?? ""));
      const arabic = heads.findIndex((h) => NAME_HEADER.test(h) && ARABIC_HEADER.test(h));
      const header = heads.findIndex((h, i) => i !== arabic && NAME_HEADER.test(h));
      setSheet({ fileName: file.name, rows });
      setHasHeader(header >= 0 || arabic >= 0);
      setColumn(String(header >= 0 ? header : Math.max(0, rows[0].findIndex((c) => typeof c === "string"))));
      setColumnAr(arabic >= 0 ? String(arabic) : NONE);
    } catch (err) {
      console.error("Could not read Excel file:", err);
      setSheet(null);
      setError(t("bulk.excelFailed"));
    }
  };

  const columns = useMemo(() => {
    if (!sheet) return [];
    const width = Math.max(...sheet.rows.map((r) => r.length));
    return Array.from({ length: width }, (_, i) => {
      const first = sheet.rows[0][i];
      const label = first === null || first === undefined ? "" : String(first).substring(0, 30);
      return { value: String(i), label: `${t("bulk.column")} ${columnLetter(i)}${label ? ` — ${label}` : ""}` };
    });
  }, [sheet, t]);

  const people = useMemo(() => {
    let rows = [];
    if (source === "excel" && sheet) {
      rows = sheet.rows
        .slice(hasHeader ? 1 : 0)
        .map((r) => [r[Number(column)], columnAr === NONE ? "" : r[Number(columnAr)]]);
    } else if (source === "paste") {
      rows = pasted.split(/\r?\n/).map((line) => line.split("\t"));
    }
    return tidyPeople(rows).slice(0, MAX_NAMES);
  }, [source, sheet, column, columnAr, hasHeader, pasted]);

  // People who already have a certificate with this description are skipped.
  const personKey = (p) => `${p.name || ""}|${p.nameAr || ""}`.toLowerCase();
  const already = useMemo(() => {
    const key = programKey({ program: cleanText(program), programAr: cleanText(programAr) }).toLowerCase();
    if (!key) return new Set();
    return new Set(existing.filter((c) => programKey(c).toLowerCase() === key).map(personKey));
  }, [existing, program, programAr]);
  const fresh = people.filter((p) => !already.has(personKey(p)));
  const skipped = people.length - fresh.length;
  const label = (p) => [p.name, p.nameAr].filter(Boolean).join(" · ");

  const issue = async () => {
    setError("");
    if (!cleanText(program) && !cleanText(programAr)) return setError(t("errors.noProgram"));
    if (!fresh.length) return setError(t("bulk.nothing"));
    setProgress(0);
    try {
      const created = await onIssue(
        { people: fresh, program: cleanText(program), programAr: cleanText(programAr), lang, eventDate, signerIds },
        setProgress
      );
      setIssued(created);
    } catch (err) {
      console.error("Bulk issue failed:", err);
      setError(t("errors.failed"));
    } finally {
      setProgress(null);
    }
  };

  const busy = progress !== null;

  return (
    <Modal opened={opened} onClose={busy ? () => {} : onClose} title={t("bulk.title")} centered size="lg" closeOnClickOutside={!busy}>
      {issued ? (
        <div className={styles.bulkDone}>
          <span className={styles.bulkDoneIcon}>
            <IconCheck size={26} />
          </span>
          <Text fw={700} size="lg">
            {t("bulk.doneTitle", { count: issued.length })}
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            {t("bulk.doneText")}
          </Text>
          <Group mt="md" justify="center">
            <Button leftSection={<IconDownload size={16} />} className={styles.primaryButton} onClick={() => onDownloadZip(issued, program)}>
              {t("actions.zip")}
            </Button>
            <Button variant="light" leftSection={<IconTable size={16} />} onClick={() => onDownloadCsv(issued, program)}>
              {t("actions.csv")}
            </Button>
          </Group>
          <Group mt="lg" justify="center">
            <Button variant="subtle" onClick={reset}>
              {t("bulk.again")}
            </Button>
            <Button variant="default" onClick={onClose}>
              {t("common.close")}
            </Button>
          </Group>
        </div>
      ) : (
        <div className={styles.editor}>
          <div className={styles.editorRow}>
            <Autocomplete
              label={t("fields.program")}
              placeholder={t("fields.programPlaceholder")}
              data={programs}
              value={program}
              onChange={setProgram}
              limit={12}
              dir="ltr"
            />
            <Autocomplete
              label={t("fields.programAr")}
              placeholder={t("fields.programArPlaceholder")}
              data={programsAr}
              value={programAr}
              onChange={setProgramAr}
              limit={12}
              dir="rtl"
              lang="ar"
            />
          </div>
          <LangPicker value={lang} onChange={setLang} />
          <div className={styles.editorRow}>
            <TextInput
              type="date"
              label={t("fields.eventDate")}
              description={t("fields.eventDateHint")}
              value={eventDate}
              onChange={(e) => setEventDate(e.currentTarget.value)}
              className={styles.dateInput}
            />
            <MultiSelect
              label={t("fields.signers")}
              placeholder={signerIds.length ? "" : signerPlaceholder}
              data={signerOptions}
              value={signerIds}
              onChange={setSignerIds}
              clearable
              searchable
            />
          </div>

          <SegmentedControl
            value={source}
            onChange={setSource}
            data={[
              { value: "excel", label: t("bulk.fromExcel") },
              { value: "paste", label: t("bulk.fromPaste") },
            ]}
          />

          {source === "excel" ? (
            <div className={styles.dropBox}>
              <IconFileSpreadsheet size={28} />
              {sheet ? (
                <>
                  <Text fw={600} size="sm">
                    {sheet.fileName}
                  </Text>
                  <div className={styles.editorRow}>
                    <Select label={t("bulk.nameColumn")} data={columns} value={column} onChange={(v) => setColumn(v || "0")} allowDeselect={false} />
                    <Select
                      label={t("bulk.nameArColumn")}
                      data={[{ value: NONE, label: t("bulk.noColumn") }, ...columns]}
                      value={columnAr}
                      onChange={(v) => setColumnAr(v || NONE)}
                      allowDeselect={false}
                    />
                  </div>
                  <div className={styles.editorRow}>
                    <Checkbox
                      mt={30}
                      label={t("bulk.hasHeader")}
                      checked={hasHeader}
                      onChange={(e) => setHasHeader(e.currentTarget.checked)}
                    />
                  </div>
                </>
              ) : (
                <Text size="sm" c="dimmed" ta="center">
                  {t("bulk.excelHint")}
                </Text>
              )}
              <FileButton onChange={readExcel} accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
                {(props) => (
                  <Button {...props} variant="light" size="xs">
                    {sheet ? t("bulk.otherFile") : t("bulk.chooseFile")}
                  </Button>
                )}
              </FileButton>
            </div>
          ) : (
            <Textarea
              label={t("bulk.pasteLabel")}
              description={t("bulk.pasteHint")}
              placeholder={"Ahmad Fauzi\tأحمد فوزي\nSiti Aminah\nمحمد رزقي"}
              autosize
              minRows={6}
              maxRows={14}
              value={pasted}
              onChange={(e) => setPasted(e.currentTarget.value)}
              dir="auto"
            />
          )}

          {people.length > 0 && (
            <div className={styles.preview}>
              <Text size="sm" fw={700}>
                {t("bulk.previewTitle", { count: fresh.length })}
              </Text>
              <p className={styles.previewNames} dir="auto">
                {fresh.slice(0, 8).map(label).join("  ·  ")}
                {fresh.length > 8 ? ` · ${t("bulk.andMore", { count: fresh.length - 8 })}` : ""}
              </p>
              {skipped > 0 && (
                <Text size="xs" c="orange.8">
                  {t("bulk.skipped", { count: skipped })}
                </Text>
              )}
            </div>
          )}

          {busy && <Progress value={progress * 100} striped animated />}
          {error && (
            <Alert color="red" variant="light">
              {error}
            </Alert>
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button className={styles.primaryButton} onClick={issue} loading={busy} disabled={!fresh.length}>
              {t("bulk.submit", { count: fresh.length })}
            </Button>
          </Group>
        </div>
      )}
    </Modal>
  );
}
