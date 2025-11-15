export const metadata = {
  title: "Billing",
};

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Invoices, payments, and billing management
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Billing module will be rendered here (Phase 3)
        </div>
      </div>
    </div>
  );
}
