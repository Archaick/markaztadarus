// src/.../SignatureBlock.jsx - one signer's signature + stamp, as printed on a certificate
import React from "react";
import styles from "./SignatureBlock.module.css";

const SignatureBlock = ({ signer }) => (
    <div className={styles.block}>
        <div className={styles.inkArea}>
            {signer.stampImg && (
                <img src={signer.stampImg} alt="" className={styles.stamp} draggable={false} />
            )}
            {signer.signatureImg && (
                <img src={signer.signatureImg} alt={`Signature of ${signer.name}`} className={styles.signature} draggable={false} />
            )}
        </div>
        <div className={styles.line} />
        <div className={styles.name}>{signer.name}</div>
        <div className={styles.position}>{signer.position}</div>
        {signer.organization && <div className={styles.org}>{signer.organization}</div>}
    </div>
);

export default SignatureBlock;
