import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { redirects } from "./config";

export default function Redirects() {
  const { shortCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const targetUrl = redirects[shortCode];

    if (targetUrl) {
      // Immediate redirect (better than <Navigate> for external URLs)
      window.location.href = targetUrl;
    } else {
      navigate("/"); // Fallback to home if code not found
    }
  }, [shortCode, navigate]);

  return null; // No render needed
}
