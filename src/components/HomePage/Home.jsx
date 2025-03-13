import React from "react";
import Hero from "./Hero/Hero";
import Methods from "./Methods/Methods";
import About from "./About/About";
import Map from "./Map/Map";
import Gallery from "./Gallery/Gallery";

const Home = () => {
  return (
    <div>
      <Hero />
      <Methods />
      <About />
      <Map />
      <Gallery />
    </div>
  );
};

export default Home;
