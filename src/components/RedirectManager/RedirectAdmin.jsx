import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  CopyButton,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconLogout,
  IconTrash,
} from "@tabler/icons-react";
import { useDebouncedValue } from "@mantine/hooks";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  endAt,
  getDocs,
  limit as firestoreLimit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  startAt,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";
import styles from "./RedirectAdmin.module.css";

const PAGE_SIZE = 10;
const REDIRECT_COLLECTION = "redirect_manager_links";
const SHORT_PATH_PATTERN = /^\/[a-z0-9-]+$/;
const particles = [
  { left: "4%", top: "78%", size: 8, delay: "0s", duration: "16s" },
  { left: "11%", top: "90%", size: 4, delay: "1.8s", duration: "14s" },
  { left: "19%", top: "84%", size: 6, delay: "3.2s", duration: "17s" },
  { left: "27%", top: "88%", size: 5, delay: "0.5s", duration: "15s" },
  { left: "35%", top: "94%", size: 7, delay: "2.6s", duration: "18s" },
  { left: "43%", top: "82%", size: 4, delay: "4.1s", duration: "13s" },
  { left: "52%", top: "89%", size: 8, delay: "1.2s", duration: "20s" },
  { left: "60%", top: "86%", size: 5, delay: "2.2s", duration: "14s" },
  { left: "68%", top: "92%", size: 6, delay: "0.8s", duration: "17s" },
  { left: "75%", top: "84%", size: 4, delay: "3.8s", duration: "12s" },
  { left: "82%", top: "90%", size: 7, delay: "1.6s", duration: "19s" },
  { left: "90%", top: "87%", size: 5, delay: "2.9s", duration: "16s" },
  { left: "96%", top: "93%", size: 6, delay: "4.5s", duration: "18s" },
];

const normalizePath = (value) => {
  let normalized = value.trim().toLowerCase();

  if (!normalized) {
    return "";
  }

  normalized = normalized.replace(/\s+/g, "-");

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  return normalized;
};

const normalizeUrl = (value) => {
  const trimmed = value.trim();
  const urlValue = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(urlValue);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Destination must be http or https");
  }
  return parsed.toString();
};

export default function RedirectAdmin() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [filter, setFilter] = useState("");
  const [redirects, setRedirects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const cursorsRef = useRef({ 1: null });
  const [debouncedFilter] = useDebouncedValue(filter, 350);
  const filterTerm = useMemo(() => debouncedFilter.trim().toLowerCase(), [debouncedFilter]);
  const isPrefixSearch = filterTerm.startsWith("/");
  const normalizedFilter = useMemo(
    () => (isPrefixSearch ? normalizePath(filterTerm) : ""),
    [filterTerm, isPrefixSearch]
  );

  useEffect(() => {
    cursorsRef.current = { 1: null };
    setPage(1);
  }, [filterTerm]);

  useEffect(() => {
    let isMounted = true;

    const fetchRedirects = async () => {
      setLoadingList(true);

      try {
        if (page > 1 && !(page in cursorsRef.current)) {
          setPage(1);
          return;
        }

        const constraints = [];
        if (normalizedFilter) {
          constraints.push(orderBy("source"));
          constraints.push(startAt(normalizedFilter));
          constraints.push(endAt(`${normalizedFilter}\uf8ff`));
        } else {
          constraints.push(orderBy("createdAt", "desc"));
        }

        const cursor = cursorsRef.current[page] ?? null;
        if (cursor) {
          constraints.push(startAfter(cursor));
        }

        constraints.push(firestoreLimit(PAGE_SIZE + 1));

        const redirectsQuery = query(collection(db, REDIRECT_COLLECTION), ...constraints);
        const snapshot = await getDocs(redirectsQuery);

        if (!isMounted) {
          return;
        }

        const docs = snapshot.docs;
        const hasMore = docs.length > PAGE_SIZE;
        const visibleDocs = hasMore ? docs.slice(0, PAGE_SIZE) : docs;
        const data = visibleDocs.map((item) => ({ id: item.id, ...item.data() }));
        const filteredData =
          !filterTerm || isPrefixSearch
            ? data
            : data.filter((item) => {
                const sourceValue = (item.source ?? "").toLowerCase();
                const destinationValue = (item.destination ?? "").toLowerCase();
                return sourceValue.includes(filterTerm) || destinationValue.includes(filterTerm);
              });

        setRedirects(filteredData);
        setHasNextPage(hasMore);

        if (hasMore && visibleDocs.length > 0) {
          cursorsRef.current[page + 1] = visibleDocs[visibleDocs.length - 1];
        } else {
          delete cursorsRef.current[page + 1];
        }
      } catch (fetchError) {
        console.error("Error fetching redirects:", fetchError);
        if (isMounted) {
          setRedirects([]);
          setHasNextPage(false);
        }
      } finally {
        if (isMounted) {
          setLoadingList(false);
        }
      }
    };

    fetchRedirects();

    return () => {
      isMounted = false;
    };
  }, [page, normalizedFilter, filterTerm, isPrefixSearch, reloadKey]);

  const resetToFirstPage = () => {
    cursorsRef.current = { 1: null };
    setPage(1);
    setReloadKey((value) => value + 1);
  };

  const handleAddRedirect = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const cleanSource = normalizePath(source);
      if (!SHORT_PATH_PATTERN.test(cleanSource)) {
        throw new Error("Custom path must be one segment like /my-link");
      }

      const cleanDestination = normalizeUrl(destination);
      const duplicateSnapshot = await getDocs(
        query(
          collection(db, REDIRECT_COLLECTION),
          where("source", "==", cleanSource),
          firestoreLimit(1)
        )
      );

      if (!duplicateSnapshot.empty) {
        throw new Error(`Path ${cleanSource} already exists`);
      }

      await addDoc(collection(db, REDIRECT_COLLECTION), {
        source: cleanSource,
        destination: cleanDestination,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.email ?? "unknown",
      });

      setSource("");
      setDestination("");
      setSuccess(`Redirect ${cleanSource} created successfully`);
      resetToFirstPage();
    } catch (createError) {
      console.error("Error adding redirect:", createError);
      setError(createError?.message || "Failed to create redirect");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    setSuccess("");
    if (window.confirm("Are you sure you want to delete this redirect?")) {
      try {
        await deleteDoc(doc(db, REDIRECT_COLLECTION, id));
        setSuccess("Redirect deleted");
        resetToFirstPage();
      } catch (deleteError) {
        console.error("Error deleting redirect:", deleteError);
        setError("Failed to delete redirect");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/internal/redirect-login";
    } catch (logoutError) {
      console.error("Logout error:", logoutError);
      setError("Unable to logout right now");
    }
  };

  const domain =
    typeof window !== "undefined" ? window.location.origin : "https://markaztadarus.org";
  const hostname = domain.replace(/^https?:\/\//, "");
  const pageStartNumber = (page - 1) * PAGE_SIZE;

  return (
    <div className={styles.container}>
      <div className={styles.particles} aria-hidden="true">
        {particles.map((particle, index) => (
          <span
            key={`dashboard-particle-${index}`}
            className={styles.particle}
            style={{
              left: particle.left,
              top: particle.top,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Redirect Manager Dashboard</h1>
            <p className={styles.subtitle}>Manage internal short links safely.</p>
            <span className={styles.badge}>Firestore collection: {REDIRECT_COLLECTION}</span>
          </div>
          <Button
            leftSection={<IconLogout size={16} />}
            className={styles.logoutBtn}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        {error && (
          <Alert
            icon={<IconAlertCircle size={18} />}
            color="red"
            mb="md"
            withCloseButton
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            icon={<IconCheck size={18} />}
            color="teal"
            mb="md"
            withCloseButton
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        <Stack gap="lg">
          <Paper p="md" className={styles.panel}>
            <Text fw={700} mb="sm">
              Create New Redirect
            </Text>
            <form onSubmit={handleAddRedirect}>
              <div className={styles.formGrid}>
                <TextInput
                  label="Custom Path"
                  placeholder="/drive"
                  description="Lowercase, numbers, and hyphens only"
                  required
                  value={source}
                  onChange={(e) => setSource(e.currentTarget.value)}
                  className={styles.input}
                />
                <TextInput
                  label="Destination URL"
                  placeholder="https://docs.google.com/..."
                  description="http/https URL"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.currentTarget.value)}
                  className={styles.input}
                />
                <Button type="submit" loading={loading} className={styles.createBtn}>
                  Create Link
                </Button>
              </div>
            </form>
          </Paper>

          <Paper p={0} className={styles.panel}>
            <Box p="md">
              <TextInput
                label="Filter"
                placeholder="/prefix or keyword"
                description="Use /path for server-side prefix. Plain text filters current page."
                value={filter}
                onChange={(e) => setFilter(e.currentTarget.value)}
                className={styles.input}
              />
            </Box>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>No.</th>
                    <th>Generated Link</th>
                    <th>Destination</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingList ? (
                    <tr>
                      <td className={styles.loading} colSpan={4}>
                        <Loader size="sm" color="blue" />
                      </td>
                    </tr>
                  ) : redirects.length === 0 ? (
                    <tr>
                      <td className={styles.empty} colSpan={4}>
                        <Text className={styles.muted}>
                          {isPrefixSearch
                            ? "No redirects found for this prefix."
                            : "No matches on this page."}
                        </Text>
                      </td>
                    </tr>
                  ) : (
                    redirects.map((route, index) => {
                      const fullLink = `${domain}${route.source}`;
                      return (
                        <tr key={route.id}>
                          <td>{pageStartNumber + index + 1}</td>
                          <td>
                            <Group gap="xs">
                              <Text className={styles.mono}>
                                {hostname}
                                {route.source}
                              </Text>
                              <CopyButton value={fullLink} timeout={1800}>
                                {({ copied, copy }) => (
                                  <Tooltip
                                    label={copied ? "Copied" : "Copy full link"}
                                    withArrow
                                    position="right"
                                  >
                                    <ActionIcon
                                      color={copied ? "teal" : "gray"}
                                      variant="subtle"
                                      onClick={copy}
                                    >
                                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                              </CopyButton>
                            </Group>
                          </td>
                          <td>
                            <Group gap="xs" wrap="nowrap">
                              <Text truncate className={styles.muted} style={{ maxWidth: 340 }}>
                                {route.destination}
                              </Text>
                              <ActionIcon
                                component="a"
                                href={route.destination}
                                target="_blank"
                                variant="subtle"
                                color="blue"
                              >
                                <IconExternalLink size={16} />
                              </ActionIcon>
                            </Group>
                          </td>
                          <td>
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              onClick={() => handleDelete(route.id)}
                              className={styles.danger}
                            >
                              <IconTrash size={17} />
                            </ActionIcon>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Group p="md" className={styles.footerRow}>
              <Text className={styles.footerText}>
                {normalizedFilter
                  ? `Prefix filter: ${normalizedFilter}`
                  : filterTerm
                    ? `Keyword filter (current page): ${filterTerm}`
                    : "Showing latest redirects"}
              </Text>

              <div className={styles.pager}>
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={page === 1 || loadingList}
                >
                  Previous
                </Button>
                <Text size="sm">Page {page}</Text>
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  disabled={!hasNextPage || loadingList}
                >
                  Next
                </Button>
              </div>
            </Group>
          </Paper>
        </Stack>
      </div>
    </div>
  );
}
