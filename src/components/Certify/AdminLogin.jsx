import React, { useState } from "react";
import { auth } from "../../../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  TextInput,
  PasswordInput,
  Button,
  Title,
  Paper,
  Center,
  Stack,
} from "@mantine/core";

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
    } catch (err) {
      alert("Login failed. Please check your credentials.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center style={{ height: "100vh", backgroundColor: "#f8f9fa" }}>
      <Paper
        p="xl"
        shadow="xl"
        radius="lg"
        withBorder
        style={{
          width: 400,
          maxWidth: "90%",
          backgroundColor: "white",
        }}
      >
        <Title order={2} mb="lg" ta="center">
          MTI Admin Login
        </Title>
        <form onSubmit={handleLogin}>
          <Stack gap="md">
            <TextInput
              size="md"
              label="Email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <PasswordInput
              size="md"
              label="Password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" fullWidth size="md" loading={loading}>
              Sign In
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}
