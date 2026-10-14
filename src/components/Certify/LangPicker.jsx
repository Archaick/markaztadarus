import { SegmentedControl, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

const NS = ["internal/Certificates", "internal/Internal"];

/** The language a certificate's page opens in when it is scanned. */
export default function LangPicker({ value, onChange }) {
  const { t } = useTranslation(NS);
  return (
    <div>
      <Text size="sm" fw={500} mb={2}>
        {t("fields.lang")}
      </Text>
      <Text size="xs" c="dimmed" mb={6}>
        {t("fields.langHint")}
      </Text>
      <SegmentedControl
        value={value}
        onChange={onChange}
        data={[
          { value: "id", label: "Bahasa Indonesia" },
          { value: "en", label: "English" },
          { value: "ar", label: "العربية" },
        ]}
      />
    </div>
  );
}
