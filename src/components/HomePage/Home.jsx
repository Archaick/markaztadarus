import { Suspense, lazy, useEffect } from "react";
import Hero from "./Hero/Hero";
import About from "./About/About";
// owner: the home page shows Tadarus Global (the dark globe) in place of the light map
const GlobalPage = lazy(() => import("../Global/GlobalPage"));
import Stats from "./Stats/Stats";
import LatestNews from "../Blog/LatestNews";
import MarqueeComponent from "./Marquee/Marquee";
import Programs from "./Programs/Programs";
import Whatsapp from "../Whatsapp/Whatsapp";
import styles from "./Home.module.css";
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
    <div className={styles.home}>
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.pattern} />
        <span className={`${styles.blob} ${styles.gold}`} />
        <span className={`${styles.blob} ${styles.navy}`} />
        <span className={`${styles.blob} ${styles.teal}`} />
      </div>
      <Hero />
      <About />
      <section id="map" style={{ scrollMarginTop: 90 }}>
        <Suspense fallback={<div style={{ minHeight: 600 }} />}>
          <GlobalPage embedded />
        </Suspense>
      </section>
      <Programs />
      <Stats />
      <LatestNews />
      <MarqueeComponent />
      <Whatsapp />
    </div>
  );
};

export default Home;
