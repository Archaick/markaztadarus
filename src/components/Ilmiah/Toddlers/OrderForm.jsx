import { useState } from "react";
import {
  TextInput,
  NumberInput,
  Button,
  Group,
  Divider,
  Text,
  Checkbox,
  Textarea,
} from "@mantine/core";
import { IconBrandWhatsapp } from "@tabler/icons-react";

const SET_PRICE = 500000;
const BOOK_PRICE = 100000;

const OrderForm = () => {
  const [sets, setSets] = useState(1);
  const [indivBooks, setIndivBooks] = useState(Array(6).fill(0));
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [org, setOrg] = useState("");
  const [address, setAddress] = useState("");

  const totalSetPrice = sets * SET_PRICE;
  const totalIndivPrice = indivBooks.reduce(
    (sum, qty) => sum + qty * BOOK_PRICE,
    0
  );
  const totalBooksInSets = sets * 6;
  const totalBooksIndiv = indivBooks.reduce((a, b) => a + b, 0);
  const grandTotal = totalSetPrice + totalIndivPrice;

  const handleSubmit = () => {
    const indivLines = indivBooks
      .map((qty, idx) => (qty > 0 ? `- Buku ${idx + 1}: ${qty} eksemplar` : null))
      .filter(Boolean)
      .join("\n");

    const totalBooks = totalBooksInSets + totalBooksIndiv;

    const message = `*Pesanan Buku*\n\n*Paket Set:* ${sets} (total ${totalBooksInSets} buku)\n\n*Buku Satuan:*\n${
      indivLines || "- tidak ada -"
    }\n\n*Total Buku Keseluruhan:* ${totalBooks}\n\n*Nama:* ${name}\n*WhatsApp:* ${phone}\n*Organisasi/Sekolah:* ${
      org || "-"
    }\n*Penerima & Alamat:* ${address}\n\n*Total Harga:* Rp ${grandTotal.toLocaleString(
      "id-ID"
    )}`;
    

    window.open(
      `https://wa.me/6287875764426?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {/* Bagian Paket Set */}
      <NumberInput
        label="Jumlah Paket Set (1 set = 6 buku)"
        value={sets}
        onChange={setSets}
        min={0}
        description={`Harga: Rp ${SET_PRICE.toLocaleString("id-ID")} / set`}
      />

      <Divider label="Atau pesan buku satuan" />

      {/* Bagian Buku Satuan dengan pratinjau harga */}
      {indivBooks.map((qty, idx) => (
        <Group key={idx} spacing="sm" align="center">
          <Checkbox
            label={`Buku ${idx + 1}`}
            checked={qty > 0}
            onChange={({ target }) =>
              setIndivBooks((prev) => {
                const next = [...prev];
                next[idx] = target.checked ? 1 : 0;
                return next;
              })
            }
          />
          <NumberInput
            value={qty}
            onChange={(val) =>
              setIndivBooks((prev) => {
                const next = [...prev];
                next[idx] = val || 0;
                return next;
              })
            }
            min={1}
            disabled={qty === 0}
            style={{ width: 80 }}
          />
          <Text size="sm" c="dimmed">
            Rp {(qty * BOOK_PRICE).toLocaleString("id-ID")}
          </Text>
        </Group>
      ))}

      {/* Data Kontak */}
      <TextInput
        label="Nama Pemesan"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        required
      />
      <TextInput
        label="Nomor WhatsApp"
        placeholder="misal: 08123456789"
        value={phone}
        onChange={(e) => setPhone(e.currentTarget.value)}
        required
      />
      <TextInput
        label="Organisasi / Sekolah"
        value={org}
        onChange={(e) => setOrg(e.currentTarget.value)}
      />
      <Textarea
        label="Alamat Penerima & Pengiriman"
        placeholder="Jalan, Kota, Provinsi, Kode Pos"
        minRows={3}
        value={address}
        onChange={(e) => setAddress(e.currentTarget.value)}
        required
      />

      {/* Pratinjau Harga */}
      <Divider />
      <Text fw={600}>Paket Set: Rp {totalSetPrice.toLocaleString("id-ID")}</Text>
      <Text fw={600}>Buku Satuan: Rp {totalIndivPrice.toLocaleString("id-ID")}</Text>
      <Text size="lg" fw={700}>
        Total Keseluruhan: Rp {grandTotal.toLocaleString("id-ID")}
      </Text>

      <Group mt="md">
        <Button
          type="submit"
          color="green"
          fullWidth
          leftSection={<IconBrandWhatsapp size={18} />}
        >
          Kirim Pesanan via WhatsApp
        </Button>
      </Group>
    </form>
  );
};

export default OrderForm;
