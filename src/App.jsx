import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import NavbarHome from "./components/Navbar/NavbarHome";
import Footer from "./components/Footer/Footer";
import ErrorPage from "./components/ErrorPage/ErrorPage";
import UT from "./components/Umrah/Programs/UT";
import DS from "./components/Umrah/Programs/DS";
import DQ from "./components/Umrah/Programs/DQ";
import Home from "./components/HomePage/Home";
import Umrah from "./components/Umrah/Umrah";
import Redirects from "./components/Redirects/Redirects";
// new pages
import Ilmiah from "./components/Ilmiah/Ilmiah";
import Pelatihan from "./components/Pelatihan/Pelatihan";
import Seminar from "./components/Seminar/Seminar";

const App = () => {
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

          {/* Add this new route above the catch-all route */}
          <Route path="/:shortCode" element={<Redirects />} />

          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
};

export default App;
