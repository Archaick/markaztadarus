import React from "react";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import styles from "./Methods.module.css";
import Tamhid from "../../../assets/imgs/homepage/methods/tamhid.png";
import Tilawah from "../../../assets/imgs/homepage/methods/tilawah.png";
import Tafsir from "../../../assets/imgs/homepage/methods/tafsir.png";
import Tadabbur from "../../../assets/imgs/homepage/methods/tadabbur.png";
import Tazkiyah from "../../../assets/imgs/homepage/methods/tazkiyah.png";

const methodKeys = ["tamhid", "tilawah", "tafsir", "tadabbur", "tazkiyah"];

const Methods = () => {
  const { t, i18n } = useTranslation("homepage/Methods");

  return (
    <div className={styles.methods}>
      <div className={styles.container}>
        <h2 className={styles.header}>{t("header")}</h2>
        <div
          className={styles.grid}
          dir={i18n.language === "ar" ? "rtl" : "ltr"}
        >
          {methodKeys.map((key, index) => (
            <MethodItem
              key={key}
              methodKey={key}
              image={getMethodImage(key)}
              number={index + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to get correct image
function getMethodImage(key) {
  const images = {
    tamhid: Tamhid,
    tilawah: Tilawah,
    tafsir: Tafsir,
    tadabbur: Tadabbur,
    tazkiyah: Tazkiyah,
  };
  return images[key];
}

const MethodItem = ({ methodKey, image, number }) => {
  const [opened, { open, close }] = useDisclosure(false);
  const { t } = useTranslation("homepage/Methods");

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title={
          <div className={styles.modalTitle}>
            <span>{t(`methods.${methodKey}.title`)}</span>
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
          <img
            src={image}
            alt={t(`methods.${methodKey}.title`)}
            className={styles.modalIcon}
          />
          <p className={styles.modalDescription}>
            {t(`methods.${methodKey}.description`)}
          </p>
          {/* Video Container - Commented for future use dont erase this */}
          {/* <div className={styles.videoContainer}>
            <iframe
              src="https://www.youtube.com/embed/8k7H8Crot-s"
              title="Method Video"
              allowFullScreen
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div> */}
        </div>
      </Modal>

      <div className={styles.methodItem}>
        <div className={styles.numberRibbon}>{number}</div>
        <img
          src={image}
          alt={t(`methods.${methodKey}.title`)}
          className={styles.image}
        />
        <h3 className={styles.title}>{t(`methods.${methodKey}.title`)}</h3>
        <button className={styles.modalButton} onClick={open}>
          {t("learn_more")}
        </button>
      </div>
    </>
  );
};

export default Methods;
