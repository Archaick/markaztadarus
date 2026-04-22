import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { TextInput, PasswordInput, Button, Card, Title, Text } from "@mantine/core";
import { IconAlertCircle, IconLink, IconLock } from "@tabler/icons-react";
import styles from "./RedirectAdminLogin.module.css";

const RedirectAdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error("Redirect manager login error:", err);

      let errorMessage = "Invalid email or password";
      if (err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundPattern} />

      <Card className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <IconLink size={34} />
          </div>
          <Title order={1} className={styles.title}>
            Redirect Manager Login
          </Title>
          <Text className={styles.subtitle}>
            Internal short-link management dashboard
          </Text>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <Text>
              <IconAlertCircle size={18} />
              {error}
            </Text>
          </div>
        )}

        <form onSubmit={handleLogin} className={styles.form}>
          <TextInput
            label="Email Address"
            placeholder="admin@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            size="md"
            classNames={{ input: styles.input, label: styles.label }}
          />

          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            size="md"
            leftSection={<IconLock size={16} />}
            classNames={{ input: styles.input, label: styles.label }}
          />

          <Button
            type="submit"
            className={styles.submitButton}
            loading={loading}
            disabled={loading || !email || !password}
            fullWidth
            size="md"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <Text size="xs" className={styles.footer}>
          Product by Markaz Tadarus Indonesia
        </Text>
      </Card>
    </div>
  );
};

export default RedirectAdminLogin;
