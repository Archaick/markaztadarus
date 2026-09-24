// src/.../Admin.jsx - Final Refactored Version
import React, { useState, useEffect } from "react";
import styles from "./Admin.module.css";
import { db, auth } from "../../../firebaseConfig";
import QrStats from "./QrStats";
import BackupManager from "./BackupManager";
import SignerManager from "./SignerManager";
import { resolveCertificateSigners } from "./signerUtils";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    query,
    orderBy,
    startAfter,
    limit as firestoreLimit,
    where,
} from "firebase/firestore";
import {
    Button,
    TextInput,
    Table,
    Title,
    Group,
    Image,
    Pagination,
    Modal,
    Text,
    PasswordInput,
    Alert,
    Tabs,
    MultiSelect,
    Badge,
} from "@mantine/core";
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle, IconDownload, IconTrash, IconCertificate, IconSignature } from '@tabler/icons-react';
import QRCode from "qrcode";
import LoadingOverlay from "../LoadingOverlay";
import {
    reauthenticateWithCredential,
    EmailAuthProvider,
    signOut,
} from "firebase/auth";

const ITEMS_PER_PAGE = 5;
const MAX_RETRIES = 3;
const INPUT_MAX_LENGTH = 200;

const Admin = () => {
    const [certificates, setCertificates] = useState([]);
    const [newCert, setNewCert] = useState({ name: "", program: "", signerIds: [] });
    const [searchTerm, setSearchTerm] = useState("");
    const [qrCodes, setQrCodes] = useState({});
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [lastVisible, setLastVisible] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [reauthPassword, setReauthPassword] = useState("");
    const [notification, setNotification] = useState(null);
    const [activeTab, setActiveTab] = useState("certificates");
    const [signers, setSigners] = useState([]);
    const [signerEdit, setSignerEdit] = useState(null); // { cert, signerIds }

    const certCollection = collection(db, "certificates");

    // ========== NOTIFICATION SYSTEM ==========
    const showNotification = (type, title, message) => {
        const config = {
            success: { icon: <IconCheck size={20} />, color: "teal" },
            error: { icon: <IconX size={20} />, color: "red" },
            warning: { icon: <IconAlertTriangle size={20} />, color: "yellow" },
            info: { icon: <IconInfoCircle size={20} />, color: "blue" },
        };

        setNotification({ ...config[type], title, message });
        setTimeout(() => setNotification(null), type === "error" ? 5000 : 4000);
    };

    // ========== CODE GENERATION ==========
    const generateSecureCode = () => {
        const array = new Uint8Array(6);
        crypto.getRandomValues(array);
        return Array.from(array)
            .map((b) => b.toString(36).toUpperCase())
            .join("")
            .substring(0, 8);
    };

    const isCodeUnique = async (code) => {
        try {
            const q = query(certCollection, where("code", "==", code));
            const snapshot = await getDocs(q);
            return snapshot.empty;
        } catch (err) {
            console.error("Error checking code uniqueness:", err);
            return false;
        }
    };

    const generateUniqueCode = async () => {
        for (let i = 0; i < MAX_RETRIES; i++) {
            const code = generateSecureCode();
            if (await isCodeUnique(code)) return code;
        }
        throw new Error("Failed to generate unique code after multiple attempts");
    };

    // ========== UTILITIES ==========
    const sanitizeInput = (input) =>
        input.trim().replace(/[<>]/g, "").substring(0, INPUT_MAX_LENGTH);

    const sanitizeFilename = (s) =>
        s.replace(/[^\w\-_. ]+/g, "").replace(/\s+/g, "_");

    const verifyAdminAuth = () => {
        const user = auth?.currentUser;
        if (!user) {
            showNotification("error", "Authentication Required", "Please log in again. Redirecting...");
            setTimeout(() => signOut(auth).then(() => (window.location.href = "/cert-login")), 2000);
            return false;
        }
        return true;
    };

    // ========== QR CODE GENERATION ==========
    const generateQRCodes = async (certData) => {
        try {
            const results = await Promise.all(
                certData.map(async (cert) => {
                    const qrDataUrl = await QRCode.toDataURL(
                        `${window.location.origin}/verify/${cert.code}`,
                        { errorCorrectionLevel: "H", margin: 2, width: 300 }
                    );
                    return [cert.id, qrDataUrl];
                })
            );
            return Object.fromEntries(results);
        } catch (err) {
            console.error("QR generation error:", err);
            return {};
        }
    };

    // ========== FETCH CERTIFICATES ==========
    const fetchCertificates = async (pageNum = 1) => {
        if (!verifyAdminAuth()) return;

        setLoading(true);
        try {
            let qQuery = query(certCollection, orderBy("createdAt", "desc"), firestoreLimit(ITEMS_PER_PAGE));

            if (pageNum > 1 && lastVisible) {
                qQuery = query(certCollection, orderBy("createdAt", "desc"), startAfter(lastVisible), firestoreLimit(ITEMS_PER_PAGE));
            }

            const snapshot = await getDocs(qQuery);
            const certData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

            setCertificates(certData);
            if (snapshot.docs.length > 0) {
                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            }

            setQrCodes(await generateQRCodes(certData));
            setTotalPages(Math.max(pageNum, snapshot.docs.length === ITEMS_PER_PAGE ? pageNum + 1 : pageNum));
        } catch (err) {
            console.error("Error fetching certificates:", err);
            showNotification("error", "Failed to Load", "Could not load certificates. Check your permissions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertificates(1);
    }, []);

    // ========== ADD CERTIFICATE ==========
    const handleAdd = async () => {
        const sanitizedName = sanitizeInput(newCert.name);
        const sanitizedProgram = sanitizeInput(newCert.program);

        if (!sanitizedName || !sanitizedProgram) {
            showNotification("warning", "Invalid Input", "Please fill all fields with valid data.");
            return;
        }

        if (!verifyAdminAuth()) return;

        setActionLoading(true);
        try {
            const code = await generateUniqueCode();
            const newData = {
                name: sanitizedName,
                program: sanitizedProgram,
                code,
                signerIds: newCert.signerIds,
                createdAt: new Date(),
                createdBy: auth.currentUser.email,
            };

            const docRef = await addDoc(certCollection, newData);
            const addedCert = { id: docRef.id, ...newData };

            const qrDataUrl = await QRCode.toDataURL(
                `${window.location.origin}/verify/${code}`,
                { errorCorrectionLevel: "H", margin: 2, width: 300 }
            );

            setCertificates((prev) => [addedCert, ...prev.slice(0, ITEMS_PER_PAGE - 1)]);
            setQrCodes((prev) => ({ ...prev, [docRef.id]: qrDataUrl }));
            setNewCert({ name: "", program: "", signerIds: [] });

            showNotification("success", "Certificate Added", `Certificate for ${sanitizedName} created successfully!`);
        } catch (err) {
            console.error("Error adding certificate:", err);
            const errorMessage = err.code === "permission-denied"
                ? "Permission denied. Check Firestore security rules."
                : err.message || "An unexpected error occurred.";
            showNotification("error", "Add Failed", errorMessage);
        } finally {
            setActionLoading(false);
        }
    };

    // ========== DELETE CERTIFICATE ==========
    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setReauthPassword("");
        setDeleteTargetId(null);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTargetId) {
            showNotification("warning", "No Selection", "No certificate selected for deletion.");
            return;
        }

        const currentUser = auth?.currentUser;
        if (!currentUser) {
            showNotification("error", "Not Authenticated", "Please log in again.");
            return;
        }

        if (!reauthPassword) {
            showNotification("warning", "Password Required", "Enter your password to confirm.");
            return;
        }

        setActionLoading(true);
        try {
            const cred = EmailAuthProvider.credential(currentUser.email, reauthPassword);
            await reauthenticateWithCredential(currentUser, cred);
            await deleteDoc(doc(db, "certificates", deleteTargetId));

            setCertificates((prev) => prev.filter((c) => c.id !== deleteTargetId));
            setQrCodes((prev) => {
                const { [deleteTargetId]: _, ...rest } = prev;
                return rest;
            });

            closeDeleteModal();
            showNotification("success", "Certificate Deleted", "Certificate removed successfully.");
        } catch (err) {
            console.error("Delete error:", err);
            const errorMessage = err.code === "auth/wrong-password"
                ? "Incorrect password. Please try again."
                : err.code === "permission-denied"
                    ? "Permission denied. Check Firestore security rules."
                    : err.message || "Deletion failed.";
            showNotification("error", "Delete Failed", errorMessage);
        } finally {
            setActionLoading(false);
        }
    };

    // ========== DOWNLOAD QR ==========
    const handleDownloadQR = (cert) => {
        const url = qrCodes[cert.id];
        if (!url) {
            showNotification("error", "QR Not Found", "QR code not available for download.");
            return;
        }

        const link = document.createElement("a");
        link.href = url;
        link.download = `QR_${sanitizeFilename(cert.name)}_${cert.code}.png`;
        link.click();

        showNotification("success", "Download Started", "QR code downloaded successfully.");
    };

    // ========== FILTERED CERTIFICATES ==========
    const filteredCertificates = certificates.filter((cert) =>
        cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.program.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ========== SIGNERS ==========
    const signerOptions = signers
        .filter((s) => s.active !== false)
        .map((s) => ({ value: s.id, label: `${s.name} — ${s.position}` }));

    const defaultSignerNames = signers
        .filter((s) => s.active !== false && s.isDefault)
        .map((s) => s.name)
        .join(", ");

    const signerPlaceholder = defaultSignerNames
        ? `Leave empty to use default signers (${defaultSignerNames})`
        : "No default signers yet — add them in the Signers & Stamps tab";

    const handleSaveCertSigners = async () => {
        if (!signerEdit || !verifyAdminAuth()) return;
        setActionLoading(true);
        try {
            await updateDoc(doc(db, "certificates", signerEdit.cert.id), { signerIds: signerEdit.signerIds });
            setCertificates((prev) =>
                prev.map((c) => (c.id === signerEdit.cert.id ? { ...c, signerIds: signerEdit.signerIds } : c))
            );
            setSignerEdit(null);
            showNotification("success", "Signers Updated", "The verification page now shows the new signers.");
        } catch (err) {
            console.error("Error updating signers:", err);
            showNotification("error", "Update Failed", err.message || "Could not update signers.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Title order={2}>Admin Certificate Panel</Title>

            {notification && (
                <Alert
                    icon={notification.icon}
                    title={notification.title}
                    color={notification.color}
                    withCloseButton
                    onClose={() => setNotification(null)}
                    mb="md"
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        zIndex: 1000,
                        maxWidth: '400px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                >
                    {notification.message}
                </Alert>
            )}

            <div className={styles.headerActions}>
                <QrStats />
                <Button
                    variant="outline"
                    color="red"
                    onClick={() => signOut(auth).then(() => (window.location.href = "/cert-login"))}
                    className={styles.logoutBtn}
                >
                    Logout
                </Button>
            </div>

            <Tabs value={activeTab} onChange={setActiveTab} className={styles.tabs} keepMounted>
                <Tabs.List className={styles.tabList} grow>
                    <Tabs.Tab value="certificates" leftSection={<IconCertificate size={18} />}>
                        Certificates
                    </Tabs.Tab>
                    <Tabs.Tab value="signers" leftSection={<IconSignature size={18} />}>
                        Signers & Stamps
                        {signers.length > 0 && (
                            <Badge size="xs" ml={6} variant="white" color="violet">{signers.length}</Badge>
                        )}
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="signers" pt="lg">
                    <SignerManager notify={showNotification} onSignersChange={setSigners} />
                </Tabs.Panel>

                <Tabs.Panel value="certificates" pt="lg">
            <BackupManager onImportComplete={() => { setPage(1); fetchCertificates(1); }} />

            <div className={styles.form}>
                <TextInput
                    label="Name"
                    placeholder="Participant Name"
                    value={newCert.name}
                    onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                    disabled={actionLoading}
                    maxLength={INPUT_MAX_LENGTH}
                />
                <TextInput
                    label="Program"
                    placeholder="Program Name"
                    value={newCert.program}
                    onChange={(e) => setNewCert({ ...newCert, program: e.target.value })}
                    disabled={actionLoading}
                    maxLength={INPUT_MAX_LENGTH}
                />
                <MultiSelect
                    label="Signers"
                    placeholder={newCert.signerIds.length ? "" : signerPlaceholder}
                    data={signerOptions}
                    value={newCert.signerIds}
                    onChange={(ids) => setNewCert({ ...newCert, signerIds: ids })}
                    disabled={actionLoading}
                    clearable
                    searchable
                    nothingFoundMessage="No signers — add them in the Signers & Stamps tab"
                />
                <Button mt="sm" onClick={handleAdd} loading={actionLoading}>
                    Add Certificate
                </Button>
            </div>

            <TextInput
                className={styles.searchBox}
                placeholder="Search by name or program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                mb="md"
            />

            {loading ? (
                <LoadingOverlay />
            ) : (
                <>
                    <Table striped highlightOnHover withBorder>
                        <thead className="table-head">
                            <tr>
                                <th>Name</th>
                                <th>Program</th>
                                <th>Code</th>
                                <th>QR</th>
                                <th>Signers</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCertificates.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: "2rem", textAlign: "center" }}>
                                        No certificates found
                                    </td>
                                </tr>
                            ) : (
                                filteredCertificates.map((cert) => (
                                    <tr className="table-row" key={cert.id}>
                                        <td>{cert.name}</td>
                                        <td>{cert.program}</td>
                                        <td>{cert.code}</td>
                                        <td className={styles.qrCell}>
                                            {qrCodes[cert.id] && (
                                                <Image src={qrCodes[cert.id]} w={60} h={60} radius="md" />
                                            )}
                                        </td>
                                        <td>
                                            <SignerSummary cert={cert} signers={signers} />
                                        </td>
                                        <td>
                                            <Group spacing="xs" justify="center">
                                                <Button
                                                    color="blue"
                                                    size="s"
                                                    onClick={() => handleDownloadQR(cert)}
                                                    title="Download QR Code"
                                                    p="xs"
                                                >
                                                    <IconDownload size={16} />
                                                </Button>
                                                <Button
                                                    color="violet"
                                                    size="s"
                                                    onClick={() => setSignerEdit({ cert, signerIds: cert.signerIds || [] })}
                                                    title="Choose Signers"
                                                    p="xs"
                                                >
                                                    <IconSignature size={16} />
                                                </Button>
                                                <Button
                                                    color="red"
                                                    size="s"
                                                    onClick={() => {
                                                        setDeleteTargetId(cert.id);
                                                        setReauthPassword("");
                                                        setDeleteModalOpen(true);
                                                    }}
                                                    title="Delete Certificate"
                                                    p="xs"
                                                >
                                                    <IconTrash size={16} />
                                                </Button>
                                            </Group>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>

                    {!searchTerm && totalPages > 1 && (
                        <Group justify="center" mt="lg">
                            <Pagination
                                value={page}
                                onChange={(p) => { setPage(p); fetchCertificates(p); }}
                                total={totalPages}
                            />
                        </Group>
                    )}
                </>
            )}
                </Tabs.Panel>
            </Tabs>

            <Modal
                opened={!!signerEdit}
                onClose={() => setSignerEdit(null)}
                title={`Signers — ${signerEdit?.cert.name || ""}`}
                centered
                size="md"
            >
                <MultiSelect
                    label="Who signed this certificate?"
                    placeholder={signerEdit?.signerIds.length ? "" : signerPlaceholder}
                    data={signerOptions}
                    value={signerEdit?.signerIds || []}
                    onChange={(ids) => setSignerEdit((prev) => ({ ...prev, signerIds: ids }))}
                    clearable
                    searchable
                />
                <Text size="xs" c="dimmed" mt="xs">
                    Leave empty to always show the current default signers.
                </Text>
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={() => setSignerEdit(null)}>Cancel</Button>
                    <Button loading={actionLoading} onClick={handleSaveCertSigners}>Save</Button>
                </Group>
            </Modal>

            <Modal
                opened={deleteModalOpen}
                onClose={closeDeleteModal}
                title="Confirm Delete — re-enter password"
                centered
                size="sm"
            >
                <Text mb="sm">To delete this certificate, re-enter your admin password.</Text>
                <PasswordInput
                    placeholder="Your password"
                    value={reauthPassword}
                    onChange={(e) => setReauthPassword(e.target.value)}
                    required
                />
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={closeDeleteModal}>Cancel</Button>
                    <Button color="red" loading={actionLoading} onClick={handleConfirmDelete}>
                        Confirm Delete
                    </Button>
                </Group>
            </Modal>
        </div>
    );
};

const SignerSummary = ({ cert, signers }) => {
    const resolved = resolveCertificateSigners(cert, signers);
    const usesDefault = !(Array.isArray(cert.signerIds) && cert.signerIds.length > 0);
    if (resolved.length === 0) return <Text size="xs" c="dimmed">—</Text>;
    return (
        <Text size="xs" title={resolved.map((s) => s.name).join(", ")}>
            {resolved.length === 1 ? resolved[0].name : `${resolved[0].name} +${resolved.length - 1}`}
            {usesDefault && <Text span size="xs" c="dimmed"> (default)</Text>}
        </Text>
    );
};

export default Admin;