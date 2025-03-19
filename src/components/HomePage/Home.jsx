import React from "react";
import Hero from "./Hero/Hero";
import Methods from "./Methods/Methods";
import About from "./About/About";
import Map from "./Map/Map";
import Gallery from "./Gallery/Gallery";
import MarqueeComponent from "./Marquee/Marquee";
import Programs from "./Programs/Programs";
import Whatsapp from "../Whatsapp/Whatsapp";
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
      <Whatsapp />
    </div>
  );
};

export default Home;
