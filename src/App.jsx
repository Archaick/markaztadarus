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
          {/* Main page with all sections */}
          <Route path="/" element={<MainPage />} />
          
          {/* Dedicated program pages without navbar and footer */}
          {/* <Route path="/program1" element={<div>Program 1 Details</div>} />
          <Route path="/program2" element={<div>Program 2 Details</div>} />
          <Route path="/program3" element={<div>Program 3 Details</div>} /> */}
          
          {/* 404 Error page */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
};

export default App;
