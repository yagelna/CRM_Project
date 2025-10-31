import NoAccessCard from "./NoAccessCard";
import { useAuth } from "../../context/AuthContext";

export default function PermissionGate({
  children,
  anyOfPerms = [],
  anyOfGroups = [],
  fallback = <NoAccessCard />,
  loadingFallback = <div className="p-4 text-center">Loading…</div>,
}) {
  const { loading, hasPerm, hasGroup } = useAuth();

  if (loading) return loadingFallback;

  const allowed =
    (anyOfPerms.length === 0 || anyOfPerms.some((p) => hasPerm(p))) &&
    (anyOfGroups.length === 0 || anyOfGroups.some((g) => hasGroup(g)));

  return allowed ? children : fallback;
}