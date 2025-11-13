import React, { useState, useEffect } from "react";
import styles from "./Admin.module.css";
import { db } from "../../../firebaseConfig";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    startAfter,
    limit as firestoreLimit
} from "firebase/firestore";

import { Button, TextInput, Table, Title, Group, Image, Pagination } from "@mantine/core";
import QRCode from "qrcode";
import LoadingOverlay from "../LoadingOverlay";

import { auth } from "../../../firebaseConfig";
import { signOut } from "firebase/auth";


const ITEMS_PER_PAGE = 5;

const Admin = () => {
    const [certificates, setCertificates] = useState([]);
    const [newCert, setNewCert] = useState({ name: "", program: "" });
    const [searchTerm, setSearchTerm] = useState("");
    const [qrCodes, setQrCodes] = useState({});
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [lastVisible, setLastVisible] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const certCollection = collection(db, "certificates");

    const handleLogout = async () => {
        if (window.confirm("Are you sure you want to log out?")) {
            await signOut(auth);
            window.location.reload(); // or redirect to login page
        }
    };


    // Generate QR codes in parallel
    const generateQRCodes = async (certData) => {
        const qrPromises = certData.map(async (cert) => {
            const qrUrl = `${window.location.origin}/verify/${cert.code}`;
            const qrDataUrl = await QRCode.toDataURL(qrUrl);
            return { id: cert.id, qrDataUrl };
        });

        const qrResults = await Promise.all(qrPromises);
        const qrMap = {};
        qrResults.forEach(({ id, qrDataUrl }) => {
            qrMap[id] = qrDataUrl;
        });

        return qrMap;
    };

    // Fetch certificates with pagination
    const fetchCertificates = async (pageNum = 1) => {
        setLoading(true);
        try {
            let q = query(
                certCollection,
                orderBy("createdAt", "desc"),
                firestoreLimit(ITEMS_PER_PAGE)
            );

            // If not first page, use pagination cursor
            if (pageNum > 1 && lastVisible) {
                q = query(
                    certCollection,
                    orderBy("createdAt", "desc"),
                    startAfter(lastVisible),
                    firestoreLimit(ITEMS_PER_PAGE)
                );
            }

            const snapshot = await getDocs(q);
            const certData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                _doc: doc // Store document reference for pagination
            }));

            setCertificates(certData);

            // Set last visible document for pagination
            if (snapshot.docs.length > 0) {
                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            }

            // Generate QR codes in parallel
            const qrMap = await generateQRCodes(certData);
            setQrCodes(qrMap);

            // Estimate total pages (this is approximate - for exact count you'd need a separate query)
            setTotalPages(Math.max(pageNum, snapshot.docs.length === ITEMS_PER_PAGE ? pageNum + 1 : pageNum));
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

    // Add a new certificate with optimistic update
    const handleAdd = async () => {
        if (!newCert.name || !newCert.program) {
            return alert("Please fill all fields.");
        }

        setActionLoading(true);
        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();

            const newCertData = {
                ...newCert,
                code,
                createdAt: new Date(),
            };

            // Add to Firestore
            const docRef = await addDoc(certCollection, newCertData);

            // Optimistic update - add to local state instead of refetching
            const newCertWithId = { id: docRef.id, ...newCertData };

            // Generate QR for new cert
            const qrUrl = `${window.location.origin}/verify/${code}`;
            const qrDataUrl = await QRCode.toDataURL(qrUrl);

            // Update state optimistically
            setCertificates(prev => [newCertWithId, ...prev.slice(0, ITEMS_PER_PAGE - 1)]);
            setQrCodes(prev => ({ ...prev, [docRef.id]: qrDataUrl }));

            setNewCert({ name: "", program: "" });
            alert("Certificate added successfully!");
        } catch (err) {
            console.error("Error adding certificate:", err);
            alert("Failed to add certificate");
        } finally {
            setActionLoading(false);
        }
    };

    // Delete a certificate with optimistic update
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this certificate?")) {
            return;
        }

        setActionLoading(true);
        try {
            await deleteDoc(doc(db, "certificates", id));

            // Optimistic update - remove from local state
            setCertificates(prev => prev.filter(cert => cert.id !== id));
            setQrCodes(prev => {
                const newQrCodes = { ...prev };
                delete newQrCodes[id];
                return newQrCodes;
            });

            alert("Certificate deleted successfully!");
        } catch (err) {
            console.error("Error deleting certificate:", err);
            alert("Failed to delete certificate");
        } finally {
            setActionLoading(false);
        }
    };

    // Download QR code
    const handleDownloadQR = (cert) => {
        const qrDataUrl = qrCodes[cert.id];
        if (!qrDataUrl) return;

        const link = document.createElement("a");
        link.href = qrDataUrl;
        link.download = `QR_${cert.name.replace(/\s+/g, "_")}_${cert.code}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchCertificates(newPage);
    };

    // Filter certificates (client-side for current page only)
    const filteredCertificates = certificates.filter(
        (cert) =>
            cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.program.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <Title order={2} mb="md">
                MTI Admin Certificate Panel
            </Title>

            <Button color="gray" variant="outline" onClick={handleLogout} mb="md">
                Logout
            </Button>


            <div className={styles.form}>
                <TextInput
                    label="Name"
                    placeholder="Student Name"
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
                <Button
                    mt="sm"
                    onClick={handleAdd}
                    loading={actionLoading}
                >
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
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Program</th>
                                <th>Code</th>
                                <th>QR Code</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCertificates.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                                        No certificates found
                                    </td>
                                </tr>
                            ) : (
                                filteredCertificates.map((cert) => (
                                    <tr key={cert.id}>
                                        <td>{cert.name}</td>
                                        <td>{cert.program}</td>
                                        <td>{cert.code}</td>
                                        <td>
                                            <div className={styles.qrCell}>
                                                {qrCodes[cert.id] && (
                                                    <Image
                                                        src={qrCodes[cert.id]}
                                                        alt="QR Code"
                                                        w={60}
                                                        h={60}
                                                        radius="md"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <Group spacing="xs" justify="center" align="center">
                                                <Button
                                                    color="blue"
                                                    size="xs"
                                                    onClick={() => handleDownloadQR(cert)}
                                                    disabled={actionLoading}
                                                >
                                                    Download
                                                </Button>
                                                <Button
                                                    color="red"
                                                    size="xs"
                                                    onClick={() => handleDelete(cert.id)}
                                                    loading={actionLoading}
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
                        <Group position="center" mt="lg">
                            <Pagination
                                value={page}
                                onChange={handlePageChange}
                                total={totalPages}
                            />
                        </Group>
                    )}
                </>
            )}
        </div>
    );
};

export default Admin;