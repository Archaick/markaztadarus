import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { redirects } from "./config";
import { db } from "../../../firebaseConfig";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

const REDIRECT_COLLECTION = "redirect_manager_links";

export default function Redirects() {
  const { shortCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const resolveRedirect = async () => {
      try {
        const source = `/${(shortCode || "").trim().toLowerCase()}`;
        const snapshot = await getDocs(
          query(collection(db, REDIRECT_COLLECTION), where("source", "==", source), limit(1))
        );

        if (!isMounted) {
          return;
        }

        if (!snapshot.empty) {
          const destination = snapshot.docs[0]?.data()?.destination;
          if (destination) {
            window.location.href = destination;
            return;
          }
        }

        const fallbackUrl = redirects[shortCode];
        if (fallbackUrl) {
          window.location.href = fallbackUrl;
          return;
        }

        navigate("/");
      } catch (error) {
        console.error("Redirect lookup error:", error);
        const fallbackUrl = redirects[shortCode];
        if (fallbackUrl) {
          window.location.href = fallbackUrl;
        } else {
          navigate("/");
        }
      }
    };

    resolveRedirect();

    return () => {
      isMounted = false;
    };
  }, [shortCode, navigate]);

  return null; // No render needed
}
