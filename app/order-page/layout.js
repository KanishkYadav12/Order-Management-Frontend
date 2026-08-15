import AppShell from "@/components/shell/AppShell";

/**
 * The kitchen board.
 *
 * It had no layout at all and relied on a NavBar mounted globally in the root
 * layout — including on the login screen. It now sits behind the same guard
 * and shell as every other authenticated area.
 */
export default function OrderPageLayout({ children }) {
  return (
    <AppShell title="Live orders">
      {children}
    </AppShell>
  );
}
