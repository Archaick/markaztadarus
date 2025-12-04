// src/.../Admin.jsx - Enhanced Security Version
import React, { useState, useEffect } from "react";
import styles from "./Admin.module.css";
import { db, auth } from "../../../firebaseConfig";
import QrStats from "./QrStats";
import BackupManager from "./BackupManager";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
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
} from "@mantine/core";

import QRCode from "qrcode";
import LoadingOverlay from "../LoadingOverlay";

import {
    reauthenticateWithCredential,
    EmailAuthProvider,
    signOut,
} from "firebase/auth";

const ITEMS_PER_PAGE = 5;
const MAX_RETRIES = 3; // For code generation collision handling

const Admin = () => {
    const [certificates, setCertificates] = useState([]);
    const [newCert, setNewCert] = useState({ name: "", program: "" });
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
    const [securityWarning, setSecurityWarning] = useState("");

    const certCollection = collection(db, "certificates");

    // ========== SECURITY: Cryptographic Code Generation ==========
    const generateSecureCode = async () => {
        const array = new Uint8Array(6);
        crypto.getRandomValues(array);
        
        // Convert to alphanumeric code (uppercase)
        return Array.from(array)
            .map(b => b.toString(36).toUpperCase())
            .join('')
            .substring(0, 8);
    };

    // ========== SECURITY: Check for code uniqueness ==========
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

    // ========== SECURITY: Generate unique code with retries ==========
    const generateUniqueCode = async () => {
        for (let i = 0; i < MAX_RETRIES; i++) {
            const code = await generateSecureCode();
            const unique = await isCodeUnique(code);
            if (unique) return code;
        }
        throw new Error("Failed to generate unique code after multiple attempts");
    };

    // ========== SECURITY: Input Sanitization ==========
    const sanitizeInput = (input) => {
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .substring(0, 200); // Limit length
    };

    const sanitizeFilename = (s) =>
        s.replace(/[^\w\-_. ]+/g, "").replace(/\s+/g, "_");

    // ========== SECURITY: Verify admin authentication ==========
    const verifyAdminAuth = () => {
        const user = auth?.currentUser;
        if (!user) {
            setSecurityWarning("Authentication required. Please log in again.");
            setTimeout(() => {
                signOut(auth).then(() => (window.location.href = "/cert-login"));
            }, 2000);
            return false;
        }
        return true;
    };

    const generateQRCodes = async (certData) => {
        try {
            const results = await Promise.all(
                certData.map(async (cert) => {
                    const qrUrl = `${window.location.origin}/verify/${cert.code}`;
                    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
                        errorCorrectionLevel: 'H', // Higher error correction
                        margin: 2,
                        width: 300
                    });
                    return { id: cert.id, qrDataUrl };
                })
            );
            return Object.fromEntries(results.map(({ id, qrDataUrl }) => [id, qrDataUrl]));
        } catch (err) {
            console.error("QR generation error:", err);
            return {};
        }
    };

    const fetchCertificates = async (pageNum = 1) => {
        if (!verifyAdminAuth()) return;
        
        setLoading(true);
        try {
            let qQuery = query(
                certCollection,
                orderBy("createdAt", "desc"),
                firestoreLimit(ITEMS_PER_PAGE)
            );

            if (pageNum > 1 && lastVisible) {
                qQuery = query(
                    certCollection,
                    orderBy("createdAt", "desc"),
                    startAfter(lastVisible),
                    firestoreLimit(ITEMS_PER_PAGE)
                );
            }

            const snapshot = await getDocs(qQuery);
            const certData = snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            }));

            setCertificates(certData);

            if (snapshot.docs.length > 0) {
                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            }

            const qrMap = await generateQRCodes(certData);
            setQrCodes(qrMap);

            setTotalPages(
                Math.max(
                    pageNum,
                    snapshot.docs.length === ITEMS_PER_PAGE ? pageNum + 1 : pageNum
                )
            );
        } catch (err) {
            console.error("Error fetching certificates:", err);
            setSecurityWarning("Failed to load certificates. Check your permissions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertificates(1);
    }, []);

    const handleAdd = async () => {
        // Input validation
        const sanitizedName = sanitizeInput(newCert.name);
        const sanitizedProgram = sanitizeInput(newCert.program);

        if (!sanitizedName || !sanitizedProgram) {
            return alert("Please fill all fields with valid data.");
        }

        if (!verifyAdminAuth()) return;

        setActionLoading(true);
        try {
            // Generate cryptographically secure unique code
            const code = await generateUniqueCode();
            
            const newData = {
                name: sanitizedName,
                program: sanitizedProgram,
                code,
                createdAt: new Date(),
                createdBy: auth.currentUser.email, // Track who created it
            };

            const docRef = await addDoc(certCollection, newData);
            const addedCert = { id: docRef.id, ...newData };

            const qrUrl = `${window.location.origin}/verify/${code}`;
            const qrDataUrl = await QRCode.toDataURL(qrUrl, {
                errorCorrectionLevel: 'H',
                margin: 2,
                width: 300
            });

            setCertificates((prev) => [addedCert, ...prev.slice(0, ITEMS_PER_PAGE - 1)]);
            setQrCodes((prev) => ({ ...prev, [docRef.id]: qrDataUrl }));

            setNewCert({ name: "", program: "" });
            alert("Certificate added successfully with secure code!");
        } catch (err) {
            console.error("Error adding certificate:", err);
            if (err.code === 'permission-denied') {
                setSecurityWarning("Permission denied. Check Firestore security rules.");
            } else {
                alert("Failed to add certificate: " + err.message);
            }
        } finally {
            setActionLoading(false);
        }
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setReauthPassword("");
        setDeleteTargetId(null);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTargetId) return alert("No certificate selected.");

        const currentUser = auth?.currentUser;
        if (!currentUser) return alert("Not authenticated.");
        if (!reauthPassword) return alert("Enter password.");

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
            alert("Certificate deleted!");
        } catch (err) {
            console.error("Delete error:", err);
            if (err.code === 'auth/wrong-password') {
                alert("Wrong password.");
            } else if (err.code === 'permission-denied') {
                setSecurityWarning("Permission denied. Check Firestore security rules.");
            } else {
                alert("Delete failed: " + err.message);
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadQR = (cert) => {
        const url = qrCodes[cert.id];
        if (!url) return;

        const link = document.createElement("a");
        link.href = url;
        link.download = `QR_${sanitizeFilename(cert.name)}_${cert.code}.png`;
        link.click();
    };

    const handleImportComplete = () => {
        setPage(1);
        fetchCertificates(1);
    };

    const filteredCertificates = certificates.filter(
        (cert) =>
            cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.program.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <Title order={2}>Admin Certificate Panel</Title>

            {securityWarning && (
                <Alert color="red" title="Security Warning" mb="md" withCloseButton onClose={() => setSecurityWarning("")}>
                    {securityWarning}
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

            <BackupManager onImportComplete={handleImportComplete} />

            <div className={styles.form}>
                <TextInput
                    label="Name"
                    placeholder="Participant Name"
                    value={newCert.name}
                    onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                    disabled={actionLoading}
                    maxLength={200}
                />
                <TextInput
                    label="Program"
                    placeholder="Program Name"
                    value={newCert.program}
                    onChange={(e) => setNewCert({ ...newCert, program: e.target.value })}
                    disabled={actionLoading}
                    maxLength={200}
                />
                <Button mt="sm" onClick={handleAdd} loading={actionLoading}>
                    Add Certificate
                </Button>
            </div>

            <TextInput
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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCertificates.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center" }}>
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
                                            <Group spacing="xs" justify="center">
                                                <Button color="blue" size="xs" onClick={() => handleDownloadQR(cert)}>
                                                    Download
                                                </Button>
                                                <Button
                                                    color="red"
                                                    size="xs"
                                                    onClick={() => {
                                                        setDeleteTargetId(cert.id);
                                                        setReauthPassword("");
                                                        setDeleteModalOpen(true);
                                                    }}
                                                >
                                                    Delete
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

export default Admin;