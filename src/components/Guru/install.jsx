import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Makes /guru installable as its own app ("Tadarus Guru"): the manifest and
// icons are added to the page only here (the rest of the site is not an app),
// the service worker is registered for /guru only, and the browser's install
// prompt is kept for our own button. iPhones have no prompt: they get steps.

const InstallContext = createContext({ canInstall: false, ios: false, installed: false, install: async () => false });
export const useInstall = () => useContext(InstallContext);

const HEAD = [
  ["link", { rel: "manifest", href: "/guru-app/manifest.webmanifest" }],
  ["link", { rel: "apple-touch-icon", href: "/guru-app/apple-touch-icon.png" }],
  ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
  ["meta", { name: "mobile-web-app-capable", content: "yes" }],
  ["meta", { name: "apple-mobile-web-app-title", content: "Tadarus Guru" }],
  ["meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" }],
];

const standalone = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

export function InstallProvider({ children }) {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(standalone);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // the app's own head tags while /guru is open
    const added = HEAD.map(([tag, attrs]) => {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
      return el;
    });
    const theme = document.querySelector('meta[name="theme-color"]') || document.head.appendChild(Object.assign(document.createElement("meta"), { name: "theme-color" }));
    const themeBefore = theme.getAttribute("content");
    theme.setAttribute("content", "#0f2a4a");
    const titleBefore = document.title;
    document.title = "Tadarus Guru";

    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register("/guru-sw.js", { scope: "/guru" }).catch((err) => console.error("Could not register the app:", err));
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      added.forEach((el) => el.remove());
      if (themeBefore === null) theme.remove();
      else theme.setAttribute("content", themeBefore);
      document.title = titleBefore;
    };
  }, []);

  const install = useCallback(async () => {
    if (!prompt) return false;
    prompt.prompt();
    const choice = await prompt.userChoice.catch(() => null);
    setPrompt(null);
    return choice?.outcome === "accepted";
  }, [prompt]);

  return <InstallContext.Provider value={{ canInstall: !!prompt && !installed, ios: ios && !installed, installed, install }}>{children}</InstallContext.Provider>;
}
