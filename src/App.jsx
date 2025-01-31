import React from "react";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero"
import ProgramHighlights from "./components/ProgramHighlights/ProgramHighlights";
import Programs from "./components/Programs/Programs";
import Leaders from "./components/Leaders/Leaders";
import Quote from "./components/Quote/Quote";

const App = () => {
  return (
    <MantineProvider>
      <Navbar />
      <Hero />
      <ProgramHighlights />
      <Programs />
      <Leaders />
      <Quote />
    </MantineProvider>
  );
};

export default App;
