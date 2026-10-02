import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Badge, Card, Group, Loader, SegmentedControl, Tabs, Text, Title } from "@mantine/core";
import { IconArrowLeft, IconListDetails, IconMessages, IconShare } from "@tabler/icons-react";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { AccountBar, InternalLayout } from "../Internal/InternalUI";
import layout from "../Internal/AccessControl.module.css";
import styles from "./Forms.module.css";
import { FORMS_COLLECTION, STATUS } from "./formSchema";
import FormBuilder from "./FormBuilder";
import ResponsesPanel from "./ResponsesPanel";
import SharePanel from "./SharePanel";

export default function FormDetail() {
  const { formId } = useParams();
  const { email } = useAccess();
  const [form, setForm] = useState(undefined);
  const [tab, setTab] = useState("questions");
  const [statusError, setStatusError] = useState("");

  useEffect(
    () =>
      onSnapshot(
        doc(db, FORMS_COLLECTION, formId),
        (snap) => setForm(snap.exists() ? { id: snap.id, ...snap.data() } : null),
        (err) => {
          console.error("Could not load form:", err);
          setForm(null);
        }
      ),
    [formId]
  );

  const changeStatus = async (status) => {
    setStatusError("");
    try {
      await updateDoc(doc(db, FORMS_COLLECTION, formId), {
        status,
        updatedBy: email,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Could not change status:", err);
      setStatusError("Could not change the status. Try again.");
    }
  };

  return (
    <InternalLayout align="top">
      <div className={layout.page}>
        <a href="/internal/forms" className={layout.back}>
          <IconArrowLeft size={16} /> All forms
        </a>

        <Card className={layout.panel}>
          <AccountBar />

          {form === undefined && (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          )}

          {form === null && (
            <Alert color="red" mt="lg" title="Form not found">
              /form/{formId} does not exist, or it was deleted.
            </Alert>
          )}

          {form && (
            <>
              <div className={styles.detailHeader}>
                <div className={styles.detailTitleWrap}>
                  <Title order={2} className={layout.headingTitle}>
                    {form.title || "Untitled form"}
                  </Title>
                  <Text size="sm" c="dimmed">
                    /form/{form.id}
                  </Text>
                </div>
                <div className={styles.statusBox}>
                  <SegmentedControl
                    value={form.status || "draft"}
                    onChange={changeStatus}
                    data={Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))}
                    color={STATUS[form.status]?.color || "gray"}
                    size="sm"
                  />
                  <Text size="xs" c="dimmed" mt={4}>
                    {STATUS[form.status]?.hint || STATUS.draft.hint}
                  </Text>
                </div>
              </div>

              {statusError && (
                <Alert color="red" mt="sm">
                  {statusError}
                </Alert>
              )}

              <Tabs value={tab} onChange={setTab} mt="lg" keepMounted={false} color="teal">
                <Tabs.List grow>
                  <Tabs.Tab value="questions" leftSection={<IconListDetails size={16} />}>
                    Questions
                  </Tabs.Tab>
                  <Tabs.Tab value="responses" leftSection={<IconMessages size={16} />}>
                    Responses
                  </Tabs.Tab>
                  <Tabs.Tab value="share" leftSection={<IconShare size={16} />}>
                    Share
                    {form.status !== "open" && (
                      <Badge size="xs" color="gray" variant="light" ml={6}>
                        {STATUS[form.status]?.label || "Draft"}
                      </Badge>
                    )}
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="questions" pt="lg">
                  <FormBuilder form={form} editorEmail={email} />
                </Tabs.Panel>
                <Tabs.Panel value="responses" pt="lg">
                  <ResponsesPanel form={form} />
                </Tabs.Panel>
                <Tabs.Panel value="share" pt="lg">
                  <SharePanel form={form} onOpen={() => changeStatus("open")} />
                </Tabs.Panel>
              </Tabs>
            </>
          )}
        </Card>
      </div>
    </InternalLayout>
  );
}
