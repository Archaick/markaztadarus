import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "@mantine/core/styles.css";
// the home page's program carousel (and the program pages) need these from the first load
import "@mantine/carousel/styles.css";
import { MantineProvider } from "@mantine/core";

// In the first download: the home page, short links (every QR scan lands
// there, so it must be instant) and the error page.
import NavbarHome from "./components/Navbar/NavbarHome";
import Footer from "./components/Footer/Footer";
import ErrorPage from "./components/ErrorPage/ErrorPage";
import Home from "./components/HomePage/Home";
import Redirects from "./components/Redirects/Redirects";
import AccessProvider from "./components/Internal/AccessProvider";
import RequireFeature, { FeatureLogin } from "./components/Internal/RequireFeature";

// Everything else is fetched when it is opened, so a visitor never downloads
// the dashboards and an admin only downloads the dashboard in use.
const { lazy } = React;
const UT = lazy(() => import("./components/Umrah/Programs/UT"));
const DS = lazy(() => import("./components/Umrah/Programs/DS"));
const DQ = lazy(() => import("./components/Umrah/Programs/DQ"));
const Umrah = lazy(() => import("./components/Umrah/Umrah"));
const Ilmiah = lazy(() => import("./components/Ilmiah/Ilmiah"));
const Pelatihan = lazy(() => import("./components/Pelatihan/Pelatihan"));
const Seminar = lazy(() => import("./components/Seminar/Seminar"));
const Majelis = lazy(() => import("./components/Majelis/Majelis"));
const LinkTree = lazy(() => import("./components/LinkTree/LinkTree"));
const BlogList = lazy(() => import("./components/Blog/BlogList"));
const BlogPost = lazy(() => import("./components/Blog/BlogPost"));
const PostPreviewPage = lazy(() => import("./components/Blog/PostPreviewPage"));
const PublicForm = lazy(() => import("./components/Forms/PublicForm"));
const CertificateVerify = lazy(() => import("./components/Certify/CertificateVerify"));
const GlobalPage = lazy(() => import("./components/Global/GlobalPage"));
// import Hidayah from "./components/Hidayah/Hidayah";

const InternalHub = lazy(() => import("./components/Internal/InternalHub"));
const AccessControl = lazy(() => import("./components/Internal/AccessControl"));
const History = lazy(() => import("./components/Internal/History"));
const SupervisiApp = lazy(() => import("./components/Supervisi/SupervisiApp"));
const RedirectAdmin = lazy(() => import("./components/RedirectManager/RedirectAdmin"));
const FormsAdmin = lazy(() => import("./components/Forms/FormsAdmin"));
const FormDetail = lazy(() => import("./components/Forms/FormDetail"));
const WebsiteAdmin = lazy(() => import("./components/Website/WebsiteAdmin"));
const PostEditor = lazy(() => import("./components/Website/PostEditor"));
const GlobalAdmin = lazy(() => import("./components/Global/GlobalAdmin"));
const Admin = lazy(() => import("./components/Certify/Admin"));

const App = () => {
  return (
    <MantineProvider>
      <AccessProvider>
        <Router>
          <React.Suspense fallback={null}>
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
          </React.Suspense>
        </Router>
      </AccessProvider>
    </MantineProvider>
  );
};

export default App;
