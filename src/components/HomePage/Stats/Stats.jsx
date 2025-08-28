import React, { useEffect, useState, useRef } from "react";
import CountUp from "react-countup";
import {
  IconUsers,
  IconSchool,
  IconBuildingCommunity,
  IconBook,
  IconScript,
  IconBuildingMosque,
} from "@tabler/icons-react";
import qurban from "../../../assets/imgs/stats/goat.png";
import kaabah from "../../../assets/imgs/stats/kaabah.png";
import styles from "./Stats.module.css";
import Bokeh from "./Bokeh.module.css";
import { useTranslation } from "react-i18next";
const Stats = () => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  const { t } = useTranslation("homepage/Stats");

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.3,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const statsData = [
    {
      icon: <IconUsers size={28} />,
      value: 1087,
      title: t("seminarParticipants"),
      suffix: t("people"),
    },
    {
      icon: <IconSchool size={28} />,
      value: 536,
      title: t("trainingParticipants"),
      suffix: t("people"),
    },
    {
      icon: <IconBuildingCommunity size={28} />,
      value: 40,
      title: t("partners"),
      suffix: t("institutions"),
    },
    {
      icon: <IconBook size={28} />,
      value: 418,
      title: t("tadarusParticipants"),
      suffix: t("people"),
    },
    {
      icon: (
        <img src={kaabah} alt={t("umrahAlt")} className={styles.customIcon} />
      ),
      value: 5,
      title: t("umrahPrograms"),
      suffix: t("umrah"),
    },
    {
      icon: <IconScript size={28} />,
      value: 390,
      title: t("booksDistributed"),
      suffix: t("copies"),
      description: t("booksDescription"),
    },
    {
      icon: (
        <img src={qurban} alt={t("qurbanAlt")} className={styles.customIcon} />
      ),
      value: 77,
      title: t("qurbanTitle"),
      suffix: t("animals"),
      description: t("qurbanDescription"),
    },
    {
      icon: <IconBuildingMosque size={28} />,
      value: 2,
      title: t("masjidsBuilt"),
      suffix: t("masjids"),
    },
  ];

  return (
    <div
      className={`${styles.statisticsContainer} ${Bokeh.bokeh}`}
      ref={containerRef}
    >
      <div className={styles.watermark}></div>

      <div className={styles.statisticsContent}>
        <h2 className={styles.statisticsTitle}>{t("achievementsTitle")}</h2>
        <div className={styles.statisticsGrid}>
          {statsData.map((stat, index) => (
            <div key={index} className={styles.statisticCard}>
              <div className={styles.statisticIcon}>{stat.icon}</div>
              <div className={styles.statisticData}>
                {isVisible ? (
                  <CountUp
                    end={stat.value}
                    duration={5}
                    className={styles.statisticValue}
                    delay={0.5}
                  />
                ) : (
                  <span className={styles.statisticValue}>0</span>
                )}
                <span className={styles.statisticSuffix}>{stat.suffix}</span>
              </div>
              <h3 className={styles.statisticTitle}>{stat.title}</h3>
              {stat.description && (
                <p className={styles.statisticDescription}>
                  {stat.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stats;
