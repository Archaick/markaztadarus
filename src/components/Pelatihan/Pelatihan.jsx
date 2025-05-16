import Navbar from "./Navbar";
import Footer from "./Footer";
import Hero from "./Hero/Hero";
import Train from "./Train/Train";
import Tujuan from "./Tujuan/Tujuan";
import Specifics from "./Specifics/Khusus";
import Target from "./Target/Target";
import Syarat from "./Syarat/Syarat";
import Participants from "./Participants/Participants";
import Fasilitas from "./Fasilitas/Fasilitas";
import Pembiayaan from "./Pembiayaan/Pembiayaan";

const Pelatihan = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <Tujuan />
      <Specifics />
      <Target />
      <Syarat />
      <Participants />
      <Fasilitas />
      <Pembiayaan />

      <Train />
      <Footer />
    </div>
  );
};

export default Pelatihan;
