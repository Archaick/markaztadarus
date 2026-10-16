import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";
import { AccessContext } from "./accessContext";
import { auditedWrite } from "./audit";
import {
  ADMINS_COLLECTION,
  FEATURE_KEYS,
  SUPER_ADMIN_EMAIL,
  normalizeEmail,
} from "./access";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Visits closer together than this count as one sign-in in the history.
const SIGN_IN_GAP_MS = 6 * 3600 * 1000;

export default function AccessProvider({ children }) {
  // undefined while Firebase restores the session, null when signed out
  const [user, setUser] = useState(undefined);
  const [invite, setInvite] = useState({ email: null, data: null });
  const recordedLoginFor = useRef(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const email = user?.emailVerified ? normalizeEmail(user.email) : "";
  const isSuperAdmin = email === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    if (!email || isSuperAdmin) return undefined;

    const ref = doc(db, ADMINS_COLLECTION, email);
    return onSnapshot(
      ref,
      (snap) => {
        setInvite({ email, data: snap.exists() ? snap.data() : null });

        // Lets the super admin see who has accepted their invite.
        if (snap.exists() && recordedLoginFor.current !== email) {
          recordedLoginFor.current = email;
          const stamp = {
            lastLoginAt: serverTimestamp(),
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
          };
          // A new history line when they come back after a while, so the
          // super admin sees who signed in and when.
          const last = snap.data().lastLoginAt?.toMillis?.() || 0;
          const write =
            Date.now() - last > SIGN_IN_GAP_MS
              ? auditedWrite(user, { area: "access", action: "admin.signin", target: email, label: email }, (batch) => batch.update(ref, stamp))
              : updateDoc(ref, stamp);
          write.catch((err) => console.error("Could not record login:", err));
        }
      },
      (err) => {
        console.error("Could not read access:", err);
        setInvite({ email, data: null });
      }
    );
  }, [email, isSuperAdmin, user]);

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code === "auth/popup-blocked") {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw err;
    }
  }, []);

  const signOutUser = useCallback(() => {
    recordedLoginFor.current = null;
    return signOut(auth);
  }, []);

  const value = useMemo(() => {
    const inviteLoaded = isSuperAdmin || !email || invite.email === email;
    const features = isSuperAdmin
      ? FEATURE_KEYS
      : invite.email === email && Array.isArray(invite.data?.features)
        ? invite.data.features
        : [];

    return {
      user: user || null,
      email,
      loading: user === undefined || (!!user && !inviteLoaded),
      isSuperAdmin,
      features,
      hasFeature: (key) => features.includes(key),
      signInWithGoogle,
      signOutUser,
    };
  }, [user, email, isSuperAdmin, invite, signInWithGoogle, signOutUser]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}
