import React from "react";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import styles from "./Methods.module.css";
import Tamhid from "../../../assets/imgs/homepage/methods/tamhid.png";
import Tilawah from "../../../assets/imgs/homepage/methods/tilawah.png";
import Tafsir from "../../../assets/imgs/homepage/methods/tafsir.png";
import Tadabbur from "../../../assets/imgs/homepage/methods/tadabbur.png";
import Tazkiyah from "../../../assets/imgs/homepage/methods/tazkiyah.png";

const methods = [
  {
    title: "Tamhid",
    image: Tamhid,
    description:
      "Pendahuluan yang disampaikan dengan pola pertanyaan menarik bertujuan untuk mengenal sekilas ayat atau surat yang akan ditadarusi",
    // youtubeId: "YOUR_YOUTUBE_ID_HERE" // Example: "dQw4w9WgXcQ"
  },
  {
    title: "Tilawah",
    image: Tilawah,
    description:
      "Membaca ayat yang akan ditadarusi bertujuan untuk menghadirkan hati.",
    // youtubeId: "YOUR_YOUTUBE_ID_HERE"
  },
  {
    title: "Tafsir",
    image: Tafsir,
    description:
      "Menjelaskan 'Kata' atau 'Kalimat' pada ayat secara singkat bertujuan untuk memahami arti ayat.",
    // youtubeId: "YOUR_YOUTUBE_ID_HERE"
  },
  {
    title: "Tadabbur",
    image: Tadabbur,
    description:
      "Menelaah dan menghayati ayat bertujuan untuk memetik pelajaran, pesan dan hikmah dari ayat.",
    // youtubeId: "YOUR_YOUTUBE_ID_HERE"
  },
  {
    title: "Tazkiyah",
    image: Tazkiyah,
    description:
      "Mensucikan hati dan diri dengan ayat bertujuan untuk menambah iman dan mengamalkan ayat dalam keseharian.",
    // youtubeId: "YOUR_YOUTUBE_ID_HERE"
  },
];

const Methods = () => {
  return (
    <div className={styles.methods}>
      <div className={styles.container}>
        <h2 className={styles.header}>Tadarus al-Qur'an Metode 5T</h2>
        <div className={styles.grid}>
          {methods.map((method, index) => (
            <MethodItem key={index} method={method} />
          ))}
        </div>
      </div>
    </div>
  );
};

const MethodItem = ({ method }) => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title={
          <div className={styles.modalTitle}>
            <span>{method.title}</span>
          </div>
        }
        centered
        size="lg"
        classNames={{
          header: styles.modalHeader,
          content: styles.modalContent,
          body: styles.modalBody,
        }}
      >
        <div className={styles.modalContentWrapper}>
          {/* YouTube Video Placeholder - Uncomment and replace with your embed code */}
          {/* <div className={styles.videoContainer}>
            <iframe
              src={`https://www.youtube.com/embed/${method.youtubeId}`}
              title={`${method.title} Video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div> */}

          <img
            src={method.image}
            alt={method.title}
            className={styles.modalIcon}
          />
          <p className={styles.modalDescription}>{method.description}</p>
        </div>
      </Modal>

      <div className={styles.methodItem}>
        <img src={method.image} alt={method.title} className={styles.image} />
        <h3 className={styles.title}>{method.title}</h3>
        <button className={styles.modalButton} onClick={open}>
          Selengkapnya
        </button>
      </div>
    </>
  );
};

export default Methods;
