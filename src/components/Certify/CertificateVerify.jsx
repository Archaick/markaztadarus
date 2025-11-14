import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Container, Title, Text, Card, Stack, Badge, Loader, Center } from "@mantine/core";
import { IconCertificate, IconAlertCircle, IconCheck } from "@tabler/icons-react";
import styles from "./CertificateVerify.module.css";

const CertificateVerify = () => {
    const { code } = useParams(); // Get code from URL
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const verifyCertificate = async () => {
            if (!code) {
                setError("No certificate code provided");
                setLoading(false);
                return;
            }

            try {
                // Query Firestore for certificate with matching code
                const certCollection = collection(db, "certificates");
                const q = query(certCollection, where("code", "==", code.toUpperCase()));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    setError("Certificate not found");
                    setLoading(false);
                    return;
                }

                // Get certificate data
                const certData = {
                    id: snapshot.docs[0].id,
                    ...snapshot.docs[0].data()
                };

                setCertificate(certData);
            } catch (err) {
                console.error("Error verifying certificate:", err);
                setError("Failed to verify certificate. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        verifyCertificate();
    }, [code]);

    // Loading state
    if (loading) {
        return (
            <Center style={{ minHeight: "100vh" }}>
                <Stack align="center" spacing="md">
                    <Loader size="lg" />
                    <Text color="dimmed">Verifying certificate...</Text>
                </Stack>
            </Center>
        );
    }

    // Error state
    if (error) {
        return (
            <Container size="sm" className={styles.container}>
                <Card shadow="md" padding="xl" radius="md" withBorder className={styles.errorCard}>
                    <Stack align="center" spacing="lg">
                        <IconAlertCircle size={64} color="red" />
                        <Title order={2} color="red">Invalid Certificate</Title>
                        <Text size="lg" align="center">{error}</Text>
                        <Text size="sm" color="dimmed" align="center">
                            This certificate code may be incorrect or does not exist in our system.
                        </Text>
                    </Stack>
                </Card>
            </Container>
        );
    }

    // Success state
    return (
        <Container size="sm" className={styles.container}>
            <Card shadow="lg" padding="xl" radius="md" withBorder className={styles.successCard}>
                <Stack spacing="xl">

                    {/* Header with icon */}
                    <Center>
                        <Stack align="center" spacing="sm">
                            <div className={styles.iconWrapper}>
                                <IconCheck size={64} color="white" className={styles.checkIcon} />
                            </div>
                            <Badge size="lg" color="green" variant="filled">
                                Authentic MTI Document
                            </Badge>
                        </Stack>
                    </Center>


                    {/* Document Title */}
                    <Title order={1} align="center" className={styles.title}>
                        {certificate.title || "Verified MTI Document"}
                    </Title>

                    <div className={styles.divider} />

                    {/* Dynamic Fields */}
                    <Stack spacing="md">

                        {/* If document has a name */}
                        {certificate.name && (
                            <div>
                                <Text size="sm" color="dimmed" weight={500}>Issued to:</Text>
                                <Title order={2} className={styles.name}>
                                    {certificate.name}
                                </Title>
                            </div>
                        )}

                        {/* If document has a program */}
                        {certificate.program && (
                            <div>
                                <Text size="sm" color="dimmed" weight={500}>Program:</Text>
                                <Title order={3} className={styles.program}>
                                    {certificate.program}
                                </Title>
                            </div>
                        )}

                        {/* If document has a description */}
                        {certificate.description && (
                            <Text size="sm" align="center" color="dimmed">
                                {certificate.description}
                            </Text>
                        )}
                    </Stack>

                    <div className={styles.divider} />

                    {/* Metadata */}
                    <Stack spacing="xs" className={styles.metadata}>
                        <Text size="sm" color="dimmed">
                            <strong>Document Code:</strong> {certificate.code}
                        </Text>

                        {certificate.createdAt && (
                            <Text size="sm" color="dimmed">
                                <strong>Issued On:</strong>{" "}
                                {certificate.createdAt.toDate
                                    ? certificate.createdAt.toDate().toLocaleDateString("id-ID", {
                                        year: "numeric", month: "long", day: "numeric"
                                    })
                                    : new Date(certificate.createdAt).toLocaleDateString("id-ID", {
                                        year: "numeric", month: "long", day: "numeric"
                                    })
                                }
                            </Text>
                        )}
                    </Stack>

                    {/* Footer */}
                    <Center>
                        <Text size="xs" color="dimmed" align="center">
                            This document has been verified as an authentic record issued by MTI.
                        </Text>
                    </Center>

                </Stack>
            </Card>
        </Container>
    );

};

export default CertificateVerify;