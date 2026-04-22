import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { TextInput, PasswordInput, Button, Card, Title, Text } from "@mantine/core";
import { IconAlertCircle, IconHome2, IconLink, IconLock } from "@tabler/icons-react";
import styles from "./RedirectAdminLogin.module.css";

const particles = [
  { left: "4%", top: "78%", size: 8, delay: "0s", duration: "16s" },
  { left: "11%", top: "90%", size: 4, delay: "1.8s", duration: "14s" },
  { left: "19%", top: "84%", size: 6, delay: "3.2s", duration: "17s" },
  { left: "27%", top: "88%", size: 5, delay: "0.5s", duration: "15s" },
  { left: "35%", top: "94%", size: 7, delay: "2.6s", duration: "18s" },
  { left: "43%", top: "82%", size: 4, delay: "4.1s", duration: "13s" },
  { left: "52%", top: "89%", size: 8, delay: "1.2s", duration: "20s" },
  { left: "60%", top: "86%", size: 5, delay: "2.2s", duration: "14s" },
  { left: "68%", top: "92%", size: 6, delay: "0.8s", duration: "17s" },
  { left: "75%", top: "84%", size: 4, delay: "3.8s", duration: "12s" },
  { left: "82%", top: "90%", size: 7, delay: "1.6s", duration: "19s" },
  { left: "90%", top: "87%", size: 5, delay: "2.9s", duration: "16s" },
  { left: "96%", top: "93%", size: 6, delay: "4.5s", duration: "18s" },
];

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
      <div className={styles.particles} aria-hidden="true">
        {particles.map((particle, index) => (
          <span
            key={`particle-${index}`}
            className={styles.particle}
            style={{
              left: particle.left,
              top: particle.top,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>
      <a href="/" className={styles.homeButton}>
        <IconHome2 size={16} />
        <span>Home</span>
      </a>

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
