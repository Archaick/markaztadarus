// src/.../Admin.jsx
import React, { useState, useEffect } from "react";
import styles from "./Admin.module.css";
import { db, auth } from "../../../firebaseConfig";
import QrStats from "./QrStats";
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
} from "@mantine/core";

import QRCode from "qrcode";
import LoadingOverlay from "../LoadingOverlay";

import {
    reauthenticateWithCredential,
    EmailAuthProvider,
    signOut,
} from "firebase/auth";

const ITEMS_PER_PAGE = 5;

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

    const certCollection = collection(db, "certificates");

    const sanitizeFilename = (s) =>
        s.replace(/[^\w\-_. ]+/g, "").replace(/\s+/g, "_");

    const generateQRCodes = async (certData) => {
        try {
            const results = await Promise.all(
                certData.map(async (cert) => {
                    const qrUrl = `${window.location.origin}/verify/${cert.code}`;
                    const qrDataUrl = await QRCode.toDataURL(qrUrl);
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
            alert("Failed to load certificates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertificates(1);
    }, []);

    const handleAdd = async () => {
        if (!newCert.name || !newCert.program) {
            return alert("Please fill all fields.");
        }

        setActionLoading(true);
        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const newData = { ...newCert, code, createdAt: new Date() };

            const docRef = await addDoc(certCollection, newData);
            const addedCert = { id: docRef.id, ...newData };

            const qrUrl = `${window.location.origin}/verify/${code}`;
            const qrDataUrl = await QRCode.toDataURL(qrUrl);

            setCertificates((prev) => [addedCert, ...prev.slice(0, ITEMS_PER_PAGE - 1)]);
            setQrCodes((prev) => ({ ...prev, [docRef.id]: qrDataUrl }));

            setNewCert({ name: "", program: "" });
            alert("Certificate added successfully!");
        } catch (err) {
            console.error("Error adding certificate:", err);
            alert("Failed to add certificate");
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
            alert(err.code === "auth/wrong-password" ? "Wrong password." : "Delete failed.");
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

    const filteredCertificates = certificates.filter(
        (cert) =>
            cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.program.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <Title order={2}>Admin Certificate Panel</Title>

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

            <div className={styles.form}>
                <TextInput
                    label="Name"
                    placeholder="Participant Name"
                    value={newCert.name}
                    onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                    disabled={actionLoading}
                />
                <TextInput
                    label="Program"
                    placeholder="Program Name"
                    value={newCert.program}
                    onChange={(e) => setNewCert({ ...newCert, program: e.target.value })}
                    disabled={actionLoading}
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
                            <Pagination value={page} onChange={(p) => { setPage(p); fetchCertificates(p); }} total={totalPages} />
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