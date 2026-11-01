import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import WorldGlobe from "../../Global/WorldGlobe";
import { useGlobalContent } from "../../Global/globalData";

/**
 * The home page map: the Tadarus Global globe in its light theme, opening on
 * Indonesia's provinces (`fit`). Every country with programs glows as on
 * /global, and the visitor can zoom out to the whole world. Loaded on its own,
 * so the world's shapes do not weigh on the rest of the home page.
 */
const MapGlobe = forwardRef(function MapGlobe(props, ref) {
  const { t } = useTranslation("homepage/Map");
  const content = useGlobalContent();
  return (
    <WorldGlobe
      ref={ref}
      theme="day"
      sky={false}
      autoSpin={false}
      programs={content?.countries || {}}
      labels={{ makkah: t("holy.makkah", "Makkah"), madinah: t("holy.madinah", "Madinah"), quds: t("holy.quds", "Al-Quds") }}
      {...props}
    />
  );
});

export default MapGlobe;
