import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

// Content the website admin edits from the Website dashboard.
export const SITE_COLLECTION = "site_content";
export const SITE_DOCS = { map: "map", stats: "stats" };

// Returns the stored document, or null while it loads, is missing, or fails;
// callers keep showing their built-in data in those cases.
export function useSiteContent(docId) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    getDoc(doc(db, SITE_COLLECTION, docId))
      .then((snap) => alive && setData(snap.exists() ? snap.data() : null))
      .catch((err) => console.error(`Could not load ${docId}:`, err));
    return () => {
      alive = false;
    };
  }, [docId]);

  return data;
}
