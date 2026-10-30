import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Badge, Group, Loader, SegmentedControl, Tabs, Text } from "@mantine/core";
import { IconArrowLeft, IconListDetails, IconMessages, IconSettings, IconShare } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import FormsShell, { FORMS_BASE } from "./FormsShell";
import styles from "./Forms.module.css";
import app from "./FormsApp.module.css";
import { FORMS_COLLECTION, KEY_DOC, PRIVATE, STATUSES, STATUS_COLORS } from "./formSchema";
import FormBuilder from "./FormBuilder";
import FormCoverEditor from "./FormCoverEditor";
import ResponsesPanel from "./ResponsesPanel";
import SharePanel from "./SharePanel";
import QuizSettings from "./QuizSettings";

export default function FormDetail() {
  return (
    <FormsShell>
      <FormPage />
    </FormsShell>
  );
}

/** One form, with the whole width for building it: questions, responses, settings and sharing. */
function FormPage() {
  const { t } = useTranslation("internal/Forms");
  const { formId } = useParams();
  const { email, user } = useAccess();
  const [form, setForm] = useState(undefined);
  const [tab, setTab] = useState("questions");
  const [statusError, setStatusError] = useState(false);
  // the quiz answer key (question id → accepted answers), admins only
  const [quizKey, setQuizKey] = useState({});

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

  useEffect(
    () =>
      onSnapshot(
        doc(db, FORMS_COLLECTION, formId, PRIVATE, KEY_DOC),
        (snap) => setQuizKey(snap.exists() ? snap.data().key || {} : {}),
        () => setQuizKey({})
      ),
    [formId]
  );

  const changeStatus = async (status) => {
    setStatusError(false);
    try {
      await auditedWrite(
        user,
        { area: "forms", action: "form.status", target: formId, label: form?.title, details: { from: form?.status || "draft", to: status } },
        (batch, auditId) =>
          batch.update(doc(db, FORMS_COLLECTION, formId), {
            status,
            auditId,
            updatedBy: email,
            updatedAt: serverTimestamp(),
          })
      );
    } catch (err) {
      console.error("Could not change status:", err);
      setStatusError(true);
    }
  };

  return (
    <div className={`${app.page} ${app.pageWide}`}>
        <Link to={FORMS_BASE} className={app.crumb}>
          <IconArrowLeft size={16} className={app.flip} /> {t("allForms")}
        </Link>

        <div className={app.sheet}>

          {form === undefined && (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          )}

          {form === null && (
            <Alert color="red" mt="lg" title={t("detail.notFoundTitle")}>
              {t("detail.notFoundText", { id: formId })}
            </Alert>
          )}

          {form && (
            <>
              <div className={styles.detailHeader}>
                <div className={styles.detailTitleWrap}>
                  <h1 className={app.formTitle} dir="auto">
                    {form.title || t("untitled")}
                  </h1>
                  <Text size="sm" c="dimmed">
                    <bdi>/form/{form.id}</bdi>
                  </Text>
                </div>
                <div className={styles.statusBox}>
                  <SegmentedControl
                    value={form.status || "draft"}
                    onChange={changeStatus}
                    data={STATUSES.map((value) => ({ value, label: t(`status.${value}`) }))}
                    color={STATUS_COLORS[form.status] || "gray"}
                    size="sm"
                  />
                  <Text size="xs" c="dimmed" mt={4}>
                    {t(`status.hint.${STATUS_COLORS[form.status] ? form.status : "draft"}`)}
                  </Text>
                </div>
              </div>

              {statusError && (
                <Alert color="red" mt="sm">
                  {t("status.failed")}
                </Alert>
              )}

              <Tabs value={tab} onChange={setTab} mt="lg" keepMounted={false} color="teal">
                <Tabs.List grow>
                  <Tabs.Tab value="questions" leftSection={<IconListDetails size={16} />}>
                    {t("detail.tabs.questions")}
                  </Tabs.Tab>
                  <Tabs.Tab value="responses" leftSection={<IconMessages size={16} />}>
                    {t("detail.tabs.responses")}
                  </Tabs.Tab>
                  <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
                    {t("detail.tabs.settings")}
                  </Tabs.Tab>
                  <Tabs.Tab value="share" leftSection={<IconShare size={16} />}>
                    {t("detail.tabs.share")}
                    {form.status !== "open" && (
                      <Badge size="xs" color="gray" variant="light" ms={6}>
                        {t(`status.${STATUS_COLORS[form.status] ? form.status : "draft"}`)}
                      </Badge>
                    )}
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="questions" pt="lg">
                  <FormCoverEditor form={form} editorEmail={email} />
                  <FormBuilder form={form} editorEmail={email} quizKey={quizKey} />
                </Tabs.Panel>
                <Tabs.Panel value="responses" pt="lg">
                  <ResponsesPanel form={form} quizKey={quizKey} />
                </Tabs.Panel>
                <Tabs.Panel value="settings" pt="lg">
                  <QuizSettings form={form} quizKey={quizKey} editorEmail={email} />
                </Tabs.Panel>
                <Tabs.Panel value="share" pt="lg">
                  <SharePanel form={form} onOpen={() => changeStatus("open")} />
                </Tabs.Panel>
              </Tabs>
            </>
          )}
        </div>
    </div>
  );
}
