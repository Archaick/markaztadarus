import React from 'react'
import Hero from "./Hero/hero";
import Navbar from './Navbar/Navbar';
import Footer from './Footer/Footer';
import Tujuan from './Tujuan/Tujuan';
import Khusus from './Specifics/Khusus';
import Target from './Target/Target';
import Syarat from './Syarat/Syarat';
import Participants from './Participants/Participants';
import Fasilitas from './Fasilitas/Fasilitas';
import Pembiayaan from './Pembiayaan/Pembiayaan';

const Seminar = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <Tujuan />
      <Khusus />
      <Target />
      <Syarat />
      <Participants />
      <Fasilitas />
      <Pembiayaan />

      <Footer />
    </div>
  );
}

export default Seminar
