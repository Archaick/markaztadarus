import { useState } from "react";
import { Button, NumberInput, Textarea, TextInput } from "@mantine/core";
import { IconBrandWhatsapp, IconMinus, IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./Ilmiah.module.css";

const SET_PRICE = 500000;
const BOOK_PRICE = 100000;
const BOOKS_PER_SET = 6;
const rupiah = (n) => n.toLocaleString("id-ID");

/**
 * Ordering the children's book: whole sets and/or single books, with the
 * total as you go; it opens WhatsApp with the order written out for the team
 * (in Indonesian, whatever the page's language).
 */
export default function OrderForm({ phone }) {
  const { t } = useTranslation("programs/Ilmiah");
  const [sets, setSets] = useState(1);
  const [single, setSingle] = useState(Array(BOOKS_PER_SET).fill(0));
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [org, setOrg] = useState("");
  const [address, setAddress] = useState("");

  const setsTotal = (Number(sets) || 0) * SET_PRICE;
  const singleTotal = single.reduce((sum, qty) => sum + qty * BOOK_PRICE, 0);
  const total = setsTotal + singleTotal;

  const change = (index, delta) =>
    setSingle((list) => list.map((qty, i) => (i === index ? Math.max(0, qty + delta) : qty)));

  const send = (event) => {
    event.preventDefault();
    const lines = single.map((qty, i) => (qty > 0 ? `- Buku ${i + 1}: ${qty} eksemplar` : null)).filter(Boolean);
    const books = (Number(sets) || 0) * BOOKS_PER_SET + single.reduce((a, b) => a + b, 0);
    const message = [
      "*Pesanan Buku Pendidikan Qur'ani Anak*",
      "",
      `*Paket set:* ${Number(sets) || 0} (${(Number(sets) || 0) * BOOKS_PER_SET} buku)`,
      "",
      "*Buku satuan:*",
      lines.length ? lines.join("\n") : "- tidak ada -",
      "",
      `*Total buku:* ${books}`,
      "",
      `*Nama:* ${name}`,
      `*WhatsApp:* ${whatsapp}`,
      `*Organisasi/Sekolah:* ${org || "-"}`,
      `*Penerima & alamat:* ${address}`,
      "",
      `*Total harga:* Rp ${rupiah(total)}`,
    ].join("\n");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  };

  return (
    <form className={styles.order} onSubmit={send}>
      <NumberInput label={t("form.sets")} description={t("form.setPrice", { price: rupiah(SET_PRICE) })} value={sets} onChange={setSets} min={0} max={500} />

      <div>
        <p className={styles.orderLabel}>{t("form.single")}</p>
        <div className={styles.singles}>
          {single.map((qty, i) => (
            <div key={i} className={`${styles.single} ${qty ? styles.singleOn : ""}`}>
              <span>{t("form.book", { n: i + 1 })}</span>
              <div className={styles.stepper}>
                <button type="button" onClick={() => change(i, -1)} disabled={!qty} aria-label="−">
                  <IconMinus size={14} />
                </button>
                <b>{qty}</b>
                <button type="button" onClick={() => change(i, 1)} aria-label="+">
                  <IconPlus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className={styles.orderHint}>Rp {rupiah(BOOK_PRICE)} / {t("form.book", { n: "" }).trim()}</p>
      </div>

      <div className={styles.orderGrid}>
        <TextInput label={t("form.name")} value={name} onChange={(e) => setName(e.currentTarget.value)} required />
        <TextInput label={t("form.phone")} placeholder={t("form.phoneHint")} value={whatsapp} onChange={(e) => setWhatsapp(e.currentTarget.value)} required dir="ltr" />
      </div>
      <TextInput label={t("form.org")} value={org} onChange={(e) => setOrg(e.currentTarget.value)} />
      <Textarea label={t("form.address")} placeholder={t("form.addressHint")} autosize minRows={2} value={address} onChange={(e) => setAddress(e.currentTarget.value)} required />

      <div className={styles.totals}>
        <span>
          {t("form.totalSets")} <b>Rp {rupiah(setsTotal)}</b>
        </span>
        <span>
          {t("form.totalSingle")} <b>Rp {rupiah(singleTotal)}</b>
        </span>
        <strong>
          {t("form.total")} <b>Rp {rupiah(total)}</b>
        </strong>
      </div>

      <Button type="submit" size="md" radius="xl" color="teal" fullWidth leftSection={<IconBrandWhatsapp size={18} />} disabled={total === 0}>
        {t("form.send")}
      </Button>
    </form>
  );
}
