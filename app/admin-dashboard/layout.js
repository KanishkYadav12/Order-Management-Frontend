import AppShell from "@/components/shell/AppShell";
import { ROLES } from "@/config/config";

/**
 * Platform administration.
 *
 * This layout previously had no guard at all — `/admin-dashboard` was the one
 * authenticated area anyone could open directly.
 */
export default function AdminDashboardLayout({ children }) {
  return (
    <AppShell title="Administration" roles={[ROLES.SUPER_ADMIN]}>
      {children}
    </AppShell>
  );
}
