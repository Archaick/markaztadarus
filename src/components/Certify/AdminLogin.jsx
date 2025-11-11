import React, { useState } from "react";
import { auth } from "../../../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { TextInput, PasswordInput, Button, Title, Paper, Center } from "@mantine/core";

export default function AdminLogin({ onLoginSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onLoginSuccess(); // redirect or show admin panel
        } catch (err) {
            alert("Login failed. Please check your credentials.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Center style={{ height: "100vh" }}>
            <Paper p="xl" shadow="lg" radius="md" withBorder>
                <Title order={3} mb="md">
                    Admin Login
                </Title>
                <form onSubmit={handleLogin}>
                    <TextInput
                        label="Email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        mb="sm"
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        mb="md"
                    />
                    <Button type="submit" fullWidth loading={loading}>
                        Sign In
                    </Button>
                </form>
            </Paper>
        </Center>
    );
}
