// src/.../SignerManager.jsx - manage signatures & stamps shown on verified certificates
import React, { useEffect, useState } from "react";
import {
    Button,
    TextInput,
    Switch,
    Group,
    Text,
    Modal,
    Badge,
    FileButton,
    ActionIcon,
    Tooltip,
    Loader,
    Center,
    Chip,
    SegmentedControl,
} from "@mantine/core";
import {
    IconUpload,
    IconSignature,
    IconStar,
    IconStarFilled,
    IconPencil,
    IconTrash,
    IconArrowUp,
    IconArrowDown,
    IconEye,
    IconEyeOff,
    IconX,
    IconPlus,
} from "@tabler/icons-react";
import { collection, doc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { db, auth } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import {
    SIGNERS_COLLECTION,
    SIGNER_LANGS,
    SIGNER_TEXT,
    signerTextKey,
    signerInLang,
    defaultLangsOf,
    processImageFile,
    fetchAllSigners,
} from "./signerUtils";
import SignatureBlock from "./SignatureBlock";
import styles from "./SignerManager.module.css";

// every text field in each language: name, nameEn, nameAr, position, …
const TEXT_KEYS = SIGNER_LANGS.flatMap((l) => SIGNER_TEXT.map((f) => signerTextKey(f, l)));
// the languages besides Indonesian a signer has its own name or position in
const translatedLangs = (s) => ["en", "ar"].filter((l) => s[signerTextKey("name", l)] || s[signerTextKey("position", l)]);

const EMPTY_FORM = {
    ...Object.fromEntries(TEXT_KEYS.map((k) => [k, ""])),
    signatureImg: "",
    stampImg: "",
    isDefault: true,
    defaultLangs: SIGNER_LANGS,
    active: true,
};
const LANG_LABELS = { id: "ID", en: "EN", ar: "AR" };

const NS = ["internal/Certificates", "internal/Internal"];
const MAX_LEN = 120;
const clean = (s) => s.trim().replace(/[<>]/g, "").substring(0, MAX_LEN);

/* Upload box for a single image (signature or stamp) */
const ImageSlot = ({ label, hint, value, onChange, removeWhite, onError }) => {
    const { t } = useTranslation(NS);
    const [busy, setBusy] = useState(false);

    const handleFile = async (file) => {
        if (!file) return;
        setBusy(true);
        try {
            onChange(await processImageFile(file, { removeWhite }));
        } catch (err) {
            onError(err.message === "not-image" ? t("signers.notImage") : t("signers.badImage"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={styles.slot}>
            <Text fw={600} size="sm" mb={4}>{label}</Text>
            <div className={styles.slotPreview}>
                {busy ? (
                    <Loader size="sm" />
                ) : value ? (
                    <>
                        <img src={value} alt={label} />
                        <ActionIcon
                            className={styles.slotClear}
                            size="sm"
                            radius="xl"
                            variant="filled"
                            color="gray"
                            onClick={() => onChange("")}
                            title={t("signers.removeImage")}
                        >
                            <IconX size={12} />
                        </ActionIcon>
                    </>
                ) : (
                    <Text size="xs" c="dimmed" ta="center">{hint}</Text>
                )}
            </div>
            <FileButton onChange={handleFile} accept="image/png,image/jpeg,image/webp">
                {(props) => (
                    <Button {...props} variant="light" size="xs" fullWidth mt={6} leftSection={<IconUpload size={14} />}>
                        {value ? t("signers.replace") : t("signers.upload")}
                    </Button>
                )}
            </FileButton>
        </div>
    );
};

const SignerManager = ({ notify, onSignersChange }) => {
    const { t } = useTranslation(NS);
    const { user } = useAccess();
    const signerEntry = (action, signer, details) => ({
        area: "certificates",
        action,
        target: signer.id || "",
        label: [signer.name, signer.position].filter(Boolean).join(" — "),
        details,
    });
    const [signers, setSigners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [removeWhite, setRemoveWhite] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [textLang, setTextLang] = useState("id");
    const key = (field) => signerTextKey(field, textLang);

    const load = async () => {
        setLoading(true);
        try {
            const list = await fetchAllSigners();
            setSigners(list);
            onSignersChange?.(list);
        } catch (err) {
            console.error("Error loading signers:", err);
            notify("error", t("errors.failedTitle"), t("signers.loadFailed"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setTextLang("id");
    };

    const startEdit = (signer) => {
        setEditingId(signer.id);
        setForm({
            ...Object.fromEntries(TEXT_KEYS.map((k) => [k, signer[k] || ""])),
            signatureImg: signer.signatureImg || "",
            stampImg: signer.stampImg || "",
            isDefault: !!signer.isDefault,
            defaultLangs: signer.isDefault ? defaultLangsOf(signer) : SIGNER_LANGS,
            active: signer.active !== false,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSave = async () => {
        const data = {
            ...Object.fromEntries(TEXT_KEYS.map((k) => [k, clean(form[k])])),
            signatureImg: form.signatureImg,
            stampImg: form.stampImg,
            // a default with no language picked is no default at all
            isDefault: form.isDefault && form.defaultLangs.length > 0,
            defaultLangs: form.isDefault ? SIGNER_LANGS.filter((l) => form.defaultLangs.includes(l)) : [],
            active: form.active,
        };

        if (!data.name || !data.position) {
            setTextLang("id");
            notify("warning", t("signers.missingTitle"), t("signers.missingDetails"));
            return;
        }
        if (!data.signatureImg && !data.stampImg) {
            notify("warning", t("signers.missingTitle"), t("signers.missingImage"));
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                const before = signers.find((s) => s.id === editingId) || {};
                const changed = Object.keys(data).filter((k) => JSON.stringify(before[k] ?? "") !== JSON.stringify(data[k]));
                await auditedWrite(user, signerEntry("signer.update", { ...data, id: editingId }, { changed }), (batch, auditId) =>
                    batch.update(doc(db, SIGNERS_COLLECTION, editingId), { ...data, auditId, updatedAt: new Date() })
                );
                notify("success", t("signers.updated"), data.name);
            } else {
                const ref = doc(collection(db, SIGNERS_COLLECTION));
                await auditedWrite(user, signerEntry("signer.create", { ...data, id: ref.id }), (batch, auditId) =>
                    batch.set(ref, {
                        ...data,
                        auditId,
                        order: signers.length ? Math.max(...signers.map((s) => s.order || 0)) + 1 : 1,
                        createdAt: new Date(),
                        createdBy: auth.currentUser?.email || "",
                    })
                );
                notify("success", t("signers.added"), data.name);
            }
            resetForm();
            await load();
        } catch (err) {
            console.error("Error saving signer:", err);
            notify("error", t("errors.failedTitle"), t("errors.failed"));
        } finally {
            setSaving(false);
        }
    };

    const toggleField = async (signer, field) => {
        const value = field === "active" ? signer.active === false : !signer.isDefault;
        // the star makes a signer the default for every language (the form picks fewer)
        const patch = field === "isDefault" ? { isDefault: value, defaultLangs: value ? SIGNER_LANGS : [] } : { [field]: value };
        try {
            const auditId = await auditedWrite(user, signerEntry("signer.update", signer, { changed: [field], [field]: value }), (batch, id) =>
                batch.update(doc(db, SIGNERS_COLLECTION, signer.id), { ...patch, auditId: id })
            );
            const next = signers.map((s) => (s.id === signer.id ? { ...s, ...patch, auditId } : s));
            setSigners(next);
            onSignersChange?.(next);
        } catch (err) {
            console.error(err);
            notify("error", t("errors.failedTitle"), t("errors.failed"));
        }
    };

    const move = async (index, dir) => {
        const target = index + dir;
        if (target < 0 || target >= signers.length) return;
        const next = [...signers];
        [next[index], next[target]] = [next[target], next[index]];
        try {
            const auditId = await auditedWrite(
                user,
                { area: "certificates", action: "signer.reorder", details: { order: next.map((s) => s.name) } },
                (batch, id) => next.forEach((s, i) => batch.update(doc(db, SIGNERS_COLLECTION, s.id), { order: i + 1, auditId: id }))
            );
            const ordered = next.map((s, i) => ({ ...s, order: i + 1, auditId }));
            setSigners(ordered);
            onSignersChange?.(ordered);
        } catch (err) {
            console.error(err);
            notify("error", t("errors.failedTitle"), t("errors.failed"));
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setSaving(true);
        try {
            await auditedWrite(user, signerEntry("signer.delete", deleteTarget), (batch, _auditId, markDelete) => {
                batch.delete(doc(db, SIGNERS_COLLECTION, deleteTarget.id));
                markDelete(`certificate_signers~${deleteTarget.id}`, deleteTarget.auditId);
            });
            if (editingId === deleteTarget.id) resetForm();
            notify("success", t("signers.removed"), deleteTarget.name);
            setDeleteTarget(null);
            await load();
        } catch (err) {
            console.error(err);
            notify("error", t("errors.failedTitle"), t("errors.failed"));
        } finally {
            setSaving(false);
        }
    };

    const shown = signerInLang(form, textLang);
    const preview = {
        name: shown.name || t("signers.fullName"),
        position: shown.position || t("signers.position"),
        organization: shown.organization,
        signatureImg: form.signatureImg,
        stampImg: form.stampImg,
    };

    return (
        <div className={styles.wrapper}>
            {/* ---------- FORM + LIVE PREVIEW ---------- */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <IconSignature size={22} />
                    <div>
                        <Text fw={700}>{editingId ? t("signers.editTitle") : t("signers.addTitle")}</Text>
                        <Text size="xs" c="dimmed">
                            {t("signers.intro")}
                        </Text>
                    </div>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.fields}>
                        <div>
                            <SegmentedControl
                                fullWidth
                                value={textLang}
                                onChange={setTextLang}
                                data={SIGNER_LANGS.map((l) => ({
                                    value: l,
                                    label: `${t(`signers.lang.${l}`)}${translatedLangs(form).includes(l) ? " ✓" : ""}`,
                                }))}
                            />
                            <Text size="xs" c="dimmed" mt={4}>
                                {textLang === "id" ? t("signers.textMain") : t("signers.textOptional")}
                            </Text>
                        </div>
                        {/* in English and Arabic the empty boxes show the Indonesian they fall back to */}
                        <TextInput
                            label={t("signers.fullName")}
                            placeholder={textLang === "id" ? t("signers.fullNamePlaceholder") : form.name}
                            value={form[key("name")]}
                            onChange={(e) => setForm({ ...form, [key("name")]: e.target.value })}
                            maxLength={MAX_LEN}
                            required={textLang === "id"}
                            dir={textLang === "ar" ? "rtl" : "auto"}
                        />
                        <TextInput
                            label={t("signers.position")}
                            placeholder={textLang === "id" ? t("signers.positionPlaceholder") : form.position}
                            value={form[key("position")]}
                            onChange={(e) => setForm({ ...form, [key("position")]: e.target.value })}
                            maxLength={MAX_LEN}
                            required={textLang === "id"}
                            dir={textLang === "ar" ? "rtl" : "auto"}
                        />
                        <TextInput
                            label={t("signers.organization")}
                            placeholder={textLang === "id" ? "Markaz Tadarus Indonesia" : form.organization}
                            value={form[key("organization")]}
                            onChange={(e) => setForm({ ...form, [key("organization")]: e.target.value })}
                            maxLength={MAX_LEN}
                            dir={textLang === "ar" ? "rtl" : "auto"}
                        />

                        <div className={styles.slots}>
                            <ImageSlot
                                label={t("signers.signature")}
                                hint={t("signers.signatureHint")}
                                value={form.signatureImg}
                                onChange={(v) => setForm((f) => ({ ...f, signatureImg: v }))}
                                removeWhite={removeWhite}
                                onError={(m) => notify("error", t("signers.imageError"), m)}
                            />
                            <ImageSlot
                                label={t("signers.stamp")}
                                hint={t("signers.stampHint")}
                                value={form.stampImg}
                                onChange={(v) => setForm((f) => ({ ...f, stampImg: v }))}
                                removeWhite={removeWhite}
                                onError={(m) => notify("error", t("signers.imageError"), m)}
                            />
                        </div>

                        <Switch
                            label={t("signers.removeWhite")}
                            description={t("signers.removeWhiteHint")}
                            checked={removeWhite}
                            onChange={(e) => setRemoveWhite(e.currentTarget.checked)}
                        />
                        <Switch
                            label={t("signers.default")}
                            description={t("signers.defaultHint")}
                            checked={form.isDefault}
                            onChange={(e) => setForm({ ...form, isDefault: e.currentTarget.checked })}
                        />
                        {form.isDefault && (
                            <div className={styles.langPick}>
                                <Text size="sm" fw={600}>{t("signers.defaultLangs")}</Text>
                                <Text size="xs" c="dimmed" mb={6}>{t("signers.defaultLangsHint")}</Text>
                                <Chip.Group multiple value={form.defaultLangs} onChange={(v) => setForm({ ...form, defaultLangs: v })}>
                                    <Group gap="xs">
                                        {SIGNER_LANGS.map((l) => (
                                            <Chip key={l} value={l} color="yellow" variant="light">
                                                {t(`signers.lang.${l}`)}
                                            </Chip>
                                        ))}
                                    </Group>
                                </Chip.Group>
                                {form.defaultLangs.length === 0 && (
                                    <Text size="xs" c="orange" mt={6}>{t("signers.defaultLangsNone")}</Text>
                                )}
                            </div>
                        )}
                        <Switch
                            label={t("signers.active")}
                            description={t("signers.activeHint")}
                            checked={form.active}
                            onChange={(e) => setForm({ ...form, active: e.currentTarget.checked })}
                        />

                        <Group mt="xs">
                            <Button
                                onClick={handleSave}
                                loading={saving}
                                className={styles.primaryBtn}
                                leftSection={editingId ? <IconPencil size={16} /> : <IconPlus size={16} />}
                            >
                                {editingId ? t("common.save") : t("signers.addButton")}
                            </Button>
                            {editingId && (
                                <Button variant="default" onClick={resetForm}>{t("common.cancel")}</Button>
                            )}
                        </Group>
                    </div>

                    <div className={styles.previewPane}>
                        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">
                            {t("signers.preview")}
                        </Text>
                        <div className={styles.previewPaper}>
                            <SignatureBlock signer={preview} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ---------- SIGNER LIST ---------- */}
            <div className={styles.card}>
                <Group justify="space-between" mb="sm">
                    <Text fw={700}>{t("signers.listTitle", { count: signers.length })}</Text>
                    <Text size="xs" c="dimmed">{t("signers.orderHint")}</Text>
                </Group>

                {loading ? (
                    <Center p="lg"><Loader /></Center>
                ) : signers.length === 0 ? (
                    <Text c="dimmed" ta="center" p="lg">
                        {t("signers.empty")}
                    </Text>
                ) : (
                    <div className={styles.list}>
                        {signers.map((s, i) => (
                            <div
                                key={s.id}
                                className={`${styles.row} ${s.active === false ? styles.inactive : ""}`}
                            >
                                <div className={styles.rowImages}>
                                    {s.signatureImg && <img src={s.signatureImg} alt={t("signers.signature")} />}
                                    {s.stampImg && <img src={s.stampImg} alt={t("signers.stamp")} />}
                                </div>
                                <div className={styles.rowInfo}>
                                    <Text fw={700} size="sm">
                                        {s.name}
                                        {s.nameAr && <span dir="rtl" className={styles.altName}>{s.nameAr}</span>}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        {s.position}{s.organization ? ` · ${s.organization}` : ""}
                                    </Text>
                                    <Group gap={4} mt={4}>
                                        {s.isDefault && (
                                            <Badge size="xs" color="yellow">
                                                {t("signers.defaultBadge")} · {defaultLangsOf(s).map((l) => LANG_LABELS[l]).join(" ")}
                                            </Badge>
                                        )}
                                        {translatedLangs(s).length > 0 && (
                                            <Badge size="xs" color="gray" variant="light">
                                                {["ID", ...translatedLangs(s).map((l) => LANG_LABELS[l])].join(" ")}
                                            </Badge>
                                        )}
                                        {s.active === false && <Badge size="xs" color="gray">{t("signers.hiddenBadge")}</Badge>}
                                    </Group>
                                </div>
                                <Group gap={4} className={styles.rowActions} wrap="nowrap">
                                    <Tooltip label={t("signers.moveUp")}>
                                        <ActionIcon variant="subtle" disabled={i === 0} onClick={() => move(i, -1)}>
                                            <IconArrowUp size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label={t("signers.moveDown")}>
                                        <ActionIcon variant="subtle" disabled={i === signers.length - 1} onClick={() => move(i, 1)}>
                                            <IconArrowDown size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label={s.isDefault ? t("signers.unsetDefault") : t("signers.setDefault")}>
                                        <ActionIcon variant="subtle" color="yellow" onClick={() => toggleField(s, "isDefault")}>
                                            {s.isDefault ? <IconStarFilled size={16} /> : <IconStar size={16} />}
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label={s.active === false ? t("signers.show") : t("signers.hide")}>
                                        <ActionIcon variant="subtle" color="gray" onClick={() => toggleField(s, "active")}>
                                            {s.active === false ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label={t("row.edit")}>
                                        <ActionIcon variant="subtle" color="blue" onClick={() => startEdit(s)}>
                                            <IconPencil size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label={t("row.delete")}>
                                        <ActionIcon variant="subtle" color="red" onClick={() => setDeleteTarget(s)}>
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t("signers.deleteTitle")} centered size="sm">
                <Text size="sm" mb="md">
                    <strong>{deleteTarget?.name}</strong> — {t("signers.deleteText")}
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setDeleteTarget(null)}>{t("common.cancel")}</Button>
                    <Button color="red" loading={saving} onClick={confirmDelete}>{t("row.delete")}</Button>
                </Group>
            </Modal>
        </div>
    );
};

export default SignerManager;
