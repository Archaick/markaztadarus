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
import { cleanText, tidyNames } from "./certSchema";
import styles from "./Admin.module.css";

const NS = ["internal/Certificates", "internal/Internal"];
const MAX_NAMES = 2000;
const NAME_HEADER = /nama|name|peserta|participant|اسم|الاسم/i;

const columnLetter = (i) => (i < 26 ? String.fromCharCode(65 + i) : `${String.fromCharCode(64 + Math.floor(i / 26))}${String.fromCharCode(65 + (i % 26))}`);

/**
 * Issue a certificate to everyone on a list at once: an Excel sheet (pick the
 * column with the names) or names pasted one per line.
 */
export default function BulkIssue({ opened, onClose, programs, signerOptions, signerPlaceholder, existing, onIssue, onDownloadZip, onDownloadCsv }) {
  const { t } = useTranslation(NS);
  const [source, setSource] = useState("excel");
  const [program, setProgram] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [signerIds, setSignerIds] = useState([]);
  const [pasted, setPasted] = useState("");
  const [sheet, setSheet] = useState(null); // { fileName, rows }
  const [column, setColumn] = useState("0");
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
      const header = rows[0].findIndex((c) => NAME_HEADER.test(String(c ?? "")));
      setSheet({ fileName: file.name, rows });
      setHasHeader(header >= 0);
      setColumn(String(header >= 0 ? header : Math.max(0, rows[0].findIndex((c) => typeof c === "string"))));
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

  const names = useMemo(() => {
    let values = [];
    if (source === "excel" && sheet) {
      values = sheet.rows.slice(hasHeader ? 1 : 0).map((r) => r[Number(column)]);
    } else if (source === "paste") {
      values = pasted.split(/\r?\n/).map((line) => line.split("\t")[0]);
    }
    return tidyNames(values).slice(0, MAX_NAMES);
  }, [source, sheet, column, hasHeader, pasted]);

  // People who already have a certificate for this program are skipped.
  const already = useMemo(() => {
    const p = cleanText(program).toLowerCase();
    if (!p) return new Set();
    return new Set(existing.filter((c) => (c.program || "").toLowerCase() === p).map((c) => (c.name || "").toLowerCase()));
  }, [existing, program]);
  const fresh = names.filter((n) => !already.has(n.toLowerCase()));
  const skipped = names.length - fresh.length;

  const issue = async () => {
    setError("");
    if (!cleanText(program)) return setError(t("errors.noProgram"));
    if (!fresh.length) return setError(t("bulk.nothing"));
    setProgress(0);
    try {
      const created = await onIssue({ names: fresh, program: cleanText(program), eventDate, signerIds }, setProgress);
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
          <Autocomplete
            label={t("fields.program")}
            placeholder={t("fields.programPlaceholder")}
            data={programs}
            value={program}
            onChange={setProgram}
            required
            limit={12}
          />
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
              placeholder={"Ahmad Fauzi\nSiti Aminah\nMuhammad Rizki"}
              autosize
              minRows={6}
              maxRows={14}
              value={pasted}
              onChange={(e) => setPasted(e.currentTarget.value)}
              dir="auto"
            />
          )}

          {names.length > 0 && (
            <div className={styles.preview}>
              <Text size="sm" fw={700}>
                {t("bulk.previewTitle", { count: fresh.length })}
              </Text>
              <p className={styles.previewNames} dir="auto">
                {fresh.slice(0, 8).join(" · ")}
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
