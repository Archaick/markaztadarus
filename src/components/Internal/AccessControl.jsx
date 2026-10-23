import { useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  CopyButton,
  Group,
  Loader,
  Modal,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBrandWhatsapp,
  IconCheck,
  IconCopy,
  IconHistory,
  IconMail,
  IconEye,
  IconTrash,
  IconUserPlus,
  IconUsersGroup,
} from "@tabler/icons-react";
import { Trans, useTranslation } from "react-i18next";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "./accessContext";
import { auditedWrite } from "./audit";
import {
  ADMINS_COLLECTION,
  FEATURES,
  SUPER_ADMIN_EMAIL,
  isValidEmail,
  normalizeEmail,
} from "./access";
import { AccountBar, InternalLayout } from "./InternalUI";
import { timeAgo } from "./timeAgo";
import portal from "./InternalPortal.module.css";
import styles from "./AccessControl.module.css";

export default function AccessControl() {
  const { t } = useTranslation("internal/Internal");
  const { email: myEmail, user } = useAccess();
  const [admins, setAdmins] = useState(null);
  const [listError, setListError] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFeatures, setInviteFeatures] = useState([]);
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [lastInvite, setLastInvite] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [busyEmail, setBusyEmail] = useState("");

  const featureTitle = (key) => t(`features.${key}.title`);

  const inviteMessage = (email, features) =>
    [
      t("access.message.greeting"),
      "",
      t("access.message.body", { dashboards: features.map(featureTitle).join(", ") }),
      "",
      t("access.message.howTo", { link: `${window.location.origin}/internal`, email }),
    ].join("\n");

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, ADMINS_COLLECTION), orderBy("invitedAt", "desc")),
        (snap) => {
          setAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setListError(false);
        },
        (err) => {
          console.error("Could not load admins:", err);
          setListError(true);
          setAdmins([]);
        }
      ),
    []
  );

  const handleInvite = async (event) => {
    event.preventDefault();
    setNotice(null);
    const email = normalizeEmail(inviteEmail);

    if (!isValidEmail(email)) {
      setNotice({ color: "red", key: "invalidEmail" });
      return;
    }
    if (email === SUPER_ADMIN_EMAIL) {
      setNotice({ color: "yellow", key: "isSuper" });
      return;
    }
    if (inviteFeatures.length === 0) {
      setNotice({ color: "yellow", key: "pickOne" });
      return;
    }

    setInviting(true);
    try {
      const ref = doc(db, ADMINS_COLLECTION, email);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        const merged = Array.from(new Set([...(existing.data().features || []), ...inviteFeatures]));
        await auditedWrite(
          user,
          { area: "access", action: "admin.update", target: email, label: email, details: { from: existing.data().features || [], to: merged } },
          (batch, auditId) => batch.update(ref, { features: merged, auditId, updatedAt: serverTimestamp() })
        );
        setNotice({ color: "teal", key: "updated", email });
        setLastInvite({ email, features: merged });
      } else {
        await auditedWrite(
          user,
          { area: "access", action: "admin.invite", target: email, label: email, details: { to: inviteFeatures } },
          (batch, auditId) =>
            batch.set(ref, {
              email,
              features: inviteFeatures,
              auditId,
              invitedBy: myEmail,
              invitedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
        );
        setNotice({ color: "teal", key: "invited", email });
        setLastInvite({ email, features: inviteFeatures });
      }
      setInviteEmail("");
      setInviteFeatures([]);
    } catch (err) {
      console.error("Invite failed:", err);
      setNotice({ color: "red", key: "inviteFailed" });
    } finally {
      setInviting(false);
    }
  };

  const toggleFeature = async (admin, key) => {
    const has = (admin.features || []).includes(key);
    const next = has ? admin.features.filter((k) => k !== key) : [...(admin.features || []), key];
    setBusyEmail(admin.id);
    try {
      await auditedWrite(
        user,
        { area: "access", action: "admin.update", target: admin.id, label: admin.id, details: { from: admin.features || [], to: next } },
        (batch, auditId) => batch.update(doc(db, ADMINS_COLLECTION, admin.id), { features: next, auditId, updatedAt: serverTimestamp() })
      );
    } catch (err) {
      console.error("Could not update access:", err);
      setNotice({ color: "red", key: "updateFailed", email: admin.id });
    } finally {
      setBusyEmail("");
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setBusyEmail(removeTarget.id);
    try {
      await auditedWrite(
        user,
        { area: "access", action: "admin.remove", target: removeTarget.id, label: removeTarget.id, details: { from: removeTarget.features || [] } },
        (batch, _auditId, markDelete) => {
          batch.delete(doc(db, ADMINS_COLLECTION, removeTarget.id));
          markDelete(`admins~${removeTarget.id}`, removeTarget.auditId);
        }
      );
      setNotice({ color: "teal", key: "removed", email: removeTarget.id });
      if (lastInvite?.email === removeTarget.id) setLastInvite(null);
    } catch (err) {
      console.error("Could not remove admin:", err);
      setNotice({ color: "red", key: "removeFailed", email: removeTarget.id });
    } finally {
      setBusyEmail("");
      setRemoveTarget(null);
    }
  };

  const shareText = lastInvite ? inviteMessage(lastInvite.email, lastInvite.features) : "";

  return (
    <InternalLayout align="top">
      <div className={styles.page}>
        <a href="/internal" className={styles.back}>
          <IconArrowLeft size={16} className={portal.flipRtl} /> {t("backToHub")}
        </a>

        <Card className={styles.panel}>
          <AccountBar />

          <div className={styles.heading}>
            <span className={styles.headingIcon}>
              <IconUsersGroup size={22} />
            </span>
            <div>
              <Title order={2} className={styles.headingTitle}>
                {t("features.access.title")}
              </Title>
              <Text className={styles.headingText}>{t("access.intro")}</Text>
            </div>
            <Button component="a" href="/internal/history" variant="default" radius="xl" leftSection={<IconHistory size={16} />} className={styles.historyLink}>
              {t("features.history.title")}
            </Button>
          </div>

          {/* ---------- Invite ---------- */}
          <form className={styles.inviteBox} onSubmit={handleInvite}>
            <Text className={styles.sectionLabel}>{t("access.inviteTitle")}</Text>
            <TextInput
              type="email"
              dir="ltr"
              placeholder="name@gmail.com"
              leftSection={<IconMail size={16} />}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={inviting}
              size="md"
              autoComplete="off"
            />
            <Text size="sm" c="dimmed" mt="sm" mb={6}>
              {t("access.dashboards")}
            </Text>
            <Chip.Group multiple value={inviteFeatures} onChange={setInviteFeatures}>
              <Group gap="xs">
                {FEATURES.map((f) => (
                  <Chip key={f.key} value={f.key} variant="light" radius="sm">
                    {featureTitle(f.key)}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
            <Button
              type="submit"
              mt="md"
              leftSection={<IconUserPlus size={17} />}
              loading={inviting}
              className={styles.inviteButton}
            >
              {t("access.invite")}
            </Button>
          </form>

          {notice && (
            <Alert color={notice.color} mt="md" withCloseButton onClose={() => setNotice(null)}>
              {t(`access.notices.${notice.key}`, { email: notice.email })}
            </Alert>
          )}

          {lastInvite && (
            <div className={styles.shareBox}>
              <Text size="sm" fw={600}>
                {t("access.messageFor", { email: lastInvite.email })}
              </Text>
              <pre className={styles.shareText}>{shareText}</pre>
              <Group gap="xs">
                <CopyButton value={shareText}>
                  {({ copied, copy }) => (
                    <Button
                      size="xs"
                      variant="light"
                      color={copied ? "teal" : "blue"}
                      leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      onClick={copy}
                    >
                      {copied ? t("access.copied") : t("access.copyMessage")}
                    </Button>
                  )}
                </CopyButton>
                <Button
                  size="xs"
                  variant="light"
                  color="green"
                  component="a"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  leftSection={<IconBrandWhatsapp size={14} />}
                >
                  {t("access.whatsapp")}
                </Button>
              </Group>
            </div>
          )}

          {/* ---------- Admins ---------- */}
          <Text className={styles.sectionLabel} mt="xl">
            {t("access.admins", { count: admins ? admins.length + 1 : 1 })}
          </Text>

          {listError && (
            <Alert color="red" mb="sm">
              {t("access.notices.loadFailed")}
            </Alert>
          )}

          <div className={styles.list}>
            <div className={`${styles.row} ${styles.rowSuper}`}>
              <div className={styles.person}>
                <Avatar radius="xl" color="violet">
                  S
                </Avatar>
                <div className={styles.personText}>
                  <span className={styles.personEmail}>
                    <bdi>{SUPER_ADMIN_EMAIL}</bdi>
                  </span>
                  <span className={styles.personMeta}>{t("access.superRow")}</span>
                </div>
              </div>
              <Badge color="violet" variant="light">
                {t("superAdmin")}
              </Badge>
            </div>

            {admins === null && (
              <Group justify="center" py="lg">
                <Loader size="sm" />
              </Group>
            )}

            {admins?.length === 0 && !listError && (
              <Text c="dimmed" ta="center" py="lg" size="sm">
                {t("access.empty")}
              </Text>
            )}

            {admins?.map((admin) => (
              <div className={`${styles.row} ${styles.adminRow}`} key={admin.id}>
                <div className={styles.adminTop}>
                  <div className={styles.person}>
                    <Avatar src={admin.photoURL || null} radius="xl">
                      {(admin.displayName || admin.id).charAt(0).toUpperCase()}
                    </Avatar>
                    <div className={styles.personText}>
                      {admin.displayName && <span className={styles.personName}>{admin.displayName}</span>}
                      <bdi className={admin.displayName ? styles.personMail : styles.personEmail}>{admin.id}</bdi>
                      <span className={styles.personMeta}>
                        {admin.lastLoginAt ? (
                          <Badge size="xs" color="teal" variant="dot">
                            {t("access.active", { time: timeAgo(admin.lastLoginAt) })}
                          </Badge>
                        ) : (
                          <Badge size="xs" color="gray" variant="dot">
                            {t("access.pending", { time: timeAgo(admin.invitedAt) })}
                          </Badge>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className={styles.rowActions}>
                    <Button
                      component="a"
                      href={`/internal?previewAs=${encodeURIComponent(admin.id)}`}
                      size="xs"
                      radius="xl"
                      variant="light"
                      color="violet"
                      leftSection={<IconEye size={15} />}
                    >
                      {t("access.preview")}
                    </Button>
                    <Tooltip label={t("access.removeTip")}>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => setRemoveTarget(admin)}
                        loading={busyEmail === admin.id}
                        aria-label={t("access.removeTip")}
                      >
                        <IconTrash size={17} />
                      </ActionIcon>
                    </Tooltip>
                  </div>
                </div>

                <div className={styles.featureChips}>
                  {FEATURES.map((f) => {
                    const on = (admin.features || []).includes(f.key);
                    const title = featureTitle(f.key);
                    return (
                      <button
                        type="button"
                        key={f.key}
                        className={`${styles.featureToggle} ${on ? styles.featureOn : ""}`}
                        onClick={() => toggleFeature(admin, f.key)}
                        disabled={busyEmail === admin.id}
                        aria-pressed={on}
                        title={on ? t("access.take", { title }) : t("access.give", { title })}
                      >
                        {on ? <IconCheck size={13} /> : null}
                        {title}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <Text className={portal.footerText}>{t("access.footnote")}</Text>
        </Card>
      </div>

      <Modal opened={!!removeTarget} onClose={() => setRemoveTarget(null)} title={t("access.removeTitle")} centered>
        <Text size="sm">
          <Trans
            t={t}
            i18nKey="access.removeText"
            values={{ email: removeTarget?.id }}
            components={{ b: <strong dir="ltr" /> }}
          />
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setRemoveTarget(null)}>
            {t("access.cancel")}
          </Button>
          <Button color="red" onClick={confirmRemove} loading={!!busyEmail}>
            {t("access.remove")}
          </Button>
        </Group>
      </Modal>
    </InternalLayout>
  );
}
