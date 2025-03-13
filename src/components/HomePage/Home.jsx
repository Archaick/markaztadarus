import React from "react";
import Hero from "./Hero/Hero";
import Methods from "./Methods/Methods";
import About from "./About/About";
import Map from "./Map/Map";

const Home = () => {
  return (
    <div>
      <Hero />
      <Methods />
      <About />
      <Map />
    </div>
  );
};

export default Home;
