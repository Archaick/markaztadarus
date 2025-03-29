import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { Helmet } from "react-helmet-async";
import Navbar from "./components/Navbar/Navbar";
import NavbarHome from "./components/Navbar/NavbarHome";
import Footer from "./components/Footer/Footer";
import Hero from "./components/Hero/Hero";
import Programs from "./components/Programs/Programs";
import Leaders from "./components/Leaders/Leaders";
import Quote from "./components/Quote/Quote";
import Gallery from "./components/Gallery/Gallery";
import Marquee from "./components/Marquee/Marquee";
import ErrorPage from "./components/ErrorPage/ErrorPage";
import UT from "./components/Programs/UT";
import DS from "./components/Programs/DS";
import DQ from "./components/Programs/DQ";
import Home from "./components/HomePage/Home";

const MainPage = () => (
  <>
    <Helmet>
      <title>Markaz Tadarus Indonesia - Umrah dan Kursus di Makkah</title>
      <meta
        name="description"
        content="Markaz Tadarus menghadirkan Umrah unik dengan kursus di Makkah. Perkuat pemahaman agama sambil beribadah untuk pengalaman spiritual mendalam."
      />
      <link rel="canonical" href="https://markaztadarus.com" />
    </Helmet>
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

const HomePage = () => (
  <>
    <NavbarHome />
    <Home />
    <Footer />
  </>
);

const App = () => {
  return (
    <MantineProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/umrah" element={<MainPage />} />
          <Route path="/ut" element={<UT />} />
          <Route path="/ds" element={<DS />} />
          <Route path="/dq" element={<DQ />} />
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
};

export default App;
