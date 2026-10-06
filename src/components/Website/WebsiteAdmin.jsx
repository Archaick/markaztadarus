import { Button, Card, Tabs, Text, Title } from "@mantine/core";
import { IconArrowLeft, IconExternalLink, IconMap2, IconTrophy, IconWorldWww } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { AccountBar, InternalLayout } from "../Internal/InternalUI";
import layout from "../Internal/AccessControl.module.css";
import portal from "../Internal/InternalPortal.module.css";
import formStyles from "../Forms/Forms.module.css";
import MapEditor from "./MapEditor";
import StatsEditor from "./StatsEditor";

export default function WebsiteAdmin() {
  const { t } = useTranslation(["internal/Website", "internal/Internal"]);
  const { email } = useAccess();

  return (
    <InternalLayout align="top">
      <div className={layout.page}>
        <a href="/internal" className={layout.back}>
          <IconArrowLeft size={16} className={portal.flipRtl} /> {t("internal/Internal:backToHub")}
        </a>

        <Card className={layout.panel}>
          <AccountBar />

          <div className={formStyles.headerRow}>
            <div className={layout.heading}>
              <span className={layout.headingIcon} style={{ background: "linear-gradient(135deg, #b8960c 0%, #102141 100%)" }}>
                <IconWorldWww size={22} />
              </span>
              <div>
                <Title order={2} className={layout.headingTitle}>
                  {t("title")}
                </Title>
                <Text className={layout.headingText}>{t("intro")}</Text>
              </div>
            </div>
            <Button
              variant="light"
              color="yellow"
              component="a"
              href="/#map"
              target="_blank"
              rel="noreferrer"
              leftSection={<IconExternalLink size={16} />}
            >
              {t("viewOnSite")}
            </Button>
          </div>

          {/* Both editors stay mounted, so switching tabs keeps unsaved edits. */}
          <Tabs defaultValue="map" mt="lg" color="yellow">
            <Tabs.List grow>
              <Tabs.Tab value="map" leftSection={<IconMap2 size={16} />}>
                {t("tabs.map")}
              </Tabs.Tab>
              <Tabs.Tab value="stats" leftSection={<IconTrophy size={16} />}>
                {t("tabs.stats")}
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="map" pt="lg">
              <MapEditor editorEmail={email} />
            </Tabs.Panel>
            <Tabs.Panel value="stats" pt="lg">
              <StatsEditor editorEmail={email} />
            </Tabs.Panel>
          </Tabs>
        </Card>
      </div>
    </InternalLayout>
  );
}
