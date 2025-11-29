import { requireTenantId } from "@/lib/session";
import { ticketService } from "@/services/ticket.service";
import { notFound } from "next/navigation";
import { TicketDetail } from "./ticket-detail";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Ticket Details",
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = await requireTenantId();

  const ticket = await ticketService.getById(tenantId, id);
  if (!ticket) notFound();

  const staff = await ticketService.getStaffMembers(tenantId);

  return (
    <div className="space-y-6">
      <Link
        href="/complaints"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Complaints
      </Link>

      <TicketDetail ticket={ticket} staff={staff} />
    </div>
  );
}
