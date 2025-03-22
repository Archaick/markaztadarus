// WhatsAppButton.jsx
import React from "react";
import { IconBrandWhatsapp } from "@tabler/icons-react"; // Assuming you're using tabler icons
import styles from "./Whatsapp.module.css";

const Whatsapp = ({
  phoneNumber = "6281210010733",
  message = "Assalamu Alaikum warahmatullah wabarakatuh. \n\nsaya ingin berkonsultasi",
}) => {
  // Construct the WhatsApp URL with the provided phone number and message
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <a
      className={styles.whatsappButton}
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
    >
      <IconBrandWhatsapp size={32} />
      <span className={styles.tooltip}>Chat with us</span>
    </a>
  );
};

export default Whatsapp;
