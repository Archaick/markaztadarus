import { useEffect } from "react";
import Hero from "./Hero/Hero";
import About from "./About/About";
import Map from "./Map/Map";
import Stats from "./Stats/Stats";
import LatestNews from "../Blog/LatestNews";
import MarqueeComponent from "./Marquee/Marquee";
import Programs from "./Programs/Programs";
import Whatsapp from "../Whatsapp/Whatsapp";
const Home = () => {
  // Links like /#about from other pages: the browser's own jump runs before
  // the sections exist, so scroll once they are on the page.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return undefined;
    const timer = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <Hero />
      <About />
      <Map />
      <Programs />
      <Stats />
      <LatestNews />
      <MarqueeComponent />
      <Whatsapp />
    </div>
  );
};

export default Home;
