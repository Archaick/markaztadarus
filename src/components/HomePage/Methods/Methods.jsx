import React from "react";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import styles from "./Methods.module.css";

const methodKeys = ["tamhid", "tilawah", "tafsir", "tadabbur", "tazkiyah"];
const delays = ["1s", "2s", "3s", "4s", "5s"]; // Adjusted for better flow

const Methods = () => {
  const { t, i18n } = useTranslation("homepage/Methods");

  return (
    <section className={styles.methods}>
      <div className={styles.container}>
        <h2 className={styles.header}>{t("header")}</h2>
        
        <div className={styles.timelineWrapper} dir={i18n.language === "ar" ? "rtl" : "ltr"}>
          {/* Central Track */}
          <div className={styles.timelineTrack}>
            <div className={styles.scannerStream}></div>
          </div>

          <div className={styles.timelineItems}>
            {methodKeys.map((key, index) => (
              <MethodTimelineItem
                key={key}
                methodKey={key}
                number={index + 1}
                delay={delays[index]}
                isEven={index % 2 !== 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const MethodTimelineItem = ({ methodKey, number, delay, isEven }) => {
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
        size="md"
        classNames={{
          header: styles.modalHeader,
          content: styles.modalContent,
          body: styles.modalBody,
        }}
      >
        <div className={styles.modalContentWrapper}>
          <p className={styles.modalDescription}>
            {t(`methods.${methodKey}.description`)}
          </p>
        </div>
      </Modal>

      <div 
        className={`${styles.timelineItem} ${isEven ? styles.even : styles.odd}`}
        style={{ "--anim-delay": delay }}
      >
        {/* The Node on the line */}
        <div className={styles.timelineNode}></div>

        {/* The Caret/Arrow */}
        <div className={styles.timelineCaret}></div>

        {/* The Card */}
        <div className={styles.methodCard} onClick={open}>
          <div className={styles.cardContent}>
            <span className={styles.numberBadge}>{number}</span>
            <h3 className={styles.cardTitle}>{t(`methods.${methodKey}.title`)}</h3>
          </div>
          <span className={styles.learnMore}>{t("learn_more")}</span>
        </div>
      </div>
    </>
  );
};


export default Methods;

