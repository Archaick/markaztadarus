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
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    writeBatch,
} from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import { SIGNERS_COLLECTION, processImageFile, fetchAllSigners } from "./signerUtils";
import SignatureBlock from "./SignatureBlock";
import styles from "./SignerManager.module.css";

const EMPTY_FORM = {
    name: "",
    position: "",
    organization: "",
    signatureImg: "",
    stampImg: "",
    isDefault: true,
    active: true,
};

const MAX_LEN = 120;
const clean = (s) => s.trim().replace(/[<>]/g, "").substring(0, MAX_LEN);

/* Upload box for a single image (signature or stamp) */
const ImageSlot = ({ label, hint, value, onChange, removeWhite, onError }) => {
    const [busy, setBusy] = useState(false);

    const handleFile = async (file) => {
        if (!file) return;
        setBusy(true);
        try {
            onChange(await processImageFile(file, { removeWhite }));
        } catch (err) {
            onError(err.message);
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
                            title="Remove image"
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
                        {value ? "Replace" : "Upload"}
                    </Button>
                )}
            </FileButton>
        </div>
    );
};

const SignerManager = ({ notify, onSignersChange }) => {
    const [signers, setSigners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [removeWhite, setRemoveWhite] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const list = await fetchAllSigners();
            setSigners(list);
            onSignersChange?.(list);
        } catch (err) {
            console.error("Error loading signers:", err);
            notify("error", "Failed to Load", "Could not load signers. Check Firestore rules.");
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
    };

    const startEdit = (signer) => {
        setEditingId(signer.id);
        setForm({
            name: signer.name || "",
            position: signer.position || "",
            organization: signer.organization || "",
            signatureImg: signer.signatureImg || "",
            stampImg: signer.stampImg || "",
            isDefault: !!signer.isDefault,
            active: signer.active !== false,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSave = async () => {
        const data = {
            name: clean(form.name),
            position: clean(form.position),
            organization: clean(form.organization),
            signatureImg: form.signatureImg,
            stampImg: form.stampImg,
            isDefault: form.isDefault,
            active: form.active,
        };

        if (!data.name || !data.position) {
            notify("warning", "Missing Details", "Name and position are required.");
            return;
        }
        if (!data.signatureImg && !data.stampImg) {
            notify("warning", "Missing Image", "Upload at least a signature or a stamp.");
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                await updateDoc(doc(db, SIGNERS_COLLECTION, editingId), {
                    ...data,
                    updatedAt: new Date(),
                });
                notify("success", "Signer Updated", `${data.name} was updated.`);
            } else {
                await addDoc(collection(db, SIGNERS_COLLECTION), {
                    ...data,
                    order: signers.length ? Math.max(...signers.map((s) => s.order || 0)) + 1 : 1,
                    createdAt: new Date(),
                    createdBy: auth.currentUser?.email || "",
                });
                notify("success", "Signer Added", `${data.name} can now sign certificates.`);
            }
            resetForm();
            await load();
        } catch (err) {
            console.error("Error saving signer:", err);
            notify(
                "error",
                "Save Failed",
                err.code === "permission-denied"
                    ? "Permission denied. Deploy the updated Firestore rules."
                    : err.message || "Could not save signer."
            );
        } finally {
            setSaving(false);
        }
    };

    const toggleField = async (signer, field) => {
        const value = field === "active" ? signer.active === false : !signer.isDefault;
        try {
            await updateDoc(doc(db, SIGNERS_COLLECTION, signer.id), { [field]: value });
            const next = signers.map((s) => (s.id === signer.id ? { ...s, [field]: value } : s));
            setSigners(next);
            onSignersChange?.(next);
        } catch (err) {
            console.error(err);
            notify("error", "Update Failed", "Could not update signer.");
        }
    };

    const move = async (index, dir) => {
        const target = index + dir;
        if (target < 0 || target >= signers.length) return;
        const next = [...signers];
        [next[index], next[target]] = [next[target], next[index]];
        try {
            const batch = writeBatch(db);
            next.forEach((s, i) => batch.update(doc(db, SIGNERS_COLLECTION, s.id), { order: i + 1 }));
            await batch.commit();
            const ordered = next.map((s, i) => ({ ...s, order: i + 1 }));
            setSigners(ordered);
            onSignersChange?.(ordered);
        } catch (err) {
            console.error(err);
            notify("error", "Reorder Failed", "Could not change the order.");
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setSaving(true);
        try {
            await deleteDoc(doc(db, SIGNERS_COLLECTION, deleteTarget.id));
            if (editingId === deleteTarget.id) resetForm();
            notify("success", "Signer Removed", `${deleteTarget.name} was removed.`);
            setDeleteTarget(null);
            await load();
        } catch (err) {
            console.error(err);
            notify("error", "Delete Failed", "Could not delete signer.");
        } finally {
            setSaving(false);
        }
    };

    const preview = {
        name: form.name || "Full Name",
        position: form.position || "Position",
        organization: form.organization,
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
                        <Text fw={700}>{editingId ? "Edit Signer" : "Add a Signer"}</Text>
                        <Text size="xs" c="dimmed">
                            Signatures and stamps appear on the page people see when they scan a certificate QR code.
                        </Text>
                    </div>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.fields}>
                        <TextInput
                            label="Full name"
                            placeholder="e.g. Dr. Ahmad Fauzi, Lc., M.A."
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            maxLength={MAX_LEN}
                            required
                        />
                        <TextInput
                            label="Position / title"
                            placeholder="e.g. Director"
                            value={form.position}
                            onChange={(e) => setForm({ ...form, position: e.target.value })}
                            maxLength={MAX_LEN}
                            required
                        />
                        <TextInput
                            label="Organization (optional)"
                            placeholder="e.g. Markaz Tadarus Indonesia"
                            value={form.organization}
                            onChange={(e) => setForm({ ...form, organization: e.target.value })}
                            maxLength={MAX_LEN}
                        />

                        <div className={styles.slots}>
                            <ImageSlot
                                label="Signature"
                                hint="Photo or scan of the signature"
                                value={form.signatureImg}
                                onChange={(v) => setForm((f) => ({ ...f, signatureImg: v }))}
                                removeWhite={removeWhite}
                                onError={(m) => notify("error", "Image Error", m)}
                            />
                            <ImageSlot
                                label="Stamp / seal"
                                hint="Official stamp image"
                                value={form.stampImg}
                                onChange={(v) => setForm((f) => ({ ...f, stampImg: v }))}
                                removeWhite={removeWhite}
                                onError={(m) => notify("error", "Image Error", m)}
                            />
                        </div>

                        <Switch
                            label="Remove white background from uploads"
                            description="Makes scanned paper transparent so ink sits cleanly on the page"
                            checked={removeWhite}
                            onChange={(e) => setRemoveWhite(e.currentTarget.checked)}
                        />
                        <Switch
                            label="Default signer"
                            description="Shown automatically on certificates that don't pick specific signers (including existing ones)"
                            checked={form.isDefault}
                            onChange={(e) => setForm({ ...form, isDefault: e.currentTarget.checked })}
                        />
                        <Switch
                            label="Active"
                            description="Inactive signers are hidden from every certificate"
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
                                {editingId ? "Save Changes" : "Add Signer"}
                            </Button>
                            {editingId && (
                                <Button variant="default" onClick={resetForm}>Cancel</Button>
                            )}
                        </Group>
                    </div>

                    <div className={styles.previewPane}>
                        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">
                            Live preview (as seen after scanning)
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
                    <Text fw={700}>Signers ({signers.length})</Text>
                    <Text size="xs" c="dimmed">Order here = order on the verification page</Text>
                </Group>

                {loading ? (
                    <Center p="lg"><Loader /></Center>
                ) : signers.length === 0 ? (
                    <Text c="dimmed" ta="center" p="lg">
                        No signers yet. Add one above — until then, the verification page shows the standard stamp.
                    </Text>
                ) : (
                    <div className={styles.list}>
                        {signers.map((s, i) => (
                            <div
                                key={s.id}
                                className={`${styles.row} ${s.active === false ? styles.inactive : ""}`}
                            >
                                <div className={styles.rowImages}>
                                    {s.signatureImg && <img src={s.signatureImg} alt="signature" />}
                                    {s.stampImg && <img src={s.stampImg} alt="stamp" />}
                                </div>
                                <div className={styles.rowInfo}>
                                    <Text fw={700} size="sm">{s.name}</Text>
                                    <Text size="xs" c="dimmed">
                                        {s.position}{s.organization ? ` · ${s.organization}` : ""}
                                    </Text>
                                    <Group gap={4} mt={4}>
                                        {s.isDefault && <Badge size="xs" color="yellow">Default</Badge>}
                                        {s.active === false && <Badge size="xs" color="gray">Hidden</Badge>}
                                    </Group>
                                </div>
                                <Group gap={4} className={styles.rowActions} wrap="nowrap">
                                    <Tooltip label="Move up">
                                        <ActionIcon variant="subtle" disabled={i === 0} onClick={() => move(i, -1)}>
                                            <IconArrowUp size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Move down">
                                        <ActionIcon variant="subtle" disabled={i === signers.length - 1} onClick={() => move(i, 1)}>
                                            <IconArrowDown size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label={s.isDefault ? "Remove as default" : "Make default"}>
                                        <ActionIcon variant="subtle" color="yellow" onClick={() => toggleField(s, "isDefault")}>
                                            {s.isDefault ? <IconStarFilled size={16} /> : <IconStar size={16} />}
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label={s.active === false ? "Show" : "Hide"}>
                                        <ActionIcon variant="subtle" color="gray" onClick={() => toggleField(s, "active")}>
                                            {s.active === false ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Edit">
                                        <ActionIcon variant="subtle" color="blue" onClick={() => startEdit(s)}>
                                            <IconPencil size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Delete">
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

            <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete signer?" centered size="sm">
                <Text size="sm" mb="md">
                    <strong>{deleteTarget?.name}</strong> will no longer appear on any certificate. To keep them for
                    later, hide them instead.
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button color="red" loading={saving} onClick={confirmDelete}>Delete</Button>
                </Group>
            </Modal>
        </div>
    );
};

export default SignerManager;
