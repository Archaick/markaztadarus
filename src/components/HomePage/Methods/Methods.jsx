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
  const { t } = useTranslation("homepage/Methods");

  return (
    <div className={styles.methods}>
      <div className={styles.container}>
        <h2 className={styles.header}>{t("header")}</h2>
        <div className={styles.grid}>
          {methodKeys.map((key) => (
            <MethodItem key={key} methodKey={key} image={getMethodImage(key)} />
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

const MethodItem = ({ methodKey, image }) => {
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
        </div>
      </Modal>

      <div className={styles.methodItem}>
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
