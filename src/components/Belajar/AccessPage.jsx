import { useEffect, useMemo, useState } from "react";
import { ActionIcon, Alert, Avatar, Badge, Button, CopyButton, Group, Loader, Modal, Text, TextInput, Textarea, Tooltip } from "@mantine/core";
import { IconCheck, IconCopy, IconMailPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, doc, getDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { ADMINS_COLLECTION, SUPER_ADMIN_EMAIL, isValidEmail, normalizeEmail } from "../Internal/access";
import { auditedWrite } from "../Internal/audit";
import { NS } from "./belajarSchema";
import styles from "./Belajar.module.css";

const KEY = "belajar";

/**
 * Who may run the learning platform: the super admin invites an admin by
 * their Google email, and takes the access away again. Someone who also has
 * site dashboards keeps those (they are managed in /internal/access).
 */
export default function AccessPage() {
  const { t } = useTranslation(NS);
  const { user, email: myEmail } = useAccess();
  const [admins, setAdmins] = useState(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [invited, setInvited] = useState(null);
  const [removing, setRemoving] = useState(null);

  useEffect(
    () =>
      onSnapshot(
        collection(db, ADMINS_COLLECTION),
        (snap) => setAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((a) => (a.features || []).includes(KEY))),
        (err) => {
          console.error("Could not load the admins:", err);
          setAdmins([]);
        }
      ),
    []
  );

  const sorted = useMemo(() => (admins || []).slice().sort((a, b) => a.id.localeCompare(b.id)), [admins]);

  const invite = async (event) => {
    event.preventDefault();
    setNotice(null);
    const target = normalizeEmail(email);
    if (!isValidEmail(target)) return setNotice({ color: "red", text: t("access.invalid") });
    if (target === SUPER_ADMIN_EMAIL) return setNotice({ color: "yellow", text: t("access.isSuper") });
    setBusy(true);
    try {
      const ref = doc(db, ADMINS_COLLECTION, target);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        const from = existing.data().features || [];
        if (from.includes(KEY)) {
          setNotice({ color: "yellow", text: t("access.already", { email: target }) });
          return;
        }
        await auditedWrite(user, { area: KEY, action: "admin.update", target, label: target, details: { from, to: [...from, KEY] } }, (batch, auditId) =>
          batch.update(ref, { features: [...from, KEY], auditId, updatedAt: serverTimestamp() })
        );
      } else {
        await auditedWrite(user, { area: KEY, action: "admin.invite", target, label: target, details: { to: [KEY] } }, (batch, auditId) =>
          batch.set(ref, { email: target, features: [KEY], auditId, invitedBy: myEmail, invitedAt: serverTimestamp(), updatedAt: serverTimestamp() })
        );
      }
      setInvited(target);
      setEmail("");
    } catch (err) {
      console.error("Invite failed:", err);
      setNotice({ color: "red", text: t("access.failed") });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const admin = removing;
    setBusy(true);
    try {
      const from = admin.features || [];
      const rest = from.filter((k) => k !== KEY);
      if (rest.length) {
        await auditedWrite(user, { area: KEY, action: "admin.update", target: admin.id, label: admin.id, details: { from, to: rest } }, (batch, auditId) =>
          batch.update(doc(db, ADMINS_COLLECTION, admin.id), { features: rest, auditId, updatedAt: serverTimestamp() })
        );
      } else {
        await auditedWrite(user, { area: KEY, action: "admin.remove", target: admin.id, label: admin.id, details: { from } }, (batch, _a, markDelete) => {
          batch.delete(doc(db, ADMINS_COLLECTION, admin.id));
          markDelete(`admins~${admin.id}`, admin.auditId);
        });
      }
      setRemoving(null);
    } catch (err) {
      console.error("Could not remove access:", err);
      setNotice({ color: "red", text: t("access.failed") });
    } finally {
      setBusy(false);
    }
  };

  const message = invited ? t("access.message", { email: invited, link: `${window.location.origin}/belajar` }) : "";

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{t("access.title")}</h1>
          <p className={styles.pageSub}>{t("access.intro")}</p>
        </div>
      </div>

      <form className={styles.panel} onSubmit={invite}>
        <h3 className={styles.panelTitle}>{t("access.invite")}</h3>
        <Group align="flex-end" wrap="nowrap">
          <TextInput style={{ flex: 1 }} label={t("access.email")} placeholder="nama@gmail.com" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
          <Button type="submit" color="#003366" loading={busy} leftSection={<IconMailPlus size={18} />}>
            {t("access.inviteButton")}
          </Button>
        </Group>
        {notice && (
          <Alert color={notice.color} mt="md">
            {notice.text}
          </Alert>
        )}
        {invited && (
          <Alert color="teal" mt="md" icon={<IconCheck size={18} />} withCloseButton onClose={() => setInvited(null)}>
            <Text size="sm" mb="xs">
              {t("access.invited", { email: invited })}
            </Text>
            <Textarea readOnly autosize value={message} mb="xs" />
            <CopyButton value={message}>
              {({ copied, copy }) => (
                <Button size="xs" variant="light" color="teal" leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />} onClick={copy}>
                  {t(copied ? "access.copied" : "access.copy")}
                </Button>
              )}
            </CopyButton>
          </Alert>
        )}
      </form>

      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>{t("access.list", { count: sorted.length })}</h3>
        {admins === null ? (
          <Loader size="sm" />
        ) : sorted.length === 0 ? (
          <Text c="dimmed" size="sm">
            {t("access.none")}
          </Text>
        ) : (
          <div className={styles.rows}>
            {sorted.map((admin) => (
              <div key={admin.id} className={styles.row}>
                <Avatar src={admin.photoURL} radius="xl" color="#003366">
                  {(admin.displayName || admin.id).charAt(0).toUpperCase()}
                </Avatar>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitle}>{admin.displayName || admin.id}</div>
                  <div className={styles.rowSub}>{admin.id}</div>
                </div>
                {admin.lastLoginAt ? <Badge color="teal">{t("access.active")}</Badge> : <Badge color="gray">{t("access.pending")}</Badge>}
                {(admin.features || []).length > 1 && (
                  <Tooltip label={t("access.alsoSite")}>
                    <Badge variant="light" color="#003366">
                      +{admin.features.length - 1}
                    </Badge>
                  </Tooltip>
                )}
                <Tooltip label={t("access.remove")}>
                  <ActionIcon variant="subtle" color="red" onClick={() => setRemoving(admin)}>
                    <IconTrash size={18} />
                  </ActionIcon>
                </Tooltip>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal opened={!!removing} onClose={() => setRemoving(null)} title={t("access.remove")} centered>
        <Text mb="md">{t("access.removeBody", { email: removing?.id })}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setRemoving(null)}>
            {t("cancel")}
          </Button>
          <Button color="red" loading={busy} onClick={remove}>
            {t("access.remove")}
          </Button>
        </Group>
      </Modal>
    </>
  );
}
