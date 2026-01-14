import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal-session";
import { portalService } from "@/services/portal.service";

export async function POST(request: Request) {
  try {
    const session = await getPortalSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { subject, description, category } = await request.json();

    if (!subject?.trim()) {
      return NextResponse.json(
        { success: false, error: "Subject is required" },
        { status: 400 }
      );
    }

    const ticket = await portalService.createTicket({
      subscriberId: session.subscriberId,
      tenantId: session.tenantId,
      subject: subject.trim(),
      description: description?.trim() ?? "",
      category: category || "OTHER",
    });

    return NextResponse.json({ success: true, ticketNumber: ticket.ticketNumber });
  } catch (error) {
    console.error("[Portal Create Ticket]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
