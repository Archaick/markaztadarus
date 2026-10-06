import { useTranslation } from "react-i18next";
import NavbarHome from "../Navbar/NavbarHome";
import Footer from "../Footer/Footer";
import styles from "./Blog.module.css";

// Same navbar and footer as the home page, with Arabic laid out right to left.
export default function BlogShell({ children }) {
  const { i18n } = useTranslation();
  return (
    <>
      <NavbarHome />
      <main className={styles.page} dir={i18n.language === "ar" ? "rtl" : "ltr"}>
        {children}
      </main>
      <Footer />
    </>
  );
}
