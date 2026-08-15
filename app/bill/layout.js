import AppShell from "@/components/shell/AppShell";

export default function BillLayout({ children }) {
  return (
    <AppShell title="Billing">
      {children}
    </AppShell>
  );
}
