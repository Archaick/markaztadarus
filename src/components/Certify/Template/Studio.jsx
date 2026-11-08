import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  FileButton,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Progress,
  SegmentedControl,
  Switch,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconDownload,
  IconEye,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconFileZip,
  IconPhotoPlus,
  IconPlus,
  IconTrash,
  IconUsersPlus,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Timestamp, collection, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { useAccess } from "../../Internal/accessContext";
import { auditedWrite } from "../../Internal/audit";
import portal from "../../Internal/InternalPortal.module.css";
import { CERTS, PUBLIC, fromDateInput, isRevoked, normCode, publicFields, safeFileName, tidyPeople } from "../certSchema";
import { LOGO_IMAGE_CHARS, processImageFile } from "../signerUtils";
import CertificateSheet, { TEMPLATES } from "./CertificateSheet";
import { certificatesPdf, certificatesZip, saveBlob } from "./studioPdf";
import { DESIGNS, DESIGNS_PUBLIC, MAX_LOGOS, MAX_SIGNERS, certsOf, cleanDesign, newDesign, numberFor, publicDesign, sheetData } from "./studioData";
import styles from "./Studio.module.css";

const NS = ["internal/Certificates", "internal/Internal"];
const MAX_NAMES = 1000;
const CERTS_PER_BATCH = 200; // two writes each, under Firestore's 500
const NAME_HEADER = /nama|name|peserta|participant|اسم|الاسم/i;
const millis = (v) => (v && typeof v.toMillis === "function" ? v.toMillis() : 0); // Timestamps (null → 0)

/** The certificate preview, as wide as its box. */
function FitSheet({ data, placeholders }) {
  const box = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  return (
    <div ref={box} className={styles.fit}>
      {width > 0 && <CertificateSheet data={data} width={width} placeholders={placeholders} />}
    </div>
  );
}

/**
 * Certificate Studio: each event's certificate designed once (the Markaz
 * Tadarus template with its own words, logos and signers), then issued to the
 * participants and downloaded as print-ready PDFs.
 */
export default function Studio({ designs, certs, signers, notify, onIssue, onDelete }) {
  const { t } = useTranslation(NS);
  const [openId, setOpenId] = useState(null); // a design id, or "new"

  if (openId) {
    const design = openId === "new" ? null : designs?.find((d) => d.id === openId);
    if (openId !== "new" && !design) return <Loader size="sm" />;
    return (
      <DesignEditor
        key={openId}
        design={design}
        certs={certs}
        signers={signers}
        notify={notify}
        onIssue={onIssue}
        onDelete={onDelete}
        onClose={() => setOpenId(null)}
        onCreated={setOpenId}
      />
    );
  }

  const list = [...(designs || [])].sort((a, b) => millis(b.updatedAt || b.createdAt) - millis(a.updatedAt || a.createdAt));

  return (
    <div>
      <div className={styles.listHead}>
        <Button color="teal" leftSection={<IconPlus size={17} />} onClick={() => setOpenId("new")}>
          {t("studio.newDesign")}
        </Button>
      </div>

      {designs === null && (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      )}
      {designs?.length === 0 && (
        <button type="button" className={styles.emptyCard} onClick={() => setOpenId("new")}>
          <div className={styles.emptyPreview}>
            <FitSheet data={sheetData(newDesign(), null, signers)} placeholders />
          </div>
          <div>
            <Text fw={700}>{t("studio.emptyTitle")}</Text>
            <Text size="sm" c="dimmed">
              {t("studio.emptyText")}
            </Text>
          </div>
        </button>
      )}

      <div className={styles.grid}>
        {list.map((d) => {
          const count = certsOf(certs, d.id).length;
          return (
            <button type="button" key={d.id} className={styles.card} onClick={() => setOpenId(d.id)}>
              <FitSheet data={sheetData(d, null, signers)} placeholders />
              <div className={styles.cardText}>
                <b dir="auto">{d.name || t("studio.untitled")}</b>
                <span>{t("studio.participants", { count })}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DesignEditor({ design, certs, signers, notify, onIssue, onDelete, onClose, onCreated }) {
  const { t } = useTranslation(NS);
  const { user, email } = useAccess();
  const isNew = !design;
  const start = useMemo(() => (design ? { ...newDesign(), ...design } : newDesign()), [design]);
  const [form, setForm] = useState(start);
  const [section, setSection] = useState(isNew ? "text" : "people");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewId, setPreviewId] = useState(null);

  // the saved design changed elsewhere (or was just saved): take it in when nothing is being edited
  const saved = useMemo(() => JSON.stringify(cleanDesign(start)), [start]);
  const dirty = JSON.stringify(cleanDesign(form)) !== saved;
  const lastSaved = useRef(saved);
  useEffect(() => {
    if (saved !== lastSaved.current) {
      if (!dirty) setForm(start);
      lastSaved.current = saved;
    }
  }, [saved]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const issued = design ? certsOf(certs, design.id) : [];
  const previewCert = issued.find((c) => c.id === previewId) || null;

  const signerOptions = signers.filter((s) => s.active !== false).map((s) => ({ value: s.id, label: `${s.name} — ${s.position}` }));

  const save = async () => {
    setError("");
    const data = cleanDesign(form);
    if (!data.name) {
      setSection("text");
      return setError(t("studio.errors.noName"));
    }
    setSaving(true);
    try {
      const ref = isNew ? doc(collection(db, DESIGNS)) : doc(db, DESIGNS, design.id);
      // certificates already issued follow the design's event name, date and
      // signers, so the verification page shows what the printed page shows
      const follow = { program: data.name, eventDate: fromDateInput(data.eventDate), signerIds: data.signerIds };
      const stale = issued.filter(
        (c) => c.program !== follow.program || millis(c.eventDate) !== millis(follow.eventDate) || JSON.stringify(c.signerIds || []) !== JSON.stringify(follow.signerIds)
      );
      const update = (batch, auditId, list) =>
        list.forEach((c) => {
          const changes = { ...follow, updatedAt: Timestamp.now(), updatedBy: email || "unknown" };
          batch.update(doc(db, CERTS, c.id), { ...changes, auditId });
          batch.set(doc(db, PUBLIC, normCode(c.code)), { ...publicFields({ ...c, ...changes }), auditId }, { merge: true });
        });

      await auditedWrite(
        user,
        { area: "certificates", action: "design.save", target: ref.id, label: data.name, ...(stale.length && { details: { certificates: stale.length } }) },
        (batch, auditId) => {
          batch.set(
            ref,
            {
              ...data,
              ...(isNew && { createdAt: Timestamp.now(), createdBy: email || "unknown" }),
              updatedAt: Timestamp.now(),
              updatedBy: email || "unknown",
              auditId,
            },
            { merge: true }
          );
          // what a scan of one of its certificates shows
          batch.set(doc(db, DESIGNS_PUBLIC, ref.id), { ...publicDesign(data), auditId });
          update(batch, auditId, stale.slice(0, CERTS_PER_BATCH));
        }
      );
      for (let i = CERTS_PER_BATCH; i < stale.length; i += CERTS_PER_BATCH) {
        const part = stale.slice(i, i + CERTS_PER_BATCH);
        await auditedWrite(user, { area: "certificates", action: "cert.update", label: data.name, details: { count: part.length, codes: part.map((c) => c.code) } }, (batch, auditId) =>
          update(batch, auditId, part)
        );
      }
      notify("success", t("studio.saved"), data.name);
      if (isNew) onCreated(ref.id);
    } catch (err) {
      console.error("Could not save the design:", err);
      setError(t("studio.errors.failed"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      const shown = await getDoc(doc(db, DESIGNS_PUBLIC, design.id));
      await auditedWrite(user, { area: "certificates", action: "design.delete", target: design.id, label: design.name }, (batch, _auditId, markDelete) => {
        batch.delete(doc(db, DESIGNS, design.id));
        markDelete(`${DESIGNS}~${design.id}`, design.auditId);
        if (shown.exists()) {
          batch.delete(shown.ref);
          markDelete(`${DESIGNS_PUBLIC}~${design.id}`, shown.data().auditId);
        }
      });
      onClose();
    } catch (err) {
      console.error("Could not delete the design:", err);
      setError(t("studio.errors.failed"));
    }
  };

  return (
    <div className={styles.editor}>
      <div className={styles.bar}>
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} className={portal.flipRtl} />} onClick={onClose}>
          {t("studio.back")}
        </Button>
        <Group gap="xs">
          {dirty && !isNew && (
            <Badge color="orange" variant="light">
              {t("studio.unsaved")}
            </Badge>
          )}
          {!isNew && issued.length === 0 && (
            <Tooltip label={t("studio.deleteDesign")}>
              <ActionIcon variant="subtle" color="red" size="lg" onClick={() => setConfirmDelete(true)} aria-label={t("studio.deleteDesign")}>
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          )}
          <Button color="teal" leftSection={<IconDeviceFloppy size={17} />} loading={saving} disabled={!dirty && !isNew} onClick={save}>
            {t("studio.save")}
          </Button>
        </Group>
      </div>

      {error && (
        <Alert color="red" variant="light" mb="sm" withCloseButton onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <div className={styles.columns}>
        <div className={styles.side}>
          <SegmentedControl
            fullWidth
            value={section}
            onChange={setSection}
            data={[
              { value: "text", label: t("studio.sections.text") },
              { value: "look", label: t("studio.sections.look") },
              { value: "people", label: `${t("studio.sections.people")}${issued.length ? ` (${issued.length})` : ""}` },
            ]}
            mb="md"
          />

          {section === "text" && (
            <div className={styles.fields}>
              <TextInput label={t("studio.fields.name")} description={t("studio.fields.nameHint")} value={form.name} onChange={(e) => set("name")(e.currentTarget.value)} required dir="auto" />
              <TextInput label={t("studio.fields.title")} value={form.title} onChange={(e) => set("title")(e.currentTarget.value)} dir="auto" />
              <div>
                <div className={`${styles.pair} ${styles.numberPair}`}>
                  <TextInput label={t("studio.fields.numberLabel")} value={form.numberLabel} onChange={(e) => set("numberLabel")(e.currentTarget.value)} />
                  <TextInput label={t("studio.fields.numberPattern")} value={form.numberPattern} onChange={(e) => set("numberPattern")(e.currentTarget.value)} />
                </div>
                <Text size="xs" c="dimmed" mt={4}>
                  {t("studio.fields.numberPatternHint", { example: numberFor(form.numberPattern, 1) })}
                </Text>
              </div>
              <TextInput label={t("studio.fields.givenTo")} value={form.givenTo} onChange={(e) => set("givenTo")(e.currentTarget.value)} dir="auto" />
              <Textarea
                label={t("studio.fields.description")}
                description={t("studio.fields.descriptionHint")}
                value={form.description}
                onChange={(e) => set("description")(e.currentTarget.value)}
                autosize
                minRows={4}
                maxRows={9}
                dir="auto"
              />
              <div className={styles.pair}>
                <TextInput label={t("studio.fields.place")} value={form.place} onChange={(e) => set("place")(e.currentTarget.value)} dir="auto" />
                <TextInput type="date" label={t("studio.fields.issueDate")} value={form.issueDate} onChange={(e) => set("issueDate")(e.currentTarget.value)} />
              </div>
              <TextInput
                type="date"
                label={t("studio.fields.eventDate")}
                description={t("studio.fields.eventDateHint")}
                value={form.eventDate}
                onChange={(e) => set("eventDate")(e.currentTarget.value)}
              />
            </div>
          )}

          {section === "look" && <LookFields form={form} set={set} signerOptions={signerOptions} signers={signers} />}

          {section === "people" && (
            <People
              design={design}
              dirty={dirty}
              issued={issued}
              signers={signers}
              onIssue={onIssue}
              onDelete={onDelete}
              notify={notify}
              previewId={previewId}
              onPreview={(id) => setPreviewId((p) => (p === id ? null : id))}
            />
          )}
        </div>

        <div className={styles.previewCol}>
          <div className={styles.previewBox}>
            <FitSheet data={sheetData(form, previewCert, signers)} placeholders={!previewCert} />
          </div>
          <Text size="xs" c="dimmed" ta="center" mt={6} dir="auto">
            {previewCert ? t("studio.previewOf", { name: previewCert.name || previewCert.nameAr }) : t("studio.previewSample")}
          </Text>
        </div>
      </div>

      <Modal opened={confirmDelete} onClose={() => setConfirmDelete(false)} title={t("studio.deleteDesign")} centered size="sm">
        <Text size="sm">{t("studio.deleteText", { name: design?.name || "" })}</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setConfirmDelete(false)}>
            {t("common.cancel")}
          </Button>
          <Button color="red" onClick={remove}>
            {t("studio.deleteDesign")}
          </Button>
        </Group>
      </Modal>
    </div>
  );
}

function LookFields({ form, set, signerOptions, signers }) {
  const { t } = useTranslation(NS);
  const [logoError, setLogoError] = useState("");
  const addLogo = async (file) => {
    if (!file) return;
    setLogoError("");
    try {
      // logos keep their own background (no white removal); stored small, inside the design
      const url = await processImageFile(file, { removeWhite: false, maxChars: LOGO_IMAGE_CHARS });
      set("logos")([...(form.logos || []), url].slice(0, MAX_LOGOS));
    } catch {
      setLogoError(t("studio.fields.logoFailed"));
    }
  };
  const moveLogo = (i, by) => {
    const logos = [...form.logos];
    const [one] = logos.splice(i, 1);
    logos.splice(i + by, 0, one);
    set("logos")(logos);
  };

  const page = TEMPLATES.includes(form.template) ? form.template : "mint";

  return (
    <div className={styles.fields}>
      <div>
        <Text size="sm" fw={500}>
          {t("studio.fields.template")}
        </Text>
        <Text size="xs" c="dimmed" mb={8}>
          {t("studio.fields.templateHint")}
        </Text>
        <div className={styles.templates}>
          {TEMPLATES.map((key) => (
            <button type="button" key={key} className={`${styles.template} ${page === key ? styles.templateOn : ""}`} onClick={() => set("template")(key)} aria-pressed={page === key}>
              <FitSheet data={sheetData({ ...form, template: key }, null, signers)} placeholders />
              <span>{t(`studio.fields.templates.${key}`)}</span>
            </button>
          ))}
        </div>
      </div>

      <MultiSelect
        label={t("studio.fields.signers")}
        description={t("studio.fields.signersHint")}
        data={signerOptions}
        value={form.signerIds}
        onChange={set("signerIds")}
        maxValues={MAX_SIGNERS}
        clearable
        searchable
      />
      <Switch label={t("studio.fields.showInk")} checked={form.showInk !== false} onChange={(e) => set("showInk")(e.currentTarget.checked)} color="teal" />

      <div>
        <Text size="sm" fw={500} mb={6}>
          {t("studio.fields.qrPlace")}
        </Text>
        <SegmentedControl
          fullWidth
          value={form.qrPlace === "signature" ? "signature" : "corner"}
          onChange={set("qrPlace")}
          data={[
            { value: "corner", label: t("studio.fields.qrCorner") },
            { value: "signature", label: t("studio.fields.qrSignature") },
          ]}
        />
        <Text size="xs" c="dimmed" mt={4}>
          {form.qrPlace === "signature" ? t("studio.fields.qrSignatureHint") : t("studio.fields.qrCornerHint")}
        </Text>
      </div>

      <div>
        <Text size="sm" fw={500}>
          {t("studio.fields.logos")}
        </Text>
        <Text size="xs" c="dimmed" mb={8}>
          {t("studio.fields.logosHint")}
        </Text>
        <div className={styles.logos}>
          {(form.logos || []).map((src, i) => (
            <div key={i} className={styles.logo}>
              <img src={src} alt="" />
              <div className={styles.logoTools}>
                {i > 0 && (
                  <button type="button" onClick={() => moveLogo(i, -1)} aria-label="←">
                    ‹
                  </button>
                )}
                <button type="button" onClick={() => set("logos")(form.logos.filter((_, k) => k !== i))} aria-label={t("studio.fields.removeLogo")}>
                  <IconX size={12} />
                </button>
                {i < form.logos.length - 1 && (
                  <button type="button" onClick={() => moveLogo(i, 1)} aria-label="→">
                    ›
                  </button>
                )}
              </div>
            </div>
          ))}
          {(form.logos || []).length < MAX_LOGOS && (
            <FileButton onChange={addLogo} accept="image/png,image/jpeg,image/webp,image/svg+xml">
              {(props) => (
                <button type="button" className={styles.addLogo} {...props}>
                  <IconPhotoPlus size={20} />
                  <span>{t("studio.fields.addLogo")}</span>
                </button>
              )}
            </FileButton>
          )}
        </div>
        {logoError && (
          <Text size="xs" c="red" mt={4}>
            {logoError}
          </Text>
        )}
      </div>

      <Switch label={t("studio.fields.seal")} checked={form.seal !== false} onChange={(e) => set("seal")(e.currentTarget.checked)} color="teal" />
    </div>
  );
}

function People({ design, dirty, issued, signers, onIssue, onDelete, notify, previewId, onPreview }) {
  const { t } = useTranslation(NS);
  const [pasted, setPasted] = useState("");
  const [issuing, setIssuing] = useState(null); // progress 0..1
  const [making, setMaking] = useState(null); // { id, progress }
  const [error, setError] = useState("");

  const people = useMemo(() => tidyPeople(pasted.split(/\r?\n/).map((line) => line.split("\t"))).slice(0, MAX_NAMES), [pasted]);
  const key = (p) => `${p.name || ""}|${p.nameAr || ""}`.toLowerCase();
  const have = useMemo(() => new Set(issued.map(key)), [issued]);
  const fresh = people.filter((p) => !have.has(key(p)));

  if (!design) {
    return (
      <Alert color="blue" variant="light">
        {t("studio.people.saveFirst")}
      </Alert>
    );
  }

  const readExcel = async (file) => {
    if (!file) return;
    setError("");
    try {
      const { readSheet } = await import("read-excel-file/browser");
      const rows = (await readSheet(file)).filter((r) => r.some((c) => c !== null && String(c).trim() !== ""));
      if (!rows.length) throw new Error("empty");
      const heads = rows[0].map((c) => String(c ?? ""));
      const col = heads.findIndex((h) => NAME_HEADER.test(h));
      const body = col >= 0 ? rows.slice(1) : rows;
      const at = col >= 0 ? col : Math.max(0, rows[0].findIndex((c) => typeof c === "string"));
      const names = body.map((r) => String(r[at] ?? "").trim()).filter(Boolean);
      setPasted((p) => [p.trim(), ...names].filter(Boolean).join("\n"));
    } catch (err) {
      console.error("Could not read the Excel file:", err);
      setError(t("studio.people.excelFailed"));
    }
  };

  const issue = async () => {
    setError("");
    if (!fresh.length) return;
    const d = cleanDesign(design);
    const first = issued.reduce((max, c) => Math.max(max, c.seq || 0), 0) + 1;
    setIssuing(0);
    try {
      await onIssue(
        {
          people: fresh.map((p, i) => ({ ...p, seq: first + i, number: numberFor(d.numberPattern, first + i) })),
          program: d.name,
          programAr: "",
          lang: "id",
          eventDate: d.eventDate,
          signerIds: d.signerIds,
          designId: design.id,
        },
        setIssuing
      );
      notify("success", t("studio.people.issued", { count: fresh.length }), d.name);
      setPasted("");
    } catch (err) {
      console.error("Could not issue certificates:", err);
      setError(t("studio.errors.failed"));
    } finally {
      setIssuing(null);
    }
  };

  const fileName = (c) => safeFileName(`${c.name || c.nameAr} ${c.number || c.code}`);
  const download = async (list, kind) => {
    const id = kind === "one" ? list[0].id : kind;
    setMaking({ id, progress: 0 });
    setError("");
    try {
      const d = cleanDesign(design);
      const items = list.map((c) => sheetData(d, c, signers));
      const onProgress = (progress) => setMaking({ id, progress });
      if (kind === "zip") {
        saveBlob(await certificatesZip(items, list.map(fileName), onProgress), `${safeFileName(d.name)}.zip`);
      } else {
        saveBlob(await certificatesPdf(items, onProgress), `${kind === "one" ? fileName(list[0]) : safeFileName(d.name)}.pdf`);
      }
    } catch (err) {
      console.error("Could not make the PDF:", err);
      setError(t("studio.people.pdfFailed"));
    } finally {
      setMaking(null);
    }
  };
  const valid = issued.filter((c) => !isRevoked(c));

  return (
    <div className={styles.fields}>
      {dirty && (
        <Alert color="orange" variant="light">
          {t("studio.people.unsavedNote")}
        </Alert>
      )}

      <div className={styles.addBox}>
        <Group justify="space-between" mb={6}>
          <Text fw={600} size="sm">
            {t("studio.people.add")}
          </Text>
          <FileButton onChange={readExcel} accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
            {(props) => (
              <Button size="compact-sm" variant="light" leftSection={<IconFileSpreadsheet size={15} />} {...props}>
                {t("studio.people.excel")}
              </Button>
            )}
          </FileButton>
        </Group>
        <Textarea
          placeholder={t("studio.people.paste")}
          description={t("studio.people.pasteHint")}
          value={pasted}
          onChange={(e) => setPasted(e.currentTarget.value)}
          autosize
          minRows={3}
          maxRows={10}
          dir="auto"
        />
        {people.length > 0 && (
          <Text size="xs" c="dimmed" mt={6}>
            {t("studio.people.ready", { count: fresh.length })}
            {people.length > fresh.length ? ` · ${t("studio.people.skipped", { count: people.length - fresh.length })}` : ""}
          </Text>
        )}
        {issuing !== null && <Progress mt="xs" value={issuing * 100} striped animated />}
        <Button mt="sm" fullWidth color="teal" leftSection={<IconUsersPlus size={17} />} disabled={!fresh.length || dirty} loading={issuing !== null} onClick={issue}>
          {t("studio.people.issue", { count: fresh.length })}
        </Button>
      </div>

      {error && (
        <Alert color="red" variant="light" withCloseButton onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <div>
        <Group justify="space-between" mb={6}>
          <Text fw={600} size="sm">
            {t("studio.people.list")} · {issued.length}
          </Text>
          {valid.length > 0 && (
            <Group gap={6}>
              <Button size="compact-sm" variant="light" color="teal" leftSection={<IconDownload size={15} />} loading={making?.id === "all"} disabled={!!making} onClick={() => download(valid, "all")}>
                {t("studio.people.pdfAll")}
              </Button>
              <Button size="compact-sm" variant="subtle" leftSection={<IconFileZip size={15} />} loading={making?.id === "zip"} disabled={!!making} onClick={() => download(valid, "zip")}>
                {t("studio.people.zip")}
              </Button>
            </Group>
          )}
        </Group>
        {(making?.id === "all" || making?.id === "zip") && (
          <div className={styles.making}>
            <Text size="xs" c="dimmed">
              {t("studio.people.making", { percent: Math.round(making.progress * 100) })}
            </Text>
            <Progress value={making.progress * 100} size="sm" />
          </div>
        )}
        {issued.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t("studio.people.none")}
          </Text>
        ) : (
          <ul className={styles.people}>
            {issued.map((c) => (
              <li key={c.id} className={`${previewId === c.id ? styles.personOn : ""} ${isRevoked(c) ? styles.personOff : ""}`}>
                <span className={styles.seq}>{c.seq || "·"}</span>
                <div className={styles.personText}>
                  <b dir="auto">{c.name || c.nameAr}</b>
                  <span>
                    {c.number} · <bdi>{c.code}</bdi>
                    {isRevoked(c) && (
                      <Badge size="xs" color="red" variant="light" ml={6}>
                        {t("studio.people.revoked")}
                      </Badge>
                    )}
                  </span>
                </div>
                <Tooltip label={t("studio.people.preview")}>
                  <ActionIcon variant={previewId === c.id ? "light" : "subtle"} color="teal" onClick={() => onPreview(c.id)} aria-label={t("studio.people.preview")}>
                    <IconEye size={17} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={t("studio.people.pdf")}>
                  <ActionIcon variant="subtle" color="gray" loading={making?.id === c.id} disabled={!!making || isRevoked(c)} onClick={() => download([c], "one")} aria-label={t("studio.people.pdf")}>
                    <IconFileTypePdf size={17} />
                  </ActionIcon>
                </Tooltip>
                {onDelete && (
                  <Tooltip label={t("studio.people.delete")}>
                    <ActionIcon variant="subtle" color="red" disabled={!!making} onClick={() => onDelete(c)} aria-label={t("studio.people.delete")}>
                      <IconTrash size={17} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
