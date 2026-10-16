import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import { SITE_COLLECTION } from "../HomePage/siteContent";
import { stableKey } from "../Internal/stableKey";

// For the history: which provinces (map) changed, or how many figures (stats).
function whatChanged(before, after) {
  if (after.provinces) {
    const old = before?.provinces || {};
    const names = [...new Set([...Object.keys(old), ...Object.keys(after.provinces)])];
    const changed = names.filter((name) => stableKey(old[name] ?? null) !== stableKey(after.provinces[name] ?? null));
    return { provinces: changed, count: Object.keys(after.provinces).length };
  }
  if (after.items) return { count: after.items.length };
  return {};
}

// Edits one site_content document. `toDraft` turns the stored document (or
// null when it has never been saved, which means "start from the built-in
// data") into the editor's shape.
export function useSiteDraft(docId, toDraft, editorEmail) {
  const { user } = useAccess();
  const [stored, setStored] = useState(undefined); // undefined = loading
  const [loadFailed, setLoadFailed] = useState(false);
  const [draft, setDraft] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const baselineRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const toDraftRef = useRef(toDraft);
  toDraftRef.current = toDraft;

  useEffect(
    () =>
      onSnapshot(
        doc(db, SITE_COLLECTION, docId),
        (snap) => {
          setStored(snap.exists() ? snap.data() : null);
          setLoadFailed(false);
        },
        (err) => {
          console.error(`Could not load ${docId}:`, err);
          setLoadFailed(true);
          setStored(null);
        }
      ),
    [docId]
  );

  // Take in saved changes, unless there are local edits to keep.
  useEffect(() => {
    if (stored === undefined) return;
    const incoming = toDraftRef.current(stored);
    const incomingKey = stableKey(incoming);
    const previous = baselineRef.current;
    if (incomingKey === previous) return;
    baselineRef.current = incomingKey;
    setBaseline(incomingKey);
    setDraft((current) => (current === null || stableKey(current) === previous ? incoming : current));
  }, [stored]);

  const dirty = draft !== null && stableKey(draft) !== baseline;

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = async (data) => {
    setSaving(true);
    try {
      await auditedWrite(user, { area: "site", action: `site.${docId}`, target: docId, details: whatChanged(stored, data) }, (batch, auditId) =>
        batch.set(doc(db, SITE_COLLECTION, docId), {
          ...data,
          auditId,
          updatedBy: editorEmail,
          updatedAt: serverTimestamp(),
        })
      );
      return true;
    } catch (err) {
      console.error(`Could not save ${docId}:`, err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    loading: stored === undefined || draft === null,
    loadFailed,
    fromBuiltIn: stored === null && !loadFailed,
    draft,
    setDraft,
    dirty,
    discard: () => setDraft(toDraftRef.current(stored)),
    save,
    saving,
  };
}
