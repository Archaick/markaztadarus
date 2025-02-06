import React from "react";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero"
import ProgramHighlights from "./components/ProgramHighlights/ProgramHighlights";
import Programs from "./components/Programs/Programs";
import Leaders from "./components/Leaders/Leaders";
import Quote from "./components/Quote/Quote";
import Marquee from "./components/Marquee/Marquee";
import Footer from "./components/Footer/Footer";
import Gallery from "./components/Gallery/Gallery";

const App = () => {
  return (
    <MantineProvider>
      <Navbar />
      <Hero />
      {/* <ProgramHighlights /> */}
      <Programs />
      <Leaders />
      <Quote />
      <Gallery />
      <Marquee />
      <Footer />
    </MantineProvider>
  );
};

export default App;
