import React, { useRef } from "react";
import "@mantine/carousel/styles.css";
import { Carousel } from "@mantine/carousel";
import Autoplay from "embla-carousel-autoplay";
import SlideOne from "../../assets/imgs/gallery/slide1.webp";
import SlideTwo from "../../assets/imgs/gallery/slide2.webp";
import SlideThree from "../../assets/imgs/gallery/slide3.webp";
import SlideFour from "../../assets/imgs/gallery/slide4.webp";
import SlideFive from "../../assets/imgs/gallery/slide5.webp";
import styles from "./Gallery.module.css"; // Import CSS module

const Gallery = () => {
  const images = [SlideOne, SlideTwo, SlideThree, SlideFour, SlideFive];
  const autoplay = useRef(
    Autoplay({ 
      delay: 3000, 
      stopOnInteraction: false // Keeps autoplay running even if the user interacts remove if needed
    })
  );

  return (
    <section
      style={{
        width: "100%",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        paddingTop: "100px",
        backgroundColor: "#f9f9f9",
      }}
      aria-labelledby="gallery-heading"
      id="gallery"
    >
      {/* Heading */}
      <div style={{ marginBottom: "20px" }}>
        <h2
          id="gallery-heading"
          style={{
            fontSize: "2rem",
            color: "#112a42",
            marginBottom: "8px",
            fontWeight: "700",
          }}
        >
          Galeri Program
        </h2>
        <p
          style={{ fontSize: "1.2rem", color: "#6c757d", marginBottom: "50px" }}
        >
          Program terlaksana tahun 1446 H / 2024 M
        </p>
      </div>

      {/* Full-Width Carousel */}
      <Carousel
        withIndicators
        height={500}
        plugins={[autoplay.current]}
        loop
        align="center"
        slideSize="70%" // Adjust slide size to show hints of adjacent slides
        slideGap="md" // Add gap between slides
        slidesToScroll={1} // Scroll one slide at a time
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