import React from "react";
import Hero from "./Hero/Hero";
import Footer from "./Footer/Footer";
import Navbar from "./Navbar/Navbar";
import Tujuan from "./Tujuan/Tujuan";
import Khusus from "./Specifics/Khusus";
import Target from "./Target/Target";

import Book from "./Book/Book";
import Participants from "./Participants/Participants";
const Majelis = () => {
  return (
    <div>
      <Navbar />

      <Hero />
      <Tujuan />
      <Khusus />
      <Book />
      <Target />

      <Participants />
      <Footer />
    </div>
  );
};
export default Majelis;
