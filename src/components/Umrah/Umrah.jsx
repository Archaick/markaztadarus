import React from "react";
import Hero from "./Hero/Hero";
import Navbar from "../Navbar/Navbar";
import Programs from "./Programs/Programs";
import Leaders from "./Leaders/Leaders";
import Gallery from "./Gallery/Gallery";
import UmrahMarquee from "./Marquee/Marquee";
import Footer from "../Footer/Footer";
import Quote from "./Quote/Quote";

const Umrah = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Programs />
      <Leaders />
      <Quote />
      <Gallery />
      <UmrahMarquee />
      <Footer />
    </>
  );
};

export default Umrah;
