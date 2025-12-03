import { requireTenantId } from "@/lib/session";
import { leadService } from "@/services/lead.service";
import { locationService } from "@/services/location.service";
import { LeadTable } from "./lead-table";

export const metadata = {
  title: "Leads",
};

export default async function LeadsPage() {
  const tenantId = await requireTenantId();

  const [result, stats, locations] = await Promise.all([
    leadService.list(tenantId),
    leadService.getStats(tenantId),
    locationService.listAll(tenantId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Track and convert potential subscribers
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">New</p>
          <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Contacted</p>
          <p className="text-2xl font-bold text-amber-600">{stats.contacted}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Site Survey</p>
          <p className="text-2xl font-bold text-purple-600">{stats.siteSurvey}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Scheduled</p>
          <p className="text-2xl font-bold text-orange-600">{stats.scheduled}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Converted</p>
          <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Conversion Rate</p>
          <p className="text-2xl font-bold">{stats.conversionRate}%</p>
        </div>
      </div>

      <LeadTable leads={result.data} locations={locations} meta={result.meta} />
    </div>
  );
}
