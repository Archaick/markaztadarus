import { Navigate } from "react-router-dom";
import { useAccess } from "./accessContext";
import { featureByKey } from "./access";
import { AccessGate, FullPageLoader, InternalLayout } from "./InternalUI";

const gateFor = (feature) => {
  const meta = featureByKey(feature);
  return (
    <InternalLayout>
      <AccessGate
        title={meta?.title}
        subtitle={meta ? `Sign in to open the ${meta.title}.` : undefined}
        icon={meta?.icon}
        color={meta?.color}
      />
    </InternalLayout>
  );
};

// Renders the dashboard for an admin who has `feature`, the sign-in gate
// for everyone else. `feature="super"` means the super admin only.
export default function RequireFeature({ feature, children }) {
  const { loading, user, isSuperAdmin, hasFeature } = useAccess();

  if (loading) return <FullPageLoader />;

  const allowed = feature === "super" ? isSuperAdmin : hasFeature(feature);
  if (allowed) return children;

  if (feature === "super") {
    return user ? <Navigate to="/internal" replace /> : gateFor(null);
  }
  return gateFor(feature);
}

// The old /cert-login style URLs: sign in here, then go on to the dashboard.
export function FeatureLogin({ feature }) {
  const { loading, hasFeature } = useAccess();
  const meta = featureByKey(feature);

  if (loading) return <FullPageLoader />;
  if (hasFeature(feature)) return <Navigate to={meta.href} replace />;
  return gateFor(feature);
}
