import { requireTenantId } from "@/lib/session";
import { ticketService } from "@/services/ticket.service";
import { TicketTable } from "./ticket-table";

export const metadata = {
  title: "Complaints",
};

export default async function ComplaintsPage() {
  const tenantId = await requireTenantId();

  const [result, stats, staff] = await Promise.all([
    ticketService.list(tenantId),
    ticketService.getStats(tenantId),
    ticketService.getStaffMembers(tenantId),
  ]);

  // Get subscribers for the ticket form
  const { prisma } = await import("@/lib/prisma");
  const subscribers = await prisma.subscriber.findMany({
    where: { tenantId },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
    take: 500,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Complaints</h1>
          <p className="text-sm text-muted-foreground">
            Support tickets and complaint management
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Open</p>
          <p className="text-2xl font-bold text-red-600">{stats.open}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Assigned</p>
          <p className="text-2xl font-bold text-amber-600">{stats.assigned}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Closed</p>
          <p className="text-2xl font-bold text-gray-500">{stats.closed}</p>
        </div>
      </div>

      <TicketTable
        tickets={result.data}
        staff={staff}
        subscribers={subscribers}
        meta={result.meta}
      />
    </div>
  );
}
