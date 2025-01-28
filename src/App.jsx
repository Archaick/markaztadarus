import React from "react";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero"

const App = () => {
  return (
    <MantineProvider>
      <Navbar />
      <Hero />
    </MantineProvider>
  );
};

export default App;
