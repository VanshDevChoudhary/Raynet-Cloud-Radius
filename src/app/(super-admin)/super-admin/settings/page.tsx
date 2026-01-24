export const metadata = { title: "System Settings" };

export default function SystemSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
        <p className="text-sm text-muted-foreground">Platform-level configuration</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "RADIUS Servers", description: "Monitor RADIUS server health and configuration" },
          { title: "Platform Billing", description: "Pricing tiers and tenant billing" },
          { title: "Global Defaults", description: "Default settings for new tenants" },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground">{item.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            <p className="mt-3 text-xs text-muted-foreground">Coming soon</p>
          </div>
        ))}
      </div>
    </div>
  );
}
