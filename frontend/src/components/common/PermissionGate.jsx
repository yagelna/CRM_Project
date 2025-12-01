import NoAccessCard from "./NoAccessCard";
import { useAuth } from "../../context/AuthContext";

export default function PermissionGate({
  children,
  anyOfPerms = [],
  anyOfGroups = [],
  allowSuperuser = true,
  fallback = <NoAccessCard />,
  loadingFallback = <div className="p-4 text-center">Loading…</div>,
}) {
  const { loading, hasPerm, hasGroup, isSuperuser } = useAuth();

  if (loading) return loadingFallback;

  if (allowSuperuser && isSuperuser) return children;

  const allowed =
    (anyOfPerms.length === 0 || anyOfPerms.some((p) => hasPerm(p))) &&
    (anyOfGroups.length === 0 || anyOfGroups.some((g) => hasGroup(g)));

  return allowed ? children : fallback;
}