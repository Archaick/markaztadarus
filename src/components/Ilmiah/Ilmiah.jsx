import styles from "./Ilmiah.module.css";
import Navbar from "./Navbar";
import Toddlers from "./Toddlers/Toddlers";
import Tadarus from "./Tadarus/Tadarus";

const Ilmiah = () => {
  return (
    <div className={styles.parentWrapper}>
      <Navbar />
      <Toddlers />
      <Tadarus />
    </div>
  );
};
export default Ilmiah;
