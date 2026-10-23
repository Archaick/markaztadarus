import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";

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
import AccessProvider from "./components/Internal/AccessProvider";
import AccessControl from "./components/Internal/AccessControl";
import History from "./components/Internal/History";
import SupervisiApp from "./components/Supervisi/SupervisiApp";
import RequireFeature, { FeatureLogin } from "./components/Internal/RequireFeature";
import RedirectAdmin from "./components/RedirectManager/RedirectAdmin";
import FormsAdmin from "./components/Forms/FormsAdmin";
import FormDetail from "./components/Forms/FormDetail";
import PublicForm from "./components/Forms/PublicForm";
import WebsiteAdmin from "./components/Website/WebsiteAdmin";
import PostEditor from "./components/Website/PostEditor";
import BlogList from "./components/Blog/BlogList";
import BlogPost from "./components/Blog/BlogPost";
import PostPreviewPage from "./components/Blog/PostPreviewPage";
import GlobalPage from "./components/Global/GlobalPage";
import GlobalAdmin from "./components/Global/GlobalAdmin";
// import Hidayah from "./components/Hidayah/Hidayah";

// Certify
import Admin from "./components/Certify/Admin";
import CertificateVerify from "./components/Certify/CertificateVerify";

const App = () => {
  return (
    <MantineProvider>
      <AccessProvider>
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

            {/* 🔐 Internal dashboards — Google sign-in, access granted per feature */}
            <Route path="/internal" element={<InternalHub />} />
            <Route
              path="/internal/access"
              element={<RequireFeature feature="super"><AccessControl /></RequireFeature>}
            />
            <Route path="/internal/supervisi/*" element={<SupervisiApp />} />
            <Route
              path="/internal/history"
              element={<RequireFeature feature="super"><History /></RequireFeature>}
            />
            <Route
              path="/cert-admin"
              element={<RequireFeature feature="certificates"><Admin /></RequireFeature>}
            />
            <Route path="/cert-login" element={<FeatureLogin feature="certificates" />} />
            <Route
              path="/internal/redirect-manager"
              element={<RequireFeature feature="redirects"><RedirectAdmin /></RequireFeature>}
            />
            <Route path="/internal/redirect-login" element={<FeatureLogin feature="redirects" />} />
            <Route
              path="/internal/forms"
              element={<RequireFeature feature="forms"><FormsAdmin /></RequireFeature>}
            />
            <Route
              path="/internal/forms/:formId"
              element={<RequireFeature feature="forms"><FormDetail /></RequireFeature>}
            />
            <Route
              path="/internal/global"
              element={<RequireFeature feature="global"><GlobalAdmin /></RequireFeature>}
            />
            <Route path="/global" element={<GlobalPage />} />
            <Route
              path="/internal/website"
              element={<RequireFeature feature="site"><WebsiteAdmin /></RequireFeature>}
            />
            <Route
              path="/internal/website/berita/:postId"
              element={<RequireFeature feature="site"><PostEditor /></RequireFeature>}
            />

            {/* 📜 Public pages */}
            <Route path="/verify/:code" element={<CertificateVerify />} />
            <Route path="/form/:formId" element={<PublicForm />} />
            <Route path="/berita" element={<BlogList />} />
            <Route path="/berita/:slug" element={<BlogPost />} />
            {/* drawn inside the news editor's preview frame */}
            <Route path="/internal/preview-post" element={<PostPreviewPage />} />

            <Route path="/:shortCode" element={<Redirects />} />

            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </Router>
      </AccessProvider>
    </MantineProvider>
  );
};

export default App;
