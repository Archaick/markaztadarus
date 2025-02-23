import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Hero from "./components/Hero/Hero";
import Programs from "./components/Programs/Programs";
import Leaders from "./components/Leaders/Leaders";
import Quote from "./components/Quote/Quote";
import Gallery from "./components/Gallery/Gallery";
import Marquee from "./components/Marquee/Marquee";
import ErrorPage from "./components/ErrorPage/ErrorPage";
// Programs
import UT from "./components/Programs/UT";
import DS from "./components/Programs/DS";
import DQ from "./components/Programs/DQ";

const MainPage = () => (
  <>
    <Navbar />
    <Hero />
    <Programs />
    <Leaders />
    <Quote />
    <Gallery />
    <Marquee />
    <Footer />
  </>
);

const App = () => {
  return (
    <MantineProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/ut" element={<UT />} />
          <Route path="/ds" element={<DS />} />
          {/* <Route path="/dq" element={<DQ />} /> */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
};


export default App;
