import styles from "./Marquee.module.css";
// left
import atfal1 from "../../assets/imgs/ilmiah/marquee/atfal1.png";
import atfal2 from "../../assets/imgs/ilmiah/marquee/atfal2.png";
import atfal3 from "../../assets/imgs/ilmiah/marquee/atfal3.png";
import atfal4 from "../../assets/imgs/ilmiah/marquee/atfal4.png";
// right
import hijaz1 from "../../assets/imgs/ilmiah/marquee/hijaz1.png";
import hijaz2 from "../../assets/imgs/ilmiah/marquee/hijaz2.png";
import hijaz3 from "../../assets/imgs/ilmiah/marquee/hijaz3.png";
import hijaz4 from "../../assets/imgs/ilmiah/marquee/hijaz4.png";

import Marquee from "react-fast-marquee";

const MarqueeIlmiah = () => {
  // Repeat the logos to fill the marquee
  const logosLeft = [atfal1, atfal2, atfal3, atfal4, hijaz2, hijaz4]; 

  return (
    <div className={styles.marqueeContainer}>
      <h2 className={styles.title}>Text Title</h2>
      <div className={styles.textcontainer}>
        <p className={styles.text}>
          Text Description
        </p>
      </div>

      <Marquee
        direction="right"
        speed={30}
        gradient={false} // Disable default gradient
        className={styles.marqueeRow}
      >
        {logosLeft.map((logo, index) => (
          <img
            key={index}
            src={logo}
            alt={`Logo ${index + 1}`}
            className={styles.logo}
          />
        ))}
      </Marquee>

      {/* Second Row (Left to Right) */}
      {/* <Marquee
        direction="left"
        speed={30}
        gradient={false} // Disable default gradient
        className={styles.marqueeRow}
      >
        {logosRight.map((logo, index) => (
          <img
            key={index}
            src={logo}
            alt={`Logo ${index + 1}`}
            className={styles.logo}
          />
        ))}
      </Marquee> */}

    </div>
  );
};

export default MarqueeIlmiah;
