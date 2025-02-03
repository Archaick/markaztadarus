import React, { useRef } from "react";
import "@mantine/carousel/styles.css";
import { Carousel } from "@mantine/carousel";
import Autoplay from "embla-carousel-autoplay";
import SlideOne from "../../assets/imgs/gallery/slide1.png";
import SlideTwo from "../../assets/imgs/gallery/slide2.png";
import SlideThree from "../../assets/imgs/gallery/slide3.png";
import SlideFour from "../../assets/imgs/gallery/slide4.jpg";
import SlideFive from "../../assets/imgs/gallery/slide5.png";
import styles from "./Gallery.module.css"; // Import CSS module

const Gallery = () => {
  const images = [SlideOne, SlideTwo, SlideThree, SlideFour, SlideFive];
  const autoplay = useRef(Autoplay({ delay: 3000 }));

  return (
    <section
      style={{
        width: "100%",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        margin: "40px 0 40px 0"
      }}
      aria-labelledby="gallery-heading"
    >
      {/* Heading */}
      <div style={{ marginBottom: "20px" }}>
        <h2 id="gallery-heading" style={{ fontSize: "2rem", color: "#112a42", marginBottom: "8px", fontWeight: "700" }}>
          Galeri Program
        </h2>
        <p style={{ fontSize: "1.2rem", color: "#6c757d", marginBottom: "50px" }}>
          Program terlaksana tahun 1446 H / 2024 M
        </p>
      </div>

      {/* Full-Width Carousel */}
      <Carousel
        withIndicators
        height={500}
        plugins={[autoplay.current]}
        onMouseEnter={autoplay.current.stop}
        onMouseLeave={autoplay.current.reset}
        loop
        align="center"
        classNames={{
          indicators: styles.carouselIndicators,
          indicator: styles.carouselIndicator,
        }}
      >
        {images.map((image, index) => (
          <Carousel.Slide key={index}>
            <img
              src={image}
              alt={`Gallery Image ${index + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Carousel.Slide>
        ))}
      </Carousel>
    </section>
  );
};

export default Gallery;
