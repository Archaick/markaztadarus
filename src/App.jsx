import React from "react";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero"
import ProgramHighlights from "./components/ProgramHighlights/ProgramHighlights";

const App = () => {
  return (
    <MantineProvider>
      <Navbar />
      <Hero />
      <ProgramHighlights />
    </MantineProvider>
  );
};

export default App;
