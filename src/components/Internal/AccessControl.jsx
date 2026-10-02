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
  IconMail,
  IconTrash,
  IconUserPlus,
  IconUsersGroup,
} from "@tabler/icons-react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "./accessContext";
import {
  ADMINS_COLLECTION,
  FEATURES,
  SUPER_ADMIN_EMAIL,
  featureByKey,
  isValidEmail,
  normalizeEmail,
} from "./access";
import { AccountBar, InternalLayout } from "./InternalUI";
import { timeAgo } from "./timeAgo";
import portal from "./InternalPortal.module.css";
import styles from "./AccessControl.module.css";

const inviteMessage = (email, features) => {
  const names = features.map((key) => featureByKey(key)?.title).filter(Boolean);
  return [
    "Assalamu'alaikum,",
    "",
    `You have been given access to the Markaz Tadarus internal dashboard${names.length ? ` (${names.join(", ")})` : ""}.`,
    "",
    `Open ${window.location.origin}/internal and choose "Continue with Google" with this account: ${email}`,
  ].join("\n");
};

export default function AccessControl() {
  const { email: myEmail } = useAccess();
  const [admins, setAdmins] = useState(null);
  const [listError, setListError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFeatures, setInviteFeatures] = useState([]);
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [lastInvite, setLastInvite] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [busyEmail, setBusyEmail] = useState("");

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, ADMINS_COLLECTION), orderBy("invitedAt", "desc")),
        (snap) => {
          setAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setListError("");
        },
        (err) => {
          console.error("Could not load admins:", err);
          setListError("Could not load admins. Check the Firestore rules are deployed.");
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
      setNotice({ color: "red", text: "Enter a valid email address." });
      return;
    }
    if (email === SUPER_ADMIN_EMAIL) {
      setNotice({ color: "yellow", text: "That is the super admin, who already has every dashboard." });
      return;
    }
    if (inviteFeatures.length === 0) {
      setNotice({ color: "yellow", text: "Pick at least one dashboard for this admin." });
      return;
    }

    setInviting(true);
    try {
      const ref = doc(db, ADMINS_COLLECTION, email);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        const merged = Array.from(new Set([...(existing.data().features || []), ...inviteFeatures]));
        await updateDoc(ref, { features: merged, updatedAt: serverTimestamp() });
        setNotice({ color: "teal", text: `${email} was already invited — dashboards updated.` });
        setLastInvite({ email, features: merged });
      } else {
        await setDoc(ref, {
          email,
          features: inviteFeatures,
          invitedBy: myEmail,
          invitedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setNotice({ color: "teal", text: `${email} is invited. Send them the message below.` });
        setLastInvite({ email, features: inviteFeatures });
      }
      setInviteEmail("");
      setInviteFeatures([]);
    } catch (err) {
      console.error("Invite failed:", err);
      setNotice({ color: "red", text: "Invite failed. Check your connection and the Firestore rules." });
    } finally {
      setInviting(false);
    }
  };

  const toggleFeature = async (admin, key) => {
    const has = (admin.features || []).includes(key);
    const next = has ? admin.features.filter((k) => k !== key) : [...(admin.features || []), key];
    setBusyEmail(admin.id);
    try {
      await updateDoc(doc(db, ADMINS_COLLECTION, admin.id), {
        features: next,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Could not update access:", err);
      setNotice({ color: "red", text: `Could not update ${admin.id}.` });
    } finally {
      setBusyEmail("");
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setBusyEmail(removeTarget.id);
    try {
      await deleteDoc(doc(db, ADMINS_COLLECTION, removeTarget.id));
      setNotice({ color: "teal", text: `${removeTarget.id} no longer has access.` });
      if (lastInvite?.email === removeTarget.id) setLastInvite(null);
    } catch (err) {
      console.error("Could not remove admin:", err);
      setNotice({ color: "red", text: `Could not remove ${removeTarget.id}.` });
    } finally {
      setBusyEmail("");
      setRemoveTarget(null);
    }
  };

  return (
    <InternalLayout align="top">
      <div className={styles.page}>
        <a href="/internal" className={styles.back}>
          <IconArrowLeft size={16} /> Internal Access
        </a>

        <Card className={styles.panel}>
          <AccountBar />

          <div className={styles.heading}>
            <span className={styles.headingIcon}>
              <IconUsersGroup size={22} />
            </span>
            <div>
              <Title order={2} className={styles.headingTitle}>
                Access Control
              </Title>
              <Text className={styles.headingText}>
                Invite a Google account and choose the dashboards it can open. Changes apply
                instantly — no password is ever shared.
              </Text>
            </div>
          </div>

          {/* ---------- Invite ---------- */}
          <form className={styles.inviteBox} onSubmit={handleInvite}>
            <Text className={styles.sectionLabel}>Invite an admin</Text>
            <TextInput
              type="email"
              placeholder="name@gmail.com"
              leftSection={<IconMail size={16} />}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={inviting}
              size="md"
              autoComplete="off"
            />
            <Text size="sm" c="dimmed" mt="sm" mb={6}>
              Dashboards
            </Text>
            <Chip.Group multiple value={inviteFeatures} onChange={setInviteFeatures}>
              <Group gap="xs">
                {FEATURES.map((f) => (
                  <Chip key={f.key} value={f.key} variant="light" radius="sm">
                    {f.title}
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
              Invite
            </Button>
          </form>

          {notice && (
            <Alert color={notice.color} mt="md" withCloseButton onClose={() => setNotice(null)}>
              {notice.text}
            </Alert>
          )}

          {lastInvite && (
            <div className={styles.shareBox}>
              <Text size="sm" fw={600}>
                Invite message for {lastInvite.email}
              </Text>
              <pre className={styles.shareText}>{inviteMessage(lastInvite.email, lastInvite.features)}</pre>
              <Group gap="xs">
                <CopyButton value={inviteMessage(lastInvite.email, lastInvite.features)}>
                  {({ copied, copy }) => (
                    <Button
                      size="xs"
                      variant="light"
                      color={copied ? "teal" : "blue"}
                      leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      onClick={copy}
                    >
                      {copied ? "Copied" : "Copy message"}
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
                  href={`https://wa.me/?text=${encodeURIComponent(inviteMessage(lastInvite.email, lastInvite.features))}`}
                  leftSection={<IconBrandWhatsapp size={14} />}
                >
                  WhatsApp
                </Button>
              </Group>
            </div>
          )}

          {/* ---------- Admins ---------- */}
          <Text className={styles.sectionLabel} mt="xl">
            Admins {admins ? `(${admins.length + 1})` : ""}
          </Text>

          {listError && (
            <Alert color="red" mb="sm">
              {listError}
            </Alert>
          )}

          <div className={styles.list}>
            <div className={`${styles.row} ${styles.rowSuper}`}>
              <div className={styles.person}>
                <Avatar radius="xl" color="violet">
                  S
                </Avatar>
                <div className={styles.personText}>
                  <span className={styles.personEmail}>{SUPER_ADMIN_EMAIL}</span>
                  <span className={styles.personMeta}>Super admin · every dashboard · can invite</span>
                </div>
              </div>
              <Badge color="violet" variant="light">
                Super admin
              </Badge>
            </div>

            {admins === null && (
              <Group justify="center" py="lg">
                <Loader size="sm" />
              </Group>
            )}

            {admins?.length === 0 && !listError && (
              <Text c="dimmed" ta="center" py="lg" size="sm">
                No admins yet. Invite the first one above.
              </Text>
            )}

            {admins?.map((admin) => (
              <div className={styles.row} key={admin.id}>
                <div className={styles.person}>
                  <Avatar src={admin.photoURL || null} radius="xl">
                    {(admin.displayName || admin.id).charAt(0).toUpperCase()}
                  </Avatar>
                  <div className={styles.personText}>
                    <span className={styles.personEmail}>
                      {admin.displayName ? `${admin.displayName} · ` : ""}
                      {admin.id}
                    </span>
                    <span className={styles.personMeta}>
                      {admin.lastLoginAt ? (
                        <Badge size="xs" color="teal" variant="dot">
                          Active · last sign-in {timeAgo(admin.lastLoginAt)}
                        </Badge>
                      ) : (
                        <Badge size="xs" color="gray" variant="dot">
                          Pending · invited {timeAgo(admin.invitedAt)}
                        </Badge>
                      )}
                    </span>
                  </div>
                </div>

                <div className={styles.rowActions}>
                  <Group gap={6} className={styles.featureChips}>
                    {FEATURES.map((f) => {
                      const on = (admin.features || []).includes(f.key);
                      return (
                        <button
                          type="button"
                          key={f.key}
                          className={`${styles.featureToggle} ${on ? styles.featureOn : ""}`}
                          onClick={() => toggleFeature(admin, f.key)}
                          disabled={busyEmail === admin.id}
                          aria-pressed={on}
                          title={on ? `Remove ${f.title}` : `Give ${f.title}`}
                        >
                          {on ? <IconCheck size={13} /> : null}
                          {f.title}
                        </button>
                      );
                    })}
                  </Group>
                  <Tooltip label="Remove access">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => setRemoveTarget(admin)}
                      loading={busyEmail === admin.id}
                      aria-label={`Remove ${admin.id}`}
                    >
                      <IconTrash size={17} />
                    </ActionIcon>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>

          <Text className={portal.footerText}>
            An admin with no dashboards ticked keeps their invite but cannot open anything.
          </Text>
        </Card>
      </div>

      <Modal opened={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Remove access" centered>
        <Text size="sm">
          <strong>{removeTarget?.id}</strong> will lose access to every internal dashboard straight away.
          You can invite them again later.
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmRemove} loading={!!busyEmail}>
            Remove
          </Button>
        </Group>
      </Modal>
    </InternalLayout>
  );
}
