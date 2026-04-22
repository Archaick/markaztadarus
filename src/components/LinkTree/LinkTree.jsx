import React from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "@tabler/icons-react";
import styles from "./LinkTree.module.css";
import { linkTreeConfig } from "./config";
import book from "../../assets/imgs/ilmiah/tadarusbook.jpg";

/**
 * LinkTree Component
 * A Linktree-style component for sharing multiple links
 * Edit links in config.js
 */
const LinkTree = () => {
  const navigate = useNavigate();

  // Dynamically get icon from tabler icons
  const getIcon = (iconName) => {
    const Icons_Map = {
      download: Icons.IconDownload,
      edit: Icons.IconEdit,
      world: Icons.IconWorld,
      "brand-instagram": Icons.IconBrandInstagram,
      "brand-youtube": Icons.IconBrandYoutube,
      "brand-whatsapp": Icons.IconBrandWhatsapp,
    };
    return Icons_Map[iconName] || Icons.IconLink;
  };

  return (
    <div className={styles.container}>
      {/* Modern Particles Background */}
      <div className={styles.particlesBackground}>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
      </div>

      {/* Background Image */}
      <div
        className={styles.backgroundImage}
        style={{ backgroundImage: `url(${book})` }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className={styles.content}>
        {/* Title */}
        <h1 className={styles.title}>{linkTreeConfig.title}</h1>

        {/* Links Container */}
        <div className={styles.linksContainer}>
          {linkTreeConfig.links.map((link) => {
            const IconComponent = getIcon(link.icon);
            return (
              <a
                key={link.id}
                href={link.url}
                target={link.target}
                rel="noopener noreferrer"
                className={styles.linkButton}
              >
                <div className={styles.linkContent}>
                  <IconComponent className={styles.linkIcon} size={24} stroke={2} />
                  <span className={styles.linkLabel}>{link.label}</span>
                </div>
                <Icons.IconChevronRight className={styles.linkArrow} size={20} stroke={2} />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LinkTree;
