import React from "react";
import Hero from "./Hero/Hero";
import Methods from "./Methods/Methods";
import About from "./About/About";
import Map from "./Map/Map";
import Gallery from "./Gallery/Gallery";
import MarqueeComponent from "./Marquee/Marquee";
import Programs from "./Programs/Programs";

const Home = () => {
  return (
    <div>
      <Hero />
      <Methods />
      <About />
      <Programs />
      <Map />
      <Gallery />
      <MarqueeComponent />
    </div>
  );
};

export default Home;
