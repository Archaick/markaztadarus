import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
// add firebase auth
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";

// Components
import NavbarHome from "./components/Navbar/NavbarHome";
import Footer from "./components/Footer/Footer";
import ErrorPage from "./components/ErrorPage/ErrorPage";
import UT from "./components/Umrah/Programs/UT";
import DS from "./components/Umrah/Programs/DS";
import DQ from "./components/Umrah/Programs/DQ";
import Home from "./components/HomePage/Home";
import Umrah from "./components/Umrah/Umrah";
import Redirects from "./components/Redirects/Redirects";
import Ilmiah from "./components/Ilmiah/Ilmiah";
import Pelatihan from "./components/Pelatihan/Pelatihan";
import Seminar from "./components/Seminar/Seminar";
import Majelis from "./components/Majelis/Majelis";
import LinkTree from "./components/LinkTree/LinkTree";
import InternalHub from "./components/Internal/InternalHub";
import RedirectAdmin from "./components/RedirectManager/RedirectAdmin";
import RedirectAdminLogin from "./components/RedirectManager/RedirectAdminLogin";
// import Hidayah from "./components/Hidayah/Hidayah";

// Certify
import Admin from "./components/Certify/Admin";
import AdminLogin from "./components/Certify/AdminLogin";
import CertificateVerify from "./components/Certify/CertificateVerify";

const App = () => {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCheckingAuth(false);
    });
    return unsubscribe;
  }, []);

  if (checkingAuth) return null; // optional: show a loading spinner

  return (
    <MantineProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <NavbarHome />
                <Home />
                <Footer />
              </>
            }
          />
          <Route path="/umrah" element={<Umrah />} />
          <Route path="/ut" element={<UT />} />
          <Route path="/ts" element={<DS />} />
          <Route path="/dq" element={<DQ />} />

          <Route path="/ilmiah" element={<Ilmiah />} />
          <Route path="/Pelatihan" element={<Pelatihan />} />
          <Route path="/Seminar" element={<Seminar />} />
          <Route path="/Majelis" element={<Majelis />} />
          <Route path="/linktree" element={<LinkTree />} />
          {/* <Route path="/hidayah" element={<Hidayah />} /> */}

          {/* 🔐 Protected Route for Admin Panel */}
          <Route
            path="/cert-admin"
            element={user ? <Admin /> : <Navigate to="/cert-login" />}
          />

          {/* Login page */}
          <Route
            path="/cert-login"
            element={<AdminLogin onLoginSuccess={() => window.location.href = "/cert-admin"} />}
          />

          {/* 📜 Certificate Verification - Public Route */}
          <Route path="/verify/:code" element={<CertificateVerify />} />
          <Route path="/internal" element={<InternalHub />} />
          <Route
            path="/internal/redirect-manager"
            element={user ? <RedirectAdmin /> : <Navigate to="/internal/redirect-login" />}
          />
          <Route
            path="/internal/redirect-login"
            element={<RedirectAdminLogin onLoginSuccess={() => (window.location.href = "/internal/redirect-manager")} />}
          />

          <Route path="/:shortCode" element={<Redirects />} />

          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
};

export default App;
