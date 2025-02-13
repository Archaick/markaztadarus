import React from "react";
import { Button, Text } from "@mantine/core";
import { Link } from "react-router-dom";
import styles from "./ErrorPage.module.css"; // Optional: for custom styles

const ErrorPage = () => {
  return (
    <div className={styles.errorContainer}>
      <h1 className={styles.errorTitle}>404 - Page Not Found</h1>
      <Text size="lg" align="center" color="white" className={styles.errorText}>
        Oops! The page you're looking for doesn't exist.
      </Text>
      <Link to="/" className={styles.backButton}>
        <Button size="md" variant="outline" color="yellow" className={styles.errorButton}>
          Back to Home
        </Button>
      </Link>
    </div>
  );
};

export default ErrorPage;
