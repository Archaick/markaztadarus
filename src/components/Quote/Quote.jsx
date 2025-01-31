import React from "react";
import styles from "./Quote.module.css";
import { Text } from "@mantine/core";


const Quote = () => {
  return (
    <section className={styles.quoteSection}>
      <Text
        align="center"
        size="xl"
        className={styles.quoteText}
      >
        “Menyatukan hati dengan al-Qur’an”
      </Text>
    </section>
  );
};

export default Quote;
