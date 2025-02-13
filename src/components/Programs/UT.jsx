import React from "react";
import { Button, Text } from "@mantine/core";

const UT = () => {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Umrah Tadabburiyah</h1>
      <Text size="lg" mb="md">
        Tadabbur al-Qur'an untuk masyarakat umum plus Umrah.
      </Text>
      <Button variant="outline" size="md" component="a" href="/">
        Kembali ke Beranda
      </Button>
    </div>
  );
};

export default UT;
