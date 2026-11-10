import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAccess } from "./accessContext";
import { featureByKey } from "./access";
import { AccessGate, FullPageLoader, InternalLayout } from "./InternalUI";

function FeatureGate({ feature }) {
  const { t } = useTranslation("internal/Internal");
  const meta = featureByKey(feature);
  const title = meta ? t(`features.${meta.key}.title`) : undefined;
  return (
    <InternalLayout>
      <AccessGate title={title} subtitle={meta ? t("gate.featureSubtitle", { title }) : undefined} />
    </InternalLayout>
  );
}

// Renders the dashboard for an admin who has `feature`, the sign-in gate
// for everyone else. `feature="super"` means the super admin only.
export default function RequireFeature({ feature, children }) {
  const { loading, user, isSuperAdmin, hasFeature } = useAccess();

  if (loading) return <FullPageLoader />;

  const allowed = feature === "super" ? isSuperAdmin : hasFeature(feature);
  if (allowed) return children;

  if (feature === "super") {
    return user ? <Navigate to="/internal" replace /> : <FeatureGate />;
  }
  return <FeatureGate feature={feature} />;
}

// The old /cert-login style URLs: sign in here, then go on to the dashboard.
export function FeatureLogin({ feature }) {
  const { loading, hasFeature } = useAccess();

  if (loading) return <FullPageLoader />;
  if (hasFeature(feature)) return <Navigate to={featureByKey(feature).href} replace />;
  return <FeatureGate feature={feature} />;
}
